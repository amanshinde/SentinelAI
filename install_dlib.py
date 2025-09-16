#!/usr/bin/env python3
"""
Dlib Installation Helper for SentinelAI
Checks system requirements and installs dlib with dependencies
"""

import subprocess
import sys
import os
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 7:
        print(f"✓ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"✗ Python {version.major}.{version.minor}.{version.micro} is not compatible")
        print("Please install Python 3.7 or higher")
        return False

def install_cmake():
    """Install CMake if not available"""
    try:
        subprocess.run(["cmake", "--version"], check=True, capture_output=True)
        print("✓ CMake is already installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("CMake not found, attempting to install...")
        
        system = platform.system().lower()
        if system == "windows":
            print("Please install CMake manually from: https://cmake.org/download/")
            print("Or use: winget install Kitware.CMake")
            return False
        elif system == "darwin":  # macOS
            return run_command("brew install cmake", "Installing CMake via Homebrew")
        else:  # Linux
            return run_command("sudo apt-get update && sudo apt-get install cmake", "Installing CMake")

def install_visual_studio_tools():
    """Install Visual Studio Build Tools on Windows"""
    if platform.system().lower() != "windows":
        return True
    
    print("\nFor Windows, you need Visual Studio Build Tools...")
    print("Please install one of the following:")
    print("1. Visual Studio Community (recommended)")
    print("2. Visual Studio Build Tools")
    print("3. Or run: winget install Microsoft.VisualStudio.2022.BuildTools")
    
    response = input("Have you installed Visual Studio Build Tools? (y/n): ")
    return response.lower() in ['y', 'yes']

def main():
    """Main installation process"""
    print("SentinelAI Dlib Installation Helper")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Install system dependencies
    if platform.system().lower() == "windows":
        if not install_visual_studio_tools():
            print("\n✗ Visual Studio Build Tools required for Windows")
            return False
    
    if not install_cmake():
        print("\n✗ CMake installation failed")
        return False
    
    # Upgrade pip
    if not run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install wheel and setuptools
    if not run_command(f"{sys.executable} -m pip install wheel setuptools", "Installing build tools"):
        return False
    
    # Install numpy first (dlib dependency)
    if not run_command(f"{sys.executable} -m pip install numpy", "Installing numpy"):
        return False
    
    # Install dlib
    print("\nInstalling dlib (this may take several minutes)...")
    if not run_command(f"{sys.executable} -m pip install dlib", "Installing dlib"):
        print("\nIf dlib installation failed, try:")
        print("1. Install pre-compiled wheel: pip install dlib-binary")
        print("2. Or use conda: conda install -c conda-forge dlib")
        return False
    
    # Install other requirements
    if not run_command(f"{sys.executable} -m pip install opencv-python Pillow", "Installing OpenCV and Pillow"):
        return False
    
    # Test installation
    print("\nTesting dlib installation...")
    try:
        import dlib
        import cv2
        import numpy as np
        print("✓ All packages imported successfully")
        
        # Test dlib detector
        detector = dlib.get_frontal_face_detector()
        print("✓ Dlib face detector initialized")
        
        print("\n🎉 Dlib installation completed successfully!")
        print("Your SentinelAI system can now use high-accuracy face recognition!")
        return True
        
    except ImportError as e:
        print(f"✗ Import test failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n❌ Installation failed. Please check the errors above.")
        sys.exit(1)
    else:
        print("\n✅ Installation successful!")
