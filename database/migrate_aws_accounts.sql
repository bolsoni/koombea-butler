-- Create AWS Accounts table
CREATE TABLE IF NOT EXISTS aws_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    aws_account_id VARCHAR(12) NOT NULL UNIQUE,
    access_key_id VARCHAR(20) NOT NULL,
    secret_access_key_encrypted TEXT NOT NULL,
    default_region VARCHAR(20) NOT NULL DEFAULT 'us-east-1',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_name (name),
    INDEX idx_aws_account_id (aws_account_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by),
    INDEX idx_default_region (default_region)
);

-- Add some sample data (optional - for testing)
-- Note: These are fake credentials for demonstration only
INSERT IGNORE INTO aws_accounts (
    name, 
    description, 
    aws_account_id, 
    access_key_id, 
    secret_access_key_encrypted, 
    default_region, 
    is_active, 
    created_by
) VALUES 
(
    'Demo Production Account',
    'Main production environment for demonstration',
    '123456789012',
    'AKIADEMO12345EXAMPLE',
    'gAAAAABhf1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL', -- Encrypted placeholder
    'us-east-1',
    TRUE,
    1
),
(
    'Demo Development Account',
    'Development and testing environment',
    '987654321098',
    'AKIATEST67890EXAMPLE',
    'gAAAAABhf9876543210zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQ', -- Encrypted placeholder
    'us-west-2',
    TRUE,
    1
);