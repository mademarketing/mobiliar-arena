#define _PHIDGET_NETWORKCODE

#include "server.h"
#include "webserver/webserver.h"

typedef struct _wsheader {
	uint64_t len;
	uint8_t	fin;
	uint8_t	rsv1;
	uint8_t	rsv2;
	uint8_t	rsv3;
	uint8_t opcode;
	uint8_t mask;
	uint8_t maskkey[4];
	uint8_t	hbuf[10];
} wsheader_t;

#define ISCTRL(op)	((op & 0x8) == 0x8)
#define WSOPC_CLOSE	0x8
#define WSOPC_PING	0x9
#define WSOPC_PONG	0xA

static PhidgetReturnCode
wsReadHeader(mosiop_t iop, WebConnHandle wc, wsheader_t *ws) {
	PhidgetReturnCode res;
	int maskoff;
	uint32_t len;

	len = 2;
	res = pnread(iop, wc->conn, ws->hbuf, &len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to read websocket header"));
	if (len != 2)
		return (MOS_ERROR(iop, EPHIDGET_IO, "failed to read first 2 bytes of websocket header"));

	ws->fin =  (ws->hbuf[0] >> 7) & 0x01;
	ws->rsv1 = (ws->hbuf[0] >> 4) & 0x01;
	ws->rsv2 = (ws->hbuf[0] >> 5) & 0x01;
	ws->rsv3 = (ws->hbuf[0] >> 6) & 0x01;
	ws->opcode = ws->hbuf[0] & 0x0F;
	ws->mask = (ws->hbuf[1] >> 7) & 0x01;
	ws->len = ws->hbuf[1] & 0x7F;

	maskoff = 2;

	if (ws->len == 127) {
		if (ISCTRL(ws->opcode))
			return (MOS_ERROR(iop, EPHIDGET_INVALID, "control frame has large payload"));

		len = 8;
		res = pnread(iop, wc->conn, &ws->hbuf[2], &len);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to read websocket 16bit length"));
		if (len != 8)
			return (MOS_ERROR(iop, res, "failed to read 64bit length 8 bytes of websocket header"));

		ws->len =
		  ((uint64_t)ws->hbuf[2] << 56) |
		  ((uint64_t)ws->hbuf[3] << 48) |
		  ((uint64_t)ws->hbuf[4] << 40) |
		  ((uint64_t)ws->hbuf[5] << 32) |
		  (ws->hbuf[6] << 24) |
		  (ws->hbuf[7] << 16) |
		  (ws->hbuf[8] << 8) |
		  ws->hbuf[9];
		maskoff += 8;
	} else if (ws->len == 126) {
		if (ISCTRL(ws->opcode))
			return (MOS_ERROR(iop, EPHIDGET_INVALID, "control frame has large payload"));

		len = 2;
		res = pnread(iop, wc->conn, &ws->hbuf[2], &len);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to read websocket 16bit length"));
		if (len != 2)
			return (MOS_ERROR(iop, res, "failed to read 16bit length 2 bytes of websocket header"));
		ws->len = (ws->hbuf[2] << 8) | ws->hbuf[3];
		maskoff += 2;
	}

	len = 4;
	res = pnread(iop, wc->conn, &ws->hbuf[maskoff], &len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to read websocket mask"));
	if (len != 4)
		return (MOS_ERROR(iop, res, "failed to read websocket mask"));

	ws->maskkey[0] = ws->hbuf[maskoff];
	ws->maskkey[1] = ws->hbuf[maskoff + 1];
	ws->maskkey[2] = ws->hbuf[maskoff + 2];
	ws->maskkey[3] = ws->hbuf[maskoff + 3];

	return (res);
}

static PhidgetReturnCode
wsReadPayload(mosiop_t iop, wsheader_t *ws, WebConnHandle wc, uint8_t *buf, uint32_t *bufsz) {
	PhidgetReturnCode res;
	uint32_t off;
	uint32_t n;

	if (*bufsz < ws->len)
		return (MOS_ERROR(iop, EPHIDGET_NOSPC, "buf too small for payload (%u vs %u)", *bufsz, ws->len));

	for (off = 0; off < ws->len; off += n) {
		n = (uint32_t)ws->len - off;
		res = pnread(iop, wc->conn, buf + off, &n);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to read websock payload"));
	}
	for (off = 0; off < (uint32_t)ws->len; off++)
		buf[off] = buf[off] ^ ws->maskkey[off % 4];

	*bufsz = (uint32_t)ws->len;
	return (0);
}

static PhidgetReturnCode
wsRead(mosiop_t iop, WebConnHandle wc, uint8_t *buf, uint32_t *bufsz, uint8_t *opcode) {
	PhidgetReturnCode res;
	wsheader_t ws;
	uint32_t boff;
	uint32_t bsz;
	int pkt;

	memset(&ws, 0, sizeof (ws));
	boff = 0;

	for (pkt = 0; !ws.fin; pkt++) {
		res = wsReadHeader(iop, wc, &ws);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to read websocket header"));

		if (pkt == 0)
			*opcode = ws.opcode;

		bsz = *bufsz - boff;
		res = wsReadPayload(iop, &ws, wc, buf + boff, &bsz);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to read websocket payload"));

		boff += bsz;
	}
	*bufsz = boff;
	return (0);
}

static PhidgetReturnCode
wsWritex(mosiop_t iop, WebConnHandle wc, int fin, uint8_t opcode, const char *buf, uint32_t len) {
	PhidgetReturnCode res;
	uint8_t hdr[4];
	int off;

	if (len > 65535)
		return (MOS_ERROR(iop, EPHIDGET_UNSUPPORTED, "write too large for implementation"));

	hdr[0] = 0;
	off = 0;

	if (fin)
		hdr[off] = 0x80;
	hdr[off] |= (opcode & 0x07);
	off++;


	if (len > 125) {
		hdr[off++] = 126;
		hdr[off++] = (len >> 8) & 0xFF;
		hdr[off++] = len & 0xFF;
	} else {
		hdr[off++] = len & 0x7F;
	}

	res = pnwrite(iop, wc->conn, hdr, off);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write header to websocket client"));
	res = pnwrite(iop, wc->conn, buf, len);
	if (res != 0)
		return (MOS_ERROR(iop, res, "failed to write payload to websocket client"));
	return (0);
}

static PhidgetReturnCode
wsWrite(mosiop_t iop, WebConnHandle wc, const char *buf, uint32_t len) {
	PhidgetReturnCode res;
	uint32_t off;
	uint32_t n;

	for (off = 0; off < len; off += n) {
		n = MOS_MIN(65535, len - off);
		res = wsWritex(iop, wc, off + n == len, off == 0 ? 0x2 : 0, buf + off, n);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to write payload to client"));
	}
	return (0);
}

static void
wsPong(WebConnHandle wc, const char *buf, uint32_t len) {

	nslogdebug("");
	wsWritex(MOS_IOP_IGNORE, wc, 1, WSOPC_PONG, buf, len);
}

static void
wsClose(WebConnHandle wc, const char *buf, uint32_t len) {

	nslogdebug("");
	wsWritex(MOS_IOP_IGNORE, wc, 1, WSOPC_CLOSE, buf, len);
}

static PhidgetReturnCode
_netconnread(mosiop_t iop, PhidgetNetConnHandle nc, void *buf, uint32_t *bufsz) {
	PhidgetReturnCode res;
	WebConnHandle wc;
	uint8_t opcode;
	uint32_t len;

	wc = getNetConnPrivate(nc);
	if (wc == NULL)
		return (EPHIDGET_IO);

readbuf:

	if (wc->readbufavail > 0) {
		len = MOS_MIN(*bufsz, (uint32_t)wc->readbufavail);
		memcpy(buf, wc->readbuf, len);
		*bufsz = len;
		memmove(wc->readbuf, wc->readbuf + len, wc->readbufavail - len);
		wc->readbufavail -= len;
		return (0);
	}

again:

	len = sizeof (wc->readbuf);
	opcode = 0;
	res = wsRead(iop, wc, (uint8_t *)wc->readbuf, &len, &opcode);
	if (res != 0)
		return (res);

	if (opcode == WSOPC_PING) {
		wsPong(wc, buf, len);
		goto again;
	}

	if (opcode == WSOPC_CLOSE) {
		wsClose(wc, buf, len);
		return (EPHIDGET_PIPE);
	}

	wc->readbufavail = len;
	if (wc->readbufavail == 0) {
		*bufsz = 0;
		return (0);
	}
	goto readbuf;
}

static PhidgetReturnCode CCONV
netconnread(mosiop_t iop, PhidgetNetConnHandle nc, void *buf, uint32_t *bufsz) {
	PhidgetReturnCode res;
	uint32_t nread;
	uint32_t n;

	for (nread = 0; nread < *bufsz; nread += n) {
		n = *bufsz - nread;
		res = _netconnread(iop, nc, ((uint8_t *)buf) + nread, &n);
		if (res != 0)
			return (MOS_ERROR(iop, res, "failed to read from websocket"));
		if (n == 0)
			break;
	}
	*bufsz = nread;

	return (0);
}

static PhidgetReturnCode CCONV
netconnwrite(mosiop_t iop, PhidgetNetConnHandle nc, const void *buf, uint32_t bufsz) {
	WebConnHandle wc;

	wc = getNetConnPrivate(nc);
	if (wc == NULL)
		return (EPHIDGET_IO);

	return (wsWrite(iop, wc, buf, bufsz));
}

void
initWebSockNetConn(IPhidgetServerHandle server, PhidgetNetConnHandle nc) {

	setNetConnHandlers(nc, NULL, NULL, netconnwrite, netconnread);
}
