import yaml
import requests
import os
import json
import subprocess
import shutil
import queue
import threading
import uuid
import time
from flask import Flask, request, jsonify
from config import config

# Configuration
DEFAULT_CV_PATH = "default_cv.yaml"
JOB_DESC_PATH = "job_description.txt"
RAW_RESPONSE_PATH = os.path.abspath("raw_response.txt")
# Get API configuration from config module
OPENROUTER_API_KEY = config['openrouter_api_key']
OPENROUTER_API_URL = config['openrouter_api_url']
OPENROUTER_MODEL = config['model']

app = Flask(__name__)

# Queue for processing requests
request_queue = queue.Queue()
# Dictionary to track request status
request_status = {}
# Lock for thread-safe operations on the request_status dictionary
status_lock = threading.Lock()
# Timeout values (in seconds)
QUEUED_TIMEOUT = 300  # 5 minutes
PROCESSING_TIMEOUT = 600  # 10 minutes
# Time after which completed/failed requests are removed from memory (1 day)
CLEANUP_TIMEOUT = 86400  # 24 hours

# Step 1: Load the default CV
def load_yaml(file_path):
    with open(file_path, 'r') as file:
        return yaml.safe_load(file)

# Step 2: Load or input job description
def get_job_description(file_path=None):
    if file_path and os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return file.read()
    else:
        return input("Paste the job description here:\n")

# Step 3: Call OpenRouter API with DeepSeek V3 (free tier) to tailor the CV
def tailor_cv_with_deepseek(_, job_description):  # default_cv parameter not used
    # Get the original YAML string to show the exact format
    with open(DEFAULT_CV_PATH, 'r') as file:
        original_yaml_str = file.read()

    # Use the default prompt from tailor-old.py
    prompt = (
        "You are an expert resume writer. I have a default CV in YAML format and a job description. "
        "Tailor the CV to match the ats important keywords and "
        "to optimize it for ATS systems. pick the relavant projects (4 projects) and activities. "
        "Don't add new information. "
        "Return *only* the tailored CV in YAML format, with no additional text "
        "or explanations. Ensure all 'highlights' fields are simple strings (e.g., 'GPA: 4.0/5.0'). "
        "IMPORTANT: You must preserve the exact same order of sections and fields as in the original YAML. "
        "Do not change the structure or order of the YAML, only modify the content to match the job description. "
        "You can change the following fields: name, date, label, details, highlights "
        "In summary, I am a fresh graduate student, So you can start with that . "
        "Use ** to make text bold as markdown syntax. "
        "Don't add any new fields. "
        "Also, add a field called 'filename' at the very top of the YAML with a suggested filename for the CV that includes the job title, applicant and compant name. "
        "Here is the exact format of the original YAML:\n\n" + original_yaml_str + "\n\n"
        "Job Description:\n" + job_description + "\n\n"
        "Output the tailored CV in YAML format with the exact same structure and order as the original, plus the filename field at the top."
    )

    # Log the API key being used (with partial masking for security)
    api_key = OPENROUTER_API_KEY.strip()  # Ensure no whitespace
    masked_key = f"{api_key[:8]}...{api_key[-8:]}" if len(api_key) > 16 else "Invalid API key format"
    print(f"Using API key: {masked_key}")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "CV Tailor Script"
    }

    # Log the model being used
    model = OPENROUTER_MODEL
    print(f"Using model: {model}")

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.7
    }

    print(f"Making request to OpenRouter API URL: {OPENROUTER_API_URL}")
    try:
        response = requests.post(
            url=OPENROUTER_API_URL,
            headers=headers,
            data=json.dumps(payload)
        )

        # Log the response status code
        print(f"OpenRouter API response status code: {response.status_code}")

        if response.status_code == 200:
            tailored_cv_text = response.json()["choices"][0]["message"]["content"].strip()

            # Save the raw response for debugging
            with open(RAW_RESPONSE_PATH, 'w') as f:
                f.write(tailored_cv_text)

            try:
                # Check for YAML code block markers
                start_marker = "```yaml"
                end_marker = "```"

                if start_marker in tailored_cv_text:
                    start_idx = tailored_cv_text.index(start_marker) + len(start_marker)
                    try:
                        end_idx = tailored_cv_text.index(end_marker, start_idx)
                        yaml_text = tailored_cv_text[start_idx:end_idx].strip()
                    except ValueError:
                        # If no end marker is found, just use everything after the start marker
                        yaml_text = tailored_cv_text[start_idx:].strip()
                        print("No end marker found, using all content after start marker")
                else:
                    yaml_text = tailored_cv_text

                # Remove any remaining code block markers if they exist
                if yaml_text.startswith("```") or "```yaml" in yaml_text:
                    yaml_text = yaml_text.replace("```yaml", "").replace("```", "").strip()

                # Try to parse the YAML
                tailored_cv = yaml.safe_load(yaml_text)

                # Check if we got a valid result
                if not tailored_cv or not isinstance(tailored_cv, dict):
                    print(f"Invalid YAML structure: {type(tailored_cv)}")
                    # Create a minimal valid structure
                    return {
                        'filename': 'tailored_cv.pdf',
                        'name': 'CV Parsing Error',
                        'location': 'Error occurred while parsing the CV',
                        'sections': []
                    }

                return tailored_cv
            except yaml.YAMLError as e:
                with open(RAW_RESPONSE_PATH, 'w') as f:
                    f.write(tailored_cv_text)
                print(f"Error parsing tailored CV YAML: {e}")
                print(f"Raw response saved to {RAW_RESPONSE_PATH}")

                # Create a minimal valid structure
                return {
                    'filename': 'tailored_cv.pdf',
                    'name': 'CV Parsing Error',
                    'location': 'Error occurred while parsing the CV',
                    'sections': []
                }
        else:
            with open(RAW_RESPONSE_PATH, 'w') as f:
                f.write(response.text)
            print(f"OpenRouter API error: {response.status_code} - {response.text}")
            print(f"Raw response saved to {RAW_RESPONSE_PATH}")
            return None
    except Exception as e:
        error_message = f"Exception when calling OpenRouter API: {str(e)}"
        print(error_message)
        with open(RAW_RESPONSE_PATH, 'w') as f:
            f.write(error_message)
        return None

# Step 4: Save the tailored CV
def save_yaml(data, file_path):
    with open(file_path, 'w') as file:
        yaml.dump(data, file, default_flow_style=False, sort_keys=False)
    print(f"Tailored CV saved to {file_path}")

# Step 5: Render the tailored CV to PDF using RenderCV CLI
def render_cv(yaml_path, output_pdf=None):
    if not output_pdf:
        output_pdf = os.path.abspath("tailored_cv.pdf")

    if not os.path.exists(yaml_path):
        print(f"Error: YAML file {yaml_path} does not exist.")
        return False

    # Log the render operation
    print(f"Rendering CV from {yaml_path} to {output_pdf}")

    try:
        # Run rendercv without --output, let it create default output
        subprocess.run(["rendercv", "render", yaml_path], check=True)

        # Find the generated PDF in the rendercv_output directory
        rendercv_output_dir = os.path.join(os.path.dirname(yaml_path), "rendercv_output")
        print(f"Looking for output in {rendercv_output_dir}")

        if os.path.exists(rendercv_output_dir):
            # Look for PDF files in the output directory
            pdf_files = [f for f in os.listdir(rendercv_output_dir) if f.endswith('.pdf')]
            print(f"Found {len(pdf_files)} PDF files in output directory")

            if pdf_files:
                # Use the first PDF file found (there should typically be only one)
                default_pdf = os.path.join(rendercv_output_dir, pdf_files[0])
                print(f"Found PDF: {default_pdf}")

                # Make sure the output directory exists
                output_dir = os.path.dirname(os.path.abspath(output_pdf))
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir, exist_ok=True)
                    print(f"Created output directory: {output_dir}")

                # Move the default PDF to desired location
                shutil.move(default_pdf, output_pdf)
                print(f"PDF generated and moved to: {output_pdf}")

                # Clean up the rendercv_output directory after moving the PDF
                try:
                    shutil.rmtree(rendercv_output_dir)
                    print(f"Cleaned up {rendercv_output_dir}")
                except Exception as e:
                    print(f"Warning: Could not remove rendercv_output directory: {e}")

                return True
            else:
                print(f"No PDF files found in {rendercv_output_dir}")
                return False
        else:
            print(f"Output directory {rendercv_output_dir} not found")
            return False
    except subprocess.CalledProcessError as e:
        print(f"Error running RenderCV CLI: {e}")
        with open(yaml_path, 'r') as f:
            print(f"Contents of {yaml_path}:\n{f.read()}")
        return False
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return False

# Main execution
def main():
    default_cv = load_yaml(DEFAULT_CV_PATH)
    if not default_cv:
        print("Error loading default CV.")
        return

    job_description = get_job_description(JOB_DESC_PATH)
    if not job_description:
        print("No job description provided.")
        return

    tailored_cv = tailor_cv_with_deepseek(default_cv, job_description)
    if not tailored_cv:
        print("Failed to tailor CV.")
        return

    # Extract filename if provided
    pdf_filename = "tailored_cv.pdf"  # Default filename
    if 'filename' in tailored_cv:
        suggested_filename = tailored_cv.pop('filename')  # Remove from CV data
        if suggested_filename:
            # Remove .yaml if present in the filename
            suggested_filename = suggested_filename.replace(".yaml", "")

            # Also remove any .yaml.pdf extension and replace with just .pdf
            suggested_filename = suggested_filename.replace(".yaml.pdf", ".pdf")

            # Remove quotes if they exist
            suggested_filename = suggested_filename.strip('"\'')

            # Ensure it has .pdf extension
            if not suggested_filename.lower().endswith('.pdf'):
                suggested_filename += '.pdf'
            pdf_filename = suggested_filename

    print("pdf filename: ", pdf_filename)
    # Save the final output path for the PDF
    final_output_pdf_path = os.path.abspath(pdf_filename)

    # Create a temporary YAML file for processing
    temp_yaml_path = os.path.abspath("temp_tailored_cv.yaml")
    save_yaml(tailored_cv, temp_yaml_path)
    print(f"Saved temporary YAML file: {temp_yaml_path}")

    # Render the CV
    success = render_cv(temp_yaml_path, output_pdf=pdf_filename)

    # Remove the temporary YAML file after PDF generation
    if os.path.exists(temp_yaml_path):
        os.remove(temp_yaml_path)
        print(f"Removed temporary YAML file: {temp_yaml_path}")

    # Clean up the rendercv_output directory if it exists
    rendercv_output_dir = os.path.join(os.path.dirname(temp_yaml_path), "rendercv_output")
    if os.path.exists(rendercv_output_dir):
        try:
            shutil.rmtree(rendercv_output_dir)
            print(f"Cleaned up {rendercv_output_dir}")
        except Exception as e:
            print(f"Warning: Could not remove rendercv_output directory: {e}")

    if success:
        # The PDF should already be at the final_output_pdf_path location
        if os.path.exists(final_output_pdf_path):
            print(f"CV tailored and saved as {pdf_filename}")
        else:
            print(f"PDF file {pdf_filename} was not found at the expected location.")
    else:
        print("Failed to generate PDF.")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "api_key_configured": bool(OPENROUTER_API_KEY)
    })

@app.route('/restart', methods=['POST'])
def restart_service():
    """Endpoint to restart the tailor service"""
    # Reload configuration to ensure we have the latest settings
    from config import load_config
    global OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_MODEL
    current_config = load_config()

    # Ensure API key is properly formatted (trimmed, etc.)
    api_key = current_config['openrouter_api_key'].strip()
    OPENROUTER_API_KEY = api_key
    OPENROUTER_API_URL = current_config['openrouter_api_url']
    OPENROUTER_MODEL = current_config['model']

    # Log the restart
    masked_key = f"{api_key[:8]}...{api_key[-8:]}" if len(api_key) > 16 else "Invalid API key format"
    print("Tailor service restarted with updated configuration")
    print(f"API Key: {masked_key} (length: {len(api_key)})")
    print(f"API Key starts with 'sk-or-': {api_key.startswith('sk-or-')}")
    print(f"Model: {OPENROUTER_MODEL}")
    print(f"API URL: {OPENROUTER_API_URL}")

    return jsonify({
        "success": True,
        "message": "Tailor service restarted successfully",
        "config": {
            "api_key_masked": masked_key,
            "api_key_length": len(api_key),
            "api_key_valid_format": api_key.startswith('sk-or-'),
            "model": OPENROUTER_MODEL,
            "api_url": OPENROUTER_API_URL
        }
    })

@app.route('/config-status', methods=['GET'])
def config_status():
    """Endpoint to check the current configuration status"""
    # Mask the API key for security
    api_key = OPENROUTER_API_KEY.strip()
    masked_key = f"{api_key[:8]}...{api_key[-8:]}" if len(api_key) > 16 else "Invalid API key format"

    return jsonify({
        "success": True,
        "config": {
            "api_key_masked": masked_key,
            "api_key_length": len(api_key),
            "api_key_valid_format": api_key.startswith('sk-or-'),
            "model": OPENROUTER_MODEL,
            "api_url": OPENROUTER_API_URL
        }
    })

@app.route('/config', methods=['POST'])
def update_config():
    """Endpoint to update the configuration"""
    global OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_MODEL

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Update the configuration
    updated_config = config.copy()

    if 'openrouter_api_key' in data:
        # Ensure API key is properly formatted (trimmed, etc.)
        api_key = data['openrouter_api_key'].strip()

        # Log the API key being updated (with partial masking for security)
        masked_key = f"{api_key[:8]}...{api_key[-8:]}" if len(api_key) > 16 else "Invalid API key format"
        print(f"Updating API key: {masked_key} (length: {len(api_key)})")

        # Check if API key is in the correct format
        if api_key and not api_key.startswith("sk-or-"):
            print(f"WARNING: API key format is invalid. API key must start with 'sk-or-'. Current key: {masked_key}")

        updated_config['openrouter_api_key'] = api_key
        OPENROUTER_API_KEY = api_key

    if 'model' in data:
        model = data['model']
        print(f"Updating model: {model}")
        updated_config['model'] = model
        OPENROUTER_MODEL = model

    # Save the updated configuration
    from config import save_config
    success = save_config(updated_config)

    if success:
        print("Configuration updated and saved successfully")
        return jsonify({
            "success": True,
            "message": "Configuration updated successfully"
        })
    else:
        print("Failed to save configuration")
        return jsonify({
            "success": False,
            "message": "Failed to save configuration"
        }), 500

@app.route('/test-api-key', methods=['POST'])
def test_api_key():
    """Endpoint to test an OpenRouter API key"""
    data = request.json
    if not data or 'api_key' not in data:
        return jsonify({"error": "API key is required"}), 400

    api_key = data['api_key'].strip()  # Trim any whitespace

    # Check if API key is in the correct format
    if not api_key.startswith("sk-or-"):
        return jsonify({
            "success": False,
            "message": f"API key format is invalid. OpenRouter API keys should start with 'sk-or-'"
        }), 400

    # Log the API key being tested (with partial masking for security)
    masked_key = f"{api_key[:8]}...{api_key[-8:]}" if len(api_key) > 16 else "Invalid API key format"
    print(f"Testing API key: {masked_key}")
    print(f"API key length: {len(api_key)}")

    # Test the API key by making a request to OpenRouter
    auth_header = f"Bearer {api_key}"
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "CV Tailor Script"
    }

    try:
        # First, make a simple request to get available models
        print("Making request to get available models")
        response = requests.get(
            url="https://openrouter.ai/api/v1/models",
            headers=headers
        )

        if response.status_code != 200:
            error_text = response.text
            print(f"API key validation failed: {response.status_code} - {error_text}")

            # Try to parse the error response for more details
            error_message = "API key validation failed"
            try:
                error_json = response.json()
                if 'error' in error_json and 'message' in error_json['error']:
                    error_message = f"API key validation failed: {error_json['error']['message']}"
            except:
                # If we can't parse the JSON, use the raw text
                if error_text:
                    error_message = f"API key validation failed: {error_text}"

            return jsonify({
                "success": False,
                "message": error_message
            }), 400

        # Check if DeepSeek model is available
        models_data = response.json()
        has_deepseek = False
        deepseek_model_id = None
        available_models = []

        if 'data' in models_data:
            for model in models_data['data']:
                if 'id' in model:
                    available_models.append(model['id'])
                    if 'deepseek' in model['id'].lower():
                        has_deepseek = True
                        deepseek_model_id = model['id']
                        print(f"Found DeepSeek model: {deepseek_model_id}")

        print(f"Available models: {', '.join(available_models)}")

        # Now, test the API key with the actual model we'll use for tailoring
        # This ensures we're testing the exact same configuration that will be used for tailoring
        test_model = deepseek_model_id or "deepseek/deepseek-chat-v3-0324:free"
        print(f"Testing API key with model: {test_model}")

        test_payload = {
            "model": test_model,
            "messages": [
                {"role": "user", "content": "Hello, this is a test message. Please respond with 'OK' if you can hear me."}
            ],
            "max_tokens": 10,
            "temperature": 0.7
        }

        test_response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=test_payload
        )

        if test_response.status_code != 200:
            error_text = test_response.text
            print(f"API key test with model failed: {test_response.status_code} - {error_text}")

            # Try to parse the error response for more details
            error_message = "API key validation with model failed"
            try:
                error_json = test_response.json()
                if 'error' in error_json and 'message' in error_json['error']:
                    error_message = f"API key validation with model failed: {error_json['error']['message']}"

                    # Add more specific guidance based on common error messages
                    if "No auth credentials found" in error_json['error']['message']:
                        error_message += ". Please check that your API key is correct and active."
                    elif "insufficient_quota" in error_json['error'].get('code', ''):
                        error_message += ". Your OpenRouter account has insufficient credits."
                    elif "model_not_found" in error_json['error'].get('code', ''):
                        error_message += ". The DeepSeek model is not available with your API key."
            except:
                # If we can't parse the JSON, use the raw text
                if error_text:
                    error_message = f"API key validation with model failed: {error_text}"

            return jsonify({
                "success": False,
                "message": error_message
            }), 400

        print("API key test with model successful")

        # For testing purposes, we'll temporarily use the API key but not save it to the config file
        # This allows the frontend to test the API key without overwriting the backend configuration
        global OPENROUTER_API_KEY
        temp_api_key = OPENROUTER_API_KEY  # Save the current API key
        OPENROUTER_API_KEY = api_key  # Temporarily set the new API key for testing

        # Check if we should save the configuration (opt-in)
        save_to_config = data.get('save_to_config', False)
        save_success = False

        if save_to_config:
            # Update the configuration file
            from config import save_config
            updated_config = config.copy()
            updated_config['openrouter_api_key'] = api_key

            # If we found a DeepSeek model, update the model ID
            if deepseek_model_id:
                global OPENROUTER_MODEL
                OPENROUTER_MODEL = deepseek_model_id
                updated_config['model'] = deepseek_model_id

            # Save the updated configuration
            save_success = save_config(updated_config)

            # Log the configuration update
            if save_success:
                print(f"Configuration updated with new API key and model: {deepseek_model_id}")
            else:
                print("Failed to save configuration file with new API key")
                # Restore the original API key if save failed
                OPENROUTER_API_KEY = temp_api_key
        else:
            # Restore the original API key since we're not saving
            OPENROUTER_API_KEY = temp_api_key
            print("API key tested successfully but not saved to configuration")

        return jsonify({
            "success": True,
            "has_deepseek": has_deepseek,
            "config_saved": save_success,
            "model_tested": test_model,
            "message": "API key is valid" + (" and DeepSeek model is available" if has_deepseek else " but DeepSeek model was not found")
        })

    except Exception as e:
        print(f"Error testing API key: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error testing API key: {str(e)}"
        }), 500

@app.route('/tailor', methods=['POST'])
def tailor_endpoint():
    data = request.json

    if not data or 'job_description' not in data:
        return jsonify({"error": "Job description is required"}), 400

    job_description = data.get('job_description')

    # Generate a unique request ID
    request_id = str(uuid.uuid4())
    print(f"Received new tailor request with ID: {request_id}")

    # Initialize request status
    with status_lock:
        request_status[request_id] = {
            'status': 'queued',
            'created_at': time.time()
        }
        # Log the current queue size
        queue_size = request_queue.qsize()
        print(f"Current queue size before adding new request: {queue_size}")

    # Add the request to the queue
    request_queue.put((request_id, job_description))
    print(f"Added request {request_id} to the queue")

    # Return the request ID to the client
    return jsonify({
        "success": True,
        "message": "CV tailoring request has been queued",
        "request_id": request_id
    })

@app.route('/status/<request_id>', methods=['GET'])
def status_endpoint(request_id):
    with status_lock:
        if request_id not in request_status:
            return jsonify({"error": "Request ID not found"}), 404

        status_data = request_status[request_id].copy()

    # Return the status information
    return jsonify({
        "request_id": request_id,
        "status": status_data
    })

@app.route('/completed-requests', methods=['GET'])
def completed_requests_endpoint():
    completed = []

    with status_lock:
        for req_id, data in request_status.items():
            if data.get('status') == 'completed':
                completed.append({
                    'request_id': req_id,
                    'filename': data.get('filename', ''),
                    'completed_at': data.get('completed_at', time.time())
                })

    return jsonify({
        "completed_requests": completed
    })

@app.route('/notifications', methods=['GET'])
def notifications_endpoint():
    """Endpoint to get new notifications about completed CVs"""
    new_notifications = []

    with status_lock:
        for req_id, data in request_status.items():
            if data.get('status') == 'completed' and data.get('notified') is False:
                new_notifications.append({
                    'request_id': req_id,
                    'filename': data.get('filename', ''),
                    'completed_at': data.get('completed_at', time.time())
                })
                # Mark as notified
                data['notified'] = True

    return jsonify({
        "notifications": new_notifications
    })

# Function to check for stale requests and mark them as failed
def check_stale_requests():
    """
    Periodically checks for requests that have been in 'queued' or 'processing' state
    for too long and marks them as failed. Also cleans up old completed/failed requests.
    """
    while True:
        try:
            current_time = time.time()
            stale_requests = []
            requests_to_remove = []

            # Identify stale requests and old requests to clean up
            with status_lock:
                for req_id, data in request_status.items():
                    status = data.get('status')
                    created_at = data.get('created_at', 0)

                    # Check if the request is stale based on its status
                    if status == 'queued' and (current_time - created_at) > QUEUED_TIMEOUT:
                        stale_requests.append((req_id, 'Request timed out in queue'))
                    elif status == 'processing':
                        # Use processing_started_at if available, otherwise fall back to created_at
                        processing_started_at = data.get('processing_started_at', created_at)
                        if (current_time - processing_started_at) > PROCESSING_TIMEOUT:
                            stale_requests.append((req_id, 'Request timed out during processing'))

                    # Check if the request is old and completed/failed (for cleanup)
                    elif status in ['completed', 'failed']:
                        completed_at = data.get('completed_at', created_at)
                        if (current_time - completed_at) > CLEANUP_TIMEOUT:
                            requests_to_remove.append(req_id)

            # Update stale requests to failed status
            for req_id, error_message in stale_requests:
                with status_lock:
                    if req_id in request_status:
                        print(f"Marking stale request {req_id} as failed: {error_message}")
                        request_status[req_id]['status'] = 'failed'
                        request_status[req_id]['error'] = error_message
                        request_status[req_id]['completed_at'] = current_time

            # Remove old completed/failed requests
            if requests_to_remove:
                with status_lock:
                    for req_id in requests_to_remove:
                        if req_id in request_status:
                            print(f"Cleaning up old request {req_id}")
                            del request_status[req_id]

            # Sleep for a while before checking again
            time.sleep(60)  # Check every minute

        except Exception as e:
            print(f"Error checking stale requests: {e}")
            time.sleep(60)  # Continue checking even if there's an error

# Worker function to process requests from the queue
def process_queue():
    while True:
        try:
            # Log the current queue size
            queue_size = request_queue.qsize()
            print(f"Current queue size: {queue_size}")

            # Get a request from the queue
            print("Waiting for the next request from the queue...")
            request_id, job_description = request_queue.get()
            print(f"Got request {request_id} from the queue")

            # Update status to processing
            with status_lock:
                request_status[request_id]['status'] = 'processing'
                # Update the timestamp to track when processing started
                request_status[request_id]['processing_started_at'] = time.time()
                print(f"Updated status of request {request_id} to 'processing'")

            # Reload configuration to ensure we have the latest API key
            from config import load_config
            global OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_MODEL
            current_config = load_config()

            # Ensure API key is properly formatted (trimmed, etc.)
            api_key = current_config['openrouter_api_key'].strip()
            OPENROUTER_API_KEY = api_key
            OPENROUTER_API_URL = current_config['openrouter_api_url']
            OPENROUTER_MODEL = current_config['model']

            # Load default CV
            default_cv = load_yaml(DEFAULT_CV_PATH)
            if not default_cv:
                with status_lock:
                    request_status[request_id]['status'] = 'failed'
                    request_status[request_id]['error'] = 'Error loading default CV'
                request_queue.task_done()
                continue

            # Tailor the CV
            tailored_cv = tailor_cv_with_deepseek(default_cv, job_description)
            if not tailored_cv:
                with status_lock:
                    request_status[request_id]['status'] = 'failed'
                    request_status[request_id]['error'] = 'Failed to tailor CV'
                request_queue.task_done()
                continue

            # Extract filename if provided
            pdf_filename = f"tailored_cv_{request_id}.pdf"  # Default filename with request ID
            if 'filename' in tailored_cv:
                suggested_filename = tailored_cv.pop('filename')  # Remove from CV data
                if suggested_filename:
                    # Remove .yaml if present in the filename
                    suggested_filename = suggested_filename.replace(".yaml", "")

                    # Also remove any .yaml.pdf extension and replace with just .pdf
                    suggested_filename = suggested_filename.replace(".yaml.pdf", ".pdf")

                    # Remove quotes if they exist
                    suggested_filename = suggested_filename.strip('"\'')

                    # Ensure it has .pdf extension
                    if not suggested_filename.lower().endswith('.pdf'):
                        suggested_filename += '.pdf'
                    pdf_filename = suggested_filename

                    print(f"Using suggested filename: {pdf_filename}")

            # Create a temporary YAML file for processing with unique name based on request_id
            # Use a timestamp to ensure uniqueness even if the same request_id is used multiple times
            timestamp = int(time.time())
            temp_yaml_path = os.path.abspath(f"temp_tailored_cv_{request_id}_{timestamp}.yaml")
            save_yaml(tailored_cv, temp_yaml_path)
            print(f"Saved temporary YAML file for request {request_id}: {temp_yaml_path}")

            # Generate PDF
            success = render_cv(temp_yaml_path, output_pdf=pdf_filename)

            # Remove the temporary YAML file after PDF generation
            if os.path.exists(temp_yaml_path):
                os.remove(temp_yaml_path)
                print(f"Removed temporary YAML file for request {request_id}: {temp_yaml_path}")

            # Clean up the rendercv_output directory if it exists
            rendercv_output_dir = os.path.join(os.path.dirname(temp_yaml_path), "rendercv_output")
            if os.path.exists(rendercv_output_dir):
                try:
                    shutil.rmtree(rendercv_output_dir)
                    print(f"Cleaned up {rendercv_output_dir}")
                except Exception as e:
                    print(f"Warning: Could not remove rendercv_output directory: {e}")

            if success:
                pdf_path = os.path.abspath(pdf_filename)
                if os.path.exists(pdf_path):
                    with status_lock:
                        request_status[request_id]['status'] = 'completed'
                        request_status[request_id]['filename'] = pdf_filename
                        request_status[request_id]['completed_at'] = time.time()
                        request_status[request_id]['notified'] = False  # Flag to track if notification has been sent
                else:
                    with status_lock:
                        request_status[request_id]['status'] = 'failed'
                        request_status[request_id]['error'] = 'PDF was generated but file not found'
            else:
                with status_lock:
                    request_status[request_id]['status'] = 'failed'
                    request_status[request_id]['error'] = 'Failed to generate PDF'

            # Mark the task as done
            request_queue.task_done()

        except Exception as e:
            print(f"Error processing request: {e}")
            # If we have a request_id, update its status
            if 'request_id' in locals():
                with status_lock:
                    request_status[request_id]['status'] = 'failed'
                    request_status[request_id]['error'] = str(e)
                request_queue.task_done()
            time.sleep(1)  # Prevent tight loop in case of recurring errors

def run_server(port=5000):
    # Start the worker thread
    worker_thread = threading.Thread(target=process_queue, daemon=True)
    worker_thread.start()

    # Start the stale request checker thread
    stale_checker_thread = threading.Thread(target=check_stale_requests, daemon=True)
    stale_checker_thread.start()

    print("Started worker thread and stale request checker thread")

    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "server":
        port = int(os.environ.get('PORT', 5000))
        run_server(port)
    else:
        main()
