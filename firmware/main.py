"""
YoloHome - Smart Home System
Main firmware for Yolo:Bit controller
"""
import time
import json
import gc
from machine import Pin, Timer
import network
from mqtt_client import MQTTClient
from dht20 import DHT20
from pir import PIRSensor
from light_sensor import LightSensor
from relay import Relay
from led import RGB_LED
from config import (
    WIFI_SSID, 
    WIFI_PASSWORD, 
    MQTT_SERVER, 
    MQTT_PORT, 
    MQTT_CLIENT_ID,
    MQTT_USER,
    MQTT_PASSWORD,
    DEVICE_ID
)

# Initialize status LED
status_led = RGB_LED(15, 4)  # Pin 15, 4 LEDs
status_led.set_all(0, 0, 20)  # Blue: Starting up

# Initialize sensors
print("Initializing sensors...")
dht_sensor = DHT20(scl_pin=22, sda_pin=21)
pir_sensor = PIRSensor(pin=13)
light_sensor = LightSensor(pin=34)

# Initialize output devices
print("Initializing output devices...")
fan_relay = Relay(pin=26)
light_relay = Relay(pin=27)
door_relay = Relay(pin=25)

# Global variables
mqtt_client = None
wifi_connected = False
mqtt_connected = False
last_sensor_publish = 0
SENSOR_PUBLISH_INTERVAL = 10000  # 10 seconds
RECONNECT_INTERVAL = 5000  # 5 seconds
last_reconnect_attempt = 0

# Topics
SENSOR_TOPIC = f"yolohome/sensors/{DEVICE_ID}"
CONTROL_TOPIC = f"yolohome/devices/{DEVICE_ID}/control"
ALERT_TOPIC = "yolohome/alerts"

# Configure built-in button for manual control
button_a = Pin(0, Pin.IN, Pin.PULL_UP)  # Button A
button_b = Pin(35, Pin.IN, Pin.PULL_UP)  # Button B

# Thresholds for alerts
TEMP_HIGH_THRESHOLD = 30.0  # Celsius
HUMIDITY_LOW_THRESHOLD = 30.0  # Percent
HUMIDITY_HIGH_THRESHOLD = 70.0  # Percent

def connect_wifi():
    """Connect to WiFi network"""
    global wifi_connected
    
    status_led.set_all(20, 20, 0)  # Yellow: Connecting to WiFi
    
    print(f"Connecting to WiFi '{WIFI_SSID}'...")
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        
        # Wait for connection with timeout
        max_wait = 20
        while max_wait > 0:
            if wlan.isconnected():
                break
            max_wait -= 1
            print("Waiting for WiFi connection...")
            time.sleep(1)
    
    if wlan.isconnected():
        wifi_connected = True
        print(f"Connected to WiFi. IP: {wlan.ifconfig()[0]}")
        status_led.set_all(0, 20, 0)  # Green: WiFi connected
        return True
    else:
        wifi_connected = False
        print("Failed to connect to WiFi")
        status_led.set_all(20, 0, 0)  # Red: WiFi connection failed
        return False

def mqtt_callback(topic, msg):
    """Callback for received MQTT messages"""
    print(f"Received message on topic {topic}: {msg}")
    
    try:
        # Convert bytes to string and parse JSON
        topic_str = topic.decode('utf-8')
        msg_str = msg.decode('utf-8')
        payload = json.loads(msg_str)
        
        # Handle device control messages
        if topic_str == CONTROL_TOPIC:
            handle_control_message(payload)
    except Exception as e:
        print(f"Error processing message: {e}")

def handle_control_message(payload):
    """Handle device control messages"""
    try:
        device_type = payload.get('type')
        action = payload.get('action')
        
        if not device_type or not action:
            print("Missing type or action in control message")
            return
        
        # Convert action to boolean
        turn_on = (action.upper() == 'ON')
        
        # Control appropriate device
        if device_type == 'fan':
            fan_relay.set(turn_on)
            print(f"Fan {'ON' if turn_on else 'OFF'}")
        elif device_type == 'light':
            light_relay.set(turn_on)
            print(f"Light {'ON' if turn_on else 'OFF'}")
        elif device_type == 'door':
            door_relay.set(turn_on)
            print(f"Door {'UNLOCKED' if turn_on else 'LOCKED'}")
        else:
            print(f"Unknown device type: {device_type}")
    except Exception as e:
        print(f"Error handling control message: {e}")

def connect_mqtt():
    """Connect to MQTT broker"""
    global mqtt_client, mqtt_connected
    
    if not wifi_connected:
        print("WiFi not connected. Cannot connect to MQTT.")
        return False
    
    status_led.set_all(20, 0, 20)  # Purple: Connecting to MQTT
    
    try:
        # Create MQTT client instance
        client_id = f"{MQTT_CLIENT_ID}_{DEVICE_ID}"
        mqtt_client = MQTTClient(
            client_id, 
            MQTT_SERVER,
            port=MQTT_PORT,
            user=MQTT_USER,
            password=MQTT_PASSWORD,
            keepalive=30
        )
        
        # Set callback and connect
        mqtt_client.set_callback(mqtt_callback)
        mqtt_client.connect()
        
        # Subscribe to control topic
        mqtt_client.subscribe(CONTROL_TOPIC)
        
        mqtt_connected = True
        print("Connected to MQTT broker")
        status_led.set_all(0, 20, 0)  # Green: MQTT connected
        return True
    except Exception as e:
        mqtt_connected = False
        print(f"Failed to connect to MQTT: {e}")
        status_led.set_all(20, 0, 0)  # Red: MQTT connection failed
        return False

def publish_sensor_data():
    """Read sensor data and publish to MQTT"""
    if not mqtt_connected:
        print("MQTT not connected. Cannot publish data.")
        return
    
    try:
        # Read temperature and humidity
        temp, humidity = dht_sensor.read()
        
        # Read motion and light
        motion = pir_sensor.motion_detected()
        light = light_sensor.read()
        
        # Create data payload
        payload = {
            "device_id": DEVICE_ID,
            "timestamp": time.time(),
            "sensors": {
                "temperature": temp,
                "humidity": humidity,
                "motion": motion,
                "light": light
            },
            "status": {
                "fan": fan_relay.is_on(),
                "light": light_relay.is_on(),
                "door": door_relay.is_on()
            }
        }
        
        # Add alerts if thresholds exceeded
        alerts = []
        
        if temp is not None and temp > TEMP_HIGH_THRESHOLD:
            alerts.append({
                "type": "temperature",
                "value": temp,
                "message": f"Temperature above threshold: {temp}°C"
            })
            # Auto turn on fan if temperature is high
            if not fan_relay.is_on():
                fan_relay.set(True)
                print(f"Auto turning ON fan. Temperature: {temp}°C")
        
        if humidity is not None:
            if humidity < HUMIDITY_LOW_THRESHOLD:
                alerts.append({
                    "type": "humidity",
                    "value": humidity,
                    "message": f"Humidity below threshold: {humidity}%"
                })
            elif humidity > HUMIDITY_HIGH_THRESHOLD:
                alerts.append({
                    "type": "humidity",
                    "value": humidity,
                    "message": f"Humidity above threshold: {humidity}%"
                })
        
        if motion:
            alerts.append({
                "type": "motion",
                "value": 1,
                "message": "Motion detected"
            })
        
        if alerts:
            payload["alerts"] = alerts
        
        # Publish data
        mqtt_client.publish(SENSOR_TOPIC, json.dumps(payload))
        print(f"Published sensor data: Temp={temp}°C, Humidity={humidity}%, Motion={motion}, Light={light}")
        
        # Send alerts if any
        if alerts:
            for alert in alerts:
                alert_payload = {
                    "device_id": DEVICE_ID,
                    "sensor_id": alert["type"],
                    "type": alert["type"],
                    "message": alert["message"],
                    "timestamp": time.time()
                }
                mqtt_client.publish(ALERT_TOPIC, json.dumps(alert_payload))
                print(f"Published alert: {alert['message']}")
        
    except Exception as e:
        print(f"Error publishing sensor data: {e}")

def check_connections():
    """Check WiFi and MQTT connections and reconnect if needed"""
    global last_reconnect_attempt
    
    current_time = time.ticks_ms()
    
    # Only attempt reconnection if enough time has passed
    if time.ticks_diff(current_time, last_reconnect_attempt) < RECONNECT_INTERVAL:
        return
    
    last_reconnect_attempt = current_time
    
    # Check WiFi connection
    if not wifi_connected:
        connect_wifi()
    
    # Check MQTT connection
    if wifi_connected and not mqtt_connected:
        connect_mqtt()

def button_a_handler(pin):
    """Handle button A press (toggle fan)"""
    # Debounce
    time.sleep_ms(50)
    if not button_a.value():  # Button is pressed (active low)
        print("Button A pressed: Toggle fan")
        fan_relay.toggle()

def button_b_handler(pin):
    """Handle button B press (toggle light)"""
    # Debounce
    time.sleep_ms(50)
    if not button_b.value():  # Button is pressed (active low)
        print("Button B pressed: Toggle light")
        light_relay.toggle()

def main():
    """Main function"""
    global last_sensor_publish
    
    # Initial setup
    print("\nYoloHome - Smart Home System")
    print("Initializing...")
    
    # Connect to WiFi
    connect_wifi()
    
    # Connect to MQTT broker
    if wifi_connected:
        connect_mqtt()
    
    # Set up button interrupts
    button_a.irq(trigger=Pin.IRQ_FALLING, handler=button_a_handler)
    button_b.irq(trigger=Pin.IRQ_FALLING, handler=button_b_handler)
    
    print("Setup complete. Running main loop...")
    
    # Main loop
    while True:
        try:
            # Check connections
            check_connections()
            
            # Check for MQTT messages
            if mqtt_connected:
                mqtt_client.check_msg()
            
            # Publish sensor data at intervals
            current_time = time.ticks_ms()
            if time.ticks_diff(current_time, last_sensor_publish) >= SENSOR_PUBLISH_INTERVAL:
                if mqtt_connected:
                    publish_sensor_data()
                last_sensor_publish = current_time
            
            # Garbage collection
            gc.collect()
            
            # Sleep to prevent CPU overuse
            time.sleep_ms(100)
            
        except Exception as e:
            print(f"Error in main loop: {e}")
            time.sleep(5)  # Wait before retrying

# Run the main function
if __name__ == "__main__":
    main()