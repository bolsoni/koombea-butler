# Butler - Intelligent Cloud Cost Optimization Platform

Butler is a comprehensive AWS cost management and optimization platform developed by Koombea. It provides real-time cost analytics, AI-powered insights, and automated recommendations to help organizations optimize their cloud spending.

## Overview

Butler connects to your AWS accounts through secure API integrations to analyze spending patterns, identify cost optimization opportunities, and provide actionable recommendations. The platform leverages multiple AI providers to generate intelligent cost optimization strategies tailored to your specific infrastructure.

## Key Features

- **Real-time Cost Analytics**: Monitor AWS spending across multiple accounts with live dashboards
- **AI-Powered Insights**: Automated cost analysis using OpenAI, Anthropic Claude, and Google Gemini
- **Multi-Account Security**: Secure management of multiple AWS accounts with encrypted credentials
- **Resource Optimization**: Identify underutilized resources and rightsizing opportunities
- **Cost Forecasting**: Predict future spending trends with confidence intervals
- **Detailed Reporting**: Generate comprehensive PDF reports with cost breakdowns
- **Smart Recommendations**: Get specific, actionable advice for reducing AWS costs

## System Architecture

Butler follows a modern containerized architecture:

- **Frontend**: React 18 application with Material-UI components
- **Backend**: FastAPI (Python) REST API with comprehensive AWS integrations
- **Database**: MySQL 8.0 for data persistence
- **Reverse Proxy**: Nginx with SSL termination and rate limiting
- **Containerization**: Docker Compose for orchestration

## System Requirements

### Development Environment
- Docker 20.0+ and Docker Compose 2.0+
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Production Environment
- Linux server with Docker support
- Minimum 4GB RAM, 2 CPU cores
- 20GB+ available storage
- SSL certificate (Let's Encrypt recommended)

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **UI Library**: Material-UI 5.15.10
- **Routing**: React Router 6.21.3
- **Charts**: Recharts 2.10.3
- **Build Tool**: React Scripts 5.0.1

### Backend
- **Framework**: FastAPI
- **Runtime**: Python 3.11
- **Database ORM**: SQLAlchemy 2.0.23
- **Authentication**: JWT with bcrypt
- **AWS Integration**: Boto3 1.34.0
- **AI Integrations**: OpenAI, Anthropic, Google Generative AI
- **Report Generation**: ReportLab 4.0.4

### Infrastructure
- **Database**: MySQL 8.0
- **Web Server**: Nginx (Alpine)
- **Containerization**: Docker with multi-stage builds
- **SSL**: Let's Encrypt with automatic renewal

## Installation

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd butler
   ```

2. **Generate secure keys**
   ```bash
   cd backend
   python generate_keys.py
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   MYSQL_ROOT_PASSWORD=your_secure_root_password
   MYSQL_PASSWORD=your_secure_user_password
   DATABASE_URL=mysql+pymysql://aws_user:your_secure_user_password@mysql:3306/aws_costs
   
   # Security Keys (generated from step 2)
   JWT_SECRET=your_generated_jwt_secret
   ENCRYPTION_KEY=your_generated_encryption_key
   
   # Optional: AI Provider API Keys
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Deploy the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Development: http://localhost
   - Production: https://butler.koombea.ai

### SSL Setup for Production

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot
   ```

2. **Generate SSL certificate**
   ```bash
   sudo certbot certonly --standalone -d butler.koombea.ai
   ```

3. **Update nginx configuration**
   Ensure your domain is correctly configured in `nginx/nginx.conf`

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MySQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `ENCRYPTION_KEY` | Fernet encryption key | Yes | - |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | Yes | - |
| `MYSQL_PASSWORD` | MySQL user password | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | No | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | No | - |
| `GEMINI_API_KEY` | Google Gemini API key | No | - |
| `ENV` | Environment mode | No | `development` |
| `DEBUG` | Debug mode | No | `false` |

### AWS Permissions

Butler requires the following AWS IAM permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ce:GetCostAndUsage",
                "ce:GetUsageForecast",
                "ce:GetReservationCoverage",
                "ce:GetReservationPurchaseRecommendation",
                "ce:GetReservationUtilization",
                "ce:GetRightsizingRecommendation",
                "ce:ListCostCategoryDefinitions",
                "ce:GetDimensionValues"
            ],
            "Resource": "*"
        }
    ]
}
```

## Usage

### Adding AWS Accounts

1. Navigate to **Settings > AWS Accounts**
2. Click **Add Account**
3. Provide:
   - Account name and ID
   - Access Key ID and Secret Access Key
   - Default region (us-east-1 recommended for Cost Explorer)

### Viewing Cost Analytics

1. **Dashboard**: Real-time overview of costs and trends
2. **Cost Explorer**: Detailed cost analysis with filtering
3. **Reports**: Generate and download PDF reports
4. **Recommendations**: AI-powered optimization suggestions

### AI-Powered Analysis

Butler supports multiple AI providers for cost analysis:

- **OpenAI GPT**: Advanced natural language recommendations
- **Anthropic Claude**: Detailed technical analysis
- **Google Gemini**: Alternative AI insights

Configure API keys in the AI Agent settings to enable intelligent recommendations.

## API Documentation

The backend provides a comprehensive REST API. Key endpoints include:

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh

### Accounts Management
- `GET /accounts` - List AWS accounts
- `POST /accounts` - Add new AWS account
- `PUT /accounts/{id}` - Update account
- `DELETE /accounts/{id}` - Delete account

### Cost Explorer
- `GET /cost-explorer/accounts/{id}/trends` - Get cost trends
- `GET /cost-explorer/accounts/{id}/detailed` - Detailed cost breakdown
- `GET /cost-explorer/accounts/{id}/forecast` - Cost forecasting
- `GET /cost-explorer/accounts/{id}/recommendations` - AI recommendations

### Reports
- `POST /cost-explorer/accounts/{id}/report` - Generate PDF report

## Development

### Local Development Setup

1. **Backend development**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend development**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database setup**
   ```bash
   docker-compose up mysql -d
   ```

### Code Structure

```
butler/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   └── generate_keys.py    # Security key generator
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Frontend container
├── nginx/                 # Reverse proxy configuration
│   └── nginx.conf         # Nginx configuration
├── database/              # Database schema
│   └── aws_costs.sql      # Initial schema
└── docker-compose.yaml    # Container orchestration
```

## Monitoring and Maintenance

### Health Checks

All containers include health checks:
- **Backend**: `GET /health`
- **Frontend**: HTTP status check on port 3000
- **Database**: MySQL ping
- **Nginx**: HTTP status check

### Logs

View container logs:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs mysql
```

### Backup

Regular database backups are recommended:
```bash
docker exec aws-costs-mysql mysqldump -u aws_user -p aws_costs > backup.sql
```

## Security Features

- **JWT Authentication**: Secure user sessions
- **Encrypted Storage**: AWS credentials encrypted at rest
- **Rate Limiting**: Login endpoint protection
- **HTTPS Only**: SSL/TLS encryption in production
- **Security Headers**: XSS and content security protection

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check MySQL container status
   - Ensure network connectivity

2. **AWS API Errors**
   - Verify AWS credentials and permissions
   - Check AWS service availability
   - Ensure Cost Explorer is enabled

3. **SSL Certificate Issues**
   - Verify domain DNS configuration
   - Check certificate expiration
   - Restart nginx container

### Support

For technical support and issues:
1. Check container logs for error details
2. Verify environment variable configuration
3. Ensure all required services are running
4. Review AWS IAM permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software owned by Koombea. All rights reserved.

## Version Information

- **Current Version**: 1.0.0
- **Node.js**: 18+
- **Python**: 3.11
- **MySQL**: 8.0
- **Docker**: 20.0+

---

**Butler** - Intelligent Cloud Cost Optimization Platform by Koombea
