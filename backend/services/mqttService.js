// backend/services/mqttService.js - Mock version
const logger = require('../utils/logger');

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    logger.info('MQTT Service is disabled (MOCK version)');
  }
  
  connect() {
    logger.info('MQTT connect method called (DISABLED)');
    return false;
  }
  
  disconnect() {
    logger.info('MQTT disconnect method called (DISABLED)');
    return false;
  }
  
  publishMessage(topic, message) {
    logger.info(`MQTT publish skipped (DISABLED): Topic: ${topic}`);
    return false;
  }
  
  subscribe(topic) {
    logger.info(`MQTT subscribe skipped (DISABLED): Topic: ${topic}`);
    return false;
  }
  
  unsubscribe(topic) {
    logger.info(`MQTT unsubscribe skipped (DISABLED): Topic: ${topic}`);
    return false;
  }
  
  check_msg() {
    // Do nothing
    return false;
  }
}

// Sử dụng Singleton pattern để đảm bảo chỉ có một instance
module.exports = new MQTTService();