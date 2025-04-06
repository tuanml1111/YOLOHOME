"""
Relay control module
"""
from machine import Pin

class Relay:
    """
    Relay control class
    """
    def __init__(self, pin, active_high=True):
        """Initialize relay"""
        self.pin = Pin(pin, Pin.OUT)
        self.active_high = active_high
        self.state = False
        
        # Initialize to OFF state
        self.set(False)
    
    def set(self, state):
        """Set relay state (True=ON, False=OFF)"""
        self.state = state
        if self.active_high:
            self.pin.value(1 if state else 0)
        else:
            self.pin.value(0 if state else 1)
    
    def on(self):
        """Turn relay ON"""
        self.set(True)
    
    def off(self):
        """Turn relay OFF"""
        self.set(False)
    
    def toggle(self):
        """Toggle relay state"""
        self.set(not self.state)
    
    def is_on(self):
        """Check if relay is ON"""
        return self.state