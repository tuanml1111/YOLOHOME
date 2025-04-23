import React, { useState, useEffect } from 'react';
import DeviceController from '../../controllers/DeviceController';
import './DeviceControl.css';
import adafruitService from '../../services/adafruitService';

const DeviceControl = () => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadDevices();
  }, []);
  
  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await DeviceController.getAllDevices();
      setDevices(result);
    } catch (err) {
      setError('Failed to load devices. Please try again.');
      console.error('Error loading devices:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleDevice = async (deviceId) => {
    try {
      const deviceIndex = devices.findIndex(d => d.id === deviceId);
      if (deviceIndex === -1) return;
      
      const device = devices[deviceIndex];
      // 🔴 UPDATED: Check the current status and determine new status based on ON/OFF
      const currentStatus = device.status;
      const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
      
      // Update UI immediately for better user experience
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex] = { 
        ...device, 
        status: newStatus,
        lastUpdated: new Date().toISOString()
      };
      setDevices(updatedDevices);
      
      // Call API to update device status
      await DeviceController.updateDeviceStatus(deviceId, newStatus);
      
      // Send command to Adafruit
      // Map device types to Adafruit feed names
      const feedMap = {
        'light': 'light',
        'fan': 'fan',
        'lock': 'lock'
      };
      
      const feed = feedMap[device.type] || device.type;
      // 🔴 UPDATED: Convert ON/OFF to 1/0 for Adafruit
      const value = newStatus === 'ON' ? '1' : '0';
      
      await adafruitService.sendCommand(feed, value);
    } catch (err) {
      setError('Failed to control device. Please try again.');
      console.error('Error controlling device:', err);
      
      // Refresh devices to reflect actual state
      loadDevices();
    }
  };
  
  const deviceTypeIcons = {
    light: 'fas fa-lightbulb',
    fan: 'fas fa-fan',
    lock: 'fas fa-lock',
    alarm: 'fas fa-bell'
  };
  
  if (isLoading) {
    return <div className="loading-indicator">Loading devices...</div>;
  }
  
  return (
    <div className="device-control">
      <div className="page-header">
        <h1>Device Control</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="device-grid">
        {devices.length > 0 ? (
          devices.map(device => (
            <div key={device.id} className="device-card">
              <div className="device-header">
                <div className="device-icon">
                  <i className={deviceTypeIcons[device.type] || 'fas fa-plug'}></i>
                </div>
                <div className="device-info">
                  <h3>{device.name}</h3>
                  <p>{device.location}</p>
                </div>
                {/* 🔴 UPDATED: Status display to show ON/OFF instead of active/inactive */}
                <div className="device-status">
                  <span className={device.status.toLowerCase()}>{device.status}</span>
                </div>
              </div>
              
              <div className="device-control-panel">
                <label className="toggle-switch">
                  {/* 🔴 UPDATED: Toggle switch checked state based on ON/OFF */}
                  <input
                    type="checkbox"
                    checked={device.status === 'ON'}
                    onChange={() => handleToggleDevice(device.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="no-devices">No devices found.</div>
        )}
      </div>
    </div>
  );
};

export default DeviceControl;