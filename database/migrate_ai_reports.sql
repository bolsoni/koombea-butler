-- Create AI Reports table
CREATE TABLE IF NOT EXISTS ai_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aws_account_id INT NOT NULL,
    ai_agent_id INT NOT NULL,
    owner_id INT NOT NULL,
    
    -- Analysis details
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    recommendations TEXT NOT NULL,
    
    -- Metrics
    estimated_savings DECIMAL(15, 2) DEFAULT 0.00,
    confidence_score DECIMAL(3, 2) DEFAULT 0.00,
    tokens_used INT DEFAULT 0,
    
    -- Additional metadata
    total_cost_analyzed DECIMAL(15, 2) DEFAULT 0.00,
    services_analyzed INT DEFAULT 0,
    rightsizing_opportunities INT DEFAULT 0,
    
    -- Status and tracking
    report_status ENUM('completed', 'failed', 'processing') DEFAULT 'completed',
    generation_time_seconds DECIMAL(5, 2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (ai_agent_id) REFERENCES ai_agent_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_aws_account_id (aws_account_id),
    INDEX idx_owner_id (owner_id),
    INDEX idx_ai_agent_id (ai_agent_id),
    INDEX idx_created_at (created_at),
    INDEX idx_analysis_period (analysis_period_start, analysis_period_end),
    INDEX idx_estimated_savings (estimated_savings),
    
    -- Composite indexes for common queries
    INDEX idx_account_owner (aws_account_id, owner_id),
    INDEX idx_account_date (aws_account_id, created_at)
);