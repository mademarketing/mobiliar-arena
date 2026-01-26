AUTOMAKE_OPTIONS = std-options
AUTOMAKE_OPTIONS += subdir-objects

AM_CFLAGS= -I$(top_srcdir)/src -I$(top_srcdir)/src/dictionary

#AM_CFLAGS+= -Werror
AM_CFLAGS+= -Wreturn-type
AM_CFLAGS+= -Wpointer-arith
AM_CFLAGS+= -Wall -Wno-format-y2k
AM_CFLAGS+= -Wno-switch
AM_CFLAGS+= -Wmissing-prototypes -Wnested-externs -Wreturn-type
AM_CFLAGS+= -Wshadow -Wchar-subscripts
AM_CFLAGS+= -Wredundant-decls -Wsign-compare

AM_CFLAGS+= -DSQLITE_OMIT_LOAD_EXTENSION
AM_CFLAGS+= -DSQLITE_OMIT_DEPRECATED

bin_PROGRAMS = phidget22networkserver

phidget22networkserver_SOURCES = src/server.h \
	src/dictionary/database.c \
	src/dictionary/dictionary.c \
	src/dictionary/dictionary.h \
	src/phidgetserver/phidgetserver.c \
	src/webserver/websocket.c \
	src/webserver/webserver.h \
	src/webserver/webutils.c \
	src/webserver/webserver.c \
	src/webserver/webapi.c \
	src/server.c \
	src/utils.c  \
	src/sqlite3.c \
	src/sqlite3.h

EXTRA_DIST = \
	networkserver.pc-dist \
	files/etc/phidgets/mimetypes.kv \
	files/etc/phidgets/phidget22networkserver.pc
