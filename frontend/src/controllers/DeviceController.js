import DeviceModel from '../models/DeviceModel';
import apiService from '../services/apiService';
import deviceService from '../services/deviceService';

class DeviceController {
  static async getAllDevices() {
    try {
      // Fetch devices from the API through deviceService
      const devices = await deviceService.getDevices();
      
      // Convert plain objects to DeviceModel instances
      return devices.map(device => new DeviceModel(device));
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }
  
  static async getDeviceById(id) {
    try {
      // In a real application, we would fetch data from the API
      // For now, let's find the device from our mock data
      const devices = await this.getAllDevices();
      const device = devices.find(d => d.id === id);
      
      if (!device) {
        throw new Error('Device not found');
      }
      
      return device;
    } catch (error) {
      console.error(`Error fetching device with id ${id}:`, error);
      throw error;
    }
  }
  
  static async updateDeviceStatus(id, status) {
    try {
      // Call the API to update the device status
      const response = await apiService.put(`/devices/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating device status for id ${id}:`, error);
      throw error;
    }
  }
  
  static async getDeviceStats() {
    try {
      // Fetch stats from the API
      const response = await apiService.get('/devices/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching device stats:', error);
      throw error;
    }
  }
  
  static async toggleDeviceByType(deviceType) {
    try {
      // Call the API endpoint to toggle devices by type
      const response = await apiService.post('/devices/toggle-by-type', { deviceType });
      return response.data;
    } catch (error) {
      console.error(`Error toggling devices of type ${deviceType}:`, error);
      throw error;
    }
  }
}

export default DeviceController;