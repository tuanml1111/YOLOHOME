-- Drop tables if they exist
DROP TABLE IF EXISTS sensor_logs;
DROP TABLE IF EXISTS device_logs;
DROP TABLE IF EXISTS equipped_with;
DROP TABLE IF EXISTS control;
DROP TABLE IF EXISTS alert;
DROP TABLE IF EXISTS alert_config;
DROP TABLE IF EXISTS configuration;
DROP TABLE IF EXISTS control_logs;
DROP TABLE IF EXISTS sensor_data;
DROP TABLE IF EXISTS sensor;
DROP TABLE IF EXISTS device;
DROP TABLE IF EXISTS users;

-- Table Users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR (50) UNIQUE NOT NULL,
  user_password VARCHAR (255) NOT NULL,
  email VARCHAR (100) UNIQUE NOT NULL
);

-- Table Devices: only 2 devices (Fan, Light), status = ON/OFF
CREATE TABLE device (
  device_id SERIAL PRIMARY KEY,
  device_name VARCHAR (100) NOT NULL CHECK (device_name IN ('Fan', 'Light')),
  device_type VARCHAR (50) NOT NULL,
  dlocation VARCHAR (100),
  status VARCHAR (3) CHECK (status IN ('ON', 'OFF')) DEFAULT 'OFF',
  adafruit_value INT CHECK (adafruit_value IN (0, 1)) DEFAULT 0, -- Added field for Adafruit numeric value
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Sensors
CREATE TABLE sensor (
  sensor_id SERIAL PRIMARY KEY,
  sensor_type VARCHAR (50) NOT NULL,
  model VARCHAR (50),
  unit VARCHAR (20),
  description TEXT
);

-- Sensor Data
CREATE TABLE sensor_data (
  data_id SERIAL PRIMARY KEY,
  sensor_id INT NOT NULL,
  svalue FLOAT NOT NULL,
  recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Control Logs
CREATE TABLE control_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  cl_action VARCHAR (3) CHECK (cl_action IN ('ON', 'OFF')) NOT NULL,
  adafruit_value INT CHECK (adafruit_value IN (0, 1)), -- Added to log the value sent to Adafruit
  description TEXT,
  executed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE
);

-- Configurations
CREATE TABLE configuration (
  config_id INT NOT NULL,
  sensor_id INT NOT NULL,
  cparameter VARCHAR (50) NOT NULL,
  cvalue VARCHAR (50) NOT NULL,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (config_id, sensor_id),
  FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Alert Config
CREATE TABLE alert_config (
  config_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  min_value FLOAT NOT NULL,
  max_value FLOAT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT unique_user_sensor_type UNIQUE (user_id, sensor_type)
);

-- Alerts
CREATE TABLE alert (
  alert_id SERIAL PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_id INT NOT NULL,
  alert_type VARCHAR (50) NOT NULL,
  amessage TEXT NOT NULL,
  alerted_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR (10) CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
  FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE,
  FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Control
CREATE TABLE control (
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  PRIMARY KEY (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE
);

-- Equipped with
CREATE TABLE equipped_with (
  device_id INT NOT NULL,
  sensor_id INT NOT NULL,
  PRIMARY KEY (device_id, sensor_id),
  FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE,
  FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Adafruit mapping - maps device types to Adafruit feed names
CREATE TABLE adafruit_mapping (
  mapping_id SERIAL PRIMARY KEY,
  device_type VARCHAR (50) NOT NULL,
  adafruit_feed VARCHAR (100) NOT NULL,
  UNIQUE (device_type)
);

-- Logs
CREATE TABLE device_logs (
  log_id SERIAL PRIMARY KEY,
  device_id INT REFERENCES device(device_id) ON DELETE CASCADE
);

CREATE TABLE sensor_logs (
  log_id SERIAL PRIMARY KEY,
  sensor_id INT REFERENCES sensor(sensor_id) ON DELETE CASCADE
);

-- Insert initial user
INSERT INTO users (user_id, username, user_password, email)
VALUES (
  1,
  'admin',
  '$2a$10$/TCFfdNZcQBSf5RB2a5V3uGafrbunZB3OdvrwiBeT1lvrH6/FYOcG',
  'admin@example.com'
);

-- Insert 2 devices only: Fan, Light (with corresponding Adafruit values)
INSERT INTO device (device_name, device_type, dlocation, status, adafruit_value)
VALUES 
('Fan', 'fan', 'Living Room', 'OFF', 0),
('Light', 'light', 'Bedroom', 'OFF', 0);

-- Insert Adafruit feed mappings
INSERT INTO adafruit_mapping (device_type, adafruit_feed)
VALUES
('fan', 'dadn.fan'),
('light', 'dadn.light');

-- Sensors
INSERT INTO sensor (sensor_type, model, unit, description)
VALUES
('Temperature', 'TMP36', 'Celsius', 'Monitors temperature'),
('Light', 'LDR', 'Lux', 'Monitors light level');

-- Alert config
INSERT INTO alert_config (user_id, sensor_type, min_value, max_value, is_active)
VALUES
(1, 'Temperature', 18.0, 30.0, TRUE),
(1, 'Light', 200.0, 800.0, TRUE);

-- Equipped
INSERT INTO equipped_with (device_id, sensor_id)
VALUES
(1, 1), -- Fan - Temperature
(2, 2); -- Light - Light sensor

-- Sensor data
INSERT INTO sensor_data (sensor_id, svalue)
VALUES
(1, 26.5),
(2, 420.0);

-- Config
INSERT INTO configuration (config_id, sensor_id, cparameter, cvalue)
VALUES
(1, 1, 'Threshold', '30'),
(2, 2, 'BrightnessLimit', '700');

-- Alerts
INSERT INTO alert (device_id, sensor_id, alert_type, amessage)
VALUES
(1, 1, 'Overheat', 'Fan temperature is too high!'),
(2, 2, 'Too Bright', 'Light level exceeds threshold!');

-- Control ON/OFF
INSERT INTO control (user_id, device_id)
VALUES (1, 1), (1, 2);

-- Control logs with Adafruit values
INSERT INTO control_logs (user_id, device_id, cl_action, adafruit_value, description)
VALUES
(1, 1, 'ON', 1, 'Turned on fan'),
(1, 1, 'OFF', 0, 'Turned off fan'),
(1, 2, 'ON', 1, 'Turned on light'),
(1, 2, 'OFF', 0, 'Turned off light');

-- Logs
INSERT INTO device_logs (log_id, device_id)
VALUES (1, 1), (2, 1), (3, 2), (4, 2);

INSERT INTO sensor_logs (log_id, sensor_id)
VALUES (1, 1), (2, 1), (3, 2), (4, 2);