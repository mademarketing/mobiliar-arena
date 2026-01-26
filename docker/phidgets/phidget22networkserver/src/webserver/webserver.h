#ifndef _WEBSERVER_H_
#define _WEBSERVER_H_

#include "server.h"

PHIDGET22_API const char * CCONV json_escape(const char *, char *, size_t);
PHIDGET22_API const char * CCONV json_unescape(char *);

struct _WebPhidget;
struct _WebConn;

#define DEFAULT_PORT	80
#define MAX_CONNECTIONS	32
#define MAX_LISTENERS	1

#define MAXHEADERS		32768

#define WEBSOCK_VERSION	13
#define WEBSOCK_GUID	"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
#define WEBSOCK_KEY		"Sec-WebSocket-Key"
#define WEBSOCK_VER		"Sec-WebSocket-Version"
#define WEBSOCK_ACCEPT	"Sec-WebSocket-Accept"

#define APIPATH			"/api/v1"
#define DICTIONARYAPI	"dictionary"

#define DICTFMT_JSON	1
#define DICTFMT_CSV		2

#define WC_WEBSOCKET			0x01	/* has been upgraded to a websocket */
#define WC_PHIDGETS				0x02	/* websocket serving phidgets */
#define WC_AUTHENTICATED		0x04	/* connection was authenticated */
#define WC_NOCACHE				0x08	/* send no cache headers to client */

#define MIME_WWW_DEFAULT		"application/octet-stream"

struct webapi {
	int	enabled;
	int	adddictionary;
	int	changedictionary;
	int	removedictionary;
	int	addkey;
	int	removekey;
	int	changekey;
};

typedef struct _WebConn {
	PhidgetNetConnHandle	conn;
	int						flags;
	int						port;
	char					*serverhost;
	char					reqline[2048];
	char					method[16];
	char					uri[2048];
	uint32_t				httpmajor;
	uint32_t				httpminor;
	kv_t					*header;
	kv_t					*query;
	char					readbuf[16384];	/* read buffer */
	size_t					readbufavail;	/* bytes available in read buffer */
	FILE					*accessfp;
	struct webapi			webapi;
} WebConn, *WebConnHandle;

void initWebSockNetConn(IPhidgetServerHandle, PhidgetNetConnHandle);
PhidgetReturnCode handleAPIRequest(mosiop_t, pconf_t *, WebConnHandle, int *);

PhidgetReturnCode mkheader(char *, size_t *, const char *, int);

/*
 * Writes a message to the access log.
 *
 * (user ident, user id, conn, status, sz)
 */
void wsaccesslog(const char *, const char *, WebConnHandle, int, uint32_t);

/*
 * Writes a HTTP header prior to sending data to the client.
 */
PhidgetReturnCode wsheader(mosiop_t, WebConnHandle, const char *);

/*
 * Writes a 404 message to the client.
 */
PhidgetReturnCode wsnoent(mosiop_t, WebConnHandle, const char *);

/*
 * Writes a generic error to the client.
 *
 * (iop, conn, http error, http msg, phidget error code, error message)
 */
PhidgetReturnCode wserror(mosiop_t, WebConnHandle, int, const char *, PhidgetReturnCode, const char *, ...);

 /*
  * Writes a 301 moved message.
  */
PhidgetReturnCode wsmoved(mosiop_t, WebConnHandle, const char *, ...);

const char *getmimetype(kv_t *, const char *);
PhidgetReturnCode loadMimeTypes(const char *);
void releaseMimeTypes(void);

#define WSSRC "www"

#ifdef NDEBUG
#define wslogdebug(...)
#define wslogcrit(...) PhidgetLog_loge(NULL, 0, __func__, WSSRC, PHIDGET_LOG_CRITICAL, __VA_ARGS__)
#define wslogerr(...) PhidgetLog_loge(NULL, 0, __func__, WSSRC, PHIDGET_LOG_ERROR, __VA_ARGS__)
#define wslogwarn(...) PhidgetLog_loge(NULL, 0, __func__, WSSRC, PHIDGET_LOG_WARNING, __VA_ARGS__)
#define wsloginfo(...) PhidgetLog_loge(NULL, 0, __func__, WSSRC, PHIDGET_LOG_INFO, __VA_ARGS__)
#define wslogverbose(...) PhidgetLog_loge(NULL, 0, __func__, WSSRC, PHIDGET_LOG_VERBOSE, __VA_ARGS__)
#else
#define wslogcrit(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, WSSRC, PHIDGET_LOG_CRITICAL, __VA_ARGS__)
#define wslogerr(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, WSSRC, PHIDGET_LOG_ERROR, __VA_ARGS__)
#define wslogwarn(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, WSSRC, PHIDGET_LOG_WARNING, __VA_ARGS__)
#define wsloginfo(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, WSSRC, PHIDGET_LOG_INFO, __VA_ARGS__)
#define wslogdebug(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, WSSRC, PHIDGET_LOG_DEBUG, __VA_ARGS__)
#define wslogverbose(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, WSSRC, PHIDGET_LOG_VERBOSE, __VA_ARGS__)
#endif /* NDEBUG */

#endif /* _WEBSERVER_H_ */