#!/usr/bin/env python3
"""
Secure key generation script for production deployment
Run this script to generate secure keys for your .env file
"""

import os
import base64
import secrets
import string

def generate_jwt_secret(length=64):
    """Generate a secure JWT secret"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_encryption_key():
    """Generate a secure 32-byte encryption key"""
    key = os.urandom(32)
    return base64.urlsafe_b64encode(key).decode()

def generate_database_password(length=32):
    """Generate a secure database password"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    print("Generating secure keys for production deployment...\n")
    
    jwt_secret = generate_jwt_secret()
    encryption_key = generate_encryption_key()
    db_password = generate_database_password()
    
    print("Add these to your .env file:")
    print("=" * 50)
    print(f"JWT_SECRET={jwt_secret}")
    print(f"ENCRYPTION_KEY={encryption_key}")
    print(f"# Suggested database password: {db_password}")
    print("=" * 50)
    print("\nIMPORTANT: Store these keys securely and never commit them to version control!")
