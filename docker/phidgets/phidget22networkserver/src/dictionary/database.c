#include "dictionary.h"

static const char *createdslog1 = "create table if not exists dslog1("
	"id INTEGER PRIMARY KEY AUTOINCREMENT,"
	"gen TEXT NOT NULL,"
	"time TEXT NOT NULL,"
	"key TEXT NOT NULL,"
	"val TEXT NOT NULL);";

static const char *idx1dslog1 = "create index if not exists genidx1 on dslog1(gen);";
static const char *idx2dslog1 = "create index if not exists tmidx1 on dslog1(time);";
static const char *idx3dslog1 = "create index if not exists keyidx1 on dslog1(key);";
static const char *idx4dslog1 = "create index if not exists validx1 on dslog1(val);";

PhidgetReturnCode
closeDatabase(dsdictionary_t *dsd) {

	if (dsd->db == NULL)
		return (EPHIDGET_OK);
	sqlite3_close_v2(dsd->db);
	dsd->db = NULL;

	return (EPHIDGET_OK);
}

PhidgetReturnCode
openDatabase(dictionarystore_t *ds, dsdictionary_t *dsd) {
	char path[MOS_PATH_MAX];
	char name[MOS_PATH_MAX];
	char *errmsg;
	size_t n;
	int err;

	// Use dictionary config file name as db file name
	mos_strlcpy(name, mos_basename(dsd->file), sizeof(name));
	name[mos_strlen(name) - mos_strlen(DICT_SUFFIX)] = '\0';

	n = mos_snprintf(path, sizeof(path), "%s/%s.db", ds->dbdir, name);
	if (n >= sizeof(path))
		return (EPHIDGET_INVALIDARG);

#ifdef Windows
	sqlite3_temp_directory = sqlite3_mprintf("%s", ds->dbdir);
#endif

	err = sqlite3_open_v2(path, &dsd->db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE, NULL);
	if (err != 0) {
		dslogerr("failed to open database '%s': %s", path, sqlite3_errmsg(dsd->db));
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}

	sqlite3_exec(dsd->db, "PRAGMA journal_mode=WAL;", NULL, NULL, &errmsg);
	if (err != SQLITE_OK) {
		dslogerr("failed to set journal_mode=WAL '%s': %s", path, errmsg);
		sqlite3_free(errmsg);
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}

	err = sqlite3_exec(dsd->db, createdslog1, NULL, NULL, &errmsg);
	if (err != SQLITE_OK) {
		dslogerr("failed to create dslog table '%s': %s", path, errmsg);
		sqlite3_free(errmsg);
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}
	err = sqlite3_exec(dsd->db, idx1dslog1, NULL, NULL, &errmsg);
	if (err != SQLITE_OK) {
		dslogerr("failed to create index '%s': %s", idx1dslog1, errmsg);
		sqlite3_free(errmsg);
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}
	err = sqlite3_exec(dsd->db, idx2dslog1, NULL, NULL, &errmsg);
	if (err != SQLITE_OK) {
		dslogerr("failed to create index '%s': %s", idx1dslog1, errmsg);
		sqlite3_free(errmsg);
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}
	err = sqlite3_exec(dsd->db, idx3dslog1, NULL, NULL, &errmsg);
	if (err != SQLITE_OK) {
		dslogerr("failed to create index '%s': %s", idx1dslog1, errmsg);
		sqlite3_free(errmsg);
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}
	err = sqlite3_exec(dsd->db, idx4dslog1, NULL, NULL, &errmsg);
	if (err != SQLITE_OK) {
		dslogerr("failed to create index '%s': %s", idx1dslog1, errmsg);
		sqlite3_free(errmsg);
		sqlite3_close_v2(dsd->db);
		dsd->db = NULL;
		return (EPHIDGET_UNEXPECTED);
	}

	return (EPHIDGET_OK);
}

static const char *insertdslog1 = "insert into dslog1 (gen, time, key, val) "
"VALUES (?1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?2, ?3);";
//"VALUES (?1, datetime('now', 'localtime'), ?2, ?3);";


PhidgetReturnCode
logMatch(dsdictionary_t *dsd, dsmatch_t *dsm, int action, const char *key, const char *val) {
	mostime_t tm;
	int err;
	int i;

	dslogverbose("%d %s=%s", action, key, val);

	if (action == DICT_DELETE)
		return (EPHIDGET_OK);

	if (dsm->interval_min > 0) {
		tm = mos_gettime_usec();
		if (tm < dsm->_nextmatch) {
			dslogdebug("%s: %"PRId64" ms interval remaining", key, (dsm->_nextmatch - tm) / 1000);
			return (EPHIDGET_OK);
		}
		dsm->_nextmatch = tm + (dsm->interval_min * 1000000);
	}

	if (dsd->dbstmt == NULL) {
		err = sqlite3_prepare_v2(dsd->db, insertdslog1, (int)mos_strlen(insertdslog1), &dsd->dbstmt, NULL);
		if (err != SQLITE_OK) {
			dslogerr("failed to prepare dslog insert stmt: %s", sqlite3_errmsg(dsd->db));
			return (EPHIDGET_UNEXPECTED);
		}
	}

	sqlite3_reset(dsd->dbstmt);
	err = sqlite3_bind_text(dsd->dbstmt, 1, dsd->generation, -1, SQLITE_STATIC);
	err = sqlite3_bind_text(dsd->dbstmt, 2, key, -1, SQLITE_STATIC);
	err = sqlite3_bind_text(dsd->dbstmt, 3, val, -1, SQLITE_STATIC);

	for (i = 0; i < 3; i++) {
		err = sqlite3_step(dsd->dbstmt);
		if (err == SQLITE_DONE || err == SQLITE_OK)
			break;
		if (err == SQLITE_BUSY) {
			mos_usleep(2000);
			continue;
		}
		dslogerr("failed to insert into dslog:%d", err);
		return (EPHIDGET_UNEXPECTED);
	}

	dslogdebug("%s (%s) %s = %s", dsd->label, dsd->generation, key, val);
	return (EPHIDGET_OK);
}
