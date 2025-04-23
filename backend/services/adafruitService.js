const SensorModel = require('../models/sensorModel');
const logger = require('../utils/logger');
const cron = require('node-cron');

class AdafruitService {
  constructor() {
    this.username = process.env.ADAFRUIT_USERNAME;
    this.key = process.env.ADAFRUIT_KEY;
    this.isRunning = false;
    this.cronJob = null;
  }

  async fetchSensorData() {
    try {
      logger.info('Fetching data from Adafruit IO');
      const feeds = ['temperature', 'pressure', 'air-quality', 'light-intensity'];
      const payload = {
        temperature: null,
        pressure: null,
        airQuality: null,
        lightIntensity: null
      };

      for (const feed of feeds) {
        const response = await fetch(`https://io.adafruit.com/api/v2/${this.username}/feeds/${feed}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-AIO-Key': this.key
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching ${feed} from Adafruit: ${response.statusText}`);
        }
        
        const data = await response.json();
        logger.info(`Data from ${feed}: ${data.last_value}`);
        
        if(feed === 'temperature') {
          payload.temperature = parseFloat(data.last_value);
        } else if(feed === 'pressure') {
          payload.pressure = parseFloat(data.last_value);
        } else if(feed === 'air-quality') {
          payload.airQuality = parseFloat(data.last_value);
        } else if(feed === 'light-intensity') {
          payload.lightIntensity = parseFloat(data.last_value);
        }
      }

      // Store data in database
      await this.storeSensorData(payload);
      
      return payload;
    } catch (err) {
      logger.error('Error fetching data from Adafruit:', err);
      throw err;
    }
  }

  async storeSensorData(data) {
    try {
      // Find corresponding sensors in database
      const sensors = await SensorModel.getAllSensors();
      
      // Store data for each sensor
      for (const sensor of sensors) {
        let value = null;
        
        if (sensor.sensor_type === 'temperature') {
          value = data.temperature;
        } else if (sensor.sensor_type === 'humidity') {
          value = data.humidity || data.pressure; // Adafruit might use pressure instead of humidity
        } else if (sensor.sensor_type === 'motion') {
          value = data.motion || 0;
        }
        
        if (value !== null) {
          await SensorModel.insertSensorData(sensor.sensor_id, value);
          logger.info(`Stored ${sensor.sensor_type} data: ${value}`);
        }
      }
    } catch (err) {
      logger.error('Error storing sensor data:', err);
      throw err;
    }
  }
  
  async sendCommand(feed, value) {
    try {
      logger.info(`Sending command to Adafruit: ${feed} = ${value}`);
      
      const response = await fetch(`https://io.adafruit.com/api/v2/${this.username}/feeds/${feed}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AIO-Key': this.key
        },
        body: JSON.stringify({ value })
      });
      
      if (!response.ok) {
        throw new Error(`Error sending command to Adafruit: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      logger.error(`Error sending command to Adafruit: ${err}`);
      throw err;
    }
  }

  start() {
    if (this.isRunning) return;
    
    logger.info('Starting Adafruit sync service');
    
    // Schedule data fetch every 5 seconds
    this.cronJob = cron.schedule('*/5 * * * * *', async () => {
      try {
        await this.fetchSensorData();
      } catch (err) {
        logger.error('Error in scheduled Adafruit sync:', err);
      }
    });
    
    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;
    
    logger.info('Stopping Adafruit sync service');
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.isRunning = false;
  }
}

module.exports = new AdafruitService();