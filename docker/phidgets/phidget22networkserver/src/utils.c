#include "server.h"

#include "mos/mos_base64.h"
#include "mos/mos_random.h"
#include "mos/mos_sha2.h"

void
hmac_sha1(const uint8_t *text, size_t text_len, uint8_t digest[SHA1_DIGEST_LENGTH]) {
	SHA1_CTX ctx;

	mos_SHA1_Init(&ctx);
	mos_SHA1_Update(&ctx, text, (unsigned int)text_len);
	mos_SHA1_Final(digest, &ctx);
}

void
hmac_sha256(const uint8_t *text, size_t text_len, uint8_t digest[SHA256_DIGEST_LENGTH]) {
	SHA256_CTX ctx;

	mos_SHA256_Init(&ctx);
	mos_SHA256_Update(&ctx, text, text_len);
	mos_SHA256_Final(digest, &ctx);
}

PhidgetReturnCode
createSalt(mosiop_t iop, char *buf, uint32_t buflen) {
	mosrandom_t *rdm;
	uint8_t rbuf[16];
	uint32_t b64len;
	uint8_t *b64;
	int err;

	err = mosrandom_alloc(iop, NULL, 0, &rdm);
	if (err != 0)
		return (EPHIDGET_UNEXPECTED);

	err = mosrandom_getbytes(rdm, iop, rbuf, sizeof (rbuf));
	mosrandom_free(&rdm);
	if (err != 0)
		return (EPHIDGET_UNEXPECTED);

	b64 = mos_base64_encode(rbuf, sizeof (rbuf), &b64len);
	mos_strlcpy(buf, (char *)b64, buflen);
	mos_free(b64, b64len);

	return (EPHIDGET_OK);
}
