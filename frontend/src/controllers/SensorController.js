import apiService from '../services/apiService';

class SensorController {
  static async getLatestReadings() {
    try {
      // In a real application, we would fetch data from the API
      // For now, let's use mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Random values for demo purposes
      const mockData = {
        temperature: (Math.random() * 10 + 25).toFixed(1),
        humidity: (Math.random() * 20 + 60).toFixed(1),
        motion: Math.random() > 0.7
      };
      
      return mockData;
    } catch (error) {
      console.error('Error fetching sensor readings:', error);
      throw error;
    }
  }
  
  static async getSensorHistory(sensorType, timeRange = 'day') {
    try {
      // In a real application, we would fetch historical data from the API
      // For now, let's generate mock data
      const now = new Date();
      const data = [];
      
      // Generate mock data points
      if (timeRange === 'day') {
        // 24 hours, one point per hour
        for (let i = 23; i >= 0; i--) {
          const timestamp = new Date(now);
          timestamp.setHours(now.getHours() - i);
          
          let value;
          if (sensorType === 'temperature') {
            value = (Math.random() * 5 + 25).toFixed(1); // 25-30 degrees
          } else if (sensorType === 'humidity') {
            value = (Math.random() * 10 + 60).toFixed(1); // 60-70%
          } else {
            value = Math.random() > 0.8 ? 1 : 0; // Motion detected randomly
          }
          
          data.push({
            timestamp: timestamp.toISOString(),
            value: parseFloat(value)
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${sensorType} history:`, error);
      throw error;
    }
  }
  
  static async getRecentAlerts() {
    try {
      // In a real application, we would fetch alerts from the API
      // For now, let's use mock data
      const mockAlerts = [
        {
          id: 1,
          type: 'temperature',
          message: 'Temperature exceeded 30°C',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
          status: 'active'
        },
        {
          id: 2,
          type: 'motion',
          message: 'Motion detected in living room',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
          status: 'active'
        },
        {
          id: 3,
          type: 'humidity',
          message: 'Humidity level below 30%',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
          status: 'resolved'
        }
      ];
      
      return mockAlerts;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }
}

export default SensorController;