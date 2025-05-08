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
from flask import Flask, request, jsonify, send_file

# Configuration
DEFAULT_CV_PATH = "default_cv.yaml"
JOB_DESC_PATH = "job_description.txt"
RAW_RESPONSE_PATH = os.path.abspath("raw_response.txt")
# OPENROUTER_API_KEY = "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"  # Replace with your OpenRouter API key
OPENROUTER_API_KEY = "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"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

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
        "Also, add a field called 'filename' at the very top of the YAML with a suggested filename for the CV that includes the job title. "
        "Here is the exact format of the original YAML:\n\n" + original_yaml_str + "\n\n"
        "Job Description:\n" + job_description + "\n\n"
        "Output the tailored CV in YAML format with the exact same structure and order as the original, plus the filename field at the top."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "CV Tailor Script"
    }
    payload = {
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.7
    }

    response = requests.post(
        url=OPENROUTER_API_URL,
        headers=headers,
        data=json.dumps(payload)
    )
    if response.status_code == 200:
        tailored_cv_text = response.json()["choices"][0]["message"]["content"].strip()
        try:
            start_marker = "```yaml"
            end_marker = "```"
            if start_marker in tailored_cv_text:
                start_idx = tailored_cv_text.index(start_marker) + len(start_marker)
                end_idx = tailored_cv_text.index(end_marker, start_idx)
                yaml_text = tailored_cv_text[start_idx:end_idx].strip()
            else:
                yaml_text = tailored_cv_text
        except ValueError:
            with open(RAW_RESPONSE_PATH, 'w') as f:
                f.write(tailored_cv_text)
            print(f"Could not extract YAML from response. Raw response saved to {RAW_RESPONSE_PATH}")
            return None

        print(tailored_cv_text)

        try:
            tailored_cv = yaml.safe_load(yaml_text)
            return tailored_cv
        except yaml.YAMLError as e:
            with open(RAW_RESPONSE_PATH, 'w') as f:
                f.write(tailored_cv_text)
            print(f"Error parsing tailored CV YAML: {e}")
            print(f"Raw response saved to {RAW_RESPONSE_PATH}")
            return None
    else:
        with open(RAW_RESPONSE_PATH, 'w') as f:
            f.write(response.text)
        print(f"OpenRouter API error: {response.status_code} - {response.text}")
        print(f"Raw response saved to {RAW_RESPONSE_PATH}")
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
        return
    try:
        # Run rendercv without --output, let it create default output
        subprocess.run(["rendercv", "render", yaml_path], check=True)

        # Find the generated PDF in the rendercv_output directory
        rendercv_output_dir = os.path.join(os.path.dirname(yaml_path), "rendercv_output")
        if os.path.exists(rendercv_output_dir):

            # Look for PDF files in the output directory
            pdf_files = [f for f in os.listdir(rendercv_output_dir) if f.endswith('.pdf')]

            if pdf_files:
                # Use the first PDF file found (there should typically be only one)
                default_pdf = os.path.join(rendercv_output_dir, pdf_files[0])
                # Move the default PDF to desired location
                shutil.move(default_pdf, output_pdf)
                print(f"PDF generated: {output_pdf}")

                # Clean up the rendercv_output directory after moving the PDF
                try:
                    shutil.rmtree(rendercv_output_dir)
                except Exception as e:
                    print(f"Warning: Could not remove rendercv_output directory: {e}")

                return True
            else:
                # If no PDF found, look for HTML files that might need conversion
                html_files = [f for f in os.listdir(rendercv_output_dir) if f.endswith('.html')]
                if html_files:
                    print(f"Found HTML file but no PDF. You may need to convert it manually.")
                    return False
                else:
                    print(f"No output files found in {rendercv_output_dir}")
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

    # Render the CV
    success = render_cv(temp_yaml_path, output_pdf=pdf_filename)

    # Remove the temporary YAML file after PDF generation
    if os.path.exists(temp_yaml_path):
        os.remove(temp_yaml_path)

    # Clean up the rendercv_output directory if it exists
    rendercv_output_dir = os.path.join(os.path.dirname(temp_yaml_path), "rendercv_output")
    if os.path.exists(rendercv_output_dir):
        try:
            shutil.rmtree(rendercv_output_dir)
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
    return jsonify({"status": "healthy"})

@app.route('/tailor', methods=['POST'])
def tailor_endpoint():
    data = request.json

    if not data or 'job_description' not in data:
        return jsonify({"error": "Job description is required"}), 400

    job_description = data.get('job_description')

    # Generate a unique request ID
    request_id = str(uuid.uuid4())

    # Initialize request status
    with status_lock:
        request_status[request_id] = {
            'status': 'queued',
            'created_at': time.time()
        }

    # Add the request to the queue
    request_queue.put((request_id, job_description))

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
            # Get a request from the queue
            request_id, job_description = request_queue.get()

            # Update status to processing
            with status_lock:
                request_status[request_id]['status'] = 'processing'
                # Update the timestamp to track when processing started
                request_status[request_id]['processing_started_at'] = time.time()

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

                    # Ensure it has .pdf extension
                    if not suggested_filename.lower().endswith('.pdf'):
                        suggested_filename += '.pdf'
                    pdf_filename = suggested_filename

            # Create a temporary YAML file for processing
            temp_yaml_path = os.path.abspath(f"temp_tailored_cv_{request_id}.yaml")
            save_yaml(tailored_cv, temp_yaml_path)

            # Generate PDF
            success = render_cv(temp_yaml_path, output_pdf=pdf_filename)

            # Remove the temporary YAML file after PDF generation
            if os.path.exists(temp_yaml_path):
                os.remove(temp_yaml_path)

            # Clean up the rendercv_output directory if it exists
            rendercv_output_dir = os.path.join(os.path.dirname(temp_yaml_path), "rendercv_output")
            if os.path.exists(rendercv_output_dir):
                try:
                    shutil.rmtree(rendercv_output_dir)
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

    app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "server":
        port = int(os.environ.get('PORT', 5000))
        run_server(port)
    else:
        main()
