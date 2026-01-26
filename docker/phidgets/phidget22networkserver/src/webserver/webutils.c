#include "server.h"
#include "webserver/webserver.h"

static kv_t *mimetypes;

static const char *MOVED301 =
	"<!DOCTYPE HTML PUBLIC \"-//IETF//DTD HTML 2.0//EN\">\n"
	"<html><head>\n"
	"<title>301 Moved Permanently</title>\n"
	"</head><body>\n"
	"<h1>Moved Permanently</h1>\n"
	"<p>The document has moved</p>\n"
	"</body></html>\n";

static const char *NOTFOUND404 =
	"<!DOCTYPE HTML PUBLIC \"-//IETF//DTD HTML 2.0//EN\">\n"
	"<HTML><HEAD>\n"
	"<TITLE>404 Not Found</TITLE>\n"
	"</HEAD><BODY>\n"
	"<H1>Not Found</H1>\n"
	"The requested URL '%s' was not found on server.<P>\n"
	"</BODY></HTML>\n";

PhidgetReturnCode
mkheader(char *buf, size_t *bufsz, const char *path, int nocache) {
	size_t len;

	if (nocache) {
		len = mos_snprintf(buf, *bufsz,
		  "HTTP/1.1 200 OK\r\nServer: Phidget22\r\n"
		  "Cache-Control: no-cache, no-store, must-revalidate\r\n"
		  "Pragma: no-cache\r\n"
		  "Expires: 0\r\n"
		  "Connection: close\r\n"
		  "Content-Type: %s\r\n"
		  "\r\n",
		  getmimetype(mimetypes, path));
	} else {
		len = mos_snprintf(buf, *bufsz,
		  "HTTP/1.1 200 OK\r\nServer: Phidget22\r\n"
		  "Connection: close\r\n"
		  "Content-Type: %s\r\n"
		  "\r\n",
		  getmimetype(mimetypes, path));
	}
	if (len >= *bufsz)
		return (EPHIDGET_NOSPC);

	*bufsz = len;
	return (EPHIDGET_OK);
}

PhidgetReturnCode
wsheader(mosiop_t iop, WebConnHandle wc, const char *path) {
	PhidgetReturnCode res;
	char header[256];
	size_t n;

	n = sizeof (header);
	res = mkheader(header, &n, path, wc->flags & WC_NOCACHE);
	if (res != EPHIDGET_OK)
		return (MOS_ERROR(iop, res, "failed to create header"));

	res = netConnWrite(iop, wc->conn, header, n);
	if (res != EPHIDGET_OK)
		return (MOS_ERROR(iop, res, "failed to write header"));

	return (EPHIDGET_OK);

}

PhidgetReturnCode
wsnoent(mosiop_t iop, WebConnHandle wc, const char *path) {
	PhidgetReturnCode res;
	char reply[256];
	size_t len;

	len = mos_snprintf(reply, sizeof (reply),
	  "HTTP/1.1 404 Not Found\r\nServer: Phidget22\r\nConnection: close\r\n"
	  "Content-Type: text/html; charset=iso-8859-1\r\n\r\n");
	if (len >= sizeof (reply))
		return (MOS_ERROR(iop, EPHIDGET_NOSPC, "not enough space to render header"));

	res = netConnWrite(iop, wc->conn, reply, len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write header to client"));

	len = mos_snprintf(reply, sizeof (reply), NOTFOUND404, wc->uri);
	res = netConnWrite(iop, wc->conn, reply, len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write error reply to client"));

	return (EPHIDGET_OK);
}

PhidgetReturnCode
wsmoved(mosiop_t iop, WebConnHandle wc, const char *fmt, ...) {
	PhidgetReturnCode res;
	char path[1024];
	char buf[2048];
	char loc[1024];
	va_list va;
	int len;

	if (wc->serverhost == NULL)
		return (MOS_ERROR(iop, MOSN_ERR, "missing server host name"));

	va_start(va, fmt);
	mos_vsnprintf(path, sizeof (path), fmt, va);
	va_end(va);

	if (wc->port != DEFAULT_PORT)
		mos_snprintf(loc, sizeof (loc), "http://%s:%d%s", wc->serverhost, wc->port, path);
	else
		mos_snprintf(loc, sizeof (loc), "http://%s%s", wc->serverhost, path);

	len = mos_snprintf(buf, sizeof (buf), "HTTP/1.1 301 Moved Permanently\r\n"
	  "Location: %s\r\n"	/* http://127.0.0.1/dir/ */
	  "Content-Length: %zu\r\n"
	  "Connection: close\r\n"
	  "Content-Type: text/html; charset=iso-8859-1\r\n\r\n%s", loc, mos_strlen(MOVED301), MOVED301);

	res = netConnWrite(iop, wc->conn, buf, len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write error message to client"));

	return (0);
}

PhidgetReturnCode
wserror(mosiop_t iop, WebConnHandle wc, int httperr, const char *httpmsg, PhidgetReturnCode err,
  const char *fmt, ...) {
	PhidgetReturnCode res;
	char emsg[1024];
	char buf[4096];
	char msg[512];
	uint32_t len;
	va_list va;

	va_start(va, fmt);
	mos_vsnprintf(msg, sizeof(msg), fmt, va);
	va_end(va);

	wslogwarn("HTTP error %d (%s):[%d] %s", httperr, httpmsg, err, msg);

	len = mos_snprintf(buf, sizeof (buf),
	  "HTTP/1.1 %d %s\r\nServer: Phidget22\r\nConnection: close\r\n"
	  "Content-Type: application/json\r\n\r\n", httperr, httpmsg);

	len += mos_snprintf(buf + len, sizeof (buf) - len, "{\"request\":\"%s\",\"result\":\"%d\","
	  "\"response\":{\"msg\":\"%s\"}}", wc->uri, err, json_escape(msg, emsg, sizeof (emsg)));

	res = netConnWrite(iop, wc->conn, buf, len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write error message to client"));

	return (0);
}

void
wsaccesslog(const char *userident, const char *userid, WebConnHandle wc, int status, uint32_t sz) {
	mostimestamp_t now;
	char req[1024];
	char dbuf[32];

	if (wc->accessfp == NULL)
		return;

	mostimestamp_now(&now);

	mos_snprintf(dbuf, sizeof (dbuf), "[%d/%s/%d:%d:%d:%d -0700]",
	  now.mts_day, mostimestamp_monthstring(&now), now.mts_year,
	  now.mts_hour, now.mts_minute, now.mts_second);

	mos_snprintf(req, sizeof (req), "%s %s HTTP/%d.%d", wc->method, wc->uri, wc->httpmajor, wc->httpminor);

	fprintf(wc->accessfp, "%s %s %s %s \"%s\" %d %u\n", getNetConnPeerName(wc->conn),
	  userident != NULL ? userident : "-",
	  userid != NULL ? userident : "-", dbuf, req, status, sz);
	fflush(wc->accessfp);
}

const char *
getmimetype(kv_t *kv, const char *name) {
	const char *p;

	p = mos_strrchrc(name, '.');
	if (p == NULL)
		return (MIME_WWW_DEFAULT);

	return (kvgetstrc(kv, p + 1, MIME_WWW_DEFAULT));
}

PhidgetReturnCode
loadMimeTypes(const char *path) {
	PhidgetReturnCode res;
	mosiop_t iop;

	if (path == NULL)
		return (EPHIDGET_INVALIDARG);

	iop = mos_iop_alloc();

	res = kv_read(&mimetypes, iop, path);
	if (res != 0) {
		wslogerr("failed to read 'mimetypes' from '%s'\n%N", path, iop);
		wsloginfo("'mimetypes' is found in the 'etc' directory of the network server by default");
	}

	mos_iop_release(&iop);

	return (res);
}

void
releaseMimeTypes() {

	if (mimetypes)
		kvfree(&mimetypes);
}
