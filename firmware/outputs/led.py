"""
RGB LED control module using NeoPixel
"""
import neopixel
from machine import Pin

class RGB_LED:
    """
    RGB LED control using NeoPixel
    """
    def __init__(self, pin, num_leds=1):
        """Initialize RGB LED"""
        self.num_leds = num_leds
        self.np = neopixel.NeoPixel(Pin(pin), num_leds)
    
    def set_pixel(self, n, r, g, b):
        """Set color of specific pixel"""
        if 0 <= n < self.num_leds:
            self.np[n] = (r, g, b)
            self.np.write()
    
    def set_all(self, r, g, b):
        """Set all pixels to same color"""
        for i in range(self.num_leds):
            self.np[i] = (r, g, b)
        self.np.write()
    
    def clear(self):
        """Turn off all pixels"""
        self.set_all(0, 0, 0)
    
    def red(self, brightness=50):
        """Set color to red"""
        self.set_all(brightness, 0, 0)
    
    def green(self, brightness=50):
        """Set color to green"""
        self.set_all(0, brightness, 0)
    
    def blue(self, brightness=50):
        """Set color to blue"""
        self.set_all(0, 0, brightness)
    
    def yellow(self, brightness=50):
        """Set color to yellow"""
        self.set_all(brightness, brightness, 0)
    
    def purple(self, brightness=50):
        """Set color to purple"""
        self.set_all(brightness, 0, brightness)
    
    def cyan(self, brightness=50):
        """Set color to cyan"""
        self.set_all(0, brightness, brightness)
    
    def white(self, brightness=50):
        """Set color to white"""
        self.set_all(brightness, brightness, brightness)