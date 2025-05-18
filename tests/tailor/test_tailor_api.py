import unittest
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import the tailor module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../tailor')))

# Try to import the tailor module
try:
    from tailor import app, tailor_cv_with_deepseek
except ImportError:
    print("Could not import tailor module. Make sure the tailor directory is in the path.")
    # Create mock objects for testing without the actual module
    app = MagicMock()
    tailor_cv_with_deepseek = MagicMock()

class TailorAPITestCase(unittest.TestCase):
    """Test case for the tailor API endpoints."""
    
    def setUp(self):
        """Set up the test client."""
        self.app = app.test_client()
        self.app.testing = True
    
    def test_health_endpoint(self):
        """Test the health endpoint."""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'healthy')
    
    @patch('tailor.OPENROUTER_API_KEY', 'test_key')
    def test_health_endpoint_with_api_key(self):
        """Test the health endpoint with an API key configured."""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('api_key_configured', data)
        self.assertTrue(data['api_key_configured'])
    
    @patch('tailor.OPENROUTER_API_KEY', '')
    def test_health_endpoint_without_api_key(self):
        """Test the health endpoint without an API key configured."""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('api_key_configured', data)
        self.assertFalse(data['api_key_configured'])
    
    def test_tailor_endpoint_missing_job_description(self):
        """Test the tailor endpoint with missing job description."""
        response = self.app.post('/tailor', json={})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Job description is required')
    
    @patch('tailor.request_queue.put')
    @patch('tailor.uuid.uuid4')
    def test_tailor_endpoint_success(self, mock_uuid, mock_queue_put):
        """Test the tailor endpoint with a valid request."""
        mock_uuid.return_value = 'test-uuid'
        
        response = self.app.post('/tailor', json={'job_description': 'Test job description'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('success', data)
        self.assertTrue(data['success'])
        self.assertIn('request_id', data)
        self.assertEqual(data['request_id'], 'test-uuid')
        
        # Check that the request was added to the queue
        mock_queue_put.assert_called_once()
    
    @patch('tailor.requests.post')
    def test_tailor_cv_with_deepseek(self, mock_post):
        """Test the tailor_cv_with_deepseek function."""
        # Mock the response from the OpenRouter API
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [
                {
                    'message': {
                        'content': '```yaml\nname: John Doe\n```'
                    }
                }
            ]
        }
        mock_post.return_value = mock_response
        
        # Call the function
        result = tailor_cv_with_deepseek(None, 'Test job description')
        
        # Check that the result is as expected
        self.assertIsNotNone(result)
        self.assertEqual(result, {'name': 'John Doe'})
        
        # Check that the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], 'https://openrouter.ai/api/v1/chat/completions')
        self.assertIn('json', kwargs)
        self.assertIn('messages', kwargs['json'])

if __name__ == '__main__':
    unittest.main()
