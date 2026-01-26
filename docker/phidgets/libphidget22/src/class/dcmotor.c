/* Generated: Wed Jan 27 2016 14:22:18 GMT-0700 (Mountain Standard Time) */
/* Will not be regenerated. */

#include "phidgetbase.h"
#include "class/dcmotor.gen.h"
#include "class/dcmotor.gen.c"

double PhidgetDCMotor_getLastBrakingStrength(PhidgetDCMotorHandle);

static void
PhidgetDCMotor_errorHandler(PhidgetChannelHandle phid, Phidget_ErrorEventCode code) {}

static void CCONV
PhidgetDCMotor_free(PhidgetChannelHandle *ch) {
	_free(ch);
}

API_PRETURN
PhidgetDCMotor_create(PhidgetDCMotorHandle *phidp) {
	return (_create(phidp));
}

static PhidgetReturnCode CCONV
PhidgetDCMotor_setStatus(PhidgetChannelHandle phid, BridgePacket *bp) {
	return (_setStatus(phid, bp));
}

static PhidgetReturnCode CCONV
PhidgetDCMotor_getStatus(PhidgetChannelHandle phid, BridgePacket **bp) {
	return (_getStatus(phid, bp));
}

static PhidgetReturnCode CCONV
PhidgetDCMotor_initAfterOpen(PhidgetChannelHandle phid) {
	return (_initAfterOpen(phid));
}

static PhidgetReturnCode CCONV
PhidgetDCMotor_setDefaults(PhidgetChannelHandle phid) {
	PhidgetDCMotorHandle ch;
	PhidgetReturnCode ret;

	ch = (PhidgetDCMotorHandle)phid;
	ret = _setDefaults(phid);

#if PHIDUID_DCC1004_SUPPORTED
	switch (phid->UCD->uid) {
	case PHIDCHUID_DCC1004_DCMOTOR_100:
		switch (ret) {
		case EPHIDGET_FAILSAFE:
			FIRE_ERROR(phid, EEPHIDGET_ESTOP, "External stop procedure initiated.");
			if (phid->iop != NULL) {
				mos_iop_addnotev(phid->iop, "ESTOP Button Pressed.");
			}
			break;
		case EPHIDGET_BADPOWER:
			FIRE_ERROR(phid, EEPHIDGET_BADPOWER, "Your power supply voltage is too high for the motor controller to begin operation.");
			if (phid->iop != NULL) {
				mos_iop_addnotev(phid->iop, "Bad Power Supply");
			}
			break;
		case EPHIDGET_POWERCYCLE:
			FIRE_ERROR(phid, EEPHIDGET_BADPOWER, "An overvoltage fault has triggered. Power your device off and on to resume operation. "
				"We recommend a PowerGuard Phidget to prevent this in future. See _____ for details.");
			if (phid->iop != NULL) {
				mos_iop_addnotev(phid->iop, "Overvoltage Fault. Power cycle required.");
			}
			break;
		default:
			break;
		}
		break;
	default:
		break;
	}
#endif
	return ret;
}

static PhidgetReturnCode
PhidgetDCMotor_bridgeInput(PhidgetChannelHandle phid, BridgePacket *bp) {
	PhidgetDCMotorHandle ch;
	PhidgetReturnCode res;

	ch = (PhidgetDCMotorHandle)phid;

	switch (bp->vpkt) {
	case BP_SETDUTYCYCLE:
	case BP_SETBRAKINGDUTYCYCLE:
		TESTRANGE_IOP(bp->iop, "%lf", getBridgePacketDouble(bp, 0), -ch->maxVelocity, ch->maxVelocity);
		res = _bridgeInput(phid, bp);
		break;
	case BP_SETFAILSAFETIME:
		TESTRANGE_IOP(bp->iop, "%u", getBridgePacketUInt32(bp, 0), ch->minFailsafeTime, ch->maxFailsafeTime);
		res = _bridgeInput(phid, bp);
		break;
#if PHIDUID_DCC1004_SUPPORTED
	case BP_INDUCTANCECHANGE:
		ch->motorInductance = getBridgePacketDouble(bp, 0);
		res = EPHIDGET_OK;
		break;
#endif
	default:
		res = _bridgeInput(phid, bp);
		break;
	}

	return (res);
}

static void
PhidgetDCMotor_fireInitialEvents(PhidgetChannelHandle phid) {
	_fireInitialEvents(phid);
}

static int
PhidgetDCMotor_hasInitialState(PhidgetChannelHandle phid) {
#if PHIDUID_DCC1004_SUPPORTED
	if (((PhidgetDCMotorHandle)phid)->motorInductance == PUNK_DBL)
		return (PFALSE);
#endif
	return (_hasInitialState(phid));
}

double
PhidgetDCMotor_getLastBrakingStrength(PhidgetDCMotorHandle ch) {
	return (ch->brakingStrength);
}