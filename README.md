# What is Happening in India

A Django web application that scrapes and summarizes the latest news from India using The Hindu website and configurable language models (defaults to OpenAI's GPT-3.5-turbo).

## Features

- **News Scraping**: Automatically scrapes latest news articles from The Hindu
- **AI Summarization**: Uses configurable LLM API to generate concise summaries (supports OpenAI and compatible APIs)
- **Time-based Filtering**: Users can specify lookback periods (up to 2 hours)
- **Summary Options**: Choose between one-sentence or one-paragraph summaries
- **Dark Theme**: Responsive design with dark/light theme toggle
- **Fallback Handling**: Graceful degradation when AI services are unavailable
- **Real-time Updates**: Loading indicators with progress tracking via streaming responses

## Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables (optional for AI summarization):
    ```bash
    export LLM_API_KEY="your_openai_api_key"
    export LLM_API_URL="https://api.openai.com/v1"  # Optional, defaults to OpenAI
    export LLM_MODEL_NAME="gpt-3.5-turbo"  # Optional, defaults to gpt-3.5-turbo
    ```

4. Run database migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Usage

1. Open your browser and navigate to `http://localhost:8000`
2. Set your preferred lookback period (1-120 minutes)
3. Choose summary type (sentence or paragraph)
4. Click "Fetch" to fetch and summarize latest news

## Configuration

### LLM API

The application uses a configurable LLM API for text summarization (defaults to OpenAI). To enable this feature:

1. Obtain an API key from your preferred LLM provider (e.g., OpenAI, or compatible services)
2. Set the `LLM_API_KEY` environment variable with your API key
3. Optionally configure `LLM_API_URL` and `LLM_MODEL_NAME` for custom endpoints/models

If no API key is provided, the application will still scrape news but won't be able to generate AI summaries, showing a configuration message instead.

### Model Configuration

The application defaults to OpenAI's `gpt-3.5-turbo` model, but can be configured to use any compatible model via the `LLM_MODEL_NAME` environment variable.

## Architecture

- **News Scraper**: Handles web scraping from The Hindu website
- **Summarizer**: Integrates with configurable LLM API (OpenAI-compatible) for text generation
- **Django Views**: Manages HTTP requests and responses with streaming for real-time progress
- **Frontend**: Responsive HTML/CSS/JavaScript with dark theme support

## Dependencies

- Django
- requests
- beautifulsoup4
- dateparser
- huggingface-hub
- celery
- redis
- python-dotenv
- openai

## Notes

- Maximum lookback period is limited to 2 hours as per requirements
- The application does not mention sources or links in summaries
- All scraping is done asynchronously with proper error handling
- Mobile-responsive design without using Bootstrap or CSS transforms