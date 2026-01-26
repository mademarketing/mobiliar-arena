#ifndef _DICTIONARY_H_
#define _DICTIONARY_H_

#include "server.h"

#include "mos/mos_time.h"
#include "mos/bsdqueue.h"
#include "sqlite3.h"

#ifdef Windows
#define CONFIGDIR	"c:/ProgramData/Phidgets/dictionary.d"
#define DBDIR		"c:/ProgramData/Phidgets"
#else /* !Windows */
#define CONFIGDIR	"/etc/phidgets/dictionary.d"
#define DBDIR		"/var/phidgets/dictionary.d"
#endif /* Windows */

/*
 * Must match the dictionary bridge packet values fired by the device.
 */
#define DICT_ADD	0x7C
#define DICT_UPDATE	0x7E
#define DICT_DELETE	0x80

#define DICT_SUFFIX	".dpc"

#define DICTSTORELS "dictstore"

#ifdef NDEBUG
#define dslogdebug(...)
#define dslogcrit(...) PhidgetLog_loge(NULL, 0, __func__, DICTSTORELS, PHIDGET_LOG_CRITICAL, __VA_ARGS__)
#define dslogerr(...) PhidgetLog_loge(NULL, 0, __func__, DICTSTORELS, PHIDGET_LOG_ERROR, __VA_ARGS__)
#define dslogwarn(...) PhidgetLog_loge(NULL, 0, __func__, DICTSTORELS, PHIDGET_LOG_WARNING, __VA_ARGS__)
#define dsloginfo(...) PhidgetLog_loge(NULL, 0, __func__, DICTSTORELS, PHIDGET_LOG_INFO, __VA_ARGS__)
#define dslogverbose(...) PhidgetLog_loge(NULL, 0, __func__, DICTSTORELS, PHIDGET_LOG_VERBOSE, __VA_ARGS__)
#else
#define dslogcrit(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, DICTSTORELS, PHIDGET_LOG_CRITICAL, __VA_ARGS__)
#define dslogerr(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, DICTSTORELS, PHIDGET_LOG_ERROR, __VA_ARGS__)
#define dslogwarn(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, DICTSTORELS, PHIDGET_LOG_WARNING, __VA_ARGS__)
#define dsloginfo(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, DICTSTORELS, PHIDGET_LOG_INFO, __VA_ARGS__)
#define dslogdebug(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, DICTSTORELS, PHIDGET_LOG_DEBUG, __VA_ARGS__)
#define dslogverbose(...) PhidgetLog_loge(__FILE__, __LINE__, __func__, DICTSTORELS, PHIDGET_LOG_VERBOSE, __VA_ARGS__)
#endif /* NDEBUG */

#define TARGET_INERROR	0x01		/* target is in an error state */
#define PERSIST_CREATE	0x02		/* create the key if it does not exist */
#define PERSIST_REPLACE	0x04		/* replace the value even if the key already exists */
#define PERSIST_RAN		0x08		/* the persist has already executed */

#define DSMATCH_CONFIG	0x00000001	/* config key */
#define DSMATCH_LOG		0x00000002	/* log key*/
#define DSMATCH_UPDATE	0x00000010	/* dictionary key updates should update store value */
#define DSMATCH_REMOVE	0x00000020	/* dictionary key removal should remove store definition */
#define DSMATCH_DIRTY	0x00000100	/* has been modified */
#define DSMATCH_DELETE	0x00000200	/* has been deleted */

typedef union {
	const char	*skey;
	char		*key;
} dskey_t;

typedef struct dsmatch {
	int						flags;
#define ds_skey key.skey
#define ds_key key.key
	dskey_t					key;
	int						interval_min;	/* minimum interval between matches */
	char					*val;
	RB_ENTRY(dsmatch)		rblink;
	mostime_t				_nextmatch;
} dsmatch_t;
typedef RB_HEAD(dsmatches, dsmatch) dsmatches_t;

int dsmatch_compare(dsmatch_t *, dsmatch_t *);

RB_PROTOTYPE(dsmatches, dsmatch, rblink, dsmatch_compare)

#define DSDICTIONARY_ADDCONFIG	0x01		/* if set, keys not already in matches are added to config */
#define DSDICTIONARY_DIRTY		0x80

typedef struct dsdictionary {
	int							flags;
	mos_mutex_t					lock;
	char						*label;
	char						*generation;
	int							sn;
	char						*file;
	dsmatches_t					matches;
	sqlite3						*db;
	sqlite3_stmt				*dbstmt;
	MTAILQ_ENTRY(dsdictionary)	link;
} dsdictionary_t;

typedef MTAILQ_HEAD(dsdictionarylist, dsdictionary) dsdictionarylist_t;
typedef struct _dictionarystore {
	mos_mutex_t			lock;
	const char			*dictdir;
	const char			*dbdir;
	mostime_t			syncinterval;
	pconf_t				*pc;			/* keep so we do not have to allocate storage for everything */
	dsdictionarylist_t	dictionaries;
	int					nextsn;			/* next available dictionary serial number */
} dictionarystore_t;

PhidgetReturnCode installDictionary(mosiop_t, dictionarystore_t *, pconf_t *, const char *);
PhidgetReturnCode openDatabase(dictionarystore_t *, dsdictionary_t *);
PhidgetReturnCode closeDatabase(dsdictionary_t *);

PhidgetReturnCode findDictionary(int, dsdictionary_t **);
PhidgetReturnCode getDictionaries(dictionarystore_t **);
PhidgetReturnCode freeDictionary(dsdictionary_t **);

PhidgetReturnCode logMatch(dsdictionary_t *, dsmatch_t *, int, const char *, const char *);
PhidgetReturnCode findMatch(dsdictionary_t *, const char *, dsmatch_t **);
PhidgetReturnCode matchExists(dsdictionary_t *, const char *);
PhidgetReturnCode addMatch(dsdictionary_t *, pconf_t *, const char *);
PhidgetReturnCode removeMatch(dsdictionary_t *, dsmatch_t *);
#endif /* _DICTIONARY_H_ */