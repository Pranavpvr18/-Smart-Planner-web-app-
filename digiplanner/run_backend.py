#!/usr/bin/env python3
"""
Quick start script for Smart Planner Backend
Run this from the project root directory (digiplanner/)
"""

import os
import sys
from pathlib import Path

# Get the directory where this script is located (project root)
PROJECT_ROOT = Path(__file__).parent.absolute()

# Change to project root directory
os.chdir(PROJECT_ROOT)

# Add project root to Python path
sys.path.insert(0, str(PROJECT_ROOT))

# Import the Flask app from backend package
from backend.app import app

if __name__ == '__main__':
    print("=" * 60)
    print("Smart Planner Backend Server")
    print("=" * 60)
    print(f"\nProject root: {PROJECT_ROOT}")
    print("Starting server on http://localhost:5000")
    print("API endpoints available at http://localhost:5000/api")
    print("\nPress CTRL+C to stop the server")
    print("=" * 60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
