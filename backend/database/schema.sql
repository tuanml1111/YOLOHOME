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

-- Table AlertConfig : User-defined alert thresholds
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
ALTER TABLE sensor_data ADD CONSTRAINT fk_sensor_data FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE;
ALTER TABLE control_logs ADD CONSTRAINT fk_control_logs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE control_logs ADD CONSTRAINT fk_control_logs_device FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE;
ALTER TABLE configuration ADD CONSTRAINT fk_configuration_sensor FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE;
ALTER TABLE alert ADD CONSTRAINT fk_alert_device FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE;
ALTER TABLE alert ADD CONSTRAINT fk_alert_sensor FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE;
ALTER TABLE control ADD CONSTRAINT fk_control_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE control ADD CONSTRAINT fk_control_device FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE;
ALTER TABLE equipped_with ADD CONSTRAINT fk_equipped_with_device FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE;
ALTER TABLE equipped_with ADD CONSTRAINT fk_equipped_with_sensor FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE;
ALTER TABLE device_logs ADD CONSTRAINT fk_device_logs FOREIGN KEY (log_id) REFERENCES control_logs(log_id) ON DELETE CASCADE;
ALTER TABLE device_logs ADD CONSTRAINT fk_device_logs_device FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE;
ALTER TABLE sensor_logs ADD CONSTRAINT fk_sensor_logs FOREIGN KEY (log_id) REFERENCES control_logs(log_id) ON DELETE CASCADE;
ALTER TABLE sensor_logs ADD CONSTRAINT fk_sensor_logs_sensor FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id) ON DELETE CASCADE;

-- Insert initial data

-- Create default admin user
INSERT INTO users (user_id, username, user_password, email)
VALUES (
  1,
  'admin',
  -- Password: 'tuan' hashed with bcrypt
  '$2a$10$/TCFfdNZcQBSf5RB2a5V3uGafrbunZB3OdvrwiBeT1lvrH6/FYOcG',
  'admin@example.com'
);

-- Insert default alert configurations for admin user
INSERT INTO alert_config (user_id, sensor_type, min_value, max_value, is_active) 
VALUES
(1, 'temperature', 18.0, 30.0, true),
(1, 'humidity', 30.0, 70.0, true);

-- Thêm dữ liệu vào bảng Devices
INSERT INTO device (device_name, device_type, dlocation) VALUES
('Smart Light', 'Lighting', 'Living Room'),
('Thermostat', 'Temperature Control', 'Bedroom'),
('Camera', 'Security', 'Front Door'),
('Air Purifier', 'Air Quality', 'Office'),
('Smart Lock', 'Security', 'Main Entrance');

-- Thêm dữ liệu vào bảng Sensors
INSERT INTO sensor (sensor_type, model, unit, description) VALUES
('Temperature', 'TMP36', 'Celsius', 'Temperature sensor for room monitoring'),
('Humidity', 'DHT22', 'Percentage', 'Humidity sensor for environment control'),
('Motion', 'PIR Sensor', 'Boolean', 'Detects movement'),
('Air Quality', 'MQ135', 'PPM', 'Measures air quality index'),
('Light', 'LDR', 'Lux', 'Measures ambient light intensity');

-- Thêm dữ liệu vào bảng Configurations
INSERT INTO configuration (config_id, sensor_id, cparameter, cvalue) VALUES
(1, 1, 'Threshold', '30'),
(2, 2, 'MinHumidity', '40'),
(3, 3, 'Sensitivity', 'High'),
(4, 4, 'AQI Limit', '200'),
(5, 5, 'Light Level', '300');

-- Thêm dữ liệu vào bảng Alerts
INSERT INTO alert (device_id, sensor_id, alert_type, amessage) VALUES
(1, 1, 'Overheat', 'Temperature exceeded threshold!'),
(2, 2, 'Low Humidity', 'Humidity dropped below minimum!');

-- Thêm dữ liệu vào bảng Control
INSERT INTO control (user_id, device_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- Thêm dữ liệu vào bảng Equipped_with
INSERT INTO equipped_with (device_id, sensor_id) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1);

-- Thêm dữ liệu vào bảng Device_logs
INSERT INTO device_logs (log_id, device_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5);

-- Thêm dữ liệu vào bảng Sensor_logs
INSERT INTO sensor_logs (log_id, sensor_id) VALUES
(1, 1), (2, 2), (1, 3), (1, 4), (1, 5);

-- Thêm dữ liệu vào bảng SensorData
INSERT INTO sensor_data (sensor_id, svalue) VALUES
(1, 25.5),
(2, 60.2),
(3, 1.0),
(4, 150.3),
(5, 500.0);

-- Thêm dữ liệu vào bảng ControlLogs
INSERT INTO control_logs (user_id, device_id, cl_action, description) VALUES
(1, 1, 'Turn On', 'Turned on smart light'),
(1, 2, 'Adjust Temperature', 'Set thermostat to 22°C'),
(1, 3, 'Enable Security', 'Activated security camera'),
(1, 4, 'Start Purifier', 'Turned on air purifier'),
(1, 5, 'Lock Door', 'Locked the main entrance smart lock');
