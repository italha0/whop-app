#!/usr/bin/env python3
"""
Tests for audio generation functionality.
"""

import os
import sys
import tempfile
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_audio_imports():
    """Test audio generation imports."""
    print("Testing audio generation imports...")
    
    try:
        import numpy as np
        from scipy.io import wavfile
        print("✅ Audio dependencies available")
        return True
    except ImportError as e:
        print(f"❌ Audio dependencies not available: {e}")
        print("Install with: pip install numpy scipy")
        return False

def test_audio_file_generation():
    """Test audio file generation."""
    print("Testing audio file generation...")
    
    try:
        from renderer.utils import generate_audio_file
        
        # Test keyboard click generation
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            temp_file = f.name
        
        try:
            generate_audio_file('keyboard_click', temp_file)
            
            if os.path.exists(temp_file) and os.path.getsize(temp_file) > 0:
                print("✅ Keyboard click audio generated successfully")
            else:
                print("❌ Keyboard click audio generation failed")
                return False
                
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        
        # Test send chime generation
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            temp_file = f.name
        
        try:
            generate_audio_file('send_chime', temp_file)
            
            if os.path.exists(temp_file) and os.path.getsize(temp_file) > 0:
                print("✅ Send chime audio generated successfully")
            else:
                print("❌ Send chime audio generation failed")
                return False
                
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        
        # Test receive chime generation
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            temp_file = f.name
        
        try:
            generate_audio_file('receive_chime', temp_file)
            
            if os.path.exists(temp_file) and os.path.getsize(temp_file) > 0:
                print("✅ Receive chime audio generated successfully")
            else:
                print("❌ Receive chime audio generation failed")
                return False
                
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        
        return True
        
    except ImportError as e:
        print(f"❌ Audio generation test failed - missing dependencies: {e}")
        return False
    except Exception as e:
        print(f"❌ Audio generation test failed: {e}")
        return False

def test_audio_assets_creation():
    """Test audio assets creation."""
    print("Testing audio assets creation...")
    
    try:
        from renderer.utils import ensure_audio_assets
        
        audio_assets = ensure_audio_assets()
        
        # Check that all required audio files exist
        required_files = ['keyboard_click', 'send_chime', 'receive_chime']
        for file_type in required_files:
            if file_type not in audio_assets:
                print(f"❌ Missing audio asset: {file_type}")
                return False
            
            if not os.path.exists(audio_assets[file_type]):
                print(f"❌ Audio file does not exist: {audio_assets[file_type]}")
                return False
            
            # Check file size (should be > 0)
            file_size = os.path.getsize(audio_assets[file_type])
            if file_size == 0:
                print(f"❌ Audio file is empty: {audio_assets[file_type]}")
                return False
            
            print(f"✅ {file_type} audio file exists ({file_size} bytes)")
        
        return True
        
    except ImportError as e:
        print(f"❌ Audio assets test failed - missing dependencies: {e}")
        return False
    except Exception as e:
        print(f"❌ Audio assets test failed: {e}")
        return False

def test_audio_file_format():
    """Test audio file format validation."""
    print("Testing audio file format...")
    
    try:
        from renderer.utils import ensure_audio_assets
        from scipy.io import wavfile
        
        audio_assets = ensure_audio_assets()
        
        for file_type, file_path in audio_assets.items():
            try:
                sample_rate, audio_data = wavfile.read(file_path)
                
                # Validate basic properties
                if sample_rate != 44100:
                    print(f"❌ {file_type} has wrong sample rate: {sample_rate}")
                    return False
                
                if len(audio_data.shape) != 1:  # Should be mono
                    print(f"❌ {file_type} is not mono audio")
                    return False
                
                if audio_data.dtype != np.int16:
                    print(f"❌ {file_type} has wrong data type: {audio_data.dtype}")
                    return False
                
                print(f"✅ {file_type} audio format is valid (44.1kHz, mono, 16-bit)")
                
            except Exception as e:
                print(f"❌ Failed to read {file_type} audio file: {e}")
                return False
        
        return True
        
    except ImportError as e:
        print(f"❌ Audio format test failed - missing dependencies: {e}")
        return False
    except Exception as e:
        print(f"❌ Audio format test failed: {e}")
        return False

def run_audio_tests():
    """Run all audio tests."""
    print("🧪 Running audio generation tests...\n")
    
    tests = [
        test_audio_imports,
        test_audio_file_generation,
        test_audio_assets_creation,
        test_audio_file_format,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 Audio Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All audio tests passed!")
        return True
    else:
        print("❌ Some audio tests failed")
        return False

if __name__ == '__main__':
    success = run_audio_tests()
    sys.exit(0 if success else 1)

