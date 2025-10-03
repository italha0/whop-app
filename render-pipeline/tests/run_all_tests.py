#!/usr/bin/env python3
"""
Run all tests for the chat renderer.
"""

import sys
import subprocess
from pathlib import Path

def run_test_file(test_file: str) -> bool:
    """Run a single test file."""
    print(f"\n{'='*60}")
    print(f"Running {test_file}")
    print('='*60)
    
    try:
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=True, text=True, timeout=60)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print(f"❌ Test {test_file} timed out")
        return False
    except Exception as e:
        print(f"❌ Error running {test_file}: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Running all chat renderer tests...")
    
    test_dir = Path(__file__).parent
    test_files = [
        "test_render_basic.py",
        "test_audio_generation.py", 
        "test_appwrite_integration.py"
    ]
    
    passed = 0
    total = len(test_files)
    
    for test_file in test_files:
        test_path = test_dir / test_file
        if test_path.exists():
            if run_test_file(str(test_path)):
                passed += 1
        else:
            print(f"⚠️  Test file not found: {test_file}")
    
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS: {passed}/{total} test suites passed")
    print('='*60)
    
    if passed == total:
        print("🎉 All test suites passed!")
        return 0
    else:
        print("❌ Some test suites failed")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
