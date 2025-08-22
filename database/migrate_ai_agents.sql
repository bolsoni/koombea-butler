-- Create AI Agent Configurations table
CREATE TABLE IF NOT EXISTS ai_agent_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    openai_api_key_encrypted TEXT NOT NULL,
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    prompt_template TEXT NOT NULL,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_name (name),
    INDEX idx_is_active (is_active),
    INDEX idx_is_default (is_default),
    INDEX idx_created_by (created_by)
);