#include "dictionary.h"
#include "webserver.h"
#include "sqlite3.h"
#include "mos/mos_fileio.h"

static const char *dictdir;		/* cached dictionary directory */

#define KEYMAP_SETFALSE		0x01
#define KEYMAP_REMOVE		0x02
#define KEYMAP_RMB4SET		0x04

struct keymap;

typedef void (*keymaphandler_t)(mosiop_t, WebConnHandle, dsdictionary_t *, pconf_t *, const char *,
  const char *, int, struct keymap *);

struct keymap {
	int				flags;
	const char		*clientkey;
	const char		*dictpath;
	const char		*altpath;
	keymaphandler_t	handler;
};

typedef PhidgetReturnCode (*dbcheck_t)(pconf_t *, pconf_t *, const char *);

struct arg {
	const char *name;
	const char *col;
	const char *cmp;
	int			type;
	dbcheck_t	check;
};

static PhidgetReturnCode validString(pconf_t *, pconf_t *, const char *);
static PhidgetReturnCode validInt(pconf_t *, pconf_t *, const char *);
static PhidgetReturnCode validDateTime(pconf_t *, pconf_t *, const char *);
static PhidgetReturnCode validKey(pconf_t *, pconf_t *, const char *);

static struct arg args[] = {
	{ "gen", "gen", "=", 1, validString},
	{ "startid", "id", ">=", 0, validInt},
	{ "endid", "id", "<=", 0, validInt},
	{ "startdate", "time", ">=", 2, validDateTime},
	{ "enddate", "time", "<=", 2, validDateTime},
	{ "key", "key", "=", 1, validKey},
	{ 0 }
};

static const char *dslog1_query = "select id, gen, time, key, val from dslog1";
//  "select id, gen, strftime('%Y-%m-%dT%H:%M:%f', time, 'localtime'), key, val from dslog1";

struct dslog1_row {
	int id;
	const uint8_t *gen;
	const uint8_t *time;
	const uint8_t *key;
	const uint8_t *val;
};

static PhidgetReturnCode
writeReply(WebConnHandle wc, PhidgetReturnCode status) {
	char buf[256];
	size_t n;

	n = mos_snprintf(buf, sizeof (buf), "{\"content\":\"status\",\"version\":1,\"result\":%d}", status);
	return (netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n));
}

static PhidgetReturnCode
validKey(pconf_t *pc, pconf_t *dbpc, const char *key) {

	if (!Phidget_validDictionaryKey(key))
		return (EPHIDGET_INVALIDARG);

	if (!pconf_exists(dbpc, "dictionary.log.key.%s", key))
		return (EPHIDGET_NOENT);

	return (EPHIDGET_OK);
}

/*
 * Parses a 8601 date
 */
static PhidgetReturnCode
validDateTime(pconf_t *pc, pconf_t *dbpc, const char *val) {
	PhidgetReturnCode res;
	mostimestamp_t ts;

	res = mostimestamp_fromstring(MOS_IOP_IGNORE, val, &ts);
	if (res != 0)
		return (EPHIDGET_INVALIDARG);
	return (EPHIDGET_OK);
}

static PhidgetReturnCode
validInt(pconf_t *pc, pconf_t *dbpc, const char *val) {
	PhidgetReturnCode res;
	uint64_t u64;

	res = mos_strtou64(val, 0, &u64);
	if (res != 0)
		return (EPHIDGET_INVALIDARG);
	return (EPHIDGET_OK);
}

static PhidgetReturnCode
validString(pconf_t *pc, pconf_t *dbpc, const char *str) {

	if (!Phidget_validDictionaryKey(str))
		return (EPHIDGET_INVALIDARG);
	return (EPHIDGET_OK);
}

static int
getDictFormat(WebConnHandle wc) {
	const char *fmt;

	fmt = kvgetstrc(wc->query, "format", "JSON");
	if (mos_strcasecmp(fmt, "JSON") == 0)
		return (DICTFMT_JSON);
	if (mos_strcasecmp(fmt, "CSV") == 0)
		return (DICTFMT_CSV);

	return (DICTFMT_JSON); /* default, even with an invalid arg */
}

#define QLEN	(sizeof (query) - (q - query))
#define ADDWHERE	do {						\
	if (where == 0) {							\
		mos_snprintf(q, QLEN, " where ");		\
		q += 7;									\
		where = 1;								\
	} else {									\
		mos_snprintf(q, QLEN, " and ");			\
		q += 5;									\
	}											\
} while (0)

#define ADDW(arg, val)	do {																		\
	switch ((arg)->type) {																			\
	case 0:																							\
		n = mos_snprintf(q, QLEN, " %s %s %s", (arg)->col, (arg)->cmp, (val));						\
		break;																						\
	case 1:																							\
		n = mos_snprintf(q, QLEN, " %s %s '%s'", (arg)->col, (arg)->cmp, (val));					\
		break;																						\
	case 2:																							\
		if (mos_endswith((val), "Z"))																\
			n = mos_snprintf(q, QLEN, " strftime('%%s', %s) %s strftime('%%s', '%s')",				\
			  (arg)->col, (arg)->cmp, (val));														\
		else																						\
			n = mos_snprintf(q, QLEN, " strftime('%%s', %s, 'localtime') %s strftime('%%s', '%s')",	\
			  (arg)->col, (arg)->cmp, (val));														\
		break;																						\
	}																								\
	if (n >= QLEN)																					\
		return (MOS_ERROR(iop, EPHIDGET_NOSPC, "query too large"));									\
	q += n;																							\
} while (0)

static PhidgetReturnCode
createDataStatement(mosiop_t iop, pconf_t *pc, pconf_t *dbpc, WebConnHandle wc, sqlite3 *db,
  sqlite3_stmt **stmt) {
	PhidgetReturnCode res;
	const char *aval;
	struct arg *arg;
	char query[512];
	int where;
	size_t n;
	char *q;
	int err;

	n = mos_strlcpy(query, dslog1_query, sizeof (query));
	q = query + n;

	where = 0;

	for (arg = args; arg->name != NULL; arg++) {
		aval = kvgetstrc(wc->query, arg->name, NULL);
		if (aval != NULL) {
			res = arg->check(pc, dbpc, aval);
			if (res != EPHIDGET_OK) {
				wslogwarn("invalid parameter '%s'='%s'", arg->name, aval);
				return (res);
			}
			ADDWHERE;
			ADDW(arg, aval);
		}
	}

	mos_strlcpy(q, " order by id;", QLEN);

	err = sqlite3_prepare_v2(db, query, -1, stmt, NULL);
	if (*stmt == NULL || err != SQLITE_OK)
		return (MOS_ERROR(iop, EPHIDGET_UNEXPECTED, "failed to create stmt from '%s':(%d)%s", query, err,
		  sqlite3_errstr(err)));

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
readDictionaryCfg(pconf_t **dbpc, const char *fmt, ...) {
	char path[MOS_PATH_MAX];
	PhidgetReturnCode res;
	char dbbuf[65536];
	char errbuf[128];
	size_t dbbufsz;
	va_list va;
	size_t n;
	int err;
	int i;

	va_start(va, fmt);
	n = mos_vsnprintf(path, sizeof (path), fmt, va);
	va_end(va);
	if (n >= sizeof (path))
		return (EPHIDGET_NOSPC);

	for (i = 0; i <= 3; i++) {
		dbbufsz = sizeof (dbbuf);
		err = mos_file_readx(MOS_IOP_IGNORE, dbbuf, &dbbufsz, "%s", path);
		if (err == 0)
			break;

		if (err == MOSN_BUSY && i < 3) {
			wslogdebug("dictionary '%s' busy while reading: trying again", path);
			mos_usleep(250000);
			continue;
		}
		wslogerr("failed to read dictionary '%s': %d", path, err);
		return (err);
	}

	dbbuf[dbbufsz] = '\0';
	res = pconf_parsepcs(dbpc, errbuf, sizeof (errbuf), dbbuf, dbbufsz);
	if (res != EPHIDGET_OK) {
		wslogerr("failed to parse database config '%s': %s\n", path, errbuf);
		wslogdebug("failed to parse [%s]", dbbuf);
	}

	return (res);
}

static PhidgetReturnCode
writeDictionaryCfg(pconf_t *dbpc, const char *fmt, ...) {
	char path[MOS_PATH_MAX];
	PhidgetReturnCode res;
	char dbbuf[65536];
	size_t dbbufsz;
	va_list va;
	size_t n;
	int err;
	int i;

	va_start(va, fmt);
	n = mos_vsnprintf(path, sizeof (path), fmt, va);
	va_end(va);
	if (n >= sizeof (path))
		return (EPHIDGET_NOSPC);

	res = pconf_renderpc(dbpc, dbbuf, sizeof (dbbuf));
	if (res != EPHIDGET_OK) {
		wslogerr("failed to render dictionary cfg: %d", res);
		return (res);
	}
	dbbufsz = mos_strlen(dbbuf);

	for (i = 0; i <= 3; i++) {
		err = mos_file_writex(MOS_IOP_IGNORE, dbbuf, dbbufsz, "%s", path);
		if (err == 0)
			break;

		if (err == MOSN_BUSY && i < 3) {
			wslogdebug("dictionary '%s' busy while writing: trying again", path);
			mos_usleep(250000);
			continue;
		}
		wslogerr("failed to write dictionary '%s': %d", path, err);
		return (err);
	}

	return (res);
}

static PhidgetReturnCode
loadDictionary(mosiop_t iop, pconf_t *pc, WebConnHandle wc, int *_sn, dsdictionary_t **dsd, pconf_t **dbpc) {
	PhidgetReturnCode res;
	int sn;

	sn = kvgeti32(wc->query, "dictserial", -1);
	if (sn == -1)
		return (MOS_ERROR(iop, EPHIDGET_INVALIDARG, "missing dictserial"));

	if (_sn != NULL)
		*_sn = sn;

	if (dsd != NULL) {
		res = findDictionary(sn, dsd);
		if (res != EPHIDGET_OK)
			return (MOS_ERROR(iop, res, "failed to find dictionary %d", sn));
	}

	if (dbpc != NULL) {
		if (dictdir == NULL)
			dictdir = pconf_getstr(pc, DICTCONFIGDIR, "phidget.feature.dictionary.directory");

		res = readDictionaryCfg(dbpc, "%s/%d.dpc", dictdir, sn);
		if (res != EPHIDGET_OK)
			return (MOS_ERROR(iop, res, "failed to create dictionary config %d", sn));
	}

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
checkSerialNumber(dictionarystore_t *ds, int sn) {
	dsdictionary_t *dsd;

	mos_mutex_lock(&ds->lock);
	MTAILQ_FOREACH(dsd, &ds->dictionaries, link) {
		if (dsd->sn == sn) {
			mos_mutex_unlock(&ds->lock);
			return (EPHIDGET_BUSY);
		}
	}

	mos_mutex_unlock(&ds->lock);
	return (EPHIDGET_OK);
}

/*
 * If an error occurs, log it, send it back to the user and return success.  Unless the error
 * cannot be related to the user providing invalid data or closing the connection, it is not
 * a server error.
 */
static PhidgetReturnCode
handleDictionaryAPIDataRequest(mosiop_t iop, WebConnHandle wc, pconf_t *pc, dsdictionary_t *dsd,
  pconf_t *dbpc, int fmt) {
	struct dslog1_row row;
	PhidgetReturnCode res;
	sqlite3_stmt *stmt;
	mostimestamp_t ts;
	char buf[1024];
	time_t current;
	int interval;
	time_t last;
	size_t n;
	int err;
	int cnt;

	stmt = NULL;

	res = createDataStatement(iop, pc, dbpc, wc, dsd->db, &stmt);
	if (res != EPHIDGET_OK) {
		wslogerr("createDataStatement() failed: %N", iop);
		wserror(iop, wc, 500, "Database Error", res, "failed to create database query");
		return (EPHIDGET_OK);
	}

	if (wsheader(MOS_IOP_IGNORE, wc, fmt == DICTFMT_JSON ? "dict.json" : "dict.csv") != EPHIDGET_OK)
		goto done;

	n = mos_snprintf(buf, sizeof (buf), "{\"dictionary\":\"%s\",\"version\":1,\"data\":[",
	  kvgetstrc(wc->query, "dictserial", ""));
	res = netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n);
	if (res != EPHIDGET_OK) {
		res = EPHIDGET_OK;
		goto done;
	}

	interval = kvgeti32(wc->query, "interval", -1);
	last = 0;

	cnt = 0;
	for (;;) {
		err = sqlite3_step(stmt);
		if (err != SQLITE_DONE && err != SQLITE_ROW) {
			MOS_ERROR(iop, EPHIDGET_UNEXPECTED, "failed to step query");
			goto done;
		}
		if (err == SQLITE_DONE)
			break;

		row.id = sqlite3_column_int(stmt, 0);
		row.gen = sqlite3_column_text(stmt, 1);
		row.time = sqlite3_column_text(stmt, 2);
		row.key = sqlite3_column_text(stmt, 3);
		row.val = sqlite3_column_text(stmt, 4);

		if (interval > 0) {
			if (mostimestamp_fromstring(MOS_IOP_IGNORE, (const char *)row.time, &ts) != 0) {
				wslogerr("failed to parse timestamp: %s", row.time);
				continue;
			}
			if (mostimestamp_toepoch(MOS_IOP_IGNORE, &ts, &current) != 0) {
				wslogerr("failed to calculate epoch from timestamp");
				continue;
			}
			if (current < last)
				continue;

			last = current + interval;
		}

		n = mos_snprintf(buf, sizeof (buf),
		  "%s{\"id\":%d,\"gen\":\"%s\",\"time\":\"%s\",\"key\":\"%s\",\"val\":\"%s\"}",
		  cnt > 0 ? "," : "", row.id, row.gen, row.time, row.key, row.val);

		/*
		 * Ignore rows that are too large (and as a result incomplete).
		 */
		if (n >= sizeof (buf))
			continue;

		res = netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n);
		if (res != EPHIDGET_OK) {
			res = EPHIDGET_OK;
			goto done;
		}
		cnt++;
	}
	n = mos_snprintf(buf, sizeof (buf), "],\"records\":%d}\n", cnt);
	netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n);

done:

	if (stmt)
		sqlite3_finalize(stmt);

	if (res != EPHIDGET_OK)
		wserror(iop, wc, 500, "Internal Error", res, "Failed to execute query");
	return (res);
}

static PhidgetReturnCode
handleDictionaryAPIGetRequest(mosiop_t iop, WebConnHandle wc, pconf_t *pc, dsdictionary_t *dsd,
  pconf_t *dbpc) {
	PhidgetReturnCode res;
	dictionarystore_t *ds;
	dsdictionary_t *_dsd;
	const char *what;
	char buf[16384];
	uint32_t cnt;
	size_t n;

	what = kvgetstrc(wc->query, "what", NULL);
	if (what == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "%s", "missing what");
		return (EPHIDGET_OK);
	}

	if (mos_strcmp(what, "dictionary") == 0) {
		/*
		 * If dbpc is null, dictserial was not sent.
		 */
		if (dbpc == NULL) {
			wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "%s", "missing dictserial");
			return (EPHIDGET_OK);
		}

		res = pconf_renderjson(dbpc, buf, sizeof (buf));
		if (res != EPHIDGET_OK)
			return (MOS_ERROR(iop, res, "failed to render dictionary json: %s", dsd->sn));

		res = wsheader(iop, wc, "dict.json");
		if (res != EPHIDGET_OK)
			return (MOS_ERROR(iop, res, "failed to write HTTP header"));

		res = netConnWrite(iop, wc->conn, buf, mos_strlen(buf));
		if (res != EPHIDGET_OK)
			return (MOS_ERROR(iop, res, "failed to write dictionary data"));

		return (EPHIDGET_OK);
	} else if (mos_strcmp(what, "dictionaries") == 0) {
		res = getDictionaries(&ds);
		if (res != EPHIDGET_OK) {
			wserror(iop, wc, 500, "Missing Dictionaries", EPHIDGET_NOENT, "failed to get dictionaries");
			return (res);
		}

		if (wsheader(MOS_IOP_IGNORE, wc, "dictionaries.json") != EPHIDGET_OK)
			return (EPHIDGET_OK);

		n = mos_snprintf(buf, sizeof (buf), "{\"version\":1,\"data\":[");
		res = netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n);
		if (res != EPHIDGET_OK)
			return (EPHIDGET_OK);

		cnt = 0;
		mos_mutex_lock(&ds->lock);
		MTAILQ_FOREACH(_dsd, &ds->dictionaries, link) {
			mos_mutex_lock(&_dsd->lock);
			n = mos_snprintf(buf, sizeof (buf), "%s{\"sn\":%d,\"label\":\"%s\",\"gen\":\"%s\"}",
			  cnt > 0 ? "," : "", _dsd->sn, _dsd->label, _dsd->generation == NULL ? "" : _dsd->generation);
			mos_mutex_unlock(&_dsd->lock);
			res = netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n);
			if (res != EPHIDGET_OK) {
				mos_mutex_unlock(&ds->lock);
				return (EPHIDGET_OK);
			}
			cnt++;
		}
		mos_mutex_unlock(&ds->lock);
		n = mos_strlcpy(buf, "]}\n", sizeof (buf));
		netConnWrite(MOS_IOP_IGNORE, wc->conn, buf, n);

		return (EPHIDGET_OK);
	}

	wserror(iop, wc, 400, "Invalid Parameter", EPHIDGET_INVALIDARG, "invalid what '%s'", what);
	return (EPHIDGET_OK);
}

static PhidgetReturnCode
addDictionary(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	char path[MOS_PATH_MAX];
	PhidgetReturnCode res;
	dictionarystore_t *ds;
	const char *label;
	const char *gen;
	pconf_t *dbpc;
	int sn;

	if (!wc->webapi.adddictionary) {
		wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "dictionary create is disabled");
		return (EPHIDGET_OK);
	}

	res = getDictionaries(&ds);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 500, "Missing Dictionaries", EPHIDGET_NOENT, "failed to get dictionaries");
		return (res);
	}

	label = kvgetstrc(wc->query, "label", NULL);
	if (label == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "%s", "missing label");
		return (EPHIDGET_OK);
	}

	sn = kvgeti32(wc->query, "sn", -1);
	if (sn != -1) {
		res = checkSerialNumber(ds, sn);
		if (res != EPHIDGET_OK) {
			wserror(iop, wc, 422, "Invalid Parameter", EPHIDGET_INVALIDARG, "%s", "serial number in use");
			return (EPHIDGET_OK);
		}
	} else {
		mos_mutex_lock(&ds->lock);
		sn = ds->nextsn;
		ds->nextsn++;
		mos_mutex_unlock(&ds->lock);
	}

	res = pconf_create(&dbpc);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 500, "Internal Error", EPHIDGET_NOENT, "failed to create dictionary");
		return (MOS_ERROR(iop, res, "failed to create pconf"));
	}

	pconf_setcreatemissing(dbpc, 1);
	pconf_addbool(dbpc, kvgetbool(wc->query, "enabled", 1), "dictionary.enabled");
	pconf_addbool(dbpc, kvgetbool(wc->query, "configadd", 0), "dictionary.add");
	pconf_addi(dbpc, sn, "dictionary.sn");
	pconf_addstr(dbpc, label, "dictionary.label");

	gen = kvgetstrc(wc->query, "generation", NULL);
	if (gen != NULL)
		pconf_addstr(dbpc, gen, "dictionary.generation");
	pconf_setcreatemissing(dbpc, 0);

	if (dictdir == NULL)
		dictdir = pconf_getstr(pc, DICTCONFIGDIR, "phidget.feature.dictionary.directory");

	if (res == EPHIDGET_OK) {
		res = writeDictionaryCfg(dbpc, "%s/%d.dpc", dictdir, sn);
		if (res != EPHIDGET_OK) {
			wserror(iop, wc, 500, "Internal Error", res, "failed to create dictionary");
			MOS_ERROR(iop, res, "failed to write dictionary %s/%d.dpc", dictdir, sn);
			goto done;
		}
	}

	mos_snprintf(path, sizeof (path), "%d.dpc", sn);
	res = installDictionary(iop, ds, dbpc, path);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 500, "Internal Error", res, "failed to install dictionary");
		MOS_ERROR(iop, res, "failed to install dictionary %s/%d.dpc", dictdir, sn);
		goto done;
	}

	if (wsheader(MOS_IOP_IGNORE, wc, "result.json") != EPHIDGET_OK)
		goto done;

	writeReply(wc, res);

done:

	pconf_release(&dbpc);
	return (res);
}

static PhidgetReturnCode
addKey(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	PhidgetReturnCode res;
	dsdictionary_t *dsd;
	const char *key;
	const char *val;
	pconf_t *dbpc;
	int sn;

	if (!wc->webapi.addkey) {
		wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "key creation is disabled");
		return (EPHIDGET_OK);
	}

	key = kvgetstrc(wc->query, "key", NULL);
	if (key == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "missing key");
		return (EPHIDGET_OK);
	}

	val = kvgetstrc(wc->query, "value", NULL);
	if (val == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "missing value");
		return (EPHIDGET_OK);
	}

	res = loadDictionary(iop, pc, wc, &sn, &dsd, &dbpc);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 422, "Invalid Dictionary", res, "failed to load dictionary");
		return (EPHIDGET_OK);
	}

	if (matchExists(dsd, key)) {
		pconf_release(&dbpc);
		wserror(iop, wc, 422, "Invalid Parameter", res, "key already exists");
		return (EPHIDGET_OK);
	}

	pconf_setcreatemissing(dbpc, 1);
	pconf_set(dbpc, val, "dictionary.config.key.%s.value", key);
	pconf_setcreatemissing(dbpc, 0);

	res = writeDictionaryCfg(dbpc, "%s", dsd->file);
	if (res != EPHIDGET_OK)
		wslogerr("failed to write dictionary %s/%d.dpc: %d", dictdir, sn, res);

	res = addMatch(dsd, dbpc, key);
	if (res != EPHIDGET_OK)
		wslogerr("failed to add match for key '%s': %d", key, res);

	if (wsheader(MOS_IOP_IGNORE, wc, "result.json") == EPHIDGET_OK)
		writeReply(wc, res);

	pconf_release(&dbpc);
	return (EPHIDGET_OK);
}

static PhidgetReturnCode
handleDictionaryAPIAdd(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	const char *target;

	target = kvgetstrc(wc->query, "target", NULL);
	if (target == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "missing target");
		return (EPHIDGET_OK);
	}

	if (mos_strcmp(target, "dictionary") == 0) {
		return (addDictionary(iop, pc, wc));
	} else if (mos_strcmp(target, "key") == 0) {
		return (addKey(iop, pc, wc));
	} else {
		wserror(iop, wc, 422, "Invalid Parameter", EPHIDGET_INVALIDARG, "invalid target");
		return (EPHIDGET_OK);
	}
}

static void
updateConfigAdd(mosiop_t iop, WebConnHandle wc, dsdictionary_t *dsd, pconf_t *dbpc, const char *key,
  const char *val, int isdict, struct keymap *km) {
	int add;

	add = pconf_getbool(dbpc, 0, "dictionary.add");
	mos_mutex_lock(&dsd->lock);
	if (add)
		dsd->flags |= DSDICTIONARY_ADDCONFIG;
	else
		dsd->flags &= ~DSDICTIONARY_ADDCONFIG;
	mos_mutex_unlock(&dsd->lock);
}

static void
updateKeyConfig(mosiop_t iop, WebConnHandle wc, dsdictionary_t *dsd, pconf_t *dbpc, const char *key,
  const char *val, int isdict, struct keymap *km) {
	PhidgetReturnCode res;
	dsmatch_t *match;
	int update;
	int remove;


	res = findMatch(dsd, key, &match);
	if (res != EPHIDGET_OK)
		return;

	update = pconf_getbool(dbpc, 0, "dictionary.config.key.%s.update", key);
	remove = pconf_getbool(dbpc, 0, "dictionary.config.key.%s.remove", key);

	mos_mutex_lock(&dsd->lock);
	if (update)
		match->flags |= DSMATCH_UPDATE;
	else
		match->flags &= ~DSMATCH_UPDATE;
	if (remove)
		match->flags |= DSMATCH_REMOVE;
	else
		match->flags &= ~DSMATCH_REMOVE;
	mos_mutex_unlock(&dsd->lock);
}

static void
updateLabel(mosiop_t iop, WebConnHandle wc, dsdictionary_t *dsd, pconf_t *dbpc, const char *key,
  const char *val, int isdict, struct keymap *km) {

	if (isdict) {
		mos_mutex_lock(&dsd->lock);
		if (dsd->label)
			mos_free(dsd->label, MOSM_FSTR);
		dsd->label = mos_strdup(val, NULL);
		mos_mutex_unlock(&dsd->lock);
	}
}

static struct keymap DictMap[] = {
	{ 0, "enabled", "dictionary.enabled", NULL, NULL },
	{ 0, "label", "dictionary.label", NULL, updateLabel },
	{ 0, "generation", "dictionary.generation", NULL, NULL },
	{ 0, "configadd", "dictionary.add", NULL, updateConfigAdd },
	{ 0 }
};

static struct keymap KeyMap[] = {
	{ 0, "update", "dictionary.config.key.%s.update", NULL, updateKeyConfig },
	{ 0, "remove", "dictionary.config.key.%s.remove", NULL, updateKeyConfig },
	{ 0, "value", "dictionary.config.key.%s.value", NULL, NULL },
	{ KEYMAP_SETFALSE | KEYMAP_RMB4SET, "cfg_type", "dictionary.config.key.%s.layout.type",
	"dictionary.config.key.%s.layout", NULL },
	{ KEYMAP_REMOVE, "cfg_readonly", "dictionary.config.key.%s.layout.readonly", NULL, NULL },
	{ 0, "cfg_order", "dictionary.config.key.%s.layout.order", NULL, NULL },
	{ 0, "cfg_dest", "dictionary.config.key.%s.layout.dest", NULL, NULL },
	{ 0, "cfg_class", "dictionary.config.key.%s.layout.class", NULL, NULL },
	{ 0, "cfg_label", "dictionary.config.key.%s.layout.label", NULL, NULL },
	{ 0 }
};

static PhidgetReturnCode
updateConfig(mosiop_t iop, WebConnHandle wc, dsdictionary_t *dsd, const char *key, struct keymap *map,
  pconf_t *dbpc, int isdict) {
	PhidgetReturnCode res;
	struct keymap *km;
	const char *val;

	pconf_setcreatemissing(dbpc, 1);
	for (km = map; km->clientkey != NULL; km++) {
		val = kvgetstrc(wc->query, km->clientkey, NULL);
		if (val != NULL) {
			/*
			 * Remove the altpath before setting the dictpath.
			 */
			if (km->flags & KEYMAP_RMB4SET)
				pconf_remove(dbpc, km->altpath, key);
			pconf_set(dbpc, val, km->dictpath, key);
			if (km->handler)
				km->handler(iop, wc, dsd, dbpc, key, val, isdict, km);
			continue;
		}
		if (km->flags == 0)
			continue;

		/*
		 * Set to false if the user did not provide the value.
		 */
		if (km->flags & KEYMAP_SETFALSE) {
			res = pconf_remove(dbpc, km->altpath, key);
			if (res != EPHIDGET_OK) {
				wslogerr("failed to remove '%s'", km->altpath);
				continue;
			}
			res = pconf_addbool(dbpc, 0, km->altpath, key);
			if (res != EPHIDGET_OK)
				wslogerr("failed to set '%s' to false", km->altpath);

			/*
			 * Remove the altpath if the user did not provide the value.
			 */
		}
		else if (km->flags & KEYMAP_REMOVE) {
			res = pconf_remove(dbpc, km->dictpath, key);
			if (res != EPHIDGET_OK) {
				wslogerr("failed to remove '%s'", km->dictpath);
				continue;
			}
		}
	}
	pconf_setcreatemissing(dbpc, 0);

	return (0);
}

static PhidgetReturnCode
handleDictionaryAPIUpdate(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	PhidgetReturnCode res;
	dsdictionary_t *dsd;
	const char *target;
	const char *key;
	pconf_t *dbpc;
	int sn;

	/*
	 * Not all request require the dictionary config.  Load it if dictserial was provided.
	 */
	sn = kvgeti32(wc->query, "dictserial", -1);
	if (sn == -1) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "%s", "missing dictserial");
		return (0);
	}

	res = loadDictionary(iop, pc, wc, &sn, &dsd, &dbpc);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 422, "Invalid Dictionary", res, "failed to load dictionary");
		return (EPHIDGET_OK);
	}

	target = kvgetstrc(wc->query, "target", "");
	if (mos_strcmp(target, "dictionary") == 0) {
		if (!wc->webapi.changedictionary) {
			wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "dictionary change is disabled");
			return (EPHIDGET_OK);
		}
		res = updateConfig(iop, wc, dsd, NULL, DictMap, dbpc, 1);
	} else if (mos_strcmp(target, "key") == 0) {
		if (!wc->webapi.changekey) {
			wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "key change is disabled");
			return (EPHIDGET_OK);
		}
		key = kvgetstrc(wc->query, "key", NULL);
		if (key == NULL) {
			wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "%s", "missing dictserial");
			res = EPHIDGET_INVALIDARG;
		} else {
			res = updateConfig(iop, wc, dsd, key, KeyMap, dbpc, 0);
		}
	} else {
		wsnoent(iop, wc, "invalid update request");
		res = EPHIDGET_INVALIDARG;
	}

	if (res == EPHIDGET_OK) {
		res = writeDictionaryCfg(dbpc, "%s", dsd->file);
		if (res != EPHIDGET_OK)
			wslogerr("failed to write dictionary %s: %d", dsd->file, res);
	}

	if (wsheader(MOS_IOP_IGNORE, wc, "result.json") == EPHIDGET_OK)
		writeReply(wc, res);

	pconf_release(&dbpc);
	return (EPHIDGET_OK);
}

static PhidgetReturnCode
removeKey(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	PhidgetReturnCode res;
	dsdictionary_t *dsd;
	dsmatch_t *match;
	const char *key;
	pconf_t *dbpc;

	if (!wc->webapi.removekey) {
		wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "key removal is disabled");
		return (EPHIDGET_OK);
	}

	key = kvgetstrc(wc->query, "key", NULL);
	if (key == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "missing key");
		return (EPHIDGET_OK);
	}

	res = loadDictionary(iop, pc, wc, NULL, &dsd, &dbpc);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 422, "Invalid Dictionary", res, "failed to load dictionary");
		return (EPHIDGET_OK);
	}

	res = findMatch(dsd, key, &match);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 422, "Invalid Parameter", EPHIDGET_INVALIDARG, "invalid key");
		return (EPHIDGET_OK);
	}

	removeMatch(dsd, match);
	pconf_remove(dbpc, "dictionary.config.key.%s", key);

	res = writeDictionaryCfg(dbpc, "%s", dsd->file);
	if (res != EPHIDGET_OK)
		wslogerr("failed to write dictionary %s: %d", dsd->file, res);

	pconf_release(&dbpc);

	if (wsheader(MOS_IOP_IGNORE, wc, "result.json") == EPHIDGET_OK)
		writeReply(wc, res);

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
removeDictionary(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	char src[MOS_PATH_MAX];
	char dst[MOS_PATH_MAX];
	PhidgetReturnCode res;
	dictionarystore_t *ds;
	dsdictionary_t *dsd;
	int sn;

	if (!wc->webapi.removedictionary) {
		wserror(iop, wc, 403, "Permission Denied", EPHIDGET_ACCESS, "dictionary removal is disabled");
		return (EPHIDGET_OK);
	}

	sn = kvgeti32(wc->query, "dictserial", -1);
	if (sn == -1) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "missing dictserial");
		return (EPHIDGET_OK);
	}

	res = getDictionaries(&ds);
	if (res != EPHIDGET_OK) {
		wserror(iop, wc, 500, "Missing Dictionaries", EPHIDGET_NOENT, "failed to get dictionaries");
		return (res);
	}

	mos_mutex_lock(&ds->lock);
	MTAILQ_FOREACH(dsd, &ds->dictionaries, link) {
		if (dsd->sn != sn)
			continue;

		goto found;
	}
	mos_mutex_unlock(&ds->lock);
	wserror(iop, wc, 422, "Invalid Parameter", EPHIDGET_INVALIDARG, "invalid dictserial");
	return (EPHIDGET_OK);

found:

	MTAILQ_REMOVE(&ds->dictionaries, dsd, link);
	mos_mutex_unlock(&ds->lock);
	freeDictionary(&dsd);

	if (dictdir == NULL)
		dictdir = pconf_getstr(pc, DICTCONFIGDIR, "phidget.feature.dictionary.directory");

	mos_snprintf(src, sizeof (src), "%s/%d.dpc", dictdir, sn);
	mos_snprintf(dst, sizeof (dst), "%s/%d.dpc.%"PRId64, dictdir, sn, mos_gettime_usec());
	rename(src, dst);

	if (wsheader(MOS_IOP_IGNORE, wc, "result.json") == EPHIDGET_OK)
		writeReply(wc, res);

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
handleDictionaryAPIRemove(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	const char *target;

	target = kvgetstrc(wc->query, "target", NULL);
	if (target == NULL) {
		wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "missing target");
		return (EPHIDGET_OK);
	}

	if (mos_strcmp(target, "dictionary") == 0)
		return (removeDictionary(iop, pc, wc));
	if (mos_strcmp(target, "key") == 0)
		return (removeKey(iop, pc, wc));

	wsnoent(iop, wc, wc->uri);
	return (EPHIDGET_OK);
}

static PhidgetReturnCode
handleDictionaryAPIPost(mosiop_t iop, pconf_t *pc, WebConnHandle wc) {
	const char *basename;

	basename = mos_basename(wc->uri);
	if (mos_strcmp(basename, "add") == 0)
		return (handleDictionaryAPIAdd(iop, pc, wc));
	if (mos_strcmp(basename, "update") == 0)
		return (handleDictionaryAPIUpdate(iop, pc, wc));
	if (mos_strcmp(basename, "remove") == 0)
		return (handleDictionaryAPIRemove(iop, pc, wc));

	wsnoent(iop, wc, wc->uri);
	return (EPHIDGET_OK);
}

/*
 * /api/v1/dictionary?action=[data|get][&dictserial=<sn>][&format=[JSON|CSV]]
 *
 * dictserial: the serial number of the dictionary being queried
 *
 * format: the data output format (only JSON is really supported currently)
 *
 * action: [data|get]
 *
 *	get: returns the dictionary config file
 *		what=[dictionaries|dictionary]
 *			dictionaries: returns a JSON block listing the known dictionaries
 *			dictionary: returns the dictionary config as JSON (requires dictserial)
 *
 *	data: returns data from the dictionary database
 *		gen=<gen>&startid=<id>&endid=<id>&startdate=<8601date>&enddate=<8601date>&key=<keyname>
 *			gen: the generation value
 *			startid: only records >= id
 *			endid: only records <= id
 *			startdate: only records with a date >= date
 *			enddate: only records with a date <= date
 *			key: only records whose key == keyname
 */
static PhidgetReturnCode
handleDictionaryAPIRequest(mosiop_t iop, pconf_t *pc, WebConnHandle wc, int *keepalive) {
	PhidgetReturnCode res;
	dsdictionary_t *dsd;
	const char *action;
	pconf_t *dbpc;
	int fmt;
	int sn;

	fmt = getDictFormat(wc);

	res = EPHIDGET_OK;
	*keepalive = 0;
	dbpc = NULL;
	dsd = NULL;

	action = kvgetstrc(wc->query, "action", NULL);
	if (action == NULL)
		action = "data";

	/*
	* Not all request require the dictionary config.  Load it if dictserial was provided.
	*/
	sn = kvgeti32(wc->query, "dictserial", -1);
	if (sn != -1) {
		res = loadDictionary(iop, pc, wc, &sn, &dsd, &dbpc);
		if (res != EPHIDGET_OK) {
			wserror(iop, wc, 422, "Invalid Dictionary", res, "failed to load dictionary");
			return (EPHIDGET_OK);
		}
	}

	if (action == NULL || mos_strcmp(action, "data") == 0) {
		if (dsd == NULL) {
			wserror(iop, wc, 422, "Missing Parameter", EPHIDGET_INVALIDARG, "%s", "missing dictserial");
			return (EPHIDGET_OK);
		}
		res = handleDictionaryAPIDataRequest(iop, wc, pc, dsd, dbpc, fmt);
	}
	else if (mos_strcmp(action, "get") == 0) {
		res = handleDictionaryAPIGetRequest(iop, wc, pc, dsd, dbpc);
	}
	else {
		wserror(iop, wc, 400, "Invalid Parameter", EPHIDGET_INVALIDARG, "invalid action '%s'", action);
	}

	pconf_release(&dbpc);
	return (res);
}

PhidgetReturnCode
handleAPIRequest(mosiop_t iop, pconf_t *pc, WebConnHandle wc, int *keepalive) {
	char path[MOS_PATH_MAX];

	mos_strlcpy(path, wc->uri + 8, sizeof (path));

	if (mos_strncmp(path, DICTIONARYAPI, mos_strlen(DICTIONARYAPI)) == 0) {
		if (mos_strcmp(wc->method, "POST") == 0)
			return (handleDictionaryAPIPost(iop, pc, wc));
		return (handleDictionaryAPIRequest(iop, pc, wc, keepalive));
	}

	wsnoent(iop, wc, wc->uri);
	return (0);
}
