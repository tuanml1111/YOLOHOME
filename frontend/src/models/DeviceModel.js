class DeviceModel {
  constructor(deviceData) {
    this.id = deviceData.id || null;
    this.name = deviceData.name || '';
    this.type = deviceData.type || '';
    this.location = deviceData.location || '';
    // 🔴 UPDATED: Use 'ON'/'OFF' instead of 'active'/'inactive'
    this.status = deviceData.status || 'OFF';
    this.lastUpdated = deviceData.lastUpdated || new Date().toISOString();
  }
  
  // 🔴 UPDATED: Check if device is ON
  isActive() {
    return this.status === 'ON';
  }
  
  // 🔴 UPDATED: Return status text directly
  getStatusText() {
    return this.status;
  }
  
  getIcon() {
    switch (this.type) {
      case 'light':
        return 'fas fa-lightbulb';
      case 'fan':
        return 'fas fa-fan';
      case 'lock':
        return 'fas fa-lock';
      default:
        return 'fas fa-plug';
    }
  }
  
  // 🔴 UPDATED: Toggle between ON and OFF
  toggle() {
    this.status = this.isActive() ? 'OFF' : 'ON';
    this.lastUpdated = new Date().toISOString();
    return this;
  }
}

export default DeviceModel;