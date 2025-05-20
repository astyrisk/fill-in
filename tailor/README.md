# CV Tailor Server

This is a server version of the CV Tailor script that tailors a CV based on a job description. It implements partial CV tailoring, which only modifies selected sections of the CV while preserving the complete YAML structure.

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

## Partial CV Tailoring

The CV Tailor Server implements partial CV tailoring, which:

1. Extracts only the selected sections from the CV YAML structure (specifically, only content under the `cv` key)
2. Sends only these extracted sections to the AI tailoring service (DeepSeek V3 API)
3. When receiving the tailored content back from the API, intelligently merges this tailored content with the original, unmodified sections of the CV
4. Preserves the complete YAML structure with all four required keys (`cv`, `design`, `locale`, and `rendercv_settings`)
5. Renders the complete merged CV as a PDF using RenderCV

This approach has several advantages:
- Reduces the amount of data sent to the API
- Ensures that only the CV content is modified, not the design or rendering settings
- Maintains compatibility with RenderCV's expected YAML structure
- Allows for more focused tailoring of just the CV content

The temporary YAML files generated during the tailoring process are kept for inspection. You can find them in the tailor directory with names like `temp_tailored_cv_<request_id>_<timestamp>.yaml`.

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
