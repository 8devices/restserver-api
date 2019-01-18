'use strict';

const ClientNode = require('./clientNodeInstance.js');
const { RESOURCE_TYPE } = require('./resourceInstance.js');

function randomFloat(min, max) {
  return (Math.random() * (max - min)) + min;
}

function randomInteger(min, max) {
  return Math.floor(randomFloat(Math.ceil(min), Math.floor(max)));
}

function powerSourceVoltageHandler(averageVoltage = 3300, fluctuation = 0.005) {
  const fluctuationMin = averageVoltage * (1 - fluctuation);
  const fluctuationMax = averageVoltage * (1 + fluctuation);
  return randomInteger(fluctuationMin, fluctuationMax);
}

function analogInputCurrentHandler() {
  return randomFloat(0, 3333);
}

function temperatureSensorHandler(averageTemperature = 20, fluctuation = 0.025) {
  const fluctuationMin = averageTemperature * (1 - fluctuation);
  const fluctuationMax = averageTemperature * (1 + fluctuation);
  return randomFloat(fluctuationMin, fluctuationMax);
}

function humiditySensorHandler(averageHumidity = 70, fluctuation = 0.05) {
  const fluctuationMin = averageHumidity * (1 - fluctuation);
  const fluctuationMax = averageHumidity * (1 + fluctuation);
  return randomFloat(fluctuationMin, fluctuationMax);
}


class Sensor3700 extends ClientNode {
  constructor(options) {
    super(options);


    this.timeInitialisation = new Date().getTime();

    this.createObject(3305, 0);
    this.createObject(3312, 0);

    this.objects['3/0'].addResource(7, 'R', RESOURCE_TYPE.INTEGER, 3300, powerSourceVoltageHandler);
    this.objects['3305/0'].addResource(5800, 'R', RESOURCE_TYPE.FLOAT, 0.0, () => {
      return this.instantaneousActivePowerHandler();
    });
    this.objects['3305/0'].addResource(5805, 'R', RESOURCE_TYPE.FLOAT, 0.0);
    this.objects['3305/0'].addResource(5810, 'R', RESOURCE_TYPE.FLOAT, 0.0, () => {
      return this.instantaneousReactivePowerHandler();
    });
    this.objects['3305/0'].addResource(5815, 'R', RESOURCE_TYPE.FLOAT, 0.0);
    this.objects['3312/0'].addResource(5850, 'RW', RESOURCE_TYPE.BOOLEAN, false, undefined, true);

    this.objects['3305/0'].resources['5800'].on('change', (currentActivePower) => {
      const cumulativeActivePower = this.objects['3305/0'].resources['5805'].value;
        this.objects['3305/0'].writeResource(
            5805, (currentActivePower/36000 + cumulativeActivePower) % (2 ** 31), true);
    });

    this.objects['3305/0'].resources['5810'].on('change', (currentReactivePower) => {
      const cumulativeReactivePower = this.objects['3305/0'].resources['5815'].value;
        this.objects['3305/0'].writeResource(
            5815, (currentReactivePower/36000 + cumulativeReactivePower) % (2 ** 31), true);
    });
  }

  instantaneousActivePowerHandler() {
    if (this.objects['3312/0'].resources['5850'].value === false) {
      return 0;
    }
    const timeNow = new Date().getTime() - this.timeInitialisation;
    return Math.abs(Math.cos(timeNow) * 1000 * Math.cos(timeNow / 20000));
  }

  instantaneousReactivePowerHandler() {
    if (this.objects['3312/0'].resources['5850'].value === false) {
      return 0;
    }
    const timeNow = new Date().getTime() - this.timeInitialisation;
    return Math.abs(Math.sin(timeNow) * 400 * Math.cos(timeNow / 20000));
  }
}

class Sensor3800 extends ClientNode {
  constructor(options) {
    super(options);

    this.createObject(3303, 0);
    this.createObject(3304, 0);

    this.objects['3/0'].addResource(7, 'R', RESOURCE_TYPE.INTEGER, 3300, powerSourceVoltageHandler);
    this.objects['3303/0'].addResource(5700, 'R', RESOURCE_TYPE.FLOAT, 20.0, temperatureSensorHandler);
    this.objects['3304/0'].addResource(5700, 'R', RESOURCE_TYPE.FLOAT, 70.0, humiditySensorHandler);
  }
}

class Sensor4400 extends ClientNode {
  constructor(options) {
    super(options);

    this.createObject(3200, 0);
    this.createObject(3303, 0);

    this.objects['3/0'].addResource(7, 'R', RESOURCE_TYPE.INTEGER, 3300, powerSourceVoltageHandler);
    this.objects['3200/0'].addResource(5500, 'R', RESOURCE_TYPE.BOOLEAN, false, undefined, true);
    this.objects['3200/0'].addResource(5501, 'R', RESOURCE_TYPE.INTEGER, 0, undefined, true);
    this.objects['3303/0'].addResource(5700, 'R', RESOURCE_TYPE.FLOAT, 20.0, temperatureSensorHandler);

    this.objects['3200/0'].resources['5500'].on('change', () => {
      this.objects['3200/0'].getResourceValue(5501, (hallSensorCounterValue) => {
        this.objects['3200/0'].writeResource(5501, (hallSensorCounterValue + 1) % (2 ** 31), true);
      });
    });
  }

  hallSensorState(newState) {
    this.objects['3200/0'].writeResource(5500, newState, true);
  }

  hallSensorTrigger() {
    this.objects['3200/0'].getResourceValue(5500, (hallSensorValue) => {
      this.objects['3200/0'].writeResource(5500, !hallSensorValue, true);
    });
  }
}

class Sensor4500 extends ClientNode {
  constructor(options) {
    super(options);

    this.createObject(3202, 0);

    this.objects['3/0'].addResource(7, 'R', RESOURCE_TYPE.INTEGER, 3300, powerSourceVoltageHandler);
    this.objects['3202/0'].addResource(5600, 'R', RESOURCE_TYPE.FLOAT, 20.0, analogInputCurrentHandler);
  }
}

module.exports = {
  Sensor3700,
  Sensor3800,
  Sensor4400,
  Sensor4500,
};
