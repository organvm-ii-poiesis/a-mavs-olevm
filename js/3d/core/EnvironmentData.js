/**
 * @file EnvironmentData.js
 * @description Fetches and manages environmental data for 3D scene reactivity
 * Integrates geolocation, weather, time, and astronomical data
 */

'use strict';

/**
 * EnvironmentData - Manages environmental inputs for 3D visuals
 * @class
 */
class EnvironmentData {
  /**
   * @param {Object} options - Configuration options
   * @param {string} [options.weatherApiKey] - OpenWeatherMap API key
   * @param {string} [options.astronomyApiId] - Astronomy API application ID
   * @param {string} [options.astronomyApiSecret] - Astronomy API secret
   * @param {number} [options.updateInterval=300000] - Update interval in ms (default 5 min)
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined' ? ETCETER4_CONFIG.threeD || {} : {};

    this.weatherApiKey = options.weatherApiKey || config.weatherApiKey || '';
    this.astronomyApiId = options.astronomyApiId || config.astronomyApiId || '';
    this.astronomyApiSecret =
      options.astronomyApiSecret || config.astronomyApiSecret || '';
    this.updateInterval = options.updateInterval || 300000; // 5 minutes

    // Current data state
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
        moonPhase: 0.5, // 0 = new, 0.5 = full, 1 = new again
        moonIllumination: 50,
        sunAltitude: 45,
        available: false,
      },
    };

    // Callbacks for data updates
    this.updateCallbacks = [];
    this._updateIntervalId = null;

    // Bind methods
    this._updateTimeData = this._updateTimeData.bind(this);
  }

  /**
   * Initialize data fetching
   * @returns {Promise<void>}
   */
  async initialize() {
    // Start time updates (every second)
    this._timeIntervalId = setInterval(this._updateTimeData, 1000);

    // Get location and fetch weather/astronomy
    try {
      await this._fetchLocation();
      if (this.data.location.available) {
        await Promise.all([this._fetchWeather(), this._fetchAstronomy()]);
      }
    } catch (error) {
      console.warn('EnvironmentData: Failed to fetch initial data', error);
    }

    // Set up periodic updates for weather and astronomy
    this._updateIntervalId = setInterval(async () => {
      if (this.data.location.available) {
        await Promise.all([this._fetchWeather(), this._fetchAstronomy()]);
      }
    }, this.updateInterval);

    this._notifyUpdate();
  }

  /**
   * Get current time-based data
   * @private
   * @returns {Object}
   */
  _getTimeData() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Calculate time of day as 0-1 (0 = midnight, 0.5 = noon)
    const timeOfDay = (hours * 3600 + minutes * 60 + seconds) / 86400;

    // Calculate sun position approximation (-1 to 1, -1 = midnight, 1 = noon)
    const sunPosition = Math.sin((timeOfDay - 0.25) * Math.PI * 2);

    // Determine period of day
    let period;
    if (hours >= 5 && hours < 8) {
      period = 'dawn';
    } else if (hours >= 8 && hours < 12) {
      period = 'morning';
    } else if (hours >= 12 && hours < 17) {
      period = 'afternoon';
    } else if (hours >= 17 && hours < 20) {
      period = 'dusk';
    } else {
      period = 'night';
    }

    // Color temperature based on time (warm at dawn/dusk, neutral midday, cool at night)
    let colorTemperature;
    if (period === 'dawn' || period === 'dusk') {
      colorTemperature = 3000; // Warm
    } else if (period === 'night') {
      colorTemperature = 8000; // Cool blue
    } else {
      colorTemperature = 5500; // Neutral daylight
    }

    return {
      hours,
      minutes,
      seconds,
      timeOfDay,
      sunPosition,
      period,
      colorTemperature,
      timestamp: now.getTime(),
    };
  }

  /**
   * Update time data
   * @private
   */
  _updateTimeData() {
    this.data.time = this._getTimeData();
    this._notifyUpdate();
  }

  /**
   * Fetch user's location
   * @private
   * @returns {Promise<void>}
   */
  async _fetchLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('EnvironmentData: Geolocation not available');
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.data.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            available: true,
          };
          resolve();
        },
        (error) => {
          console.warn('EnvironmentData: Geolocation error', error.message);
          // Use default location (NYC) as fallback
          this.data.location = {
            lat: 40.7128,
            lng: -74.006,
            available: false,
          };
          resolve();
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000, // 1 hour cache
        }
      );
    });
  }

  /**
   * Fetch weather data from OpenWeatherMap
   * @private
   * @returns {Promise<void>}
   */
  async _fetchWeather() {
    if (!this.weatherApiKey) {
      console.warn('EnvironmentData: No weather API key configured');
      return;
    }

    const { lat, lng } = this.data.location;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.weatherApiKey}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Map weather conditions to simplified categories
      const conditionMap = {
        Clear: 'clear',
        Clouds: 'cloudy',
        Rain: 'rain',
        Drizzle: 'rain',
        Thunderstorm: 'storm',
        Snow: 'snow',
        Mist: 'fog',
        Fog: 'fog',
        Haze: 'haze',
      };

      const mainCondition = data.weather?.[0]?.main || 'Clear';
      const condition = conditionMap[mainCondition] || 'clear';

      this.data.weather = {
        condition,
        temperature: data.main?.temp || 20,
        humidity: data.main?.humidity || 50,
        cloudCover: data.clouds?.all || 0,
        windSpeed: data.wind?.speed || 0,
        available: true,
      };
    } catch (error) {
      console.warn('EnvironmentData: Weather fetch failed', error);
    }
  }

  /**
   * Fetch astronomical data
   * @private
   * @returns {Promise<void>}
   */
  async _fetchAstronomy() {
    // If no astronomy API configured, use calculated moon phase
    if (!this.astronomyApiId || !this.astronomyApiSecret) {
      this.data.astronomy = {
        ...this._calculateMoonPhase(),
        sunAltitude: this.data.time.sunPosition * 90,
        available: true,
      };
      return;
    }

    const { lat, lng } = this.data.location;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Create authorization header
    const authString = btoa(`${this.astronomyApiId}:${this.astronomyApiSecret}`);

    const url = `https://api.astronomyapi.com/api/v2/bodies/positions/moon`;
    const body = {
      latitude: lat,
      longitude: lng,
      elevation: 0,
      from_date: dateStr,
      to_date: dateStr,
      time: now.toISOString().split('T')[1].substring(0, 8),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Astronomy API error: ${response.status}`);
      }

      const data = await response.json();
      const moonData = data.data?.table?.rows?.[0]?.cells?.[0];

      if (moonData) {
        this.data.astronomy = {
          moonPhase: moonData.extraInfo?.phase?.fraction || 0.5,
          moonIllumination: (moonData.extraInfo?.phase?.fraction || 0.5) * 100,
          sunAltitude: this.data.time.sunPosition * 90,
          available: true,
        };
      }
    } catch (error) {
      console.warn('EnvironmentData: Astronomy fetch failed', error);
      // Fallback to calculated moon phase
      this.data.astronomy = {
        ...this._calculateMoonPhase(),
        sunAltitude: this.data.time.sunPosition * 90,
        available: true,
      };
    }
  }

  /**
   * Calculate approximate moon phase without API
   * @private
   * @returns {Object}
   */
  _calculateMoonPhase() {
    // Synodic month (moon cycle) is approximately 29.53 days
    const synodicMonth = 29.53;
    // Reference new moon date: January 6, 2000
    const referenceNewMoon = new Date('2000-01-06T00:00:00Z').getTime();
    const now = Date.now();
    const daysSinceReference = (now - referenceNewMoon) / (1000 * 60 * 60 * 24);
    const moonAge = daysSinceReference % synodicMonth;
    const moonPhase = moonAge / synodicMonth;

    // Calculate illumination (0 at new moon, 100 at full moon, 0 at next new moon)
    const illumination = Math.abs(Math.sin(moonPhase * Math.PI)) * 100;

    return {
      moonPhase,
      moonIllumination: illumination,
    };
  }

  /**
   * Register a callback for data updates
   * @param {Function} callback - Called with current data object
   * @returns {Function} Unsubscribe function
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
    // Immediately call with current data
    callback(this.data);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks of data update
   * @private
   */
  _notifyUpdate() {
    for (const callback of this.updateCallbacks) {
      callback(this.data);
    }
  }

  /**
   * Get current environment data
   * @returns {Object}
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Get visual parameters derived from environment data
   * Useful for directly applying to shaders/materials
   * @returns {Object}
   */
  getVisualParams() {
    const { time, weather, astronomy } = this.data;

    // Particle density based on weather (higher in fog/snow)
    let particleDensity = 0.3;
    if (weather.condition === 'fog' || weather.condition === 'haze') {
      particleDensity = 0.8;
    } else if (weather.condition === 'rain') {
      particleDensity = 0.6;
    } else if (weather.condition === 'snow') {
      particleDensity = 0.7;
    } else if (weather.condition === 'cloudy') {
      particleDensity = 0.4;
    }

    // Blur amount based on weather
    let blurAmount = 0;
    if (weather.condition === 'fog' || weather.condition === 'haze') {
      blurAmount = 0.5;
    } else if (weather.condition === 'rain') {
      blurAmount = 0.2;
    }

    // Color temperature to RGB shift
    const kelvinToRGB = (kelvin) => {
      const temp = kelvin / 100;
      let r, g, b;

      if (temp <= 66) {
        r = 255;
        g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
      } else {
        r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
        g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
      }

      if (temp >= 66) {
        b = 255;
      } else if (temp <= 19) {
        b = 0;
      } else {
        b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
      }

      return { r: r / 255, g: g / 255, b: b / 255 };
    };

    const colorTempRGB = kelvinToRGB(time.colorTemperature);

    // Moon glow intensity
    const moonGlow = astronomy.moonIllumination / 100;

    // Ambient light intensity based on time
    let ambientIntensity = 0.3;
    if (time.period === 'night') {
      ambientIntensity = 0.1 + moonGlow * 0.2;
    } else if (time.period === 'dawn' || time.period === 'dusk') {
      ambientIntensity = 0.5;
    } else {
      ambientIntensity = 0.8;
    }

    // Reduce intensity based on cloud cover
    ambientIntensity *= 1 - weather.cloudCover / 200;

    return {
      particleDensity,
      blurAmount,
      colorTemperature: time.colorTemperature,
      colorTempRGB,
      moonGlow,
      moonPhase: astronomy.moonPhase,
      ambientIntensity,
      windSpeed: weather.windSpeed,
      timeOfDay: time.timeOfDay,
      period: time.period,
      sunPosition: time.sunPosition,
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this._timeIntervalId) {
      clearInterval(this._timeIntervalId);
    }
    if (this._updateIntervalId) {
      clearInterval(this._updateIntervalId);
    }
    this.updateCallbacks = [];
  }
}

// Export for global scope (no build step)
window.EnvironmentData = EnvironmentData;
