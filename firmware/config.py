"""
YoloHome - Configuration settings
"""

# WiFi Configuration
WIFI_SSID = "YourWiFiName"
WIFI_PASSWORD = "YourWiFiPassword"

# MQTT Configuration
MQTT_SERVER = "your-mqtt-broker.local"  # E.g., broker.emqx.io or IP address
MQTT_PORT = 1883
MQTT_CLIENT_ID = "yolohome"
MQTT_USER = ""  # Leave empty if authentication not required
MQTT_PASSWORD = ""  # Leave empty if authentication not required

# Device Configuration
DEVICE_ID = "yolobit1"  # Unique ID for this device

# Sensor thresholds
TEMPERATURE_THRESHOLD = 30.0  # Celsius
HUMIDITY_LOW_THRESHOLD = 30.0  # Percent
HUMIDITY_HIGH_THRESHOLD = 70.0  # Percent
LIGHT_THRESHOLD = 500  # Analog value (0-1023)

# Data collection interval (milliseconds)
SENSOR_READ_INTERVAL = 10000  # 10 seconds