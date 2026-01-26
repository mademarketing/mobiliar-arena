AC_INIT([Phidget22 Network Server],
  [m4_esyscmd_s(cat library_version)],
  [support@phidgets.com],
  [phidget22networkserver],
  [www.phidgets.com])

AC_CONFIG_AUX_DIR([build])
AM_INIT_AUTOMAKE([-Wall])
AC_CONFIG_MACRO_DIR([m4])
AC_CONFIG_SRCDIR([src/server.h])
m4_ifdef([AM_SILENT_RULES],[AM_SILENT_RULES([yes])])

LT_INIT

AC_CANONICAL_HOST
AS_CASE([$host_cpu],
  [x86_64],
	AC_DEFINE_UNQUOTED(_HOST_CPU, [$host_cpu])
	AC_DEFINE_UNQUOTED(_MACHINE, [$host_cpu])
  [
  ],
  [i?86],
  [
	AC_DEFINE_UNQUOTED(_HOST_CPU, [$host_cpu])
	AC_DEFINE(_MACHINE, [i386])
  ],
  [*],
  [
	AC_DEFINE_UNQUOTED(_HOST_CPU, [$host_cpu])
	AC_DEFINE_UNQUOTED(_MACHINE, [$host_cpu])
  ]
)

AC_PROG_CC_C99
if test x$ac_cv_prog_c99 = xno ; then
	AC_MSG_ERROR([A c99 compiler is required])
fi

AC_PROG_LIBTOOL
AC_C_BIGENDIAN(
  [AC_DEFINE(MOS_BYTE_ORDER, MOS_BIG_ENDIAN, [bigendian machine])],
  [AC_DEFINE(MOS_BYTE_ORDER, MOS_LITTLE_ENDIAN, [littleendian machine])],
  [AC_MSG_ERROR(unknown endianess)]
)

case "$host_os" in
*linux*)
	# Checks for libraries.
	AC_SEARCH_LIBS([dlopen], [dl], [],
		AC_MSG_ERROR([Missing libdl!]))
	AC_SEARCH_LIBS([sqrt], [m], [],
		AC_MSG_ERROR([Missing libm!]))
	AC_SEARCH_LIBS([pthread_create], [pthread],
		[AC_DEFINE(_MOS_PTHREADS, 1)],
		AC_MSG_ERROR([Missing libpthread!]))
	AC_SEARCH_LIBS([libusb_init], [usb-1.0], [],
		AC_MSG_ERROR([Missing libusb!]))
	AC_DEFINE(UNIX, 1)
	AC_DEFINE(_LINUX, 1)
	AC_DEFINE(Linux, 1)
	;;
freebsd*)
	AC_SEARCH_LIBS([sqrt], [m], [],
		AC_MSG_ERROR([Missing libm!]))
	AC_SEARCH_LIBS([pthread_create], [pthread],
		[AC_DEFINE(_MOS_PTHREADS, 1)],
		AC_MSG_ERROR([Missing libpthread!]))
	AC_SEARCH_LIBS([libusb_init], [usb], [],
		AC_MSG_ERROR([Missing libusb!]))
	AC_DEFINE(UNIX, 1)
	AC_DEFINE(_FREEBSD, 1)
	AC_DEFINE(FreeBSD, 1)
	;;
*)
	AC_MSG_ERROR(Unrecognized OS $host_os)
	;;
esac

AC_SEARCH_LIBS([Phidget_getLibraryVersion], [phidget22],
  [AC_DEFINE([_PHIDGET22], 1)],
  AC_MSG_ERROR([Missing libphidget22]))

AC_SEARCH_LIBS([getPhidgetExtraVersion], [phidget22extra],
  [AC_DEFINE([_PHIDGET22EXTRA], 1)],
  AC_MSG_ERROR([Missing libphidget22extra]))

AC_ARG_ENABLE([debug],
  [AS_HELP_STRING([--enable-debug], [Define to enable debugging])],,
  [enable_debug=no]
)
AS_IF([test "x$enable_debug" == "xyes"], [
  AC_DEFINE([DEBUG], 1, [Define to enable debugging])
  AC_DEFINE([_DEBUG], 1, [Define to enable debugging])
])
AS_IF([test "x$enable_debug" == "xno"], [
  AC_DEFINE([NDEBUG], 1, [Define to disable debugging])
])

AC_CONFIG_FILES([Makefile])
AC_OUTPUT
