#include "server.h"
#include "mos/mos_fmt.h"
#include "mos/mos_assert.h"
#include "phidget22extra/phidgetconfig.h"

#include <signal.h>
#ifdef VERSION
#undef VERSION
#endif
#define VERSION	"1.1"

#ifdef _WINDOWS
#pragma comment(lib, "Ws2_32.lib")
#pragma comment(lib, "winmm.lib")
#endif

static PhidgetManagerHandle phidgetManager;
static pconf_t *cfg;

static const char *pidfile;	/* for UNIX */
static const char *logfile;
static const char *cfgfile;	/* configuration file */
static int Dflag;			/* run as service/daemon */
static int stop;

static int websrv_phid_enable;
static int dictionary_enable;
static int phidsrv_enable;
static int websrv_enable;
static int logport;
static int netlog;

static Phidget_LogLevel ll;

static void
usage(const char *pname, int err) {
	FILE *out;

	if (err)
		out = stderr;
	else
		out = stdout;

	fprintf(out, "usage: %s [-Dhv][-c <file>]\n", pname);
	fprintf(out, "  -D           run as daemon\n");
	fprintf(out, "  -c <file>    configuration file\n");
	fprintf(out, "  -h           print help\n");
	fprintf(out, "  -v           print version\n");

	exit(err);
}

#ifdef _WINDOWS
static BOOL
ctrlhandler(DWORD type) {

	switch (type) {
	case CTRL_C_EVENT:
		nslogwarn("ctrl-c: flagging the server to stop");
		stop = 1;
		return (TRUE);
	case CTRL_SHUTDOWN_EVENT:
		nslogwarn("shutdown event received");
		stop = 1;
		return (TRUE);
	default:
		return (FALSE);
	}
}
#endif /* _WINDOWS */

#ifdef UNIX
static void
sighandler(int sig, siginfo_t *siginfo, void *context) {

	removepid(pidfile);
	stop = 1;
}

static int
register_signalhandlers() {
	struct sigaction act;

	memset(&act, '\0', sizeof(act));
	act.sa_sigaction = &sighandler;
	act.sa_flags = SA_SIGINFO;

	sigaction(SIGINT, &act, NULL);
	sigaction(SIGTERM, &act, NULL);
	sigaction(SIGQUIT, &act, NULL);
	signal(SIGPIPE, SIG_IGN);

	return (0);
}
#endif /* UNIX */

#ifdef _WINDOWS
static int
register_signalhandlers() {
	if (SetConsoleCtrlHandler((PHANDLER_ROUTINE)ctrlhandler, TRUE) != 0)
		return (0);
	return (1);
}
#endif /* _WINDOWS */

static PhidgetReturnCode
processconfig() {
	PhidgetReturnCode res;
	char errbuf[128] = { 0 };
	uint64_t maxsize;
	int maxfiles;

	res = pconf_parsepc(&cfg, errbuf, sizeof(errbuf), cfgfile);
	if (res != EPHIDGET_OK) {
		nslogerr("failed to read configuration file [%s]: '%s' %s\n", cfgfile, getErrorStr(res), errbuf);
		return (res);
	}

	dictionary_enable = pconf_getbool(cfg, 1, "phidget.feature.dictionary.enabled");
	phidsrv_enable = pconf_getbool(cfg, 0, "phidget.enabled");
	websrv_enable =  pconf_getbool(cfg, 0, "phidget.www.enabled");
	websrv_phid_enable = pconf_getbool(cfg, 1, "phidget.www.phidgets.enabled");
	ll = getLogLevel(pconf_getstr(cfg, "", "phidget.logging.level"));
	netlog = pconf_getbool(cfg, 0, "phidget.logging.network.enabled");
	logport = pconf_get32(cfg, LOGPORT, "phidget.logging.network.port");
	logfile = pconf_getstr(cfg, LOGFILE, "phidget.logging.file");
	pidfile = pconf_getstr(cfg, PIDFILE, "phidget.pidfile");

	PhidgetLog_getRotating(&maxsize, &maxfiles);
	maxfiles = pconf_getu32(cfg, maxfiles, "phidget.logging.maxfiles");
	maxsize = pconf_get64(cfg, maxsize, "phidget.logging.maxsize");
	PhidgetLog_setRotating(maxsize, maxfiles);

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
enableLogging() {
	PhidgetReturnCode res;
	Phidget_LogLevel lvl;
	const char *sname;
	const char *llvl;
	int i;

	/* Disable STDERR logging */
	PhidgetLog_disable();

	res = PhidgetLog_enable(ll, logfile);
	if (res != EPHIDGET_OK) {
		mos_printef("failed to enable logging '%s'\n", getErrorStr(res));
		return (res);
	}

	if (netlog && logport != 0) {
		res = PhidgetLog_enableNetwork(NULL, logport);
		if (res != EPHIDGET_OK)
			nslogerr("failed to enable network logging");
	}

	for (i = 0; i < pconf_getcount(cfg, "phidget.logging.source"); i++) {
		sname = pconf_getentryname(cfg, i, "phidget.logging.source");
		MOS_ASSERT(sname != NULL);
		llvl = pconf_getstr(cfg, "info", "phidget.logging.source.%s.level", sname);
		lvl = getLogLevel(llvl);
		res = PhidgetLog_setSourceLevel(sname, lvl);
		if (res == EPHIDGET_OK)
			nsloginfo("logging: %s=%s", sname, llvl);
		else
			nslogwarn("failed to set log source level (%s): %d", sname, res);
	}

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
runPhidgetNetworkServer(void *ctx) {
	PhidgetReturnCode res;

	if (stop)
		return (EPHIDGET_OK);

	res = enableLogging();
	if (res != EPHIDGET_OK)
		return (res);

	/*
	 * Start a global phidget manager if the phidsrv or websrv is enabled (and wants phidgets).
	 * They can share.
	 */
	if (phidsrv_enable || (websrv_enable && websrv_phid_enable)) {
		res = PhidgetManager_create(&phidgetManager);
		if (res != EPHIDGET_OK) {
			nslogerr("failed to create PhidgetManager");
			goto done;
		}

		res = PhidgetManager_open(phidgetManager);
		if (res != 0) {
			PhidgetManager_delete(&phidgetManager);
			nslogerr("failed to open PhidgetManager");
			goto done;
		}
		nslogverbose("created phidget manager");
	}

	if (dictionary_enable) {
		res = startDictionaries(cfg);
		if (res != EPHIDGET_OK) {
			nslogerr("failed to start dictionaries");
			goto done;
		}
	}

	if (phidsrv_enable) {
		res = startPhidgetServer(cfg);
		if (res != EPHIDGET_OK) {
			nslogerr("failed to start phidget server");
			goto done;
		}
	}

	if (websrv_enable) {
		WebServerInit();
		res = startWebServer(cfg);
		if (res != EPHIDGET_OK) {
			nslogerr("failed to start web server");
			goto done;
		}
	}

	res = EPHIDGET_OK;

	while (!stop)
		mos_usleep(MOS_SEC / 1000);

done:

	if (phidsrv_enable)
		stopPhidgetServer();
	if (websrv_enable)
		stopWebServer();

	if (phidgetManager) {
		PhidgetManager_close(phidgetManager);
		PhidgetManager_delete(&phidgetManager);
	}

	return (EPHIDGET_OK);
}

int
main(int argc, char **argv) {
	PhidgetReturnCode res;
	int ch;

	res = PhidgetLog_enable(PHIDGET_LOG_INFO, NULL);
	if (res != EPHIDGET_OK) {
		if (res == EPHIDGET_IO) {
			// This is expected when running as a Windows Service, so just continue.
			fprintf(stderr, "failed to enable initial logging - continuing\n");
		} else {
			fprintf(stderr, "failed to enable initial logging\n");
			exit(1);
		}
	}

	if (register_signalhandlers()) {
		nslogerr("failed to register signal handlers\n");
		exit(1);
	}

	phidgetManager = NULL;

	while ((ch = mos_getopt(argc, argv, "Dc:hwv-")) != -1) {
		switch (ch) {
		case 'D':
			Dflag++;
			break;
		case 'c':
			cfgfile = mos_optarg;
			break;
		case 'v':
			printf("Phidget22NetworkServer %s\n", VERSION);
			break;
		case 'h':
		case '-':
			usage(argv[0], 0); /* To handle --help and --version arguments */
			/* NOT REACHED */
		default:
			usage(argv[0], 1);
			/* NOT REACHED */
		}
	}

	argc -= mos_optind;
	argv += mos_optind;

	if (cfgfile == NULL)
		cfgfile = CONFIGFILE;

	res = processconfig();
	if (res != 0)
		exit(3);

	nsloginfo("Phidget22NetworkServer %s\n", VERSION);

	if (Dflag) {
		res = startDaemon("Phidget22NetworkServer", runPhidgetNetworkServer, NULL, NULL, pidfile);
		if (res != 0)
			nslogerr("failed to start Phidget22Server service: %s", getErrorStr(res));
	} else {
		runPhidgetNetworkServer(NULL);
	}

	if (cfg)
		pconf_release(&cfg);

	if (netlog)
		PhidgetLog_disableNetwork();
	PhidgetLog_disable();

	Phidget_finalize(0);
	exit(res);
}
