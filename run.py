#!/usr/bin/env python3
"""
PPT Generator - Run script with environment checks
"""

import os
import sys
import platform

def check_virtual_environment():
    """Check if we're running in a virtual environment"""
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    
    if not in_venv:
        print("⚠️  Warning: Not running in a virtual environment")
        print("🔧 Recommended setup:")
        if platform.system() == "Windows":
            print("   python -m venv venv")
            print("   venv\\Scripts\\activate")
        else:
            print("   python -m venv venv")
            print("   source venv/bin/activate")
        print("   pip install -r requirements.txt")
        print("\n💡 Or run: python setup.py")
        
        response = input("\nContinue anyway? (y/n): ")
        if not response.lower().startswith('y'):
            print("👋 Setup cancelled. Run setup.py first!")
            sys.exit(0)
    else:
        print("✅ Virtual environment detected")

def main():
    """Run the PPT Generator application"""
    
    print("🎯 PPT Generator")
    print("=" * 30)
    
    # Check virtual environment
    check_virtual_environment()
    
    # Check if requirements are installed
    try:
        import flask
        import pptx
        from flask_cors import CORS
        print("✅ Dependencies verified")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("🔧 Run setup first: python setup.py")
        print("   Or install manually: pip install -r requirements.txt")
        sys.exit(1)
    
    # Create uploads directory if it doesn't exist
    os.makedirs('uploads', exist_ok=True)
    
    print("\n🚀 Starting PPT Generator...")
    print("📝 Open your browser to: http://localhost:8080")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Import and run the Flask app
    from app import app
    app.run(debug=True, host='0.0.0.0', port=8080)

if __name__ == '__main__':
    main()

