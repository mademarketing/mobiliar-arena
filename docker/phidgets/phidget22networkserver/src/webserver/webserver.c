#define _PHIDGET_NETWORKCODE
#include "server.h"
#include "webserver.h"

#include "mos/mos_urldecode.h"
#include "mos/mos_base64.h"
#include "mos/kv/kv.h"

#include <sys/stat.h>

static PhidgetMDNSPublishHandle publishhandle[2];
static PhidgetServerHandle wwwserver;
static const char *cachectrl;
static const char *docroot;
static pconf_t *wwwcfg;

static int enable_phidgets;		/* control websocket access to phidgets */
static const char *servername;	/* the name of the server for mdns etc. */
static const char *serverhost;	/* the hostname of the machine: overrides the getnameinfo() name */
static int initialized;
static FILE *accessfp;
static int port;

static void
loadWebAPI(WebConnHandle wc, pconf_t *pc) {

	wc->webapi.enabled = pconf_getbool(pc, 0, "phidget.feature.dictionary.webapi.enabled");
	wc->webapi.adddictionary = pconf_getbool(pc, 1, "phidget.feature.dictionary.webapi.adddictionary");
	wc->webapi.changedictionary = pconf_getbool(pc, 1, "phidget.feature.dictionary.webapi.changedictionary");
	wc->webapi.removedictionary = pconf_getbool(pc, 0, "phidget.feature.dictionary.webapi.removedictionary");
	wc->webapi.addkey = pconf_getbool(pc, 1, "phidget.feature.dictionary.webapi.addkey");
	wc->webapi.removekey = pconf_getbool(pc, 0, "phidget.feature.dictionary.webapi.removekey");
	wc->webapi.changekey = pconf_getbool(pc, 1, "phidget.feature.dictionary.webapi.changekey");
}

static int
handleHTTPUpgrade(mosiop_t iop, WebConnHandle wc) {
	uint8_t digest[SHA1_DIGEST_LENGTH];
	PhidgetReturnCode res;
	uint8_t key[128];
	char reply[256];
	uint32_t b64len;
	uint8_t *b64;
	int len;

	if (mos_strcmp(wc->uri, "/phidgets") == 0) {
		if (!enable_phidgets)
			return (MOS_ERROR(iop, EPHIDGET_UNSUPPORTED, "websocket access to phidgets disabled"));
	} else {
		return (MOS_ERROR(iop, EPHIDGET_UNSUPPORTED, "unsupported websocket type: %s", wc->uri));
	}

	wslogdebug("sec-websocket-version: %d", kvgeti32(wc->header, "sec-websocket-version", 0));
	wslogdebug("sec-websocket-key: %s", kvgetstrc(wc->header, "sec-websocket-key", ""));

	len = mos_snprintf((char *)key, sizeof (key), "%s%s", kvgetstrc(wc->header, WEBSOCK_KEY, ""),
	  WEBSOCK_GUID);
	hmac_sha1(key, len, digest);

	b64 = mos_base64_encode(digest, SHA1_DIGEST_LENGTH, &b64len);
	if (b64 == NULL) {
		wserror(iop, wc, 500, "Internal Error", EPHIDGET_UNEXPECTED, "internal error");
		return (MOS_ERROR(iop, EPHIDGET_UNEXPECTED, "failed to base64 encode wesocket key"));
	}

	len = mos_snprintf(reply, sizeof (reply), "HTTP/1.1 101 Switching Protocols\r\n"
	  "Upgrade: websocket\r\n"
	  "Connection: Upgrade\r\n"
	  "%s: %s\r\n\r\n", WEBSOCK_ACCEPT, b64);
	mos_free(b64, b64len);

	res = netConnWrite(iop, wc->conn, reply, len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write websocket upgrade reply to client"));

	wc->flags |= WC_WEBSOCKET;
	if (mos_strcmp(wc->uri, "/phidgets") == 0)
		wc->flags |= WC_PHIDGETS;

	return (0);
}

static int
staturi(const char *path, int *type) {
	char buf[MOS_PATH_MAX];
	struct stat sb;
	int err;

	mos_strlcpy(buf, path, sizeof (buf));
	if (mos_endswith(buf, "/"))
		buf[mos_strlen(buf) - 1] = '\0';

	err = stat(buf, &sb);
	if (err != 0) {
		wslogerr("failed to stat '%s': %s", buf, strerror(errno));
		return (EPHIDGET_NOENT);
	}

	*type = sb.st_mode & S_IFMT;
	return (0);
}

static int
handleHTTPGet(mosiop_t iop, WebConnHandle wc, int *keepalive) {
	PhidgetReturnCode err;
	char path[MOS_PATH_MAX];
	char pathcannonical[MOS_PATH_MAX];
	char docrootcannonical[MOS_PATH_MAX];
	char buf[32768];
	size_t len;
	int noent;
	int type;
	FILE *fp;

	noent = 0;

	/*
	 * Route API requests.
	 */
	if (mos_strncmp(wc->uri, APIPATH, mos_strlen(APIPATH)) == 0) {
		if (!wc->webapi.enabled) {
			wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "webapi is disabled");
			return (EPHIDGET_OK);
		}
		return (handleAPIRequest(iop, wwwcfg, wc, keepalive));
	}

	if (mos_strcmp(wc->uri, "/") == 0)
		mos_strlcpy(wc->uri, "/index.html", sizeof (wc->uri));

	mos_snprintf(path, sizeof (path), "%s%s", docroot, wc->uri);

	// Get cannonical names
	if (mos_path_getcanonical(path, pathcannonical, MOS_PATH_MAX) == NULL)
		return (MOS_ERROR(iop, ENOENT, "failed to get cannonical path"));
	if (mos_path_getcanonical(docroot, docrootcannonical, MOS_PATH_MAX) == NULL)
		return (MOS_ERROR(iop, ENOENT, "failed to get cannonical docroot"));

	// Make sure request is within docroot
	if (strncmp(pathcannonical, docrootcannonical, strlen(docrootcannonical)) != 0)
		return (MOS_ERROR(iop, ENOENT, "file is not within docroot"));

	type = 0;
	err = staturi(pathcannonical, &type);
	if (err == ENOENT) {
		noent = 1;
		goto noent;
	}

	if (type == S_IFDIR) {
		if (mos_endswith(pathcannonical, "/"))
			mos_strlcat(pathcannonical, "index.html", sizeof (pathcannonical));
		else
			return (wsmoved(iop, wc, "%s/", wc->uri));
	}

	fp = fopen(pathcannonical, "rb");
	if (fp == NULL) {
noent:
		err = wsnoent(iop, wc, pathcannonical);
		if (noent)
			return (EPHIDGET_NOENT);
		return (0);
	}

	err = wsheader(iop, wc, pathcannonical);
	if (err != EPHIDGET_OK)
		return (MOS_ERROR(iop, err, "failed to write header to client"));

	/* Do not send the body if the method is HEAD */
	if (mos_strcmp(wc->method, "HEAD") == 0)
		goto done;

	for (;;) {
		len = fread(buf, 1, sizeof (buf), fp);
		if (len == 0)
			break;
		err = netConnWrite(iop, wc->conn, buf, len);
		if (err != 0)
			return (MOS_ERROR(iop, err, "failed to write reply block to client"));
	}

done:

	fclose(fp);
	return (0);
}

static int
readreq(mosiop_t iop, WebConnHandle wc) {
	PhidgetReturnCode err;
	size_t n;

	n = sizeof (wc->reqline) - 1;
	err = netConnReadLine(iop, wc->conn, wc->reqline, &n);
	if (err != 0)
		return (MOS_ERROR(iop, err, "failed to read HTTP request from socket"));
	wc->reqline[n] = '\0';

	if (mos_sscanf(wc->reqline, "%15s %2047s HTTP/%u.%u", wc->method, wc->uri, &wc->httpmajor,
	 &wc->httpminor) != 4)
		return (MOS_ERROR(iop, MOSN_INVAL, "failed to scan request line ('%s')", wc->reqline));

	return (0);
}

static int
readheader(mosiop_t iop, WebConnHandle wc) {
	PhidgetReturnCode err;
	char buf[8192];
	char val[8192];
	char key[256];
	char *c;
	size_t n;

	newkv(&wc->header);

	/*
	 * RFC 7230 deprecates line folding (mostly), so we do not try to handle it.
	 *
	 * There is not suppose to be any white space prior to the first ':', which we do not check
	 * for and always trim.
	 *
	 * We trim whitespace from the value, which is not technically correct.
	 */
	for (;;) {
		n = sizeof (buf);
		err = netConnReadLine(iop, wc->conn, buf, &n);
		if (err != 0) {
			MOS_ERROR(iop, err, "mos_net_readline() failed");
			goto bad;
		}
		if (n == 0)
			break;

		buf[n] = '\0';
		c = mos_strchr(buf, ':');
		if (c == NULL) {
			kvfree(&wc->header);
			return (MOS_ERROR(iop, MOSN_INVAL, "missing ':' in HTTP header entry (%s)", buf));
		}
		*c = '\0';
		c++;
		mos_strtrim(buf, key, sizeof(key));
		mos_strtrim(c, val, sizeof(val));
		kvadd(wc->header, MOS_IOP_IGNORE, key, val);
	}

	kvsetcaseinsensitive(wc->header, 1);

	return (0);

bad:

	mos_free(buf, MAXHEADERS + 1);
	return (err);
}

static int
getformvalues(mosiop_t iop, WebConnHandle wc) {
	PhidgetReturnCode res;
	char postbuf[65536];
	char *input;
	char *next;
	char *name;
	char *val;
	char *qry;

	uint32_t inputlen;
	uint32_t namelen;
	uint32_t vallen;
	uint32_t rem;
	size_t len;
	int clen;

	/*
	 * Simply handling of basic POST query.
	 */
	if (mos_strcmp(wc->method, "POST") == 0) {
		clen = kvgeti32(wc->header, "content-length", -1);
		if (clen == 0)
			return (0);
		if (clen < 0)
			return (MOS_ERROR(iop, EPHIDGET_UNEXPECTED, "missing content-length"));
		if (clen > (int)sizeof (postbuf))
			return (MOS_ERROR(iop, EPHIDGET_NOSPC, "content-length too large"));
		len = (size_t)clen;
		res = netConnReadLine(iop, wc->conn, postbuf, &len);
		if (res != EPHIDGET_OK)
			return (MOS_ERROR(iop, res, "failed to read POST content"));
		postbuf[len] = '\0';
		qry = postbuf;
		input = mos_strdup(qry, &inputlen);
		goto handlequery;
	}

	if (mos_strcmp(wc->method, "GET") != 0) {
		/* Treat HEAD as GET */
		if (mos_strcmp(wc->method, "HEAD") != 0)
			return (MOS_ERROR(iop, EPHIDGET_UNSUPPORTED, "method '%' unsupported", wc->method));
	}

	qry = mos_strchr(wc->uri, '?');
	if (qry == NULL)
		return (0);
	input = mos_strdup(qry + 1, &inputlen);

handlequery:

	res = newkv(&wc->query);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to create query kv"));

	next = input;
	for (rem = inputlen; rem > 0;) {
		name = next;
		next = mos_strchr(next, '&');
		if (next == NULL) {
			namelen = rem;
			rem = 0;
		} else {
			next++;
			namelen = (uint32_t)(next - name);
			rem -= namelen;
		}
		val = mos_strchr(name, '=');
		if (val == NULL) {
			MOS_ERROR(iop, EPHIDGET_INVALID, "missing value for '%.*s'", namelen, name);
			goto done;
		}
		*val = '\0';
		vallen = namelen - (int)(val + 2 - name);
		namelen = (uint32_t)(val - name);
		val++;

		namelen = mos_urldecode(name, namelen);
		name[namelen] = '\0';

		vallen = mos_urldecode(val, vallen);
		while (vallen > 0 && (val[vallen - 1] == '\r' || val[vallen - 1] == '\n'))
			vallen--;

		/*
		 * Note: val is not null terminated.
		 */
		res = kvvset(wc->query, iop, name, "%.*s", vallen, val);
		if (res != 0) {
			MOS_ERROR(iop, res, "failed to set '%s' in kv", name);
			goto done;
		}
	}

	/* terminate the uri at the parameters (for GET) */
	*qry = '\0';

done:

	mos_free(input, inputlen);
	return (res);
}

static PhidgetReturnCode CCONV
handleWWWClient(mosiop_t iop, IPhidgetServerHandle server) {
	PhidgetServerHandle psrv;
	PhidgetNetConnHandle nc;
	PhidgetReturnCode err;
	const char *conn;
	WebConnHandle wc;
	int keepalive;
	int upgrade;

	psrv = getPhidgetServerHandle(server);
	nc = getIPhidgetServerNetConn(server);
	wc = getNetConnPrivate(nc);

	setNetConnConnTypeStr(nc, "_www");

	if (serverhost)
		wc->serverhost = mos_strdup(serverhost, NULL);
	else if (serverhost == NULL && psrv->host)
		wc->serverhost = mos_strdup(psrv->host, NULL);
	else
		wc->serverhost = NULL;

	keepalive = 0;
	upgrade = 0;

	err = readreq(iop, wc);
	if (err != 0) {
		if (err == EPHIDGET_EOF) /* connection closed */
			goto done;
		wslogerr("failed to read HTTP request\n%N", iop);
		goto done;
	}

		/* Treat HEAD as GET */
	if (mos_strcmp(wc->method, "GET") != 0 && mos_strcmp(wc->method, "HEAD") != 0 &&
	  mos_strcmp(wc->method, "POST") != 0) {
		wslogerr("received a method of '%s'; only GET, HEAD and POST are supported", wc->method);
		err = MOS_ERROR(iop, EPHIDGET_UNSUPPORTED, "Unsupported method '%s'", wc->method);
		goto done;
	}

	err = readheader(iop, wc);
	if (err != 0) {
		wslogerr("failed to read HTTP header\n%N", iop);
		goto done;
	}

	conn = kvgetstrc(wc->header, "Connection", NULL);
	if (conn != NULL) {
		keepalive = (mos_strcasestrc(conn, "keep-alive") != NULL);
		upgrade = (mos_strcasestrc(conn, "upgrade") != NULL);
	}

	if (upgrade) {
		wsloginfo("updating %s to device connection", getNetConnPeerName(wc->conn));
		err = handleHTTPUpgrade(iop, wc);
		if (err != 0) {
			wslogerr("failed to handle HTTP websocket upgrade");
			goto done;
		}
		if (wc->flags & WC_PHIDGETS) {
			err = handleDeviceClient(iop, server);
			if (err != 0)
				wslogerr("failed to handle phidgets websocket connection\n%N", iop);
		}
		goto done;
	}

	err = getformvalues(iop, wc);
	if (err != 0) {
		wslogerr("failed to get form values");
		goto done;
	}

	err = handleHTTPGet(iop, wc, &keepalive);
	if (err != 0 && err != EPHIDGET_NOENT) {
		wslogerr("failed to handle HTTP GET request\n%N", iop);
		goto done;
	}

	if (err == 0)
		wsaccesslog(NULL, NULL, wc, 200, 0);

done:

	if (wc->header)
		kvfree(&wc->header);
	if (wc->query)
		kvfree(&wc->query);

	if (err == EPHIDGET_EOF || err == EPHIDGET_NOENT)
		return (0);
	return (err);
}

/*
 * Called by closePhidgetNetConn when the connection is closed or dropped by peer.
 */
static void CCONV
netconnclose(PhidgetNetConnHandle nc) {
	WebConnHandle wc;

	wc = getNetConnPrivate(nc);
	setNetConnPrivate(nc, NULL);
	if (wc->serverhost)
		mos_free(wc->serverhost, MOSM_FSTR);
	mos_free(wc, sizeof (WebConn));
}

static void CCONV
initNetConn(IPhidgetServerHandle server, PhidgetNetConnHandle nc) {
	PhidgetServerHandle psrv;
	WebConnHandle wc;

	psrv = getPhidgetServerHandle(server);

	wc = mos_zalloc(sizeof (WebConn));
	setNetConnPrivate(nc, wc);
	wc->conn = nc;
	wc->port = port;
	setNetConnHandlers(nc, netconnclose, NULL, NULL, NULL);
	setNetConnProtocol(nc, NULL, 0, 0);
	wc->accessfp = accessfp;
	loadWebAPI(wc, wwwcfg);

	if (mos_strcmp(cachectrl, "nocache") == 0)
		wc->flags |= WC_NOCACHE;

	if (psrv->type == PHIDGETSERVER_WWWLISTENER) {
		setNetConnConnectionTypeListener(nc);
	} else {
		setNetConnConnectionTypeLocal(nc);
		initWebSockNetConn(server, nc);
	}
}

int
startWebServer(pconf_t *cfg) {
	PhidgetReturnCode res;
	const char *address;
	const char *passwd;
	const char *acclog;
	char compname[64];
	char defname[64];
	kv_t *kv;
	int af;

	if (!initialized) {
		nslogerr("not initialized");
		return (EPHIDGET_INVALID);
	}

	wwwcfg = cfg;

	wsloginfo("Phidget22 Web Server Starting");
	PhidgetLog_setSourceLevel(WSSRC, getLogLevel(pconf_getstr(cfg, "", "phidget.www.logging.level")));

	cachectrl = pconf_getstr(cfg, "", "phidget.www.network.cachectrl");

	mos_snprintf(defname, sizeof(defname), "%s Phidget22 WWW Server", getComputerName(compname, sizeof(compname), "Unknown"));
	servername = pconf_getstr(cfg, defname, "phidget.www.network.publish.name");
	serverhost = pconf_getstr(cfg, NULL, "phidget.www.serverhost");

	res = loadMimeTypes(pconf_getstr(cfg, NULL, "phidget.www.mimetypes"));
	if (res != EPHIDGET_OK) {
		if (res == EPHIDGET_INVALIDARG)
			wslogerr("phidget.www.mimetypes not specified in configuration");
		return (res);
	}

	docroot = pconf_getstr(cfg, NULL, "phidget.www.docroot");
	if (docroot == NULL) {
		wslogerr("phidget.www.docroot not specified in configuration");
		return (EPHIDGET_INVALID);
	}

	port = pconf_get32(cfg, DEFAULT_PORT, "phidget.www.network.ipv4.port");
	address = pconf_getstr(cfg, NULL, "phidget.www.network.ipv4.address");
	af = AF_INET;

	// Use the global password, but allow override by the webserver specific password
	passwd = pconf_getstr(cfg, "", "phidget.auth.password");
	passwd = pconf_getstr(cfg, passwd, "phidget.www.phidgets.passwd");

	acclog = pconf_getstr(cfg, "access.log", "phidget.www.logging.accesslog");
	accessfp = fopen(acclog, "w+");
	if (accessfp == NULL)
		wslogerr("failed to open access log file '%s'", acclog);

	enable_phidgets = pconf_getbool(cfg, 1, "phidget.www.phidgets.enabled");

	/*
	 * We handle our own client connections, and never deal with servers.c request processing until
	 * a connection is upgraded.
	 *
	 * The server code will handle accepting connection and the creation of a thread to handle the connection.
	 * That thread will call handleWWWClient() which will serve HTTP requests, and possibly upgrade the
	 * connection to a phidget device server, which will result in calls to handleDeviceRequest().
	 */
	res = PhidgetNet_startServer2(PHIDGETSERVER_WWWLISTENER, 0, af, "webserver", address, port, passwd,
	  initNetConn, handleWWWClient, handleDeviceRequest, &wwwserver);
	if (res != 0) {
		wslogerr("failed to start webserver");
		return (res);
	}
	wsloginfo("Started Phidget WWW Server %s %s:%d", servername, address ? address : "0.0.0.0", port);

	if (pconf_getbool(cfg, 0, "phidget.www.network.publish.enabled")) {
		newkv(&kv);
		kvset(kv, MOS_IOP_IGNORE, "version", "1");
		kvset(kv, MOS_IOP_IGNORE, "POST", "0");
		kvset(kv, MOS_IOP_IGNORE, "phidget22", "1.0");

		res = PhidgetNet_publishmdns(&publishhandle[0], servername, NULL, PHIDGET_NETWORK_MDNS_WWW, port, kv);
		if (res != EPHIDGET_OK)
			wslogerr("failed to publishmdns '%s'", PHIDGET_NETWORK_MDNS_WWW);

		res = PhidgetNet_publishmdns(&publishhandle[1], servername, NULL, "_http._tcp", port, kv);
		if (res != EPHIDGET_OK)
			wslogerr("failed to publishmdns '_http._tcp'");

		kvfree(&kv);
	}

	return (0);
}

void
stopWebServer() {

	if (publishhandle[0])
		PhidgetNet_unpublishmdns(&publishhandle[0]);

	if (publishhandle[1])
		PhidgetNet_unpublishmdns(&publishhandle[1]);

	if (wwwserver)
		PhidgetNet_stopServer(&wwwserver);

	if (accessfp)
		fclose(accessfp);

	releaseMimeTypes();

	serverhost = NULL;
}

void
WebServerInit() {

	initialized = 1;
}
