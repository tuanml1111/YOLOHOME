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
      logger.info('Connected to MQTT broker');
      
      // Subscribe to topics
      this.client.subscribe(mqttConfig.topics.sensorData);
      this.client.subscribe(mqttConfig.topics.deviceControl);
      this.client.subscribe(mqttConfig.topics.alerts);
      
      logger.info('Subscribed to MQTT topics');
    });
    
    this.client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Handle messages based on topic
        if (topic.startsWith('yolohome/sensors/')) {
          this.handleSensorData(topic, payload);
        } else if (topic.startsWith('yolohome/devices/') && topic.endsWith('/control')) {
          this.handleDeviceControl(topic, payload);
        } else if (topic === 'yolohome/alerts') {
          this.handleAlert(payload);
        }
      } catch (error) {
        logger.error(`Error handling MQTT message: ${error.message}`);
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
  
  async handleSensorData(topic, payload) {
    try {
      // Extract sensor type from topic
      // Format: yolohome/sensors/{sensorId}
      const parts = topic.split('/');
      const sensorId = parts[2];
      
      if (!sensorId) {
        logger.warn(`Invalid sensor topic: ${topic}`);
        return;
      }
      
      // Get sensor
      const sensor = await SensorModel.getSensorById(sensorId);
      
      if (!sensor) {
        logger.warn(`Unknown sensor ID: ${sensorId}`);
        return;
      }
      
      // Store sensor data
      const timestamp = payload.timestamp || new Date().toISOString();
      await SensorModel.insertSensorData(sensorId, payload.value, timestamp);
      
      logger.info(`Stored sensor data: ${sensor.sensor_type} = ${payload.value}`);
    } catch (error) {
      logger.error(`Error handling sensor data: ${error.message}`);
    }
  }
  
  async handleDeviceControl(topic, payload) {
    try {
      // Extract device ID from topic
      // Format: yolohome/devices/{deviceId}/control
      const parts = topic.split('/');
      const deviceId = parts[2];
      
      if (!deviceId) {
        logger.warn(`Invalid device topic: ${topic}`);
        return;
      }
      
      // Skip if the message came from the API to avoid loops
      if (payload.source === 'api') {
        return;
      }
      
      // Update device status
      const status = payload.action === 'ON' ? 'active' : 'inactive';
      await DeviceModel.updateDevice(deviceId, { status });
      
      logger.info(`Updated device ${deviceId} status to ${status}`);
    } catch (error) {
      logger.error(`Error handling device control: ${error.message}`);
    }
  }
  
  async handleAlert(payload) {
    try {
      // Create alert
      await AlertModel.createAlert({
        device_id: payload.device_id,
        sensor_id: payload.sensor_id,
        alert_type: payload.type,
        amessage: payload.message,
        status: 'pending'
      });
      
      logger.info(`Created alert: ${payload.type} - ${payload.message}`);
    } catch (error) {
      logger.error(`Error handling alert: ${error.message}`);
    }
  }
  
  publishMessage(topic, message) {
    if (!this.connected) {
      logger.warn('MQTT client not connected. Cannot publish message.');
      return false;
    }
    
    this.client.publish(topic, message);
    logger.info(`Published message to ${topic}`);
    return true;
  }
}

module.exports = new MQTTService();