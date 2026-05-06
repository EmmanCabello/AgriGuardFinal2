-- AgriGuard Database Schema

-- Create database
CREATE DATABASE AgriGuard;

-- Use database
USE AgriGuard;

-- Weather table
CREATE TABLE Weather (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    temperature VARCHAR(10),
    humidity VARCHAR(10),
    rainfall VARCHAR(10)
);

-- Crop table
CREATE TABLE Crop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    yield VARCHAR(100)
);

-- Alert table
CREATE TABLE Alert (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(20),
    message TEXT,
    date DATE
);

-- Weather Sensor table
CREATE TABLE WeatherSensor (
    id VARCHAR(10) PRIMARY KEY,
    location VARCHAR(50),
    temperature VARCHAR(10),
    humidity VARCHAR(10),
    windSpeed VARCHAR(10),
    lastUpdate DATETIME
);

-- Pest Sensor table
CREATE TABLE PestSensor (
    id VARCHAR(10) PRIMARY KEY,
    location VARCHAR(50),
    pestType VARCHAR(50),
    detectionLevel VARCHAR(20),
    status VARCHAR(20),
    lastUpdate DATETIME
);

-- Marketplace table
CREATE TABLE Marketplace (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    unit VARCHAR(20),
    seller VARCHAR(100)
);

-- Insert sample data
INSERT INTO Weather (date, temperature, humidity, rainfall) VALUES
('2023-10-01', '25°C', '60%', '0mm'),
('2023-10-02', '22°C', '65%', '5mm'),
('2023-10-03', '28°C', '55%', '2mm'),
('2023-10-04', '24°C', '70%', '10mm'),
('2023-10-05', '26°C', '58%', '0mm');

INSERT INTO Crop (name, status, yield) VALUES
('Wheat', 'Healthy', 'Expected 50 tons'),
('Corn', 'Needs Water', 'Expected 40 tons'),
('Rice', 'Healthy', 'Expected 60 tons');

INSERT INTO Alert (type, message, date) VALUES
('Warning', 'Low soil moisture detected in field 3', '2023-10-01'),
('Info', 'Scheduled irrigation completed', '2023-10-04'),
('Warning', 'High temperature alert for wheat field', '2023-10-05');

INSERT INTO WeatherSensor (id, location, temperature, humidity, windSpeed, lastUpdate) VALUES
('WS001', 'Field A', '25°C', '65%', '12 km/h', '2023-10-05 14:30:00'),
('WS002', 'Field B', '26°C', '58%', '8 km/h', '2023-10-05 14:28:00');

INSERT INTO PestSensor (id, location, pestType, detectionLevel, status, lastUpdate) VALUES
('PS001', 'Field A', 'Aphids', 'Low', 'Normal', '2023-10-05 14:25:00'),
('PS002', 'Field B', 'Corn Borer', 'Medium', 'Warning', '2023-10-05 14:20:00');

INSERT INTO Marketplace (name, description, price, unit, seller) VALUES
('Wheat', 'Premium quality wheat grains for sale', 1450.00, 'kg', 'FarmFresh Co.'),
('Corn', 'Fresh corn kernels ready for market', 1044.00, 'kg', 'Golden Harvest'),
('Rice', 'High-quality rice grains from local farms', 1276.00, 'kg', 'RiceLand Agri');

-- Sample queries
-- Get all weather data
SELECT * FROM Weather;

-- Get crops that need attention
SELECT * FROM Crop WHERE status != 'Healthy';

-- Get recent alerts
SELECT * FROM Alert WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);