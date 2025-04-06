"""
Light Sensor (LDR) Driver
"""
from machine import ADC, Pin

class LightSensor:
    """
    Light Sensor (LDR) using ADC
    """
    def __init__(self, pin=34, atten=ADC.ATTN_11DB):
        """Initialize sensor"""
        self.adc = ADC(Pin(pin))
        self.adc.atten(atten)  # Set attenuation (0-3.3V range)
        self.max_value = 4095  # 12-bit ADC
    
    def read(self):
        """Read raw ADC value (0-4095)"""
        return self.adc.read()
    
    def read_percentage(self):
        """Read light level as percentage (0-100%)"""
        raw = self.read()
        # Invert value as higher resistance = lower light
        # Map 0-4095 to 0-100%
        return round(100 - (raw * 100 / self.max_value))
    
    def is_dark(self, threshold=2000):
        """Check if it's dark (below threshold)"""
        return self.read() > threshold
    
    def is_bright(self, threshold=1000):
        """Check if it's bright (above threshold)"""
        return self.read() < threshold