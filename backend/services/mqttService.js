const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const SensorModel = require('../models/sensorModel');
const AlertModel = require('../models/alertModel');
const DeviceModel = require('../models/deviceModel');
const logger = require('../utils/logger');

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
  }
  
  connect() {
    // Connect to MQTT broker
    this.client = mqtt.connect(mqttConfig.brokerUrl, mqttConfig.connectOptions);
    
    // Set up event handlers
    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Connected to Adafruit IO MQTT broker');
      
      // Subscribe to topics
      this.client.subscribe(mqttConfig.topics.sensorData);
      this.client.subscribe(mqttConfig.topics.deviceControl);
      this.client.subscribe(mqttConfig.topics.alerts);
      
      logger.info('Subscribed to Adafruit IO MQTT topics');
    });
    
    this.client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        logger.info(`Received message from topic ${topic}: ${message.toString()}`);
        
        // Handle messages based on topic
        if (topic.includes('/feeds/') && !topic.includes('/control')) {
          this.handleSensorData(topic, payload);
        } else if (topic.includes('/feeds/') && topic.includes('/control')) {
          this.handleDeviceControl(topic, payload);
        } else if (topic.includes('/feeds/alerts')) {
          this.handleAlert(payload);
        }
      } catch (error) {
        logger.error(`Error handling MQTT message: ${error.message}`);
        // Try to parse as simple value if not JSON
        try {
          const simpleValue = message.toString();
          // Extract feed name from topic
          const feedName = this.extractFeedName(topic);
          if (feedName) {
            this.handleSimpleSensorData(feedName, simpleValue);
          }
        } catch (e) {
          logger.error(`Failed to handle non-JSON message: ${e.message}`);
        }
      }
    });
    
    this.client.on('error', (error) => {
      this.connected = false;
      logger.error(`MQTT client error: ${error.message}`);
    });
    
    this.client.on('close', () => {
      this.connected = false;
      logger.info('MQTT client disconnected');
    });
  }
  
  // Extract feed name from topic
  extractFeedName(topic) {
    // Format: username/groups/groupname/feeds/feedname
    const parts = topic.split('/');
    if (parts.length >= 5 && parts[3] === 'feeds') {
      return parts[4];
    }
    return null;
  }
  
  // Handle simple value format from Adafruit
  async handleSimpleSensorData(feedName, value) {
    try {
      // Map feed names to sensor types
      const sensorTypeMap = {
        'temperature': 1, // Assuming sensor_id 1 is temperature
        'humidity': 2,    // Assuming sensor_id 2 is humidity
        'motion': 3,      // Assuming sensor_id 3 is motion
        // Add more mappings as needed
      };
      
      const sensorId = sensorTypeMap[feedName];
      if (!sensorId) {
        logger.warn(`Unknown feed name: ${feedName}`);
        return;
      }
      
      // Get numeric value
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        logger.warn(`Non-numeric value for sensor data: ${value}`);
        return;
      }
      
      // Store sensor data
      await SensorModel.insertSensorData(sensorId, numericValue);
      
      logger.info(`Stored sensor data from Adafruit: ${feedName} = ${numericValue}`);
    } catch (error) {
      logger.error(`Error handling simple sensor data: ${error.message}`);
    }
  }
  
  async handleSensorData(topic, payload) {
    try {
      // Extract feed name from topic
      const feedName = this.extractFeedName(topic);
      if (!feedName) {
        logger.warn(`Invalid sensor topic: ${topic}`);
        return;
      }
      
      // Map feed names to sensor IDs
      const sensorTypeMap = {
        'temperature': 1, // Assuming sensor_id 1 is temperature
        'humidity': 2,    // Assuming sensor_id 2 is humidity
        'motion': 3,      // Assuming sensor_id 3 is motion
        // Add more mappings as needed
      };
      
      const sensorId = sensorTypeMap[feedName];
      if (!sensorId) {
        logger.warn(`Unknown feed name: ${feedName}`);
        return;
      }
      
      // Adafruit format is typically: { "value": 123 }
      const value = payload.value !== undefined ? payload.value : payload;
      
      // Store sensor data
      const timestamp = payload.timestamp || payload.created_at || new Date().toISOString();
      await SensorModel.insertSensorData(sensorId, value, timestamp);
      
      logger.info(`Stored sensor data from Adafruit: ${feedName} = ${value}`);
    } catch (error) {
      logger.error(`Error handling sensor data: ${error.message}`);
    }
  }
  
  async handleDeviceControl(topic, payload) {
    try {
      // Extract feed name from topic
      const feedName = this.extractFeedName(topic);
      if (!feedName) {
        logger.warn(`Invalid device topic: ${topic}`);
        return;
      }
      
      // Map feed names to device IDs
      const deviceMap = {
        'light': 1,    // Assuming device_id 1 is light
        'thermostat': 2, // Assuming device_id 2 is thermostat
        'camera': 3,   // Assuming device_id 3 is camera
        // Add more mappings as needed
      };
      
      const deviceId = deviceMap[feedName.replace('/control', '')];
      if (!deviceId) {
        logger.warn(`Unknown device feed: ${feedName}`);
        return;
      }
      
      // Skip if the message came from the API to avoid loops
      if (payload.source === 'api') {
        return;
      }
      
      // Determine status based on payload
      let status;
      if (typeof payload === 'object') {
        status = payload.value === 'ON' || payload.value === 1 || payload.value === '1' ? 'active' : 'inactive';
      } else {
        status = payload === 'ON' || payload === 1 || payload === '1' ? 'active' : 'inactive';
      }
      
      // Update device status
      await DeviceModel.updateDevice(deviceId, { status });
      
      logger.info(`Updated device ${deviceId} status to ${status} from Adafruit`);
    } catch (error) {
      logger.error(`Error handling device control: ${error.message}`);
    }
  }
  
  async handleAlert(payload) {
    try {
      // Adafruit format might be: { "value": "Alert message" }
      const message = payload.value || payload;
      
      // For demonstration, we'll assign default values
      // In practice, the alert message could be parsed to extract details
      const deviceId = 1; // Default to first device
      const sensorId = 1; // Default to first sensor
      const alertType = 'System Alert';
      
      // Create alert
      await AlertModel.createAlert({
        device_id: deviceId,
        sensor_id: sensorId,
        alert_type: alertType,
        amessage: message,
        status: 'pending'
      });
      
      logger.info(`Created alert from Adafruit: ${message}`);
    } catch (error) {
      logger.error(`Error handling alert: ${error.message}`);
    }
  }
  
  publishMessage(topic, message) {
    if (!this.connected) {
      logger.warn('MQTT client not connected. Cannot publish message.');
      return false;
    }
    
    // Format for Adafruit IO
    const adafruitTopic = topic.replace('yolohome/', `${process.env.MQTT_USERNAME}/groups/default/feeds/`);
    
    this.client.publish(adafruitTopic, message);
    logger.info(`Published message to Adafruit IO topic ${adafruitTopic}`);
    return true;
  }
}

module.exports = new MQTTService();