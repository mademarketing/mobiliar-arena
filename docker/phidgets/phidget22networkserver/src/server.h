#ifndef _NETWORK_SERVER_H_
#define _NETWORK_SERVER_H_

#include "phidget22extra.h"

#include "mos/mos_os.h"
#include "mos/mos_lock.h"
#include "mos/mos_iop.h"
#include "mos/mos_net.h"
#include "mos/kv/kv.h"
#include "mos/bsdtree.h"
#include "mos/mos_sha1.h"
#include "mos/mos_sha2.h"

#define LOGPORT			5771
#define DICTCONFIGEXT	".dpc"
#ifdef Windows
#define CONFIGFILE		"c:/ProgramData/Phidgets/phidget22networkserver.pc"
#define DICTCONFIGDIR	"c:/ProgramData/Phidgets/dictionary.d"
#define DICTDBDIR		"c:/ProgramData/Phidgets/dictionary.d"
#define LOGFILE			"c:/ProgramData/Phidgets/phidget22networkserver.log"
#define PIDFILE			""
#else /* !Windows */
#ifndef CONFIGFILE
#define CONFIGFILE		"/etc/phidgets/phidget22networkserver.pc"
#endif
#define DICTCONFIGDIR	"/etc/phidgets/dictionary.d"
#define DICTDBDIR		"/var/phidgets/dictionary.d"
#define PIDFILE			"/var/run/phidget22networkserver.pid"
#define LOGFILE			"/var/log/phidget22networkserver.log"
#endif /* Windows */

PhidgetReturnCode startDictionaries(pconf_t *);
void stopDictionaries(void);

PhidgetReturnCode startPhidgetServer(pconf_t *);
void stopPhidgetServer(void);

void WebServerInit(void);
int startWebServer(pconf_t *);
void stopWebServer(void);

void hmac_sha1(const uint8_t *, size_t, uint8_t[SHA1_DIGEST_LENGTH]);
void hmac_sha256(const uint8_t *, size_t, uint8_t[SHA256_DIGEST_LENGTH]);
PhidgetReturnCode createSalt(mosiop_t, char *, uint32_t);

void CCONV onAttach(PhidgetManagerHandle, void *, PhidgetHandle);
void CCONV onDetach(PhidgetManagerHandle, void *, PhidgetHandle);

#define NETSRVLS "netsrv"

#ifdef NDEBUG
#define nslogdebug(...)
#define nslogcrit(...) PhidgetLog_loge(NULL, 0, __func__, NETSRVLS, PHIDGET_LOG_CRITICAL, __VA_ARGS__)
#define nslogerr(...) PhidgetLog_loge(NULL, 0, __func__, NETSRVLS, PHIDGET_LOG_ERROR, __VA_ARGS__)
#define nslogwarn(...) PhidgetLog_loge(NULL, 0, __func__, NETSRVLS, PHIDGET_LOG_WARNING, __VA_ARGS__)
#define nsloginfo(...) PhidgetLog_loge(NULL, 0, __func__, NETSRVLS, PHIDGET_LOG_INFO, __VA_ARGS__)
#define nslogverbose(...) PhidgetLog_loge(NULL, 0, __func__, NETSRVLS, PHIDGET_LOG_VERBOSE, __VA_ARGS__)
#else
#define nslogcrit(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, NETSRVLS, PHIDGET_LOG_CRITICAL, __VA_ARGS__)
#define nslogerr(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, NETSRVLS, PHIDGET_LOG_ERROR, __VA_ARGS__)
#define nslogwarn(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, NETSRVLS, PHIDGET_LOG_WARNING, __VA_ARGS__)
#define nsloginfo(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, NETSRVLS, PHIDGET_LOG_INFO, __VA_ARGS__)
#define nslogdebug(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, NETSRVLS, PHIDGET_LOG_DEBUG, __VA_ARGS__)
#define nslogverbose(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, NETSRVLS, PHIDGET_LOG_VERBOSE, __VA_ARGS__)
#endif /* NDEBUG */

/*
 * Unexposed phidget22 services.
 * MUST be kept in sync with phidget22
 */

#define PHIDGET_NETWORK_PUBLISHMDNS	0x10000000
#define PHIDGET_NETWORK_MDNS_WWW	"_phidget_www._tcp"

struct PhidgetNetConn;
typedef struct PhidgetNetConn * PhidgetNetConnHandle;
struct IPhidgetServer;
typedef struct IPhidgetServer * IPhidgetServerHandle;
struct PhidgetMDNSPublish;
typedef struct PhidgetMDNSPublish * PhidgetMDNSPublishHandle;

typedef PhidgetReturnCode(CCONV *NetConnWrite)(mosiop_t, PhidgetNetConnHandle, const void *, uint32_t);
typedef PhidgetReturnCode(CCONV *NetConnRead)(mosiop_t, PhidgetNetConnHandle, void *, uint32_t *);
typedef void(CCONV *NetConnClose)(PhidgetNetConnHandle);
typedef void(CCONV *NetConnRelease)(PhidgetNetConnHandle *);

typedef void (CCONV *initPhidgetNetConn_t)(IPhidgetServerHandle, PhidgetNetConnHandle);
typedef PhidgetReturnCode(CCONV *handlePhidgetNetConn_t)(mosiop_t, IPhidgetServerHandle);
typedef PhidgetReturnCode(CCONV *handleRequest_t)(mosiop_t, PhidgetNetConnHandle, void *, int *);

PHIDGET22_API PhidgetReturnCode CCONV netConnWrite(mosiop_t, PhidgetNetConnHandle, const void *, size_t);
PHIDGET22_API PhidgetReturnCode CCONV netConnReadLine(mosiop_t, PhidgetNetConnHandle, void *, size_t *);
PHIDGET22_API PhidgetReturnCode CCONV pnwrite(mosiop_t, PhidgetNetConnHandle, const void *, uint32_t);
PHIDGET22_API PhidgetReturnCode CCONV pnread(mosiop_t, PhidgetNetConnHandle, void *, uint32_t *);

PHIDGET22_API PhidgetReturnCode CCONV setNetConnHandlers(PhidgetNetConnHandle, NetConnClose, NetConnRelease, NetConnWrite,
  NetConnRead);
PHIDGET22_API const char * CCONV getNetConnPeerName(PhidgetNetConnHandle);
PHIDGET22_API void CCONV setNetConnPrivate(PhidgetNetConnHandle, void *);
PHIDGET22_API void * CCONV getNetConnPrivate(PhidgetNetConnHandle);

PHIDGET22_API PhidgetReturnCode CCONV setNetConnProtocol(PhidgetNetConnHandle, const char *, int, int);
PHIDGET22_API PhidgetReturnCode CCONV setNetConnConnTypeStr(PhidgetNetConnHandle, const char *);
PHIDGET22_API PhidgetReturnCode CCONV setNetConnConnectionTypeListener(PhidgetNetConnHandle);
PHIDGET22_API PhidgetReturnCode CCONV setNetConnConnectionTypeLocal(PhidgetNetConnHandle);

PHIDGET22_API PhidgetNetConnHandle CCONV getIPhidgetServerNetConn(IPhidgetServerHandle);
PHIDGET22_API PhidgetServerHandle CCONV getPhidgetServerHandle(IPhidgetServerHandle);
PHIDGET22_API PhidgetReturnCode CCONV handleDeviceRequest(mosiop_t, PhidgetNetConnHandle, void *, int *);
PHIDGET22_API PhidgetReturnCode CCONV handleDeviceClient(mosiop_t, IPhidgetServerHandle);

PHIDGET22_API PhidgetReturnCode CCONV PhidgetNet_startServer2(PhidgetServerType, int, int, const char *, const char *, int,
  const char *, initPhidgetNetConn_t, handlePhidgetNetConn_t, handleRequest_t, PhidgetServerHandle *);

PHIDGET22_API PhidgetReturnCode CCONV PhidgetNet_publishmdns(PhidgetMDNSPublishHandle *, const char *, const char *,
  const char *, int, kv_t *);
PHIDGET22_API PhidgetReturnCode CCONV PhidgetNet_unpublishmdns(PhidgetMDNSPublishHandle *);
PHIDGET22_API PhidgetReturnCode CCONV PhidgetNet_setProperty(const char *, const char *, ...);

PHIDGET22_API PhidgetReturnCode CCONV PhidgetDictionary_enableControlDictionary(void);
PHIDGET22_API PhidgetReturnCode CCONV PhidgetDictionary_enableStatsDictionary(void);

PHIDGET22_API PhidgetReturnCode CCONV PhidgetDictionary_addDictionary(int deviceSerialNumber, const char *label);

#endif /* _NETWORK_SERVER_H_ */
