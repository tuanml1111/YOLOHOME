"""
DHT20 Temperature and Humidity Sensor Driver
"""
from machine import I2C, Pin
import time

class DHT20:
    """
    DHT20 Temperature and Humidity Sensor
    """
    # I2C address of the device
    DHT20_I2C_ADDR = 0x38
    
    def __init__(self, scl_pin=22, sda_pin=21, i2c_freq=100000):
        """Initialize I2C and sensor"""
        self.i2c = I2C(0, scl=Pin(scl_pin), sda=Pin(sda_pin), freq=i2c_freq)
        
        # Check if sensor is present
        if self.DHT20_I2C_ADDR not in self.i2c.scan():
            raise Exception("DHT20 sensor not found on I2C bus")
        
        # Reset sensor
        self._reset()
        
        # Wait for sensor to stabilize
        time.sleep_ms(100)
        
    def _reset(self):
        """Reset the sensor"""
        # Send reset command
        self.i2c.writeto(self.DHT20_I2C_ADDR, bytes([0xBA]))
        time.sleep_ms(20)
    
    def _crc8_check(self, data):
        """Calculate CRC8 checksum for data verification"""
        crc = 0xFF
        for byte in data[:-1]:  # Exclude the CRC byte itself
            crc ^= byte
            for _ in range(8):
                if crc & 0x80:
                    crc = (crc << 1) ^ 0x31
                else:
                    crc = crc << 1
        return (crc & 0xFF) == data[-1]
    
    def read(self):
        """Read temperature and humidity from the sensor"""
        try:
            # Send measurement command
            self.i2c.writeto(self.DHT20_I2C_ADDR, bytes([0xAC, 0x33, 0x00]))
            
            # Wait for measurement to complete (at least 80ms)
            time.sleep_ms(80)
            
            # Read data (7 bytes: 1 status + 2 humidity + 2 temperature + 1 CRC)
            data = self.i2c.readfrom(self.DHT20_I2C_ADDR, 7)
            
            # Check status
            if (data[0] & 0x80) == 0x80:
                # Sensor is busy, not ready yet
                return None, None
            
            # Check CRC
            if not self._crc8_check(data):
                print("DHT20: CRC check failed")
                return None, None
            
            # Calculate humidity (20-bit value)
            humidity_raw = ((data[1] & 0x0F) << 16) | (data[2] << 8) | data[3]
            humidity = humidity_raw / 1048576.0 * 100  # Convert to percentage
            
            # Calculate temperature (20-bit value)
            temp_raw = ((data[1] & 0xF0) >> 4) | (data[4] << 4) | (data[5] << 12)
            temp = temp_raw / 1048576.0 * 200 - 50  # Convert to Celsius
            
            # Round to 1 decimal place
            humidity = round(humidity, 1)
            temp = round(temp, 1)
            
            return temp, humidity
        
        except Exception as e:
            print(f"DHT20 read error: {e}")
            return None, None