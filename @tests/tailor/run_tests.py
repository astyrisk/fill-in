#!/usr/bin/env python3
"""
Test runner for the CV tailor tests.
"""

import unittest
import sys
import os

def run_tests():
    """Run all tests in the tailor directory."""
    # Add the parent directory to the path so we can import the tailor module
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../tailor')))
    
    # Discover and run all tests
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(os.path.abspath(__file__))
    suite = loader.discover(start_dir, pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return non-zero exit code if tests failed
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests())
