#define _PHIDGET_NETWORKCODE
#include "../server.h"
#include "mos/mos_readdir.h"

static PhidgetServerHandle netconn;

static PhidgetReturnCode
setNetworkFlags(pconf_t *cfg) {

	if (pconf_getbool(cfg, 0, "phidget.network.resolveaddrs"))
		PhidgetNet_setProperty("resolveaddrs", "true");

	return (EPHIDGET_OK);
}

static void
blockv4Clients(pconf_t *cfg) {
	const char *addr;
	char json[64];
	int verbose;
	int i;

	if (!pconf_getbool(cfg, 1, "phidget.filter.clients.deny.enabled")) {
		nsloginfo("client deny filtering disabled");
		return;
	}

	verbose = pconf_getbool(cfg, 0, "phidget.filter.clients.deny.verbose");

	for (i = 0; ; i++) {
		addr = pconf_getstr(cfg, NULL, "phidget.filter.clients.deny.list.%d", i);
		if (addr == NULL)
			break;
		mos_snprintf(json, sizeof (json), "{\"family\":%d, \"addr\":\"%s\",\"verbose\":%d}",
		  AF_INET, addr, verbose);
		if (PhidgetNet_setProperty("blockclient", json) != EPHIDGET_OK)
			nslogerr("failed to add block for client: '%s'", addr);
	}
}

static void
allowv4Clients(pconf_t *cfg) {
	const char *addr;
	char json[64];
	int verbose;
	int i;

	if (!pconf_getbool(cfg, 1, "phidget.filter.clients.allow.enabled")) {
		nsloginfo("client allow filtering disabled");
		return;
	}

	verbose = pconf_getbool(cfg, 0, "phidget.filter.clients.allow.verbose");

	for (i = 0; ; i++) {
		addr = pconf_getstr(cfg, NULL, "phidget.filter.clients.allow.list.%d", i);
		if (addr == NULL)
			break;
		mos_snprintf(json, sizeof (json), "{\"family\":%d, \"addr\":\"%s\",\"verbose\":%d}",
		  AF_INET, addr, verbose);
		if (PhidgetNet_setProperty("allowclient", json) != EPHIDGET_OK)
			nslogerr("failed to add block for client: '%s'", addr);
	}
}

static void
filterClients(pconf_t *cfg) {

	if (pconf_getbool(cfg, 1, "phidget.filter.enabled") == 0)
		return;

	if (mos_strcmp(pconf_getstr(cfg, "allow", "phidget.filter.clients.default"), "allow") == 0)
		PhidgetNet_setProperty("allowclients", "%d", 1);
	else
		PhidgetNet_setProperty("allowclients", "%d", 0);
	blockv4Clients(cfg);
	allowv4Clients(cfg);
}

PhidgetReturnCode
startPhidgetServer(pconf_t *cfg) {
	PhidgetReturnCode res;
	const char *srvname;
	const char *passwd;
	char compname[64];
	int flags;

	const char *ipv4_addr;
	int ipv4_port;
	int keepalive;
	int allowdg;

	getComputerName(compname, sizeof (compname), "Phidget22Server");
	flags = 0;

	srvname = pconf_getstr(cfg, compname, "phidget.network.publish.name");
	passwd = pconf_getstr(cfg, "", "phidget.auth.password");
	ipv4_port = pconf_get32(cfg, -1, "phidget.network.ipv4.port");
	ipv4_addr = pconf_getstr(cfg, NULL, "phidget.network.ipv4.address");
	keepalive = pconf_get32(cfg, -1, "phidget.network.keepalive");
	allowdg = pconf_getbool(cfg, 1, "phidget.network.datagram.enabled");

	if (allowdg)
		PhidgetNet_setProperty("allowdatagram", "true");
	else
		PhidgetNet_setProperty("allowdatagram", "false");

	if (keepalive >= 0) {
		nsloginfo("Changed network keepalive to %d", keepalive);
		PhidgetNet_setProperty("keepalive", "%d", keepalive);
	}

	if (pconf_getbool(cfg, 0, "phidget.feature.stats.enabled"))
		PhidgetDictionary_enableStatsDictionary();

	if (pconf_getbool(cfg, 1, "phidget.feature.control.enabled"))
		PhidgetDictionary_enableControlDictionary();

	if (pconf_getbool(cfg, 1, "phidget.network.publish.enabled"))
		flags |= PHIDGET_NETWORK_PUBLISHMDNS;

	filterClients(cfg);
	setNetworkFlags(cfg);

	if (ipv4_port != -1) {
		res = PhidgetNet_startServer(flags, AF_INET, srvname, ipv4_addr, ipv4_port, passwd, &netconn);
		if (res != EPHIDGET_OK) {
			nsloginfo("PhidgetNet_startserver() failed on IPv4 port %d", ipv4_port);
			return (res);
		}
		nsloginfo("Started Phidget Server %s %s:%d", srvname, ipv4_addr ? ipv4_addr : "any", ipv4_port);
	}

	return (EPHIDGET_OK);
}

void
stopPhidgetServer() {

	PhidgetNet_stopServer(&netconn);
}