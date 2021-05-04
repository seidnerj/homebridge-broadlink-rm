# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- [Changed] Updated CHANGELOG.md to follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [4.4.3] - 2021-05-04
 - [Added] Adds Mute button to TV accessories (No HomeKit support and untested yet)
 - [Added] Adds the RM Mini 3 6507
 - [Added] Adds fan speed step functionality and speed improvements (Thanks @EpicKris)
 - [Added] Adds Current Temperature support to Heater-Cooler accessories. Offers all the same options: file, MQTT, or RM Pro Device (Thanks @uzumaki20398)
 - [Added] Allows HEX Objects for additional charactistics on Fan, Air-Purifier, and HumidifierDehumidifier Accessories (Thanks @ aymericbaur)
 - [Added] Adds turnOnWhenOff support to the HeaterCooler Accessory
 - [Fixed] Fixes bug with Parsing JSON MQTT messages (#298)
 - [Fixed] Fixes fanv1 "counterClockwise is undefined" error when showRotationDirection is true (#306)

## [4.4.2] - 2021-04-07
 - [Changed] Set node-persist to ignore parse errors to stop crashing the plugin on read errors
 - [Changed] Sets "undefined" characteristics to either 0 or minValue to prevent future Homebridge errors
 - [Added] Adds offDryMode configuration option to the airconditioner accessory. Thanks @pixeleyesltd
 - [Added] Adds stateless configuration switch option to have a switch "forget" its state
 - [Added] Adds Eve History service support. This can be disabled by adding `"noHistory":true` to your config
 - [Changed] Moves onTemperature and onHumidity logging to Debug only, reducing noice in the logs from all updates
 - [Fixed] Fixes mac address formatting error when using manual hosts devices #266
 - [Fixed] Fixes Accessory mac address formatting to support all formats the hosts section does - and improve matching to devices.
 - [Fixed] Stopped MQTT updates from defaulting to 0 when the topic isn't found. This does create messages that the plugin is slowing homebridge until MQTT updates are recieved.

## [4.4.1] - 2021-01-27
 - [Added] Adds pingUseArp configuration to use an ARP lookup instead of ICMP ping to test a device's status
 - [Added] Adds heater-cooler tempStepSize to support devices without 0.5 temperaure codes
 - [Fixed] Fixes "'Temperature Display Units': characteristic was supplied illegal value: undefined!"
 - [Fixed] Fixes "SET handler returned write response value, though the characteristic doesn't support write response! when returning a value"
 - [Fixed] Fixes Learn Button error "the characteristic 'On': characteristic was supplied illegal value: undefined!"
 - [Fixed] Fixes Error in Heater-Cooler with setting a value to a constant

## [4.4.0] - 2020-12-17
 - [Changed] Updated all dependencies to remove some security vulnerabilities 
 - [Added] Added Low Battery Alerts to Humidity and Temperature sensors (using battery:XX in readings from files)
 - [Added] Extended Temperature and Humidity readings from files to support temperature:XX, humidity:XX, and battery:XX values on each line
 - [Changed] Removed file and w1 Temperature readings being forced to 10 minutes. Now 1 minute minimum and adjustable
 - [Added] Added MQTT support to AC and Temperature sensor using temperature,humidity, and battery identifiers
 - [Added] Added HeaterCooler accessory option. Refer to [this document](https://github.com/kiwi-cam/homebridge-broadlink-rm/blob/kiwi-cam-beta-1/docs/heater-cooler.md) to read @newt10's work here.
 - [Changed] Integrated the platform helper module to improve maintainability.
 - [Changed] MQTT will update when published so frequent refreshes aren't required ( 10 minute default as a fallback )
 - [Fixed] Fixed duplicate monitorTemperature calls from Temperature Sensor accessories
 - [Fixed] Fixed SIGTERM when unexpected packet received

## [4.3.8] - 2020-12-01
- [Changed] Added Keep Alive packet to RM Devices to avoid reboots when the cloud is unreachable.
- [Added] **Added RF Learning** steps from #45
- [Fixed] Fixes "No Response" from Dehumidifers when noHumidity and accessory Off
- [Fixed] Fixes "log is not a function" error when using Pronto codes

## [4.3.7] - 2020-11-16
- [Fixed] Fixes missing FanSpeed/Direction features in Fanv1

## [4.3.6] - 2020-11-11
- [Changed] Improves HumidifierDehumidifier accessory to update state by using Humidity data from the Broadlink device 
- [Added] Adds humidityFilePath support to the HumidifierDehumidifier accessory to update the current humidity from a local file
- [Added] Adds autoOn/autoOff support to the Fan and HumidifierDehumidifier accessory (Note the Bug detail below)
- [Changed] Updated humiditySensor and temperatureSensor accessories to extend HumidifierDehumidifier and AirCon accessories (respectively) so both gain MQTT and file values too.
- [Changed] Updated the switch accessory to use On/Active status depending on device type. Many accessories inherit from this and it broke their AutoOff functions.
- [Fixed] Fixed AutoOn/AutoOff functions for Fan and HumidifierDehumidifier. This was an issue with the different characteristics between the HomeKit Fan and Fanv2 Services. In order to tidy this up users wanting to have the classic style Fan (with more icon options) will need to update type to "fanv1" i.e. `"type": "fanv1"`

## [4.3.5] - -2020-11-02
- [Fixed] Fixes bug in Fan accessory that removed Rotation Direction and/or Swing options

## [4.3.4] - 2020-10-27
- [Changed] Improves HumidifierDehumidifier accessory by using Humidity data from the Broadlink device (See README.md for notes.) 
- [Changed] Uses Service.Fan instead of Service.Fanv2 to allow Fan icons if not using SwingMode (Thanks @apexad)
- [Added] Adds fan improvements with defaultFanSpeed and stepSize (Thanks @newt10)
- [Fixed] Fixes Air Purifier so it no longer appears as a fan
- [Fixed] Removes limits on air-conditioner Current Temperature so it isn't constrained to the same limits as the Target Temperature.
- [Fixed] Fixed the identification of manual devices. New Manual deviceTypes added which are selected based on isRFSupported and isRM4. isRM4 will be required on newer devices to make sure messages include the correct headers.
- [Fixed] Fixes an error in the aircon accessory where HEX codes for temperatureXX would falsely report as missing

## [4.3.3] - 2020-09-29
- [Fixed] Fixes error in heombridge-platform-helper "ReferenceError: log is not defined"
- [Added] Adds Humidity information to the Aircon accessory
- [Added] Adds TemperatureSensor accessory to give temperature and humidity information from Broadlink sensors
- [Added] Adds HumiditySensor accessory to give humidity information from Broadlink sensors
- [Added] Adds AirPurifier and HumidifierDehumidifier accessory from the original fork

## [4.3.2] - 2020-09-21
- [Added] Updated documentation around TV changes

## [4.3.1] - 2020-09-21
- [Fixed] Fixes issue in heatOnly mode for Aircon accessories
- [Added] Adds coolOnly mode for Aircon accessories
- [Added] Fixes TV Display issue in iOS14. *All TVs are now seperate accessories. Previously the first TV connected via Homebridge as a bridge. This means that after updating, that first TV will need to be removed and re-added to HomeKit.*
- [Added] Adds TV subType to display STB, Receiver, or Stick types 
- [Fixed] Fixes MAC address order error. *If you specify a HOST in your config.json by MAC address, you'll likely need to correct this value after you update.*

## [4.3.0] - 2020-09-09
- [Added] Adds HeatOnly mode for Aircon accessories
- [Added] Adds support for RM4 Temperature sensors
- [Changed] Improves support for RM4 RF devices (e.g. RM4 Pro)

## [4.2.9] - 2020-08-11
- [Model] Added `Broadlink RM Mini 4 C` 610f support
- [Added] Added notes about IHC setup/reset process 

## [4.2.8] - 2020-07-15
- [Model] Added `Broadlink RM4 4 Pro` 649b support

## [4.2.7] - 2020-07-10
- [Added] Adds IR Learn support for RM4 devices
- [Added] Adds additional Debug information
- [Model] Added `Broadlink RM4 Mini 4 KR` support

## [4.2.6] - -2020-06-12
- [Fixed] Fix for RM4 SendCode issues
- [Added] Adds command acknowledgement messages

## [4.2.5] - 2020-06-10
- [Fixed] Updated to use new kiwicam-broadlinkjs-rm version with RM4 bug fixes (Learn Mode)
- [Model] Added `Broadlink RM Mini 4 S` support

## [4.2.3] - 2020-06-08
- [Fixed] Update to use new fork kiwicam-broadlinkjs-rm with RM4 support

## [4.2.0] - 2020-05-25
- [Added] Inital version - forked from AlexanderBabel/homebridge-broadlink-rm-tv
- [Fixed] Added device support from def-broadlinkjs-rm
