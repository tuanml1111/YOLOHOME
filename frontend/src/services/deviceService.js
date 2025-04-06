import apiService from './apiService';

const deviceService = {
  // Get all devices
  async getDevices() {
    try {
      const response = await apiService.get('/devices');
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  },
  
  // Get device by ID
  async getDeviceById(id) {
    try {
      // In a real application, we would call the API
      // const response = await apiService.get(`/devices/${id}`);
      // return response.data;
      
      // For demo purposes, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const devices = await this.getDevices();
      const device = devices.find(d => d.id === parseInt(id));
      
      if (!device) {
        throw new Error('Device not found');
      }
      
      return device;
    } catch (error) {
      console.error(`Error fetching device with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Update device status
  async updateDeviceStatus(id, status) {
    try {
      // In a real application, we would call the API
      // const response = await apiService.put(`/devices/${id}/status`, { status });
      // return response.data;
      
      // For demo purposes, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        id: parseInt(id),
        status,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error updating device status for ID ${id}:`, error);
      throw error;
    }
  },
  
  // Toggle device by type
  async toggleDevicesByType(type) {
    try {
      // In a real application, we would call the API
      // const response = await apiService.post(`/devices/toggle-by-type`, { type });
      // return response.data;
      
      // For demo purposes, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      console.error(`Error toggling devices of type ${type}:`, error);
      throw error;
    }
  }
};

export default deviceService;