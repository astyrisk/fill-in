# CV Tailor Server

This is a server version of the CV Tailor script that tailors a CV based on a job description.

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the server with:

```bash
python tailor.py server
```

The server will start on port 5000 by default. You can change the port by setting the `PORT` environment variable.

## API Endpoints

### Health Check

```
GET /health
```

Returns a simple health check response.

### Tailor CV

```
POST /tailor
```

Request body:

```json
{
  "job_description": "Your job description text here...",
  "output_format": "yaml",  // or "json"
  "generate_pdf": true,     // whether to generate a PDF
  "return_pdf": false       // whether to return the PDF file directly
}
```

Response (when `return_pdf` is `false`):

```json
{
  "cv": "...",  // CV content in the requested format
  "format": "yaml",
  "message": "PDF generated as tailored_cv.pdf"
}
```

When `return_pdf` is `true`, the response will be the PDF file itself.

### Configuration

```
GET /config-status
```

Returns the current configuration status.

```
POST /config
```

Updates the configuration (API key, model, etc.).

```
POST /test-api-key
```

Tests if the provided OpenRouter API key is valid.

## Running as CLI

You can still run the script as a CLI tool:

```bash
python tailor.py
```

This will use the job description from `job_description.txt` or prompt you to enter one.

## Example Usage with curl

```bash
curl -X POST http://localhost:5000/tailor \
  -H "Content-Type: application/json" \
  -d '{"job_description": "Your job description here...", "output_format": "json"}'
```

To get the PDF file directly:

```bash
curl -X POST http://localhost:5000/tailor \
  -H "Content-Type: application/json" \
  -d '{"job_description": "Your job description here...", "return_pdf": true}' \
  --output tailored_cv.pdf
```
