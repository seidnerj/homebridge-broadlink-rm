# Changes

## 4.3.3
- [Bug] Fixes error in heombridge-platform-helper "ReferenceError: log is not defined"
- [Improvement] Addeds Humidity information to the Aircon accessory

## 4.3.2
- [Improvement] Updated documentation around TV changes

## 4.3.1
- [Bug] Fixes issue in heatOnly mode for Aircon accessories
- [Improvement] Adds coolOnly mode for Aircon accessories
- [Improvement] Fixes TV Display issue in iOS14. *All TVs are now seperate accessories. Previously the first TV connected via Homebridge as a bridge. This means that after updating, that first TV will need to be removed and re-added to HomeKit.*
- [Improvement] Adds TV subType to display STB, Receiver, or Stick types 
- [Bug] Fixes MAC address order error. *If you specify a HOST in your config.json by MAC address, you'll likely need to correct this value after you update.*

## 4.3.0
- [Improvement] Adds HeatOnly mode for Aircon accessories
- [Improvement] Adds support for RM4 Temperature sensors
- [Improvement] Improves support for RM4 RF devices (e.g. RM4 Pro)

## 4.2.9
- [Model] Added `Broadlink RM Mini 4 C` 610f support
- [Improvement] Added notes about IHC setup/reset process 

## 4.2.8
- [Model] Added `Broadlink RM4 4 Pro` 649b support

## 4.2.7
- [Improvement] Adds IR Learn support for RM4 devices
- [Improvement] Adds additional Debug information
- [Model] Added `Broadlink RM4 Mini 4 KR` support

## 4.2.6

- [Bug] Fix for RM4 SendCode issues
- [Improvement] Adds command acknowledgement messages

## 4.2.5

- [Bug] Updated to use new kiwicam-broadlinkjs-rm version with RM4 bug fixes (Learn Mode)
- [Model] Added `Broadlink RM Mini 4 S` support

## 4.2.3

- [Bug] Update to use new fork kiwicam-broadlinkjs-rm with RM4 support

## 4.2.0

- Inital version - forked from AlexanderBabel/homebridge-broadlink-rm-tv
- [Bug] Added device support from def-broadlinkjs-rm
