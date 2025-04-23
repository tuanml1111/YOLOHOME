const DeviceModel = require('../models/deviceModel');
const mqttService = require('../services/mqttService');

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private
exports.getAllDevices = async (req, res, next) => {
  try {
    const devices = await DeviceModel.getAllDevices();
    
    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res, next) => {
  try {
    const device = await DeviceModel.getDeviceById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new device
// @route   POST /api/devices
// @access  Private
exports.createDevice = async (req, res, next) => {
  try {
    const { name, type, location, status } = req.body;
    
    // Validate input
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and type for the device'
      });
    }
    
    // Create device
    const device = await DeviceModel.createDevice({
      name,
      type,
      location,
      status: status || 'OFF' // 🔴 UPDATED: Default to 'OFF' instead of 'inactive'
    });
    
    res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res, next) => {
  try {
    const { name, type, location, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (location) updateData.location = location;
    if (status) updateData.status = status;
    
    // Update device
    const device = await DeviceModel.updateDevice(req.params.id, updateData);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Send MQTT message if status has changed
    if (updateData.status) {
      const topic = `yolohome/devices/${device.device_id}/control`;
      // 🔴 UPDATED: Convert ON/OFF to 1/0 for MQTT
      const value = device.status === 'ON' ? '1' : '0';
      const message = JSON.stringify({
        device_id: device.device_id,
        action: device.status,
        value: value, // Add numerical value for Adafruit
        timestamp: new Date().toISOString(),
        source: 'api'
      });
      
      mqttService.publishMessage(topic, message);
    }
      
    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
exports.deleteDevice = async (req, res, next) => {
  try {
    const success = await DeviceModel.deleteDevice(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Control device (turn on/off)
// @route   POST /api/devices/:id/control
// @access  Private
exports.controlDevice = async (req, res, next) => {
  try {
    const { action } = req.body;
    
    // 🔴 UPDATED: Validate input for ON/OFF values
    if (!action || (action !== 'ON' && action !== 'OFF')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid action (ON or OFF)'
      });
    }
    
    // Get device
    const device = await DeviceModel.getDeviceById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Update device status
    const updatedDevice = await DeviceModel.updateDevice(req.params.id, { status: action });
    
    // Send MQTT message
    const topic = `yolohome/devices/${device.device_id}/control`;
    // 🔴 UPDATED: Convert ON/OFF to 1/0 for MQTT/Adafruit
    const value = action === 'ON' ? '1' : '0';
    const message = JSON.stringify({
      device_id: device.device_id,
      action,
      value: value, // Add numerical value for Adafruit
      timestamp: new Date().toISOString(),
      source: 'api'
    });
    
    mqttService.publishMessage(topic, message);
    
    res.status(200).json({
      success: true,
      data: updatedDevice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get device statistics
// @route   GET /api/devices/stats
// @access  Private
exports.getDeviceStats = async (req, res, next) => {
  try {
    const stats = await DeviceModel.getDeviceStatistics();
    
    res.status(200).json({
      success: true,
      data: {
        total: parseInt(stats.total),
        // 🔴 UPDATED: Map active/inactive to ON/OFF in statistics
        online: parseInt(stats.active),
        offline: parseInt(stats.inactive)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle devices by type
// @route   POST /api/devices/toggle-by-type
// @access  Private
exports.toggleDevicesByType = async (req, res, next) => {
  try {
    const { device_type } = req.body;
    
    // Validate input
    if (!device_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide device type'
      });
    }
    
    // Get devices of the specified type
    const devices = await DeviceModel.getDevicesByType(device_type);
    
    if (devices.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No devices found with type: ${device_type}`
      });
    }
    
    // Toggle each device
    const updatedDevices = [];
    
    for (const device of devices) {
      // 🔴 UPDATED: Toggle between ON and OFF
      const newStatus = device.status === 'ON' ? 'OFF' : 'ON';
      const updatedDevice = await DeviceModel.updateDevice(device.device_id, { status: newStatus });
      updatedDevices.push(updatedDevice);
      
      // Send MQTT message
      const topic = `yolohome/devices/${device.device_id}/control`;
      // 🔴 UPDATED: Convert ON/OFF to 1/0 for Adafruit
      const value = newStatus === 'ON' ? '1' : '0';
      const message = JSON.stringify({
        device_id: device.device_id,
        action: newStatus,
        value: value, // Add numerical value for Adafruit
        timestamp: new Date().toISOString(),
        source: 'api'
      });
      
      mqttService.publishMessage(topic, message);
    }
    
    res.status(200).json({
      success: true,
      count: updatedDevices.length,
      data: updatedDevices
    });
  } catch (error) {
    next(error);
  }
};