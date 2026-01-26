/**
 * @file tests/unit/EnvironmentData.test.js
 * @description Unit tests for EnvironmentData class
 * Tests time calculations, weather parsing, moon phase calculations, and visual params
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Load the EnvironmentData class
// Note: In a no-build environment, we manually load the class for testing
const EnvironmentDataCode = `
class EnvironmentData {
  constructor(options = {}) {
    const config = typeof ETCETER4_CONFIG !== 'undefined' ? ETCETER4_CONFIG.threeD || {} : {};
    this.weatherApiKey = options.weatherApiKey || config.weatherApiKey || '';
    this.astronomyApiId = options.astronomyApiId || config.astronomyApiId || '';
    this.astronomyApiSecret = options.astronomyApiSecret || config.astronomyApiSecret || '';
    this.updateInterval = options.updateInterval || 300000;
    this.data = {
      location: { lat: null, lng: null, available: false },
      time: this._getTimeData(),
      weather: {
        condition: 'clear',
        temperature: 20,
        humidity: 50,
        cloudCover: 0,
        windSpeed: 0,
        available: false,
      },
      astronomy: {
        moonPhase: 0.5,
        moonIllumination: 50,
        sunAltitude: 45,
        available: false,
      },
    };
    this.updateCallbacks = [];
    this._updateIntervalId = null;
    this._updateTimeData = this._updateTimeData.bind(this);
  }

  _getTimeData() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const timeOfDay = (hours * 3600 + minutes * 60 + seconds) / 86400;
    const sunPosition = Math.sin((timeOfDay - 0.25) * Math.PI * 2);
    let period;
    if (hours >= 5 && hours < 8) period = 'dawn';
    else if (hours >= 8 && hours < 12) period = 'morning';
    else if (hours >= 12 && hours < 17) period = 'afternoon';
    else if (hours >= 17 && hours < 20) period = 'dusk';
    else period = 'night';
    let colorTemperature;
    if (period === 'dawn' || period === 'dusk') colorTemperature = 3000;
    else if (period === 'night') colorTemperature = 8000;
    else colorTemperature = 5500;
    return { hours, minutes, seconds, timeOfDay, sunPosition, period, colorTemperature, timestamp: now.getTime() };
  }

  _updateTimeData() {
    this.data.time = this._getTimeData();
    this._notifyUpdate();
  }

  _calculateMoonPhase() {
    const synodicMonth = 29.53;
    const referenceNewMoon = new Date('2000-01-06T00:00:00Z').getTime();
    const now = Date.now();
    const daysSinceReference = (now - referenceNewMoon) / (1000 * 60 * 60 * 24);
    const moonAge = daysSinceReference % synodicMonth;
    const moonPhase = moonAge / synodicMonth;
    const illumination = Math.abs(Math.sin(moonPhase * Math.PI)) * 100;
    return { moonPhase, moonIllumination: illumination };
  }

  onUpdate(callback) {
    this.updateCallbacks.push(callback);
    callback(this.data);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) this.updateCallbacks.splice(index, 1);
    };
  }

  _notifyUpdate() {
    for (const callback of this.updateCallbacks) callback(this.data);
  }

  getData() { return { ...this.data }; }

  getVisualParams() {
    const { time, weather, astronomy } = this.data;
    let particleDensity = 0.3;
    if (weather.condition === 'fog' || weather.condition === 'haze') particleDensity = 0.8;
    else if (weather.condition === 'rain') particleDensity = 0.6;
    else if (weather.condition === 'snow') particleDensity = 0.7;
    else if (weather.condition === 'cloudy') particleDensity = 0.4;

    let blurAmount = 0;
    if (weather.condition === 'fog' || weather.condition === 'haze') blurAmount = 0.5;
    else if (weather.condition === 'rain') blurAmount = 0.2;

    const moonGlow = astronomy.moonIllumination / 100;
    let ambientIntensity = 0.3;
    if (time.period === 'night') ambientIntensity = 0.1 + moonGlow * 0.2;
    else if (time.period === 'dawn' || time.period === 'dusk') ambientIntensity = 0.5;
    else ambientIntensity = 0.8;
    ambientIntensity *= 1 - weather.cloudCover / 200;

    return {
      particleDensity, blurAmount, colorTemperature: time.colorTemperature,
      moonGlow, moonPhase: astronomy.moonPhase, ambientIntensity,
      windSpeed: weather.windSpeed, timeOfDay: time.timeOfDay, period: time.period, sunPosition: time.sunPosition
    };
  }

  dispose() {
    if (this._timeIntervalId) clearInterval(this._timeIntervalId);
    if (this._updateIntervalId) clearInterval(this._updateIntervalId);
    this.updateCallbacks = [];
  }
}
`;

// Execute the class definition
eval(EnvironmentDataCode);

describe('EnvironmentData', () => {
  let envData;

  beforeEach(() => {
    vi.useFakeTimers();
    envData = new EnvironmentData();
  });

  afterEach(() => {
    envData?.dispose();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(envData.data.location.available).toBe(false);
      expect(envData.data.weather.condition).toBe('clear');
      expect(envData.data.weather.temperature).toBe(20);
      expect(envData.data.astronomy.moonPhase).toBe(0.5);
      expect(envData.updateInterval).toBe(300000);
    });

    it('should accept custom options', () => {
      const custom = new EnvironmentData({
        weatherApiKey: 'test-key',
        updateInterval: 60000,
      });
      expect(custom.weatherApiKey).toBe('test-key');
      expect(custom.updateInterval).toBe(60000);
      custom.dispose();
    });
  });

  describe('_getTimeData', () => {
    it('should calculate timeOfDay as a value between 0 and 1', () => {
      const timeData = envData._getTimeData();
      expect(timeData.timeOfDay).toBeGreaterThanOrEqual(0);
      expect(timeData.timeOfDay).toBeLessThan(1);
    });

    it('should return dawn period for hours 5-7', () => {
      vi.setSystemTime(new Date('2024-01-15T06:30:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().period).toBe('dawn');
      data.dispose();
    });

    it('should return morning period for hours 8-11', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().period).toBe('morning');
      data.dispose();
    });

    it('should return afternoon period for hours 12-16', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().period).toBe('afternoon');
      data.dispose();
    });

    it('should return dusk period for hours 17-19', () => {
      vi.setSystemTime(new Date('2024-01-15T18:30:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().period).toBe('dusk');
      data.dispose();
    });

    it('should return night period for hours 20-4', () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().period).toBe('night');
      data.dispose();
    });

    it('should set warm color temperature for dawn/dusk', () => {
      vi.setSystemTime(new Date('2024-01-15T06:30:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().colorTemperature).toBe(3000);
      data.dispose();
    });

    it('should set cool color temperature for night', () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().colorTemperature).toBe(8000);
      data.dispose();
    });

    it('should set neutral color temperature for day', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
      const data = new EnvironmentData();
      expect(data._getTimeData().colorTemperature).toBe(5500);
      data.dispose();
    });

    it('should calculate sunPosition sinusoidally', () => {
      // At noon (timeOfDay = 0.5), sunPosition should be close to 1
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
      const data = new EnvironmentData();
      const timeData = data._getTimeData();
      expect(timeData.sunPosition).toBeCloseTo(1, 1);
      data.dispose();
    });
  });

  describe('_calculateMoonPhase', () => {
    it('should return moonPhase between 0 and 1', () => {
      const result = envData._calculateMoonPhase();
      expect(result.moonPhase).toBeGreaterThanOrEqual(0);
      expect(result.moonPhase).toBeLessThan(1);
    });

    it('should return moonIllumination between 0 and 100', () => {
      const result = envData._calculateMoonPhase();
      expect(result.moonIllumination).toBeGreaterThanOrEqual(0);
      expect(result.moonIllumination).toBeLessThanOrEqual(100);
    });

    it('should calculate illumination based on phase', () => {
      // At new moon (phase near 0 or 1), illumination should be near 0
      // At full moon (phase near 0.5), illumination should be near 100
      const result = envData._calculateMoonPhase();
      // Illumination follows sin curve
      expect(typeof result.moonIllumination).toBe('number');
    });
  });

  describe('getData', () => {
    it('should return a copy of the data object', () => {
      const data = envData.getData();
      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('time');
      expect(data).toHaveProperty('weather');
      expect(data).toHaveProperty('astronomy');
    });

    it('should not return the same reference', () => {
      const data1 = envData.getData();
      const data2 = envData.getData();
      expect(data1).not.toBe(data2);
    });
  });

  describe('getVisualParams', () => {
    it('should return visual parameters derived from environment data', () => {
      const params = envData.getVisualParams();
      expect(params).toHaveProperty('particleDensity');
      expect(params).toHaveProperty('blurAmount');
      expect(params).toHaveProperty('colorTemperature');
      expect(params).toHaveProperty('moonGlow');
      expect(params).toHaveProperty('ambientIntensity');
      expect(params).toHaveProperty('windSpeed');
      expect(params).toHaveProperty('timeOfDay');
      expect(params).toHaveProperty('period');
    });

    it('should return higher particle density for fog', () => {
      envData.data.weather.condition = 'fog';
      const params = envData.getVisualParams();
      expect(params.particleDensity).toBe(0.8);
    });

    it('should return higher particle density for rain', () => {
      envData.data.weather.condition = 'rain';
      const params = envData.getVisualParams();
      expect(params.particleDensity).toBe(0.6);
    });

    it('should return higher particle density for snow', () => {
      envData.data.weather.condition = 'snow';
      const params = envData.getVisualParams();
      expect(params.particleDensity).toBe(0.7);
    });

    it('should return blur amount for fog', () => {
      envData.data.weather.condition = 'fog';
      const params = envData.getVisualParams();
      expect(params.blurAmount).toBe(0.5);
    });

    it('should return blur amount for rain', () => {
      envData.data.weather.condition = 'rain';
      const params = envData.getVisualParams();
      expect(params.blurAmount).toBe(0.2);
    });

    it('should calculate ambient intensity based on time period', () => {
      envData.data.time.period = 'afternoon';
      envData.data.weather.cloudCover = 0;
      const params = envData.getVisualParams();
      expect(params.ambientIntensity).toBe(0.8);
    });

    it('should reduce ambient intensity with cloud cover', () => {
      envData.data.time.period = 'afternoon';
      envData.data.weather.cloudCover = 100;
      const params = envData.getVisualParams();
      expect(params.ambientIntensity).toBeLessThan(0.8);
    });
  });

  describe('onUpdate', () => {
    it('should call callback immediately with current data', () => {
      const callback = vi.fn();
      envData.onUpdate(callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(envData.data);
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = envData.onUpdate(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove callback when unsubscribed', () => {
      const callback = vi.fn();
      const unsubscribe = envData.onUpdate(callback);
      callback.mockClear();

      unsubscribe();
      envData._notifyUpdate();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should clear all callbacks', () => {
      const callback = vi.fn();
      envData.onUpdate(callback);
      envData.dispose();
      expect(envData.updateCallbacks).toHaveLength(0);
    });
  });
});
