-- Create database if not exists
CREATE DATABASE IF NOT EXISTS aws_costs;
USE aws_costs;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'aws_user'@'%' IDENTIFIED BY 'AppUser2024!Database#5621';
GRANT ALL PRIVILEGES ON aws_costs.* TO 'aws_user'@'%';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    last_login TIMESTAMP NULL,
    last_seen TIMESTAMP NULL,
    created_by_admin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);