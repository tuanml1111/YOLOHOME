-- Drop tables if they exist
DROP TABLE IF EXISTS sensor_logs;
DROP TABLE IF EXISTS device_logs;
DROP TABLE IF EXISTS equipped_with;
DROP TABLE IF EXISTS control;
DROP TABLE IF EXISTS alert;
DROP TABLE IF EXISTS configuration;
DROP TABLE IF EXISTS control_logs;
DROP TABLE IF EXISTS sensor_data;
DROP TABLE IF EXISTS sensor;
DROP TABLE IF EXISTS device;
DROP TABLE IF EXISTS users;

-- Table Users : Save user information
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR (50) UNIQUE NOT NULL,
  user_password VARCHAR (255) NOT NULL,
  email VARCHAR (100) UNIQUE NOT NULL
);

-- Table Devices : Save equipment information
CREATE TABLE device (
  device_id SERIAL PRIMARY KEY,
  device_name VARCHAR (100) NOT NULL,
  device_type VARCHAR (50) NOT NULL,
  dlocation VARCHAR (100),
  status VARCHAR (10) CHECK ( status IN ( 'active', 'inactive' ) ) DEFAULT 'inactive',
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Sensors : Sensing sensor information (each device has many sensors)
CREATE TABLE sensor (
  sensor_id SERIAL PRIMARY KEY,
  sensor_type VARCHAR (50) NOT NULL,
  model VARCHAR (50),
  unit VARCHAR (20),
  description TEXT
);

-- Table SensorData : Save data measured from the sensor
CREATE TABLE sensor_data (
  data_id SERIAL PRIMARY KEY,
  sensor_id INT NOT NULL,
  svalue FLOAT NOT NULL,
  recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES sensor (sensor_id) ON DELETE CASCADE
);

-- Table Controllogs : Save device control history
CREATE TABLE control_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  cl_action VARCHAR (50) NOT NULL,
  description TEXT,
  executed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES device (device_id) ON DELETE CASCADE
);

-- Table Configurations : The weak entity of the sensors (configuration)
CREATE TABLE configuration (
  config_id INT NOT NULL,
  sensor_id INT NOT NULL,
  cparameter VARCHAR (50) NOT NULL,
  cvalue VARCHAR (50) NOT NULL,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (config_id, sensor_id),
  FOREIGN KEY (sensor_id) REFERENCES sensor (sensor_id) ON DELETE CASCADE
);

-- Table Alerts : Warning information
CREATE TABLE alert (
  alert_id SERIAL PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_id INT NOT NULL,
  alert_type VARCHAR (50) NOT NULL,
  amessage TEXT NOT NULL,
  alerted_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR (10) CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
  FOREIGN KEY (device_id) REFERENCES device (device_id) ON DELETE CASCADE,
  FOREIGN KEY (sensor_id) REFERENCES sensor (sensor_id) ON DELETE CASCADE
);

-- Table Control : Save equipment information controlled by users
CREATE TABLE control (
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  PRIMARY KEY (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES device (device_id) ON DELETE CASCADE
);

-- Table Equipped_with : Determine which device is equipped
CREATE TABLE equipped_with (
  device_id INT NOT NULL,
  sensor_id INT NOT NULL,
  PRIMARY KEY (device_id, sensor_id),
  FOREIGN KEY (device_id) REFERENCES device (device_id) ON DELETE CASCADE,
  FOREIGN KEY (sensor_id) REFERENCES sensor (sensor_id) ON DELETE CASCADE
);

CREATE TABLE device_logs (
  log_id SERIAL PRIMARY KEY,
  device_id INT REFERENCES device (device_id) ON DELETE CASCADE,
  FOREIGN KEY (log_id) REFERENCES control_logs (log_id) ON DELETE CASCADE
);

CREATE TABLE sensor_logs (
  log_id SERIAL PRIMARY KEY,
  sensor_id INT REFERENCES sensor (sensor_id) ON DELETE CASCADE,
  FOREIGN KEY (log_id) REFERENCES control_logs (log_id) ON DELETE CASCADE
);

-- Insert initial data

-- Create default admin user
INSERT INTO users (username, user_password, email)
VALUES (
  'admin',
  -- Password: 'tuan' hashed with bcrypt
  '$2a$10$mFZqKVX5WTp8YK1p1RNKIeUb8Vp1wEjO5LYvgzHXvrvEzFBU3HHPG',
  'admin@example.com'
);

-- Create default sensors
INSERT INTO sensor (sensor_type, model, unit, description)
VALUES
  ('temperature', 'DHT20', '°C', 'Temperature sensor'),
  ('humidity', 'DHT20', '%', 'Humidity sensor'),
  ('motion', 'PIR', 'boolean', 'Motion detection sensor'),
  ('light', 'LDR', 'lux', 'Light intensity sensor');

-- Create default devices
INSERT INTO device (device_name, device_type, dlocation, status)
VALUES
  ('Living Room Light', 'light', 'Living Room', 'inactive'),
  ('Bedroom Fan', 'fan', 'Bedroom', 'inactive'),
  ('Kitchen Light', 'light', 'Kitchen', 'inactive'),
  ('Front Door Lock', 'lock', 'Front Door', 'active');

-- Link devices with sensors
INSERT INTO equipped_with (device_id, sensor_id)
VALUES
  (1, 4), -- Living Room Light with light sensor
  (2, 1), -- Bedroom Fan with temperature sensor
  (2, 2), -- Bedroom Fan with humidity sensor
  (3, 4), -- Kitchen Light with light sensor
  (4, 3); -- Front Door Lock with motion sensor