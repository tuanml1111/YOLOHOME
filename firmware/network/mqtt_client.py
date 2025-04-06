"""
MQTT Client wrapper for MicroPython
"""
from umqtt.simple import MQTTClient as SimpleMQTTClient
import time

class MQTTClient:
    """Wrapper around SimpleMQTTClient with enhanced functionality"""
    
    def __init__(self, client_id, server, port=1883, user=None, password=None, keepalive=60):
        """Initialize MQTT client"""
        self.client_id = client_id
        self.server = server
        self.port = port
        self.user = user
        self.password = password
        self.keepalive = keepalive
        self.client = None
        self.last_ping = 0
        self.ping_interval = keepalive * 1000 // 2  # Half the keepalive in ms
        self.callback = None
    
    def connect(self):
        """Connect to MQTT broker"""
        self.client = SimpleMQTTClient(
            self.client_id, 
            self.server, 
            self.port, 
            self.user, 
            self.password,
            self.keepalive
        )
        
        if self.callback:
            self.client.set_callback(self.callback)
        
        self.client.connect()
        self.last_ping = time.ticks_ms()
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.disconnect()
    
    def reconnect(self):
        """Reconnect to MQTT broker"""
        try:
            self.disconnect()
        except:
            pass
        
        self.connect()
    
    def set_callback(self, callback):
        """Set callback for received messages"""
        self.callback = callback
        if self.client:
            self.client.set_callback(callback)
    
    def publish(self, topic, message):
        """Publish message to topic"""
        return self.client.publish(topic, message)
    
    def subscribe(self, topic):
        """Subscribe to topic"""
        return self.client.subscribe(topic)
    
    def check_msg(self):
        """Check for messages and maintain connection"""
        # Check for messages
        self.client.check_msg()
        
        # Ping to keep connection alive
        current_time = time.ticks_ms()
        if time.ticks_diff(current_time, self.last_ping) >= self.ping_interval:
            self.client.ping()
            self.last_ping = current_time