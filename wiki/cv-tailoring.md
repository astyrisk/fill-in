# CV Tailoring

The CV Tailoring feature automatically customizes your CV for each job application based on the job description.

## Features

- **AI-Powered**: Uses DeepSeek V3 API to customize your CV based on job descriptions
- **Status Tracking**: Monitor the tailoring process for each job listing
- **Multiple Requests**: Handles multiple tailoring requests simultaneously

## How It Works

The CV Tailoring feature works by:

1. Extracting the job description from a LinkedIn job listing
2. Sending the job description to a local server
3. The server uses the DeepSeek V3 API to analyze the job description and tailor your CV
4. The tailored CV is saved as a PDF file

## Setting Up the CV Tailor Server

The CV tailoring feature requires a local server:

1. Navigate to the `tailor` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Install rendercv: `npm install -g rendercv`
4. Start the server: `python tailor.py server`

## Configuring Your API Key

To use the CV Tailoring feature, you need to configure your DeepSeek V3 API key:

1. Open the settings page
2. Navigate to the "Tailor" tab
3. Enter your OpenRouter API key
4. (Optional) Customize the tailoring prompt

You can get an API key from [OpenRouter](https://openrouter.ai/).

## Using the CV Tailoring Feature

1. View a job's details in the job listings page
2. Click the "Tailor CV" button
3. Monitor the tailoring status for each job

## Tailoring Status

Each job listing shows the current status of CV tailoring:

- **Not Started**: No tailoring has been requested
- **CV Queued**: The tailoring request is in the queue
- **CV Processing**: The server is currently processing the request
- **CV Ready**: The tailored CV is ready to download
- **CV Failed**: The tailoring process encountered an error

You can reset a job's CV status if it gets stuck in the "CV Queued" or "CV Processing" state.

## Customizing the Tailoring Prompt

You can customize the prompt used to tailor your CV in the settings page. This allows you to control how the AI tailors your CV based on the job description.

The default prompt instructs the AI to:
- Analyze the job description
- Identify key skills and requirements
- Adjust your CV to highlight relevant experience
- Format the CV according to industry standards
