#include "server.h"
#include "dictionary.h"
#include "mos/mos_readdir.h"
#include "mos/mos_assert.h"

RB_GENERATE(dsmatches, dsmatch, rblink, dsmatch_compare)

static dictionarystore_t dictionarystore;
static int started;

int
dsmatch_compare(dsmatch_t *m1, dsmatch_t *m2) {

	return (mos_strcmp(m1->ds_skey, m2->ds_skey));
}

PhidgetReturnCode
addMatch(dsdictionary_t *dsd, pconf_t *dbpc, const char *key) {
	PhidgetReturnCode res;
	dsmatch_t *match;
	dsmatch_t *mck;
	char val[1024];
	int found;

	if (!Phidget_validDictionaryKey(key)) {
		dslogwarn("invalid dictionary key '%s': ignoring", key);
		return (EPHIDGET_INVALIDARG);
	}

	res = findMatch(dsd, key, &match);
	if (res == EPHIDGET_OK)
		found = 1;
	else
		found = 0;

	/*
	 * Convert the value to a string, and add it to the dictionary.
	 */
	res = pconf_tostring(dbpc, val, sizeof (val), "dictionary.config.key.%s.value", key);
	if (res != EPHIDGET_OK) {
		dslogwarn("failed to convert dictionary key value to string:%d", res);
		return (res);
	}

	/*
	 * Create the match.
	 */
	if (found == 0) {
		match = mos_zalloc(sizeof(*match));
		match->ds_key = mos_strdup(key, NULL);
	}
	match->flags |= DSMATCH_CONFIG;
	if (pconf_getbool(dbpc, 1, "dictionary.config.key.%s.update", key))
		match->flags |= DSMATCH_UPDATE;
	if (pconf_getbool(dbpc, 0, "dictionary.config.key.%s.remove", key))
		match->flags |= DSMATCH_REMOVE;

	/* this shouldn't be possible since the config is a tree */
	if (found == 0) {
		mos_mutex_lock(&dsd->lock);
		mck = RB_INSERT(dsmatches, &dsd->matches, match);
		mos_mutex_unlock(&dsd->lock);
		if (mck != NULL) {
			dslogwarn("duplicate key in config '%s'", key);
			mos_free(match->ds_key, MOSM_FSTR);
			mos_free(match, sizeof(*match));
		}
	}

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
_removeMatch(dsdictionary_t *dsd, dsmatch_t *dsm) {

	RB_REMOVE(dsmatches, &dsd->matches, dsm);

	mos_free(dsm->ds_key, MOSM_FSTR);
	if (dsm->val)
		mos_free(dsm->val, MOSM_FSTR);
	mos_free(dsm, sizeof(*dsm));

	return (EPHIDGET_OK);
}

PhidgetReturnCode
removeMatch(dsdictionary_t *dsd, dsmatch_t *dsm) {
	PhidgetReturnCode res;

	mos_mutex_lock(&dsd->lock);
	res = _removeMatch(dsd, dsm);
	mos_mutex_unlock(&dsd->lock);

	return (res);
}

PhidgetReturnCode
findMatch(dsdictionary_t *dsd, const char *key, dsmatch_t **dsm) {
	dsmatch_t sm;

	sm.ds_skey = key;
	mos_mutex_lock(&dsd->lock);
	*dsm = RB_FIND(dsmatches, &dsd->matches, &sm);
	mos_mutex_unlock(&dsd->lock);
	if (*dsm == NULL)
		return (EPHIDGET_NOENT);

	return (EPHIDGET_OK);
}

PhidgetReturnCode
matchExists(dsdictionary_t *dsd, const char *key) {
	dsmatch_t *mck;
	dsmatch_t sm;

	sm.ds_skey = key;

	mos_mutex_lock(&dsd->lock);
	mck = RB_FIND(dsmatches, &dsd->matches, &sm);
	mos_mutex_unlock(&dsd->lock);
	if (mck == NULL)
		return (0);
	return (1);
}

PhidgetReturnCode
getDictionaries(dictionarystore_t **ds) {

	*ds = &dictionarystore;
	return (EPHIDGET_OK);
}

PhidgetReturnCode
findDictionary(int sn, dsdictionary_t **dsd) {
	dsdictionary_t *d;

	mos_mutex_lock(&dictionarystore.lock);
	MTAILQ_FOREACH(d, &dictionarystore.dictionaries, link) {
		if (d->sn != sn)
			continue;
		*dsd = d;
		mos_mutex_unlock(&dictionarystore.lock);
		return (EPHIDGET_OK);
	}

	mos_mutex_unlock(&dictionarystore.lock);
	return (EPHIDGET_NOENT);
}

static void
dictionaryChanged(dsdictionary_t *dsd, int action, const char *key, const char *val) {
	PhidgetReturnCode res;
	dsmatch_t *dsm;

	dslogdebug("dictionary=%s flags=0x%x action=%d key=%s val=%s", dsd->label, dsd->flags, action, key, val);

	res = findMatch(dsd, key, &dsm);
	if (res != EPHIDGET_OK) {
		if (res == EPHIDGET_NOENT && action == DICT_ADD && dsd->flags & DSDICTIONARY_ADDCONFIG) {
			mos_mutex_lock(&dsd->lock);
			goto add;
		}
		return;
	}

	/*
	 * We should lock around these checks, but the flags almost never change, and getting it wrong
	 * is not really a problem.
	 */
	if (dsm->flags & DSMATCH_LOG)
		logMatch(dsd, dsm, action, key, val);

	if ((dsm->flags & DSMATCH_CONFIG) == 0)
		return;

	mos_mutex_lock(&dsd->lock);

	switch (action) {
	case DICT_ADD:
	add:
		/*
		 * This can happen if the match is created through the webapi as the webapi does not currently
		 * add anything to the actual dictionary.
		 */
		if (dsm != NULL)
			goto update;

		dsm = mos_zalloc(sizeof(*dsm));
		dsm->ds_key = mos_strdup(key, NULL);
		dsm->flags |= DSMATCH_UPDATE | DSMATCH_REMOVE | DSMATCH_DIRTY;
		dsm->val = mos_strdup(val, NULL);
		RB_INSERT(dsmatches, &dsd->matches, dsm);
		break;
	case DICT_UPDATE:
update:
		if ((dsm->flags & DSMATCH_UPDATE) == 0)
			goto done;

		if (dsm->val != NULL)
			mos_free(dsm->val, MOSM_FSTR);
		dsm->val = mos_strdup(val, NULL);
		dsm->flags |= DSMATCH_DIRTY;
		mos_mutex_unlock(&dsd->lock);
		break;
	case DICT_DELETE:
		if ((dsm->flags & DSMATCH_REMOVE) == 0)
			goto done;

		dsm->flags |= DSMATCH_DELETE;	/* will be removed during sync */
		dsm->flags |= DSMATCH_DIRTY;
		break;
	}
	dsd->flags |= DSDICTIONARY_DIRTY;

done:
	mos_mutex_unlock(&dsd->lock);
}

static PhidgetReturnCode
addMatchToPC(int sn, pconf_t *pc, const char *key, const char *val) {
	PhidgetReturnCode res;

	if (pconf_exists(pc, "dictionary.config.key.%s", key)) {
		dslogwarn("add received for key that already exists '%s' for dictionary %d", key, sn);
		return (EPHIDGET_DUPLICATE);
	}

	res = pconf_addblock(pc, "dictionary.config.key.%s", key);
	if (res != EPHIDGET_OK) {
		dslogerr("failed to add config block '%s' for dictionary %d: %s", key, sn, getErrorStr(res));
		return (res);
	}
	res = pconf_addstr(pc, val, "dictionary.config.key.%s.value", key);
	if (res != EPHIDGET_OK) {
		dslogerr("failed to add value for key '%s' for dictionary %d: %s", key, sn, getErrorStr(res));
		return (res);
	}

	/*
	* Allow keys to be deleted that were created dynamically.
	*/
	pconf_addbool(pc, 1, "dictionary.config.key.%s.remove", key);

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
updateMatchToPC(pconf_t *pc, const char *key, const char *val) {
	PhidgetReturnCode res;

	res = pconf_update(pc, val, "dictionary.config.key.%s.value", key);
	if (res == EPHIDGET_OK)
		return (res);

	if (res == EPHIDGET_INVALIDARG) {
		dslogwarn("'%s': type in config does not match new value (%s): attempting to recreate", key, val);
		res = pconf_remove(pc, "dictionary.config.key.%s.value", key);
		if (res != EPHIDGET_OK) {
			dslogwarn("failed to remove 'dictionary.config.key.%s.value': %s", key, getErrorStr(res));
			return (res);
		}
		res = pconf_addstr(pc, val, "dictionary.config.key.%s.value", key);
		if (res != EPHIDGET_OK) {
			dslogerr("failed to add 'dictionary.config.key.%s.value': %s", key, getErrorStr(res));
			return (res);
		}
	}

	return (res);
}

static PhidgetReturnCode
mergeDSIntoPC(dsdictionary_t *dsd, pconf_t *pc) {
	PhidgetReturnCode res;
	dsmatch_t *dsm, *tmp;

	/*
	 * If the match has not been modified, it will not be flagged dirty.
	 * If the match has been removed, it will be flagged DELETE, and we must remove the match entry.
	 * If the config does not have the key, add it.
	 * Update the rest.
	 */
	RB_FOREACH_SAFE(dsm, dsmatches, &dsd->matches, tmp) {
		if ((dsm->flags & DSMATCH_DIRTY) == 0)
			continue;

		dslogdebug("%s %s=%s", dsd->label, dsm->ds_key, dsm->val);
		if (dsm->flags & DSMATCH_DELETE) {
			pconf_remove(pc, "dictionary.config.key.%s", dsm->ds_key);
			_removeMatch(dsd, dsm);
			dsm->flags &= ~DSMATCH_DIRTY;
			continue;
		}

		if (!pconf_exists(pc, "dictionary.config.key.%s", dsm->ds_key)) {
			res = addMatchToPC(dsd->sn, pc, dsm->ds_key, dsm->val);
			if (res != EPHIDGET_OK)
				dslogerr("failed to add key '%s' to dictionary '%d'", dsm->ds_key, dsd->sn);
			dsm->flags &= ~DSMATCH_DIRTY;
			continue;
		}

		res = updateMatchToPC(pc, dsm->ds_key, dsm->val);
		if (res != EPHIDGET_OK) {
			dslogerr("failed to update key '%s' in dictionary '%d'", dsm->ds_key, dsd->sn);
			continue;
		}
		dsm->flags &= ~DSMATCH_DIRTY;

		/* Some values could be large, and we could have a lot of keys */
		mos_free(dsm->val, MOSM_FSTR);
		dsm->val = NULL;
	}
	return (EPHIDGET_OK);
}

/*
 * Dictionary change callback function : registered with the dictionary device.
 *
 * serial number, label, ctx(dsdictionary_t), bridge packet type, key, value
 */
static void CCONV
onDictionaryChange(int sn, const char *label, void *ctx, int action, const char *key, const char *val) {
	PhidgetReturnCode res;
	dsdictionary_t *dsd;

	/*
	 * Mapped from the BP_DICTIONARYXXX values, and they must match.
	 */
	MOS_ASSERT(action == DICT_ADD || action == DICT_UPDATE || action == DICT_DELETE);

	res = findDictionary(sn, &dsd);
	if (res != EPHIDGET_OK) {
		dslogverbose("unable to find dictionary %d/%s", sn, label);
		return;
	}

	dictionaryChanged(dsd, action, key, val);
}

/*
 * Does not lock.  The dictionary must be removed from the dictionarystore before being freed.
 */
PhidgetReturnCode
freeDictionary(dsdictionary_t **_dsd) {
	dsmatch_t *match, *nxt;
	dsdictionary_t *dsd;

	dsd = *_dsd;

	for (match = RB_MIN(dsmatches, &dsd->matches); match != NULL; match = nxt) {
		nxt = RB_NEXT(dsmatches, &dsd->matches, match);
		RB_REMOVE(dsmatches, &dsd->matches, match);
		mos_free(match->ds_key, MOSM_FSTR);
		mos_free(match, sizeof(*match));
	}

	closeDatabase(dsd);

	if (dsd->file)
		mos_free(dsd->file, MOSM_FSTR);
	dsd->file = NULL;

	if (dsd->label)
		mos_free(dsd->label, MOSM_FSTR);
	dsd->label = NULL;

	if (dsd->generation)
		mos_free(dsd->generation, MOSM_FSTR);
	dsd->generation = NULL;

	mos_free(dsd, sizeof(*dsd));

	*_dsd = NULL;

	return (EPHIDGET_OK);
}

static PhidgetReturnCode
readDictionary(mosiop_t iop, dictionarystore_t *ds, const char *file) {
	PhidgetReturnCode res;
	char errbuf[128];
	pconf_t *pc;

	res = pconf_parsepc(&pc, errbuf, sizeof(errbuf), "%s/%s", ds->dictdir, file);
	if (res != EPHIDGET_OK)
		return (MOS_ERROR(iop, res, "failed to read dictionary '%s': %s", file, errbuf));

	res = installDictionary(iop, ds, pc, file);
	pconf_release(&pc);
	if (res != EPHIDGET_OK)
		return (MOS_ERROR(iop, res, "failed to install dictionary '%s'", file));
	return (res);
}

static PhidgetReturnCode
loadDictionaries(mosiop_t iop, dictionarystore_t *ds) {
	mos_dirinfo_t *di;
	int err;

	err = mos_opendir(iop, ds->dictdir, &di);
	if (err != 0) {
		err = mos_mkdirp(ds->dictdir, 0777);
		if (err != 0)
			return (MOS_ERROR(iop, err, "failed to create directory '%s'", ds->dictdir));

		err = mos_opendir(iop, ds->dictdir, &di);
		if (err != 0)
			return (MOS_ERROR(iop, err, "failed to open directory '%s'", ds->dictdir));
	}

	for (;;) {
		err = mos_readdir(iop, di);
		if (err != 0) {
			MOS_ERROR(iop, err, "failed to read directory '%s'", ds->dictdir);
			goto bad;
		}

		if (di->errcode == MOSN_NOENT)
			break;
		if (di->flags & MOS_DIRINFO_ISDIR)
			continue;
		if (!mos_endswith(di->filename, DICT_SUFFIX))
			continue;

		err = readDictionary(iop, ds, di->filename);
		if (err != EPHIDGET_OK)
			goto bad;
	}

bad:

	mos_closedir(&di);
	return (err);
}

static PhidgetReturnCode
readconfig(pconf_t *pc, dictionarystore_t *ds) {

	ds->syncinterval = pconf_get32(pc, 5, "phidget.dictionarystore.sync") * 1000000; /* usec */
	ds->dictdir = pconf_getstr(pc, CONFIGDIR, "phidget.feature.dictionary.directory");
	ds->dbdir = pconf_getstr(pc, DBDIR, "phidget.dictionarystore.database.directory");

	ds->pc = pc;

	return (EPHIDGET_OK);
}

PhidgetReturnCode
installDictionary(mosiop_t iop, dictionarystore_t *ds, pconf_t *pc, const char *file) {
	PhidgetDictionaryHandle dict;
	PhidgetReturnCode res;
	dsdictionary_t *dsd;
	const char *label;
	const char *bname;
	dsmatch_t *match;
	dsmatch_t smatch;
	char val[1024];
	int sn;
	int i;

	dict = NULL;
	dsd = NULL;

	/*
	 * If disabled, just return.
	 */
	if (!pconf_getbool(pc, 0, "dictionary.enabled"))
		return (EPHIDGET_OK);

	label = pconf_getstr(pc, NULL, "dictionary.label");
	if (label == NULL)
		return (MOS_ERROR(iop, EPHIDGET_INVALID, "missing 'dictionary.label'"));

	sn = pconf_get32(pc, -1, "dictionary.sn");
	if (sn == -1)
		return (MOS_ERROR(iop, EPHIDGET_INVALID, "missing 'dictionary.sn'"));

	if (sn >= ds->nextsn)
		ds->nextsn = sn + 1;

	res = PhidgetDictionary_addDictionary(sn, label);
	if (res != EPHIDGET_OK)
		return (MOS_ERROR(iop, res, "failed to add dictionary %s/%d", label, sn));

	res = PhidgetDictionary_create(&dict);
	if (res != EPHIDGET_OK)
		return (MOS_ERROR(iop, res, "failed to create dictionary handle for %s/%d", label, sn));

	res = Phidget_setDeviceSerialNumber((PhidgetHandle)dict, sn);
	if (res != EPHIDGET_OK) {
		MOS_ERROR(iop, res, "failed to set device serial number on dictionary handle %s/%d", label, sn);
		goto bad;
	}

	res = Phidget_setDeviceLabel((PhidgetHandle)dict, label);
	if (res != EPHIDGET_OK) {
		MOS_ERROR(iop, res, "failed to set device label on dictionary handle %s/%d", label, sn);
		goto bad;
	}

	res = Phidget_openWaitForAttachment((PhidgetHandle)dict, 30000);
	if (res != EPHIDGET_OK) {
		MOS_ERROR(iop, res, "failed to open dictionary %s/%d", label, sn);
		goto bad;
	}

	dsd = mos_zalloc(sizeof(dsdictionary_t));
	RB_INIT(&dsd->matches);
	mos_mutex_init(&dsd->lock);
	mos_asprintf(&dsd->file, NULL, "%s/%s", ds->dictdir, file);
	dsd->label = mos_strdup(label, NULL);
	dsd->generation = mos_strdup(pconf_getstr(pc, "default", "dictionary.generation"), NULL);
	dsd->sn = sn;

	mos_mutex_lock(&ds->lock);
	MTAILQ_INSERT_HEAD(&ds->dictionaries, dsd, link);
	mos_mutex_unlock(&ds->lock);

	/*
	 * CONFIG
	 */
	if (pconf_getbool(pc, 0, "dictionary.add")) {
		dsd->flags |= DSDICTIONARY_ADDCONFIG;
		dsloginfo("%s: Add Config enabled", dsd->label);
	}

	for (i = 0; ; i++) {
		bname = pconf_getentryname(pc, i, "dictionary.config.key");
		if (bname == NULL)
			break;

		res = pconf_tostring(pc, val, sizeof (val), "dictionary.config.key.%s.value", bname);
		if (res != EPHIDGET_OK)
			continue;

		res = addMatch(dsd, pc, bname);
		if (res != EPHIDGET_OK) {
			dslogwarn("Failed to add match for '%s'", bname);
			continue;
		}

		PhidgetDictionary_add(dict, bname, val);
	}

	/*
	 * LOG
	 */
	for (i = 0; ; i++) {
		bname = pconf_getentryname(pc, i, "dictionary.log.key");
		if (bname == NULL)
			break;

		if (!Phidget_validDictionaryKey(bname)) {
			dslogwarn("invalid dictionary key '%s': ignoring", bname);
			continue;
		}
		smatch.ds_skey = bname;
		match = RB_FIND(dsmatches, &dsd->matches, &smatch);
		if (match == NULL) {
			match = mos_zalloc(sizeof(*match));
			match->ds_key = mos_strdup(bname, NULL);
			RB_INSERT(dsmatches, &dsd->matches, match);
		}
		match->flags |= DSMATCH_LOG;
		match->interval_min = pconf_get32(pc, -1, "dictionary.log.key.%s.interval.min", bname);
	}

	if (i > 0) {
		res = openDatabase(ds, dsd);
		if (res != EPHIDGET_OK)
			goto bad;
	}

	Phidget_close((PhidgetHandle)dict);
	PhidgetDictionary_delete(&dict);

	return (EPHIDGET_OK);

bad:

	if (dict)
		PhidgetDictionary_delete(&dict);

	if (dsd)
		freeDictionary(&dsd);

	return (res);
}

static void
syncDictionaries(dictionarystore_t *ds) {
	PhidgetReturnCode res;
	dsdictionary_t *dsd;
	char errbuf[128];
	pconf_t *pc;

	mos_mutex_lock(&ds->lock);
	MTAILQ_FOREACH(dsd, &ds->dictionaries, link) {
		mos_mutex_lock(&dsd->lock);
		if ((dsd->flags & DSDICTIONARY_DIRTY) == 0)
			goto next;

		dsloginfo("sync dictionary %s/%d", dsd->label, dsd->sn);

		res = pconf_parsepc_locked(&pc, errbuf, sizeof(errbuf), "%s", dsd->file);
		if (res != EPHIDGET_OK) {
			dslogerr("failed to parse dictionary file %s : %s", dsd->file, errbuf);
			goto next;
		}

		res = mergeDSIntoPC(dsd, pc);
		if (res != EPHIDGET_OK) {
			dslogerr("failed to merge dictionary store into configuration");
			pconf_unlock_locked(&pc);
			goto next;
		}

		res = pconf_renderpc_locked(&pc);
		if (res != EPHIDGET_OK) {
			dslogerr("failed to render dictionary file %s", dsd->file);
			goto next;
		}

		dsd->flags &= ~DSDICTIONARY_DIRTY;

next:
		mos_mutex_unlock(&dsd->lock);
	}
	mos_mutex_unlock(&ds->lock);
}

static int syncerrunning;
static int syncerrun;
static mos_mutex_t synclock;
static mos_cond_t synccond;

static MOS_TASK_RESULT
runSyncDictionaries(void *arg) {
	mostime_t next, tm;

	next = 0;

	mos_mutex_lock(&synclock);
	syncerrunning = 1;

	for (;;) {
		if (!syncerrun) {
			syncerrunning = 0;
			mos_mutex_unlock(&synclock);
			MOS_TASK_EXIT(0);
		}

		mos_mutex_unlock(&synclock);
		tm = mos_gettime_usec();
		if (tm >= next) {
			nslogdebug("syncing dictionary store");
			syncDictionaries(&dictionarystore);
			tm = mos_gettime_usec();
			next = tm + dictionarystore.syncinterval;
		}
		mos_mutex_lock(&synclock);
		mos_cond_timedwait(&synccond, &synclock, (next - tm) * 1000); /* nsec */
	}
}

PhidgetReturnCode
startDictionaries(pconf_t *cfg) {
	PhidgetReturnCode res;
	mosiop_t iop;
	int err;

	iop = NULL;

	mos_glock((void *)1);
	if (started) {
		mos_gunlock((void *)1);
		return (EPHIDGET_BUSY);
	}
	started = 1;
	mos_gunlock((void *)1);

	memset(&dictionarystore, 0, sizeof (dictionarystore));
	mos_mutex_init(&dictionarystore.lock);

	res = readconfig(cfg, &dictionarystore);
	if (res != EPHIDGET_OK) {
		nslogerr("failed to read dictionary configuration");
		goto bad;
	}

	iop = mos_iop_alloc();
	res = loadDictionaries(iop, &dictionarystore);
	if (res != EPHIDGET_OK) {
		nslogerr("failed to load dictionaries\n%N\n", iop);
		goto bad;
	}

	PhidgetDictionary_setOnChangeCallbackHandler(onDictionaryChange, &dictionarystore);

	mos_mutex_init(&synclock);
	mos_cond_init(&synccond);

	syncerrun = 1;
	err = mos_task_create(NULL, runSyncDictionaries, NULL);
	if (err != 0)
		nslogerr("failed to start dictionary store sync thread");

bad:

	if (iop)
		mos_iop_release(&iop);

	mos_glock((void *)1);
	started = 0;
	mos_gunlock((void *)1);
	return (res);
}

void
stopDictionaries() {

	mos_glock((void *)1);
	if (!started) {
		mos_gunlock((void *)1);
		return;
	}

	mos_mutex_lock(&synclock);
	syncerrun = 0;
	while (syncerrunning) {
		mos_cond_broadcast(&synccond);
		mos_cond_wait(&synccond, &synclock);
	}
	mos_mutex_unlock(&synclock);

	mos_mutex_destroy(&synclock);
	mos_cond_destroy(&synccond);

	started = 0;
	mos_gunlock((void *)1);
}
