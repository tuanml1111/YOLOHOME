import apiService from './apiService';

const adafruitService = {
  // Send command to Adafruit
  async sendCommand(feed, value) {
    try {
      const response = await apiService.post('/adafruit/command', { feed, value });
      return response.data;
    } catch (error) {
      console.error('Error sending command to Adafruit:', error);
      throw error;
    }
  },
  
  // Manually fetch latest data from Adafruit
  async fetchData() {
    try {
      const response = await apiService.get('/adafruit/fetch');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching data from Adafruit:', error);
      throw error;
    }
  }
};

export default adafruitService;