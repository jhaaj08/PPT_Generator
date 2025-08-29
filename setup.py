#!/usr/bin/env python3
"""
PPT Generator - Setup Script
Creates virtual environment and installs dependencies
"""

import os
import sys
import subprocess
import platform

def run_command(command, check=True):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=check, 
                              capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def main():
    """Set up the PPT Generator environment"""
    
    print("🚀 PPT Generator Setup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Check if we're already in a virtual environment
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("📝 Already in a virtual environment")
        install_deps = input("Install dependencies? (y/n): ").lower().startswith('y')
        if install_deps:
            print("\n📦 Installing dependencies...")
            success, stdout, stderr = run_command("pip install -r requirements.txt")
            if success:
                print("✅ Dependencies installed successfully")
            else:
                print(f"❌ Failed to install dependencies: {stderr}")
                sys.exit(1)
    else:
        # Create virtual environment
        print("\n🔧 Creating virtual environment...")
        
        venv_command = "python -m venv venv"
        if platform.system() == "Windows":
            activate_command = r"venv\Scripts\activate"
            pip_command = r"venv\Scripts\pip"
        else:
            activate_command = "source venv/bin/activate"
            pip_command = "venv/bin/pip"
        
        success, stdout, stderr = run_command(venv_command)
        if not success:
            print(f"❌ Failed to create virtual environment: {stderr}")
            sys.exit(1)
        
        print("✅ Virtual environment created")
        
        # Install dependencies
        print("\n📦 Installing dependencies...")
        success, stdout, stderr = run_command(f"{pip_command} install --upgrade pip")
        if not success:
            print(f"⚠️  Warning: Could not upgrade pip: {stderr}")
        
        success, stdout, stderr = run_command(f"{pip_command} install -r requirements.txt")
        if not success:
            print(f"❌ Failed to install dependencies: {stderr}")
            sys.exit(1)
        
        print("✅ Dependencies installed successfully")
    
    # Create uploads directory
    os.makedirs('uploads', exist_ok=True)
    print("✅ Created uploads directory")
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    
    if not (hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)):
        if platform.system() == "Windows":
            print("   1. Activate virtual environment: venv\\Scripts\\activate")
        else:
            print("   1. Activate virtual environment: source venv/bin/activate")
    
    print("   2. Run the application: python run.py")
    print("   3. Open browser to: http://localhost:8080")
    print("\n🔑 Don't forget to get your LLM API key:")
    print("   - OpenAI: https://platform.openai.com/api-keys")
    print("   - Anthropic: https://console.anthropic.com/")
    print("   - Google AI: https://aistudio.google.com/app/apikey")

if __name__ == '__main__':
    main()
