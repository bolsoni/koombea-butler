# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Literal
import jwt
import bcrypt
import os
from contextlib import contextmanager
from cryptography.fernet import Fernet
import base64
import openai
import anthropic
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from decimal import Decimal
import json
import csv
import io
import time
import logging
import traceback
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import tempfile
from dotenv import load_dotenv
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))

# Secure encryption key management
def get_encryption_key():
    """Get encryption key from environment or generate a secure one"""
    key_b64 = os.getenv('ENCRYPTION_KEY')
    if key_b64:
        try:
            # Validate the key
            key = base64.urlsafe_b64decode(key_b64)
            if len(key) != 32:
                raise ValueError("Encryption key must be 32 bytes")
            return key_b64
        except Exception as e:
            logger.error(f"Invalid ENCRYPTION_KEY in environment: {e}")
            # Fallback para desenvolvimento
            if os.getenv('ENV') != 'production':
                logger.warning("Using fallback encryption key for development")
                return generate_fallback_key()
            raise ValueError("Invalid ENCRYPTION_KEY format")
    else:
        # In production, this should never happen - key should be pre-generated
        if os.getenv('ENV') == 'production':
            raise ValueError("ENCRYPTION_KEY environment variable is required in production")
        
        # For development only - generate a secure random key
        logger.warning("Generating temporary encryption key for development")
        return generate_fallback_key()

def generate_fallback_key():
    """Generate fallback key for development (consistent seed for compatibility)"""
    seed = "aws-costs-encryption-seed-2025"
    key_bytes = seed.encode('utf-8')
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b'0')
    else:
        key_bytes = key_bytes[:32]
    return base64.urlsafe_b64encode(key_bytes).decode()

# Initialize encryption
ENCRYPTION_KEY = get_encryption_key()
fernet = Fernet(ENCRYPTION_KEY)


# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    timezone = Column(String(50), default='UTC')
    last_login = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_by_admin = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AIAgentConfig(Base):
    __tablename__ = "ai_agent_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    provider = Column(String(20), nullable=False, default="openai")
    openai_api_key_encrypted = Column(Text, nullable=True)
    anthropic_api_key_encrypted = Column(Text, nullable=True)
    model = Column(String(50), nullable=False, default="gpt-4")
    prompt_template = Column(Text, nullable=False)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AWSAccount(Base):
    __tablename__ = "aws_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    aws_account_id = Column(String(12), nullable=False)
    access_key_id = Column(String(20), nullable=False)
    secret_access_key_encrypted = Column(Text, nullable=False)
    default_region = Column(String(20), nullable=False, default="us-east-1")
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AIReport(Base):
    __tablename__ = "ai_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    aws_account_id = Column(Integer, ForeignKey("aws_accounts.id"), nullable=False)
    ai_agent_id = Column(Integer, ForeignKey("ai_agent_configs.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Analysis details
    analysis_period_start = Column(String(10), nullable=False)
    analysis_period_end = Column(String(10), nullable=False)
    recommendations = Column(Text, nullable=False)
    
    # Metrics
    estimated_savings = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    tokens_used = Column(Integer, default=0)
    
    # Additional metadata
    total_cost_analyzed = Column(Float, default=0.0)
    services_analyzed = Column(Integer, default=0)
    rightsizing_opportunities = Column(Integer, default=0)
    
    # Status and tracking
    report_status = Column(String(20), default="completed")
    generation_time_seconds = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

# Pydantic Models - User Management
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    repeat_password: str
    is_admin: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    repeat_password: Optional[str] = None
    is_admin: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    is_admin: bool
    avatar_url: Optional[str] = None
    timezone: str
    last_login: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    created_by_admin: bool
    created_at: datetime
    updated_at: datetime

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    repeat_password: str

# AI Agent Models
class AIAgentConfigCreate(BaseModel):
    name: str
    description: Optional[str] = None
    provider: Literal["openai", "anthropic"] = "openai"
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    model: str = "gpt-4"
    prompt_template: str
    temperature: float = 0.7
    max_tokens: int = 1000
    is_active: bool = True

class AIAgentConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    provider: Optional[Literal["openai", "anthropic"]] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    model: Optional[str] = None
    prompt_template: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_active: Optional[bool] = None

class AIAgentConfigResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    provider: str
    model: str
    prompt_template: str
    temperature: float
    max_tokens: int
    is_active: bool
    is_default: bool
    created_by: int
    created_at: datetime
    updated_at: datetime

class AIAgentTestRequest(BaseModel):
    agent_id: Optional[int] = None
    provider: Literal["openai", "anthropic"] = "openai"
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    model: str
    prompt: str
    temperature: float = 0.7
    max_tokens: int = 1000
    minimal: bool = False

# AWS Account Models
class AWSAccountCreate(BaseModel):
    name: str
    description: Optional[str] = None
    aws_account_id: str
    access_key_id: str
    secret_access_key: str
    default_region: str = "us-east-1"
    is_active: bool = True

class AWSAccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    aws_account_id: Optional[str] = None
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None
    default_region: Optional[str] = None
    is_active: Optional[bool] = None

class AWSAccountResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    aws_account_id: str
    access_key_id: str
    default_region: str
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime

# Authentication Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Cost Explorer Models
class CostData(BaseModel):
    date: str
    amount: float
    unit: str = "USD"

class ServiceCost(BaseModel):
    service_name: str
    amount: float
    percentage: float
    unit: str = "USD"

class DimensionCost(BaseModel):
    key: str
    amount: float
    percentage: float
    unit: str = "USD"

class CostTrendResponse(BaseModel):
    account_id: str
    account_name: str
    period_start: str
    period_end: str
    granularity: str
    total_cost: float
    daily_costs: List[CostData]
    currency: str = "USD"

class ServiceBreakdownResponse(BaseModel):
    account_id: str
    account_name: str
    period_start: str
    period_end: str
    total_cost: float
    services: List[ServiceCost]
    currency: str = "USD"

class CostComparisonResponse(BaseModel):
    account_id: str
    account_name: str
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    change_amount: float
    change_percentage: float
    currency: str = "USD"

class RightsizingRecommendation(BaseModel):
    account_id: str
    resource_id: str
    resource_type: str
    current_instance_type: str
    recommended_instance_type: str
    estimated_monthly_savings: float
    confidence_level: str

class DetailedCostResponse(BaseModel):
    account_id: str
    account_name: str
    period_start: str
    period_end: str
    granularity: str
    group_by: str
    total_cost: float
    groups: List[DimensionCost]
    currency: str = "USD"

class MonthlySummaryData(BaseModel):
    month: str
    year: int
    total_cost: float
    service_count: int
    top_service: str
    top_service_cost: float

class MonthlySummaryResponse(BaseModel):
    account_id: str
    account_name: str
    months_included: int
    monthly_data: List[MonthlySummaryData]
    currency: str = "USD"

class CostStatisticsResponse(BaseModel):
    account_id: str
    account_name: str
    period_start: str
    period_end: str
    total_cost: float
    average_daily_cost: float
    highest_daily_cost: float
    lowest_daily_cost: float
    cost_variance: float
    trend_direction: str
    currency: str = "USD"

class AIInsightsRequest(BaseModel):
    account_id: int
    start_date: str
    end_date: str
    agent_id: Optional[int] = None

class AIInsightsResponse(BaseModel):
    account_id: str
    account_name: str
    analysis_period: str
    recommendations: str
    estimated_savings: float
    confidence_score: float
    generated_at: datetime

# AI Reports Models
class AIReportResponse(BaseModel):
    id: int
    aws_account_id: int
    aws_account_name: str
    ai_agent_id: int
    ai_agent_name: str
    owner_id: int
    owner_name: str
    
    # Analysis details
    analysis_period_start: str
    analysis_period_end: str
    recommendations: str
    
    # Metrics
    estimated_savings: float
    confidence_score: float
    tokens_used: int
    
    # Additional metadata
    total_cost_analyzed: float
    services_analyzed: int
    rightsizing_opportunities: int
    
    # Status and tracking
    report_status: str
    generation_time_seconds: float
    
    # Timestamps
    created_at: datetime

class AIReportsListResponse(BaseModel):
    reports: List[AIReportResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool

class CostForecastData(BaseModel):
    date: str
    forecasted_cost: float
    confidence_interval_lower: float
    confidence_interval_upper: float

class CostForecastResponse(BaseModel):
    account_id: str
    account_name: str
    forecast_period: str
    forecast_data: List[CostForecastData]
    currency: str = "USD"

# Dashboard Models
class DashboardStats(BaseModel):
    total_accounts: int
    total_monthly_cost: float
    potential_savings: float
    recommendations_count: int
    
class CostTrend(BaseModel):
    date: str
    cost: float
    savings: float

class ResourceDistribution(BaseModel):
    name: str
    value: float
    cost: float

class DashboardData(BaseModel):
    stats: DashboardStats
    cost_trends: List[CostTrend]
    resource_distribution: List[ResourceDistribution]

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Security Functions
security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    if request.client:
        return request.client.host
    return "unknown"

def log_action(db: Session, user_id: int, user_email: str, action: str, resource_type: str, 
               resource_id: str = None, details: dict = None, ip_address: str = None, 
               success: bool = True, error_message: str = None):
    """Log user actions for audit trail"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            success=success,
            error_message=error_message
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log action: {str(e)}")

# Encryption helpers
def encrypt_api_key(api_key: str) -> str:
    return fernet.encrypt(api_key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    return fernet.decrypt(encrypted_key.encode()).decode()


def generate_cost_report_pdf(detailed_response, account_id, start_date, end_date, group_by):
    """Generate PDF report for cost data"""
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    
    # Create PDF document
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Title
    title = Paragraph(f"AWS Cost Report - {detailed_response.account_name}", title_style)
    story.append(title)
    story.append(Spacer(1, 20))
    
    # Report Details
    details_data = [
        ['Report Period:', f"{start_date} to {end_date}"],
        ['AWS Account ID:', detailed_response.account_id],
        ['Account Name:', detailed_response.account_name],
        ['Grouped By:', group_by.replace('_', ' ').title()],
        ['Total Cost:', f"${detailed_response.total_cost:.2f} USD"],
        ['Generated:', datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')]
    ]
    
    details_table = Table(details_data, colWidths=[2*inch, 3*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 30))
    
    # Cost Breakdown Table
    breakdown_title = Paragraph("Cost Breakdown", styles['Heading2'])
    story.append(breakdown_title)
    story.append(Spacer(1, 10))
    
    # Prepare table data
    table_data = [['Service/Resource', 'Cost (USD)', 'Percentage']]
    
    for group in detailed_response.groups:
        table_data.append([
            group.key,
            f"${group.amount:.2f}",
            f"{group.percentage:.1f}%"
        ])
    
    # Create table
    cost_table = Table(table_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    cost_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),  # Align numbers to right
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),    # Align service names to left
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))
    
    story.append(cost_table)
    story.append(Spacer(1, 30))
    
    # Summary
    summary_title = Paragraph("Summary", styles['Heading2'])
    story.append(summary_title)
    story.append(Spacer(1, 10))
    
    summary_text = f"""
    This report shows the cost breakdown for AWS Account {detailed_response.account_name} 
    ({detailed_response.account_id}) from {start_date} to {end_date}. 
    
    Total analyzed cost: ${detailed_response.total_cost:.2f} USD
    Number of {group_by.replace('_', ' ').lower()} analyzed: {len(detailed_response.groups)}
    
    The data is grouped by {group_by.replace('_', ' ').lower()} and shows both absolute costs 
    and percentage distribution.
    """
    
    summary_para = Paragraph(summary_text, styles['Normal'])
    story.append(summary_para)
    
    # Build PDF
    doc.build(story)
    
    # Read the file content
    with open(temp_file.name, 'rb') as f:
        pdf_content = f.read()
    
    # Clean up temp file
    import os
    os.unlink(temp_file.name)
    
    return pdf_content

def generate_ai_report_pdf(report, account, agent, owner):
    """Generate PDF report for AI analysis"""
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    
    # Create PDF document
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Title
    title = Paragraph(f"AI Cost Analysis Report #{report.id}", title_style)
    story.append(title)
    story.append(Spacer(1, 20))
    
    # Report Details
    details_data = [
        ['Report ID:', f"#{report.id}"],
        ['AWS Account:', f"{account.name} ({account.aws_account_id})"],
        ['AI Agent:', agent.name if agent else "Unknown"],
        ['Analysis Period:', f"{report.analysis_period_start} to {report.analysis_period_end}"],
        ['Generated By:', owner.name if owner else "Unknown"],
        ['Generated At:', report.created_at.strftime('%Y-%m-%d %H:%M UTC')],
        ['Status:', report.report_status.title()]
    ]
    
    details_table = Table(details_data, colWidths=[2*inch, 4*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 30))
    
    # Metrics Summary
    metrics_title = Paragraph("Analysis Metrics", styles['Heading2'])
    story.append(metrics_title)
    story.append(Spacer(1, 10))
    
    metrics_data = [
        ['Metric', 'Value'],
        ['Estimated Monthly Savings', f"${report.estimated_savings:.2f} USD"],
        ['Total Cost Analyzed', f"${report.total_cost_analyzed:.2f} USD"],
        ['Services Analyzed', str(report.services_analyzed)],
        ['Rightsizing Opportunities', str(report.rightsizing_opportunities)],
        ['Confidence Score', f"{report.confidence_score:.1%}"],
        ['Tokens Used', str(report.tokens_used)],
        ['Generation Time', f"{report.generation_time_seconds:.2f} seconds"]
    ]
    
    metrics_table = Table(metrics_data, colWidths=[3*inch, 2*inch])
    metrics_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),  # Align values to right
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))
    
    story.append(metrics_table)
    story.append(Spacer(1, 30))
    
    # AI Recommendations
    recommendations_title = Paragraph("AI-Generated Recommendations", styles['Heading2'])
    story.append(recommendations_title)
    story.append(Spacer(1, 10))
    
    # Split recommendations into paragraphs for better formatting
    recommendations_text = report.recommendations or "No recommendations available."
    recommendations_paragraphs = recommendations_text.split('\n\n')
    
    for para_text in recommendations_paragraphs:
        if para_text.strip():
            para = Paragraph(para_text.strip(), styles['Normal'])
            story.append(para)
            story.append(Spacer(1, 12))
    
    story.append(Spacer(1, 20))
    
    # Footer
    footer_text = f"""
    This AI-powered cost analysis report was generated using advanced machine learning algorithms 
    to identify cost optimization opportunities in your AWS infrastructure. The recommendations 
    are based on usage patterns, historical data, and AWS best practices.
    
    Report generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} using {agent.name if agent else 'AI Agent'}.
    """
    
    footer_para = Paragraph(footer_text, styles['Normal'])
    story.append(footer_para)
    
    # Build PDF
    doc.build(story)
    
    # Read the file content
    with open(temp_file.name, 'rb') as f:
        pdf_content = f.read()
    
    # Clean up temp file
    import os
    os.unlink(temp_file.name)
    
    return pdf_content

# AWS Cost Explorer helpers
def get_cost_explorer_client(account):
    """Get Cost Explorer client for an AWS account. Note: Cost Explorer is only available in us-east-1 region."""
    try:
        logger.info(f"Creating Cost Explorer client for account ID: {account.id}")
        
        # Verificar se a chave criptografada existe
        if not account.secret_access_key_encrypted:
            logger.error(f"No encrypted secret key found for account {account.id}")
            raise HTTPException(status_code=400, detail="No secret access key found for this AWS account")
        
        logger.info(f"Attempting to decrypt secret key for account {account.id}")
        
        # Tentar descriptografar a chave secreta
        try:
            secret_key = decrypt_api_key(account.secret_access_key_encrypted)
            logger.info(f"Successfully decrypted secret key for account {account.id}")
        except Exception as decrypt_error:
            logger.error(f"Failed to decrypt secret key for account {account.id}: {str(decrypt_error)}")
            logger.error(f"Decrypt error type: {type(decrypt_error).__name__}")
            raise HTTPException(status_code=400, detail=f"Failed to decrypt secret access key: {str(decrypt_error)}")
        
        # Verificar se as credenciais estão válidas
        logger.info(f"Creating boto3 session for account {account.id}")
        
        try:
            session = boto3.Session(
                aws_access_key_id=account.access_key_id,
                aws_secret_access_key=secret_key,
                region_name='us-east-1'
            )
            
            # Testar as credenciais primeiro
            sts_client = session.client('sts')
            identity = sts_client.get_caller_identity()
            logger.info(f"AWS credentials validated for account {account.id}: {identity.get('Account')}")
            
            # Criar o cliente Cost Explorer
            ce_client = session.client('ce')
            logger.info(f"Cost Explorer client created successfully for account {account.id}")
            
            return ce_client
            
        except ClientError as aws_error:
            error_code = aws_error.response['Error']['Code']
            error_message = aws_error.response['Error']['Message']
            logger.error(f"AWS Error for account {account.id}: {error_code} - {error_message}")
            
            if error_code == 'InvalidUserID.NotFound':
                raise HTTPException(status_code=400, detail="Invalid AWS credentials - user not found")
            elif error_code == 'SignatureDoesNotMatch':
                raise HTTPException(status_code=400, detail="Invalid AWS secret access key")
            elif error_code == 'TokenRefreshRequired':
                raise HTTPException(status_code=400, detail="AWS credentials need to be refreshed")
            else:
                raise HTTPException(status_code=400, detail=f"AWS Error: {error_code} - {error_message}")
                
        except NoCredentialsError:
            logger.error(f"No credentials provided for account {account.id}")
            raise HTTPException(status_code=400, detail="No AWS credentials provided")
            
        except Exception as session_error:
            logger.error(f"Unexpected error creating AWS session for account {account.id}: {str(session_error)}")
            logger.error(f"Session error type: {type(session_error).__name__}")
            raise HTTPException(status_code=400, detail=f"Failed to create AWS session: {str(session_error)}")
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_cost_explorer_client for account {account.id}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Failed to create Cost Explorer client: {str(e)}")

def format_decimal_to_float(decimal_value):
    """Convert Decimal to float for JSON serialization"""
    if isinstance(decimal_value, Decimal):
        return float(decimal_value)
    return decimal_value

def get_cost_and_usage(ce_client, start_date: str, end_date: str, granularity: str = "DAILY", group_by: List[Dict] = None):
    """Get cost and usage data from Cost Explorer"""
    try:
        params = {
            'TimePeriod': {
                'Start': start_date,
                'End': end_date
            },
            'Granularity': granularity,
            'Metrics': ['BlendedCost', 'UnblendedCost', 'UsageQuantity']
        }
        
        if group_by:
            params['GroupBy'] = group_by
            
        response = ce_client.get_cost_and_usage(**params)
        return response
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'DataUnavailableException':
            raise HTTPException(status_code=404, detail="Cost data not available for the specified period")
        elif error_code == 'InvalidNextTokenException':
            raise HTTPException(status_code=400, detail="Invalid pagination token")
        else:
            raise HTTPException(status_code=400, detail=f"AWS Cost Explorer Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error retrieving cost data: {str(e)}")

def get_rightsizing_recommendations(ce_client):
    """Get rightsizing recommendations from Cost Explorer"""
    try:
        response = ce_client.get_rightsizing_recommendation(Service='AmazonEC2')
        return response
    except ClientError as e:
        return {'RightsizingRecommendations': []}
    except Exception as e:
        return {'RightsizingRecommendations': []}

# OpenAI helpers
def test_openai_config(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, minimal: bool = False) -> dict:
    try:
        client = openai.OpenAI(api_key=api_key, timeout=30.0)
        
        if minimal:
            test_prompt = "Hi"
            test_max_tokens = 5
            test_temperature = 0.1
        else:
            test_prompt = prompt
            test_max_tokens = max_tokens
            test_temperature = temperature
        
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": test_prompt}],
            temperature=test_temperature,
            max_tokens=test_max_tokens,
            timeout=30.0
        )
        
        return {
            "success": True,
            "response": response.choices[0].message.content if not minimal else "API key is valid",
            "tokens_used": response.usage.total_tokens,
            "model_used": response.model,
            "test_type": "minimal" if minimal else "full"
        }
    except openai.APIError as e:
        return {"success": False, "error": f"OpenAI API Error: {str(e)}"}
    except openai.RateLimitError as e:
        return {"success": False, "error": f"Rate limit exceeded: {str(e)}"}
    except openai.AuthenticationError as e:
        return {"success": False, "error": f"Authentication failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

# Anthropic helpers
def test_anthropic_config(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, minimal: bool = False) -> dict:
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        if minimal:
            test_prompt = "Hi"
            test_max_tokens = 5
            test_temperature = 0.1
        else:
            test_prompt = prompt
            test_max_tokens = max_tokens
            test_temperature = temperature
        
        response = client.messages.create(
            model=model,
            max_tokens=test_max_tokens,
            temperature=test_temperature,
            messages=[
                {"role": "user", "content": test_prompt}
            ]
        )
        
        # Extract response text
        response_text = ""
        if response.content and len(response.content) > 0:
            response_text = response.content[0].text
        
        # Extract token usage
        tokens_used = 0
        if hasattr(response, 'usage'):
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
        
        return {
            "success": True,
            "response": response_text if not minimal else "API key is valid",
            "tokens_used": tokens_used,
            "model_used": response.model if hasattr(response, 'model') else model,
            "test_type": "minimal" if minimal else "full"
        }
        
    except anthropic.AuthenticationError as e:
        return {"success": False, "error": f"Authentication failed: {str(e)}"}
    except anthropic.RateLimitError as e:
        return {"success": False, "error": f"Rate limit exceeded: {str(e)}"}
    except anthropic.BadRequestError as e:
        return {"success": False, "error": f"Bad request: {str(e)}"}
    except anthropic.APIError as e:
        return {"success": False, "error": f"Anthropic API Error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

# AWS helpers
def test_aws_credentials(access_key_id: str, secret_access_key: str, region: str = "us-east-1") -> dict:
    try:
        session = boto3.Session(
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region
        )
        
        sts_client = session.client('sts')
        response = sts_client.get_caller_identity()
        
        return {
            "success": True,
            "account_id": response.get("Account"),
            "user_id": response.get("UserId"),
            "arn": response.get("Arn"),
            "message": "AWS credentials are valid"
        }
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'InvalidUserID.NotFound':
            return {"success": False, "error": "Invalid AWS credentials"}
        elif error_code == 'SignatureDoesNotMatch':
            return {"success": False, "error": "Invalid secret access key"}
        else:
            return {"success": False, "error": f"AWS Error: {str(e)}"}
    except NoCredentialsError:
        return {"success": False, "error": "No AWS credentials provided"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

# FastAPI App
app = FastAPI(title="AWS Costs Dashboard API", version="1.0.0")

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for monitoring"""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.4f}s")
    
    return response

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize admin user
def init_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@awscosts.com").first()
        if not admin:
            admin = User(
                name="System Administrator",
                email="admin@awscosts.com",
                password_hash=hash_password("admin123"),
                is_admin=True,
                created_by_admin=False,
                timezone='UTC'
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        
        default_config = db.query(AIAgentConfig).filter(AIAgentConfig.is_default == True).first()
        if not default_config:
            default_prompt = """You are an AWS cost optimization expert. Analyze the following AWS resources and provide specific recommendations to reduce costs while maintaining performance and reliability.

Focus on these key areas:
1. **Rightsizing**: Identify over-provisioned instances that can be downsized
2. **Reserved Instances**: Recommend Reserved Instance purchases for consistent workloads
3. **Unused Resources**: Find idle or underutilized resources that can be terminated
4. **Storage Optimization**: Suggest more cost-effective storage classes and cleanup
5. **Network Costs**: Identify expensive data transfer patterns and optimization opportunities
6. **Scheduling**: Recommend start/stop schedules for non-production resources

For each recommendation, provide:
- **Resource**: Specific AWS resource affected
- **Current Cost**: Estimated current monthly cost
- **Recommendation**: Specific action to take
- **Estimated Savings**: Expected monthly savings
- **Implementation**: How to implement the change
- **Risk Level**: Low/Medium/High impact on operations

AWS Resource Data: {resource_data}

Provide actionable, prioritized recommendations with clear cost savings estimates."""

            default_config = AIAgentConfig(
                name="Default AWS Cost Optimizer",
                description="Pre-configured cost optimization assistant for AWS resources",
                provider="anthropic",
                anthropic_api_key_encrypted=encrypt_api_key("your-anthropic-api-key-here"),
                model="claude-3-5-sonnet-20241022",
                prompt_template=default_prompt,
                temperature=0.7,
                max_tokens=1500,
                is_active=True,
                is_default=True,
                created_by=admin.id
            )
            db.add(default_config)
            db.commit()
    finally:
        db.close()

# Basic Routes
@app.get("/")
def read_root():
    return {"message": "AWS Costs Dashboard API", "version": "1.0.0"}

# Health check endpoint with detailed debugging
@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    try:
        from sqlalchemy import text
        
        logger.info("Starting database connection test...")
        
        logger.info("Step 1: Creating database session...")
        db = SessionLocal()
        logger.info("Session created successfully")
        
        logger.info("Step 2: Executing test query...")
        result = db.execute(text("SELECT 1 as test"))
        logger.info("Query executed successfully")
        
        logger.info("Step 3: Fetching query result...")
        row = result.fetchone()
        logger.info(f"Query result: {row}")
        
        logger.info("Step 4: Closing database connection...")
        db.close()
        logger.info("Database connection test completed successfully")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "database": "connected",
            "test_result": str(row) if row else "No result"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        logger.error(f"Database URL being used: {DATABASE_URL}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )

# Authentication Routes
@app.post("/auth/login", response_model=LoginResponse)
def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_request.email, User.is_active == True).first()
    
    if not user or not verify_password(login_request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.last_login = func.now()
    user.last_seen = func.now()
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id, name=user.name, email=user.email, is_active=user.is_active,
            is_admin=user.is_admin, avatar_url=user.avatar_url, timezone=user.timezone,
            last_login=user.last_login, last_seen=user.last_seen, 
            created_by_admin=user.created_by_admin, created_at=user.created_at, 
            updated_at=user.updated_at
        )
    )

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.last_seen = func.now()
    db.commit()
    
    return UserResponse(
        id=current_user.id, name=current_user.name, email=current_user.email,
        is_active=current_user.is_active, is_admin=current_user.is_admin,
        avatar_url=current_user.avatar_url, timezone=current_user.timezone,
        last_login=current_user.last_login, last_seen=current_user.last_seen,
        created_by_admin=current_user.created_by_admin, created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

# Profile Management Routes
@app.put("/profile", response_model=UserResponse)
def update_profile(profile_data: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.email is not None:
        existing_user = db.query(User).filter(User.email == profile_data.email, User.id != current_user.id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_data.email
    if profile_data.timezone is not None:
        current_user.timezone = profile_data.timezone
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    
    current_user.updated_at = func.now()
    current_user.last_seen = func.now()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id, name=current_user.name, email=current_user.email,
        is_active=current_user.is_active, is_admin=current_user.is_admin,
        avatar_url=current_user.avatar_url, timezone=current_user.timezone,
        last_login=current_user.last_login, last_seen=current_user.last_seen,
        created_by_admin=current_user.created_by_admin, created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@app.post("/profile/change-password")
def change_password(password_data: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if password_data.new_password != password_data.repeat_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    current_user.password_hash = hash_password(password_data.new_password)
    current_user.updated_at = func.now()
    current_user.last_seen = func.now()
    db.commit()
    
    return {"message": "Password changed successfully"}

# Dashboard Route
@app.get("/dashboard", response_model=DashboardData)
def get_dashboard_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    aws_account_count = db.query(AWSAccount).filter(AWSAccount.is_active == True).count()
    
    estimated_cost = 0.0
    if aws_account_count > 0:
        estimated_cost = aws_account_count * (2500 + (aws_account_count * 1500))
    
    stats = DashboardStats(
        total_accounts=aws_account_count,
        total_monthly_cost=estimated_cost,
        potential_savings=estimated_cost * 0.22 if estimated_cost > 0 else 0.0,
        recommendations_count=max(aws_account_count * 4, 5) if aws_account_count > 0 else 0
    )
    
    cost_trends = [
        CostTrend(date="2024-01-01", cost=2840, savings=420),
        CostTrend(date="2024-01-02", cost=2920, savings=380),
        CostTrend(date="2024-01-03", cost=2760, savings=520),
        CostTrend(date="2024-01-04", cost=2650, savings=630),
        CostTrend(date="2024-01-05", cost=2580, savings=700),
        CostTrend(date="2024-01-06", cost=2490, savings=790),
        CostTrend(date="2024-01-07", cost=2420, savings=860),
    ]
    
    resource_distribution = [
        ResourceDistribution(name="EC2", value=45, cost=1250),
        ResourceDistribution(name="RDS", value=25, cost=695),
        ResourceDistribution(name="S3", value=15, cost=417),
        ResourceDistribution(name="Lambda", value=8, cost=222),
        ResourceDistribution(name="Others", value=7, cost=195),
    ]
    
    return DashboardData(stats=stats, cost_trends=cost_trends, resource_distribution=resource_distribution)

# Cost Explorer Routes
@app.get("/cost-explorer/accounts/{account_id}/trends", response_model=CostTrendResponse)
def get_account_cost_trends(
    account_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    granularity: str = Query("DAILY", description="DAILY, MONTHLY, or YEARLY"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get cost trends for a specific AWS account. Note: Cost Explorer data is only available in us-east-1 region."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    
    valid_granularities = ["DAILY", "MONTHLY", "YEARLY"]
    if granularity not in valid_granularities:
        raise HTTPException(status_code=400, detail=f"Invalid granularity. Must be one of: {valid_granularities}")
    
    cost_data = get_cost_and_usage(ce_client, start_date, end_date, granularity)
    
    daily_costs = []
    total_cost = 0.0
    
    for result in cost_data.get('ResultsByTime', []):
        amount = float(result['Total']['BlendedCost']['Amount'])
        total_cost += amount
        
        daily_costs.append(CostData(
            date=result['TimePeriod']['Start'],
            amount=amount,
            unit=result['Total']['BlendedCost']['Unit']
        ))
    
    return CostTrendResponse(
        account_id=account.aws_account_id, account_name=account.name,
        period_start=start_date, period_end=end_date, granularity=granularity,
        total_cost=total_cost, daily_costs=daily_costs, currency="USD"
    )

@app.get("/cost-explorer/accounts/{account_id}/services", response_model=ServiceBreakdownResponse)
def get_account_service_breakdown(
    account_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get service-level cost breakdown for a specific AWS account."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    
    cost_data = get_cost_and_usage(
        ce_client, start_date, end_date, "MONTHLY",
        group_by=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
    )
    
    services = []
    total_cost = 0.0
    
    for result in cost_data.get('ResultsByTime', []):
        for group in result.get('Groups', []):
            amount = float(group['Metrics']['BlendedCost']['Amount'])
            total_cost += amount
    
    service_costs = {}
    for result in cost_data.get('ResultsByTime', []):
        for group in result.get('Groups', []):
            service_name = group['Keys'][0]
            amount = float(group['Metrics']['BlendedCost']['Amount'])
            
            if service_name in service_costs:
                service_costs[service_name] += amount
            else:
                service_costs[service_name] = amount
    
    for service_name, amount in service_costs.items():
        percentage = (amount / total_cost * 100) if total_cost > 0 else 0
        services.append(ServiceCost(
            service_name=service_name, amount=amount,
            percentage=round(percentage, 2), unit="USD"
        ))
    
    services.sort(key=lambda x: x.amount, reverse=True)
    
    return ServiceBreakdownResponse(
        account_id=account.aws_account_id, account_name=account.name,
        period_start=start_date, period_end=end_date,
        total_cost=total_cost, services=services, currency="USD"
    )

@app.get("/cost-explorer/accounts/{account_id}/comparison", response_model=CostComparisonResponse)
def get_account_cost_comparison(
    account_id: int,
    current_start: str = Query(..., description="Current period start date in YYYY-MM-DD format"),
    current_end: str = Query(..., description="Current period end date in YYYY-MM-DD format"),
    previous_start: str = Query(..., description="Previous period start date in YYYY-MM-DD format"),
    previous_end: str = Query(..., description="Previous period end date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare cost data between two periods for a specific AWS account."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    
    current_data = get_cost_and_usage(ce_client, current_start, current_end, "MONTHLY")
    current_cost = 0.0
    for result in current_data.get('ResultsByTime', []):
        current_cost += float(result['Total']['BlendedCost']['Amount'])
    
    previous_data = get_cost_and_usage(ce_client, previous_start, previous_end, "MONTHLY")
    previous_cost = 0.0
    for result in previous_data.get('ResultsByTime', []):
        previous_cost += float(result['Total']['BlendedCost']['Amount'])
    
    change_amount = current_cost - previous_cost
    change_percentage = (change_amount / previous_cost * 100) if previous_cost > 0 else 0
    
    return CostComparisonResponse(
        account_id=account.aws_account_id, account_name=account.name,
        current_period={"start_date": current_start, "end_date": current_end, "total_cost": current_cost},
        previous_period={"start_date": previous_start, "end_date": previous_end, "total_cost": previous_cost},
        change_amount=change_amount, change_percentage=round(change_percentage, 2), currency="USD"
    )

@app.get("/cost-explorer/accounts/{account_id}/recommendations", response_model=List[RightsizingRecommendation])
def get_account_rightsizing_recommendations(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rightsizing recommendations for a specific AWS account."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    recommendations_data = get_rightsizing_recommendations(ce_client)
    
    recommendations = []
    for rec in recommendations_data.get('RightsizingRecommendations', []):
        if rec.get('RightsizingType') == 'Modify':
            modify_details = rec.get('ModifyRecommendationDetail', {})
            target_instances = modify_details.get('TargetInstances', [])
            
            for target in target_instances:
                estimated_savings = target.get('EstimatedMonthlySavings', 0)
                if isinstance(estimated_savings, str):
                    estimated_savings = float(estimated_savings)
                
                recommendations.append(RightsizingRecommendation(
                    account_id=account.aws_account_id,
                    resource_id=target.get('ResourceId', 'Unknown'),
                    resource_type='EC2',
                    current_instance_type=rec.get('CurrentInstance', {}).get('InstanceType', 'Unknown'),
                    recommended_instance_type=target.get('DefaultTargetInstance', {}).get('InstanceType', 'Unknown'),
                    estimated_monthly_savings=estimated_savings,
                    confidence_level=rec.get('ConfidenceLevel', 'MEDIUM')
                ))
    
    return recommendations

# Additional Cost Explorer Routes
@app.get("/cost-explorer/accounts/{account_id}/detailed", response_model=DetailedCostResponse)
def get_detailed_cost_data(
    account_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    group_by: str = Query("SERVICE", description="Grouping dimension"),
    granularity: str = Query("DAILY", description="DAILY, MONTHLY, or YEARLY"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed cost data with custom grouping for a specific AWS account."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    
    valid_dimensions = ["SERVICE", "REGION", "INSTANCE_TYPE", "USAGE_TYPE", "OPERATION", "AVAILABILITY_ZONE"]
    if group_by not in valid_dimensions:
        raise HTTPException(status_code=400, detail=f"Invalid group_by. Must be one of: {valid_dimensions}")
    
    cost_data = get_cost_and_usage(
        ce_client, start_date, end_date, granularity,
        group_by=[{'Type': 'DIMENSION', 'Key': group_by}]
    )
    
    groups = []
    total_cost = 0.0
    
    group_totals = {}
    for result in cost_data.get('ResultsByTime', []):
        for group in result.get('Groups', []):
            group_key = group['Keys'][0]
            amount = float(group['Metrics']['BlendedCost']['Amount'])
            
            if group_key in group_totals:
                group_totals[group_key] += amount
            else:
                group_totals[group_key] = amount
            
            total_cost += amount
    
    for group_key, amount in group_totals.items():
        percentage = (amount / total_cost * 100) if total_cost > 0 else 0
        groups.append(DimensionCost(
            key=group_key, amount=amount,
            percentage=round(percentage, 2), unit="USD"
        ))
    
    groups.sort(key=lambda x: x.amount, reverse=True)
    
    return DetailedCostResponse(
        account_id=account.aws_account_id, account_name=account.name,
        period_start=start_date, period_end=end_date,
        granularity=granularity, group_by=group_by,
        total_cost=total_cost, groups=groups, currency="USD"
    )

@app.get("/cost-explorer/accounts/{account_id}/monthly-summary", response_model=MonthlySummaryResponse)
def get_monthly_cost_summary(
    account_id: int,
    months: int = Query(6, description="Number of months to retrieve", ge=1, le=13),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly cost summary for the specified number of months."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    
    today = datetime.utcnow()
    start_date = datetime(today.year, today.month - months + 1, 1) if today.month >= months else datetime(today.year - 1, today.month - months + 13, 1)
    end_date = today
    
    cost_data = get_cost_and_usage(
        ce_client, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'),
        "MONTHLY", group_by=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
    )
    
    monthly_data = []
    
    for result in cost_data.get('ResultsByTime', []):
        month_start = datetime.strptime(result['TimePeriod']['Start'], '%Y-%m-%d')
        total_month_cost = float(result['Total']['BlendedCost']['Amount'])
        
        top_service = "N/A"
        top_service_cost = 0.0
        service_count = len(result.get('Groups', []))
        
        for group in result.get('Groups', []):
            service_cost = float(group['Metrics']['BlendedCost']['Amount'])
            if service_cost > top_service_cost:
                top_service_cost = service_cost
                top_service = group['Keys'][0]
        
        monthly_data.append(MonthlySummaryData(
            month=month_start.strftime('%B'), year=month_start.year,
            total_cost=total_month_cost, service_count=service_count,
            top_service=top_service, top_service_cost=top_service_cost
        ))
    
    return MonthlySummaryResponse(
        account_id=account.aws_account_id, account_name=account.name,
        months_included=len(monthly_data), monthly_data=monthly_data, currency="USD"
    )

@app.get("/cost-explorer/accounts/{account_id}/statistics", response_model=CostStatisticsResponse)
def get_cost_statistics(
    account_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistical analysis of cost data for a specific AWS account."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    cost_data = get_cost_and_usage(ce_client, start_date, end_date, "DAILY")
    
    daily_costs = []
    total_cost = 0.0
    
    for result in cost_data.get('ResultsByTime', []):
        daily_cost = float(result['Total']['BlendedCost']['Amount'])
        daily_costs.append(daily_cost)
        total_cost += daily_cost
    
    if not daily_costs:
        raise HTTPException(status_code=404, detail="No cost data available for the specified period")
    
    average_daily_cost = total_cost / len(daily_costs)
    highest_daily_cost = max(daily_costs)
    lowest_daily_cost = min(daily_costs)
    
    variance = sum((cost - average_daily_cost) ** 2 for cost in daily_costs) / len(daily_costs)
    
    if len(daily_costs) >= 2:
        first_half_avg = sum(daily_costs[:len(daily_costs)//2]) / (len(daily_costs)//2)
        second_half_avg = sum(daily_costs[len(daily_costs)//2:]) / (len(daily_costs) - len(daily_costs)//2)
        
        if second_half_avg > first_half_avg * 1.05:
            trend_direction = "increasing"
        elif second_half_avg < first_half_avg * 0.95:
            trend_direction = "decreasing"
        else:
            trend_direction = "stable"
    else:
        trend_direction = "stable"
    
    return CostStatisticsResponse(
        account_id=account.aws_account_id, account_name=account.name,
        period_start=start_date, period_end=end_date,
        total_cost=total_cost, average_daily_cost=average_daily_cost,
        highest_daily_cost=highest_daily_cost, lowest_daily_cost=lowest_daily_cost,
        cost_variance=variance, trend_direction=trend_direction, currency="USD"
    )

@app.post("/cost-explorer/ai-insights", response_model=AIInsightsResponse)
def generate_ai_cost_insights(
    request: AIInsightsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered cost optimization insights using configured AI agent."""
    import time
    start_time = time.time()
    
    account = db.query(AWSAccount).filter(AWSAccount.id == request.account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    if request.agent_id:
        ai_config = db.query(AIAgentConfig).filter(AIAgentConfig.id == request.agent_id, AIAgentConfig.is_active == True).first()
    else:
        ai_config = db.query(AIAgentConfig).filter(AIAgentConfig.is_default == True, AIAgentConfig.is_active == True).first()
    
    if not ai_config:
        raise HTTPException(status_code=404, detail="No active AI agent configuration found")
    
    try:
        ce_client = get_cost_explorer_client(account)
        
        cost_trends = get_cost_and_usage(ce_client, request.start_date, request.end_date, "DAILY")
        service_breakdown = get_cost_and_usage(
            ce_client, request.start_date, request.end_date, "MONTHLY",
            group_by=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
        )
        recommendations = get_rightsizing_recommendations(ce_client)
        
        cost_summary = {
            "account_name": account.name,
            "account_id": account.aws_account_id,
            "period": f"{request.start_date} to {request.end_date}",
            "daily_costs": [],
            "top_services": [],
            "rightsizing_opportunities": len(recommendations.get('RightsizingRecommendations', []))
        }
        
        total_cost = 0.0
        for result in cost_trends.get('ResultsByTime', []):
            daily_cost = float(result['Total']['BlendedCost']['Amount'])
            cost_summary["daily_costs"].append({
                "date": result['TimePeriod']['Start'],
                "cost": daily_cost
            })
            total_cost += daily_cost
        
        service_costs = {}
        services_count = 0
        for result in service_breakdown.get('ResultsByTime', []):
            for group in result.get('Groups', []):
                service_name = group['Keys'][0]
                service_cost = float(group['Metrics']['BlendedCost']['Amount'])
                if service_name in service_costs:
                    service_costs[service_name] += service_cost
                else:
                    service_costs[service_name] = service_cost
                services_count += 1
        
        sorted_services = sorted(service_costs.items(), key=lambda x: x[1], reverse=True)[:10]
        cost_summary["top_services"] = [
            {"service": service, "cost": cost, "percentage": round(cost/total_cost*100, 1)}
            for service, cost in sorted_services
        ]
        
        analysis_prompt = ai_config.prompt_template.format(
            resource_data=json.dumps(cost_summary, indent=2)
        )
        
        # Use appropriate AI provider
        if ai_config.provider == "openai":
            api_key = decrypt_api_key(ai_config.openai_api_key_encrypted)
            client = openai.OpenAI(api_key=api_key, timeout=60.0)
            
            response = client.chat.completions.create(
                model=ai_config.model,
                messages=[
                    {"role": "system", "content": "You are an AWS cost optimization expert. Analyze the provided cost data and provide specific, actionable recommendations."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=ai_config.temperature,
                max_tokens=ai_config.max_tokens
            )
            
            insights_text = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
        else:  # anthropic
            api_key = decrypt_api_key(ai_config.anthropic_api_key_encrypted)
            client = anthropic.Anthropic(api_key=api_key)
            
            response = client.messages.create(
                model=ai_config.model,
                max_tokens=ai_config.max_tokens,
                temperature=ai_config.temperature,
                messages=[
                    {"role": "user", "content": f"You are an AWS cost optimization expert. Analyze the provided cost data and provide specific, actionable recommendations.\n\n{analysis_prompt}"}
                ]
            )
            
            # Extract response text
            insights_text = ""
            if response.content and len(response.content) > 0:
                insights_text = response.content[0].text
            
            # Extract token usage
            tokens_used = 0
            if hasattr(response, 'usage'):
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                
        estimated_savings = total_cost * 0.15
        confidence_score = 0.8
        
        rightsizing_count = len(recommendations.get('RightsizingRecommendations', []))
        if rightsizing_count > 0:
            estimated_savings += sum(
                float(rec.get('ModifyRecommendationDetail', {}).get('TargetInstances', [{}])[0].get('EstimatedMonthlySavings', 0))
                for rec in recommendations['RightsizingRecommendations']
                if rec.get('ModifyRecommendationDetail', {}).get('TargetInstances')
            )
            confidence_score = 0.9
        
        # Calculate generation time
        generation_time = time.time() - start_time
        
        # Save the report to database
        ai_report = AIReport(
            aws_account_id=account.id,
            ai_agent_id=ai_config.id,
            owner_id=current_user.id,
            analysis_period_start=request.start_date,
            analysis_period_end=request.end_date,
            recommendations=insights_text,
            estimated_savings=estimated_savings,
            confidence_score=confidence_score,
            tokens_used=tokens_used,
            total_cost_analyzed=total_cost,
            services_analyzed=len(service_costs),
            rightsizing_opportunities=rightsizing_count,
            report_status="completed",
            generation_time_seconds=round(generation_time, 2)
        )
        
        db.add(ai_report)
        db.commit()
        db.refresh(ai_report)
        
        return AIInsightsResponse(
            account_id=account.aws_account_id, account_name=account.name,
            analysis_period=f"{request.start_date} to {request.end_date}",
            recommendations=insights_text, estimated_savings=estimated_savings,
            confidence_score=confidence_score, generated_at=datetime.utcnow()
        )
        
    except (openai.APIError, anthropic.APIError) as e:
        # Save failed report
        ai_report = AIReport(
            aws_account_id=account.id,
            ai_agent_id=ai_config.id,
            owner_id=current_user.id,
            analysis_period_start=request.start_date,
            analysis_period_end=request.end_date,
            recommendations=f"AI analysis failed: {str(e)}",
            report_status="failed",
            generation_time_seconds=round(time.time() - start_time, 2)
        )
        db.add(ai_report)
        db.commit()
        
        raise HTTPException(status_code=400, detail=f"AI analysis failed: {str(e)}")
    except Exception as e:
        # Save failed report
        ai_report = AIReport(
            aws_account_id=account.id,
            ai_agent_id=ai_config.id,
            owner_id=current_user.id,
            analysis_period_start=request.start_date,
            analysis_period_end=request.end_date,
            recommendations=f"Failed to generate insights: {str(e)}",
            report_status="failed",
            generation_time_seconds=round(time.time() - start_time, 2)
        )
        db.add(ai_report)
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@app.get("/ai-reports", response_model=AIReportsListResponse)
def get_ai_reports(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    aws_account_id: Optional[int] = Query(None, description="Filter by AWS account"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated list of AI reports with optional filtering."""
    
    query = db.query(AIReport)
    
    if aws_account_id:
        query = query.filter(AIReport.aws_account_id == aws_account_id)
    
    total_count = query.count()
    
    offset = (page - 1) * page_size
    reports = query.order_by(AIReport.created_at.desc()).offset(offset).limit(page_size).all()
    
    report_responses = []
    for report in reports:
        account = db.query(AWSAccount).filter(AWSAccount.id == report.aws_account_id).first()
        agent = db.query(AIAgentConfig).filter(AIAgentConfig.id == report.ai_agent_id).first()
        owner = db.query(User).filter(User.id == report.owner_id).first()
        
        owner_name = "Unknown"
        if owner:
            if hasattr(owner, 'full_name') and owner.full_name:
                owner_name = owner.full_name
            elif hasattr(owner, 'name') and owner.name:
                owner_name = owner.name  
            elif hasattr(owner, 'username') and owner.username:
                owner_name = owner.username
            elif hasattr(owner, 'email') and owner.email:
                owner_name = owner.email
        
        report_responses.append(AIReportResponse(
            id=report.id,
            aws_account_id=report.aws_account_id,
            aws_account_name=account.name if account else "Unknown",
            ai_agent_id=report.ai_agent_id,
            ai_agent_name=agent.name if agent else "Unknown",
            owner_id=report.owner_id,
            owner_name=owner_name,
            analysis_period_start=str(report.analysis_period_start),
            analysis_period_end=str(report.analysis_period_end),
            recommendations=report.recommendations,
            estimated_savings=float(report.estimated_savings),
            confidence_score=float(report.confidence_score),
            tokens_used=report.tokens_used,
            total_cost_analyzed=float(report.total_cost_analyzed),
            services_analyzed=report.services_analyzed,
            rightsizing_opportunities=report.rightsizing_opportunities,
            report_status=report.report_status,
            generation_time_seconds=float(report.generation_time_seconds),
            created_at=report.created_at
        ))
    
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_previous = page > 1
    
    return AIReportsListResponse(
        reports=report_responses,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_previous=has_previous
    )

@app.get("/ai-reports/{report_id}/export")
def export_ai_report(
    report_id: int,
    format: str = Query("pdf", description="Export format: pdf or json"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export AI report in specified format"""
    
    # Get the report
    report = db.query(AIReport).filter(AIReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Get related data
    account = db.query(AWSAccount).filter(AWSAccount.id == report.aws_account_id).first()
    agent = db.query(AIAgentConfig).filter(AIAgentConfig.id == report.ai_agent_id).first()
    owner = db.query(User).filter(User.id == report.owner_id).first()
    
    if format.lower() == "pdf":
        pdf_content = generate_ai_report_pdf(report, account, agent, owner)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=ai-report-{report_id}-{datetime.utcnow().strftime('%Y%m%d')}.pdf"}
        )
    
    else:  # json
        report_data = {
            "report_id": report.id,
            "aws_account": {
                "name": account.name if account else "Unknown",
                "aws_account_id": account.aws_account_id if account else "Unknown"
            },
            "ai_agent": {
                "name": agent.name if agent else "Unknown",
                "model": agent.model if agent else "Unknown"
            },
            "analysis_period": {
                "start": report.analysis_period_start,
                "end": report.analysis_period_end
            },
            "metrics": {
                "estimated_savings": float(report.estimated_savings),
                "total_cost_analyzed": float(report.total_cost_analyzed),
                "services_analyzed": report.services_analyzed,
                "rightsizing_opportunities": report.rightsizing_opportunities,
                "confidence_score": float(report.confidence_score),
                "tokens_used": report.tokens_used,
                "generation_time_seconds": float(report.generation_time_seconds)
            },
            "recommendations": report.recommendations,
            "status": report.report_status,
            "generated_by": owner.name if owner else "Unknown",
            "generated_at": report.created_at.isoformat(),
            "exported_at": datetime.utcnow().isoformat()
        }
        
        return JSONResponse(
            content=report_data,
            headers={"Content-Disposition": f"attachment; filename=ai-report-{report_id}-{datetime.utcnow().strftime('%Y%m%d')}.json"}
        )

@app.get("/ai-agents/available", response_model=List[AIAgentConfigResponse])
def get_available_ai_agents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get available AI agents for cost analysis - accessible to all authenticated users"""
    configs = db.query(AIAgentConfig).filter(
        AIAgentConfig.is_active == True
    ).order_by(
        AIAgentConfig.is_default.desc(), 
        AIAgentConfig.created_at.desc()
    ).all()
    
    return [AIAgentConfigResponse(
        id=config.id, name=config.name, description=config.description,
        provider=config.provider, model=config.model, prompt_template=config.prompt_template,
        temperature=config.temperature, max_tokens=config.max_tokens,
        is_active=config.is_active, is_default=config.is_default,
        created_by=config.created_by, created_at=config.created_at,
        updated_at=config.updated_at
    ) for config in configs]

@app.get("/cost-explorer/accounts/{account_id}/forecast", response_model=CostForecastResponse)
def get_cost_forecast(
    account_id: int,
    start_date: str = Query(..., description="Forecast start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="Forecast end date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get cost forecast for a specific AWS account."""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    ce_client = get_cost_explorer_client(account)
    
    try:
        response = ce_client.get_cost_forecast(
            TimePeriod={'Start': start_date, 'End': end_date},
            Metric='BLENDED_COST',
            Granularity='DAILY'
        )
        
        forecast_data = []
        for result in response.get('ForecastResultsByTime', []):
            forecast_data.append(CostForecastData(
                date=result['TimePeriod']['Start'],
                forecasted_cost=float(result['MeanValue']),
                confidence_interval_lower=float(result.get('PredictionIntervalLowerBound', result['MeanValue'])),
                confidence_interval_upper=float(result.get('PredictionIntervalUpperBound', result['MeanValue']))
            ))
        
        return CostForecastResponse(
            account_id=account.aws_account_id, account_name=account.name,
            forecast_period=f"{start_date} to {end_date}",
            forecast_data=forecast_data, currency="USD"
        )
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'DataUnavailableException':
            raise HTTPException(status_code=404, detail="Forecast data not available for the specified period")
        else:
            raise HTTPException(status_code=400, detail=f"AWS Cost Forecast Error: {str(e)}")

@app.get("/cost-explorer/accounts/{account_id}/export")
def export_cost_data(
    account_id: int,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    group_by: str = Query("SERVICE", description="Group by dimension"),
    format: str = Query("csv", description="Export format: csv, json, or pdf"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id, AWSAccount.is_active == True).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    detailed_response = get_detailed_cost_data(
        account_id, start_date, end_date, group_by, "DAILY", current_user, db
    )
    
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Account_ID', 'Account_Name', 'Period_Start', 'Period_End', 'Group_Key', 'Cost_USD', 'Percentage'])
        
        for group in detailed_response.groups:
            writer.writerow([
                detailed_response.account_id, detailed_response.account_name,
                detailed_response.period_start, detailed_response.period_end,
                group.key, group.amount, group.percentage
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=cost-data-{account_id}-{start_date}-to-{end_date}.csv"}
        )
    
    elif format.lower() == "pdf":
        pdf_content = generate_cost_report_pdf(detailed_response, account_id, start_date, end_date, group_by)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=cost-report-{account_id}-{start_date}-to-{end_date}.pdf"}
        )
    
    else:  # json
        return JSONResponse(
            content=detailed_response.dict(),
            headers={"Content-Disposition": f"attachment; filename=cost-data-{account_id}-{start_date}-to-{end_date}.json"}
        )
        
# User Management Routes (Admin only)
@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return [UserResponse(
        id=user.id, name=user.name, email=user.email, is_active=user.is_active,
        is_admin=user.is_admin, avatar_url=user.avatar_url, timezone=user.timezone,
        last_login=user.last_login, last_seen=user.last_seen,
        created_by_admin=user.created_by_admin, created_at=user.created_at,
        updated_at=user.updated_at
    ) for user in users]

@app.post("/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    if user_data.password != user_data.repeat_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=user_data.name, email=user_data.email,
        password_hash=hash_password(user_data.password),
        is_admin=user_data.is_admin, created_by_admin=True, timezone='UTC'
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id, name=user.name, email=user.email, is_active=user.is_active,
        is_admin=user.is_admin, avatar_url=user.avatar_url, timezone=user.timezone,
        last_login=user.last_login, last_seen=user.last_seen,
        created_by_admin=user.created_by_admin, created_at=user.created_at,
        updated_at=user.updated_at
    )

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.password and user_data.repeat_password:
        if user_data.password != user_data.repeat_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        user.password_hash = hash_password(user_data.password)
    
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        existing_user = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_data.email
    if user_data.is_admin is not None:
        user.is_admin = user_data.is_admin
    
    user.updated_at = func.now()
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id, name=user.name, email=user.email, is_active=user.is_active,
        is_admin=user.is_admin, avatar_url=user.avatar_url, timezone=user.timezone,
        last_login=user.last_login, last_seen=user.last_seen,
        created_by_admin=user.created_by_admin, created_at=user.created_at,
        updated_at=user.updated_at
    )

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# AI Agent Configuration Routes (Admin only)
@app.get("/ai-agents", response_model=List[AIAgentConfigResponse])
def get_ai_agents(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    configs = db.query(AIAgentConfig).order_by(AIAgentConfig.is_default.desc(), AIAgentConfig.created_at.desc()).all()
    return [AIAgentConfigResponse(
        id=config.id, name=config.name, description=config.description,
        provider=config.provider, model=config.model, prompt_template=config.prompt_template,
        temperature=config.temperature, max_tokens=config.max_tokens,
        is_active=config.is_active, is_default=config.is_default,
        created_by=config.created_by, created_at=config.created_at,
        updated_at=config.updated_at
    ) for config in configs]

@app.post("/ai-agents", response_model=AIAgentConfigResponse)
def create_ai_agent(config_data: AIAgentConfigCreate, request: Request = None, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    ip_address = get_client_ip(request)
    
    existing_config = db.query(AIAgentConfig).filter(AIAgentConfig.name == config_data.name).first()
    if existing_config:
        log_action(
            db=db,
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="CREATE",
            resource_type="AI_AGENT",
            details={"name": config_data.name},
            ip_address=ip_address,
            success=False,
            error_message="Configuration name already exists"
        )
        raise HTTPException(status_code=400, detail="Configuration name already exists")
    
    # Validate API keys based on provider
    if config_data.provider == "openai":
        if not config_data.openai_api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key is required for OpenAI provider")
        
        test_result = test_openai_config(
            config_data.openai_api_key, config_data.model, "Test", 0.1, 5, minimal=True
        )
    else:  # anthropic
        if not config_data.anthropic_api_key:
            raise HTTPException(status_code=400, detail="Anthropic API key is required for Anthropic provider")
        
        test_result = test_anthropic_config(
            config_data.anthropic_api_key, config_data.model, "Test", 0.1, 5, minimal=True
        )
    
    if not test_result["success"]:
        log_action(
            db=db,
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="CREATE",
            resource_type="AI_AGENT",
            details={"name": config_data.name, "model": config_data.model, "provider": config_data.provider},
            ip_address=ip_address,
            success=False,
            error_message=f"AI configuration validation failed: {test_result['error']}"
        )
        raise HTTPException(status_code=400, detail=f"AI configuration validation failed: {test_result['error']}")
    
    config = AIAgentConfig(
        name=config_data.name, description=config_data.description,
        provider=config_data.provider,
        openai_api_key_encrypted=encrypt_api_key(config_data.openai_api_key) if config_data.openai_api_key else None,
        anthropic_api_key_encrypted=encrypt_api_key(config_data.anthropic_api_key) if config_data.anthropic_api_key else None,
        model=config_data.model, prompt_template=config_data.prompt_template,
        temperature=config_data.temperature, max_tokens=config_data.max_tokens,
        is_active=config_data.is_active, created_by=admin_user.id
    )
    
    db.add(config)
    db.commit()
    db.refresh(config)
    
    log_action(
        db=db,
        user_id=admin_user.id,
        user_email=admin_user.email,
        action="CREATE",
        resource_type="AI_AGENT",
        resource_id=str(config.id),
        details={
            "name": config.name,
            "provider": config.provider,
            "model": config.model,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens
        },
        ip_address=ip_address,
        success=True
    )
    
    return AIAgentConfigResponse(
        id=config.id, name=config.name, description=config.description,
        provider=config.provider, model=config.model, prompt_template=config.prompt_template,
        temperature=config.temperature, max_tokens=config.max_tokens,
        is_active=config.is_active, is_default=config.is_default,
        created_by=config.created_by, created_at=config.created_at,
        updated_at=config.updated_at
    )

@app.put("/ai-agents/{config_id}", response_model=AIAgentConfigResponse)
def update_ai_agent(config_id: int, config_data: AIAgentConfigUpdate, request: Request = None, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    ip_address = get_client_ip(request)
    
    config = db.query(AIAgentConfig).filter(AIAgentConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    changes = {}
    
    if config_data.name and config_data.name != config.name:
        existing_config = db.query(AIAgentConfig).filter(AIAgentConfig.name == config_data.name).first()
        if existing_config:
            log_action(
                db=db,
                user_id=admin_user.id,
                user_email=admin_user.email,
                action="UPDATE",
                resource_type="AI_AGENT",
                resource_id=str(config_id),
                ip_address=ip_address,
                success=False,
                error_message="Configuration name already exists"
            )
            raise HTTPException(status_code=400, detail="Configuration name already exists")
    
    # Test API keys if provided
    if config_data.openai_api_key or config_data.anthropic_api_key:
        provider = config_data.provider or config.provider
        model = config_data.model or config.model
        
        if provider == "openai" and config_data.openai_api_key:
            test_result = test_openai_config(
                config_data.openai_api_key, model, "Test", 0.1, 5, minimal=True
            )
        elif provider == "anthropic" and config_data.anthropic_api_key:
            test_result = test_anthropic_config(
                config_data.anthropic_api_key, model, "Test", 0.1, 5, minimal=True
            )
        else:
            test_result = {"success": True}
        
        if not test_result["success"]:
            log_action(
                db=db,
                user_id=admin_user.id,
                user_email=admin_user.email,
                action="UPDATE",
                resource_type="AI_AGENT",
                resource_id=str(config_id),
                ip_address=ip_address,
                success=False,
                error_message=f"AI configuration validation failed: {test_result['error']}"
            )
            raise HTTPException(status_code=400, detail=f"AI configuration validation failed: {test_result['error']}")
    
    if config_data.name is not None:
        changes['name'] = {'old': config.name, 'new': config_data.name}
        config.name = config_data.name
    if config_data.description is not None:
        changes['description'] = {'old': config.description, 'new': config_data.description}
        config.description = config_data.description
    if config_data.provider is not None:
        changes['provider'] = {'old': config.provider, 'new': config_data.provider}
        config.provider = config_data.provider
    if config_data.openai_api_key is not None:
        config.openai_api_key_encrypted = encrypt_api_key(config_data.openai_api_key)
        changes['openai_api_key'] = "updated"
    if config_data.anthropic_api_key is not None:
        config.anthropic_api_key_encrypted = encrypt_api_key(config_data.anthropic_api_key)
        changes['anthropic_api_key'] = "updated"
    if config_data.model is not None:
        changes['model'] = {'old': config.model, 'new': config_data.model}
        config.model = config_data.model
    if config_data.prompt_template is not None:
        changes['prompt_template'] = "updated"
        config.prompt_template = config_data.prompt_template
    if config_data.temperature is not None:
        changes['temperature'] = {'old': config.temperature, 'new': config_data.temperature}
        config.temperature = config_data.temperature
    if config_data.max_tokens is not None:
        changes['max_tokens'] = {'old': config.max_tokens, 'new': config_data.max_tokens}
        config.max_tokens = config_data.max_tokens
    if config_data.is_active is not None:
        changes['is_active'] = {'old': config.is_active, 'new': config_data.is_active}
        config.is_active = config_data.is_active
    
    config.updated_at = func.now()
    db.commit()
    db.refresh(config)
    
    log_action(
        db=db,
        user_id=admin_user.id,
        user_email=admin_user.email,
        action="UPDATE",
        resource_type="AI_AGENT",
        resource_id=str(config.id),
        details={
            "name": config.name,
            "changes": changes
        },
        ip_address=ip_address,
        success=True
    )
    
    return AIAgentConfigResponse(
        id=config.id, name=config.name, description=config.description,
        provider=config.provider, model=config.model, prompt_template=config.prompt_template,
        temperature=config.temperature, max_tokens=config.max_tokens,
        is_active=config.is_active, is_default=config.is_default,
        created_by=config.created_by, created_at=config.created_at,
        updated_at=config.updated_at
    )

@app.delete("/ai-agents/{config_id}")
def delete_ai_agent(config_id: int, request: Request = None, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    ip_address = get_client_ip(request)
    
    config = db.query(AIAgentConfig).filter(AIAgentConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    deleted_config_name = config.name
    
    if config.is_default:
        other_configs = db.query(AIAgentConfig).filter(AIAgentConfig.id != config_id).first()
        if other_configs:
            other_configs.is_default = True
            db.commit()
        else:
            log_action(
                db=db,
                user_id=admin_user.id,
                user_email=admin_user.email,
                action="DELETE",
                resource_type="AI_AGENT",
                resource_id=str(config_id),
                ip_address=ip_address,
                success=False,
                error_message="Cannot delete the last AI agent configuration"
            )
            raise HTTPException(status_code=400, detail="Cannot delete the last AI agent configuration")
    
    db.delete(config)
    db.commit()
    
    log_action(
        db=db,
        user_id=admin_user.id,
        user_email=admin_user.email,
        action="DELETE",
        resource_type="AI_AGENT",
        resource_id=str(config_id),
        details={
            "deleted_config_name": deleted_config_name,
            "was_default": config.is_default
        },
        ip_address=ip_address,
        success=True
    )
    
    return {"message": "Configuration deleted successfully"}

@app.post("/ai-agents/test")
def test_ai_agent(test_data: AIAgentTestRequest, request: Request = None, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    ip_address = get_client_ip(request)
    
    api_key = None
    
    if test_data.agent_id:
        config = db.query(AIAgentConfig).filter(AIAgentConfig.id == test_data.agent_id).first()
        if not config:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        
        try:
            if config.provider == "openai":
                api_key = decrypt_api_key(config.openai_api_key_encrypted)
            else:
                api_key = decrypt_api_key(config.anthropic_api_key_encrypted)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Failed to decrypt API key")
    else:
        if test_data.provider == "openai":
            if not test_data.openai_api_key:
                raise HTTPException(status_code=400, detail="OpenAI API key is required for testing")
            api_key = test_data.openai_api_key
        else:
            if not test_data.anthropic_api_key:
                raise HTTPException(status_code=400, detail="Anthropic API key is required for testing")
            api_key = test_data.anthropic_api_key
    
    if test_data.provider == "openai":
        result = test_openai_config(
            api_key, test_data.model, test_data.prompt,
            test_data.temperature, test_data.max_tokens, minimal=test_data.minimal
        )
    else:
        result = test_anthropic_config(
            api_key, test_data.model, test_data.prompt,
            test_data.temperature, test_data.max_tokens, minimal=test_data.minimal
        )
    
    return result

@app.post("/ai-agents/{config_id}/set-default")
def set_default_ai_agent(config_id: int, request: Request = None, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    ip_address = get_client_ip(request)
    
    config = db.query(AIAgentConfig).filter(AIAgentConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    db.query(AIAgentConfig).update({AIAgentConfig.is_default: False})
    db.commit()
    
    config.is_default = True
    config.updated_at = func.now()
    db.commit()
    db.refresh(config)
    
    log_action(
        db=db,
        user_id=admin_user.id,
        user_email=admin_user.email,
        action="UPDATE",
        resource_type="AI_AGENT",
        resource_id=str(config.id),
        details={"action": "set_as_default"},
        ip_address=ip_address,
        success=True
    )
    
    return {"message": "Default configuration updated successfully", "default_agent_id": config.id}

# AWS Account Management Routes
@app.get("/aws-accounts", response_model=List[AWSAccountResponse])
def get_aws_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = db.query(AWSAccount).order_by(AWSAccount.created_at.desc()).all()
    return [AWSAccountResponse(
        id=account.id, name=account.name, description=account.description,
        aws_account_id=account.aws_account_id, access_key_id=account.access_key_id,
        default_region=account.default_region, is_active=account.is_active,
        created_by=account.created_by, created_at=account.created_at,
        updated_at=account.updated_at
    ) for account in accounts]

@app.get("/debug/aws-accounts/{account_id}/decrypt-test")
def debug_decrypt_test(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Debug endpoint para testar a descriptografia da chave secreta"""
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    try:
        logger.info(f"Testing decryption for account {account_id}")
        logger.info(f"Encrypted key exists: {bool(account.secret_access_key_encrypted)}")
        logger.info(f"Encrypted key length: {len(account.secret_access_key_encrypted) if account.secret_access_key_encrypted else 0}")
        
        # Tentar descriptografar
        secret_key = decrypt_api_key(account.secret_access_key_encrypted)
        logger.info(f"Decryption successful, key length: {len(secret_key)}")
        
        # Testar credenciais AWS
        test_result = test_aws_credentials(account.access_key_id, secret_key, account.default_region)
        
        return {
            "success": True,
            "account_id": account.id,
            "decryption_successful": True,
            "secret_key_length": len(secret_key),
            "aws_test_result": test_result
        }
        
    except Exception as e:
        logger.error(f"Debug test failed: {str(e)}")
        return {
            "success": False,
            "account_id": account.id,
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.post("/aws-accounts", response_model=AWSAccountResponse)
def create_aws_account(account_data: AWSAccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_account = db.query(AWSAccount).filter(AWSAccount.aws_account_id == account_data.aws_account_id).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="AWS Account ID already exists")
    
    test_result = test_aws_credentials(
        account_data.access_key_id, account_data.secret_access_key, account_data.default_region
    )
    
    if not test_result["success"]:
        raise HTTPException(status_code=400, detail=f"AWS credential validation failed: {test_result['error']}")
    
    if test_result["account_id"] != account_data.aws_account_id:
        raise HTTPException(status_code=400, detail="AWS Account ID doesn't match the provided credentials")
    
    account = AWSAccount(
        name=account_data.name, description=account_data.description,
        aws_account_id=account_data.aws_account_id, access_key_id=account_data.access_key_id,
        secret_access_key_encrypted=encrypt_api_key(account_data.secret_access_key),
        default_region=account_data.default_region, is_active=account_data.is_active,
        created_by=current_user.id
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    
    return AWSAccountResponse(
        id=account.id, name=account.name, description=account.description,
        aws_account_id=account.aws_account_id, access_key_id=account.access_key_id,
        default_region=account.default_region, is_active=account.is_active,
        created_by=account.created_by, created_at=account.created_at,
        updated_at=account.updated_at
    )

@app.put("/aws-accounts/{account_id}", response_model=AWSAccountResponse)
def update_aws_account(account_id: int, account_data: AWSAccountUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    if account_data.aws_account_id and account_data.aws_account_id != account.aws_account_id:
        existing_account = db.query(AWSAccount).filter(AWSAccount.aws_account_id == account_data.aws_account_id).first()
        if existing_account:
            raise HTTPException(status_code=400, detail="AWS Account ID already exists")
    
    if account_data.access_key_id or account_data.secret_access_key:
        test_access_key = account_data.access_key_id or account.access_key_id
        test_secret_key = account_data.secret_access_key or decrypt_api_key(account.secret_access_key_encrypted)
        test_region = account_data.default_region or account.default_region
        
        test_result = test_aws_credentials(test_access_key, test_secret_key, test_region)
        
        if not test_result["success"]:
            raise HTTPException(status_code=400, detail=f"AWS credential validation failed: {test_result['error']}")
    
    if account_data.name is not None:
        account.name = account_data.name
    if account_data.description is not None:
        account.description = account_data.description
    if account_data.aws_account_id is not None:
        account.aws_account_id = account_data.aws_account_id
    if account_data.access_key_id is not None:
        account.access_key_id = account_data.access_key_id
    if account_data.secret_access_key is not None:
        account.secret_access_key_encrypted = encrypt_api_key(account_data.secret_access_key)
    if account_data.default_region is not None:
        account.default_region = account_data.default_region
    if account_data.is_active is not None:
        account.is_active = account_data.is_active
    
    account.updated_at = func.now()
    db.commit()
    db.refresh(account)
    
    return AWSAccountResponse(
        id=account.id, name=account.name, description=account.description,
        aws_account_id=account.aws_account_id, access_key_id=account.access_key_id,
        default_region=account.default_region, is_active=account.is_active,
        created_by=account.created_by, created_at=account.created_at,
        updated_at=account.updated_at
    )

@app.delete("/aws-accounts/{account_id}")
def delete_aws_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    db.delete(account)
    db.commit()
    
    return {"message": "AWS account deleted successfully"}

@app.post("/aws-accounts/{account_id}/test")
def test_aws_account_connection(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(AWSAccount).filter(AWSAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")
    
    try:
        secret_key = decrypt_api_key(account.secret_access_key_encrypted)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to decrypt secret access key")
    
    result = test_aws_credentials(account.access_key_id, secret_key, account.default_region)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
