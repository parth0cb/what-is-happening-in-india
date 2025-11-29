# What is Happening in India

A Django web application that scrapes and summarizes the latest news from India using The Hindu website and Hugging Face's language models.

## Features

- **News Scraping**: Automatically scrapes latest news articles from The Hindu
- **AI Summarization**: Uses Hugging Face's SmolLM3-3B model to generate concise summaries
- **Time-based Filtering**: Users can specify lookback periods (up to 2 hours)
- **Summary Options**: Choose between one-sentence or one-paragraph summaries
- **Dark Theme**: Responsive design with dark/light theme toggle
- **Fallback Handling**: Graceful degradation when AI services are unavailable
- **Real-time Updates**: Loading indicators with progress tracking

## Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables (optional):
   ```bash
   export HF_TOKEN="your_huggingface_token"
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

### Hugging Face API

The application uses Hugging Face's Serverless Inference API for text summarization. To enable this feature:

1. Create a Hugging Face account at https://huggingface.co
2. Generate an access token from Settings > Access Tokens
3. Set the `HF_TOKEN` environment variable with your token

If no token is provided, the application will still scrape news but won't be able to generate AI summaries.

### Model Configuration

The application uses `HuggingFaceTB/SmolLM3-3B-hf` by default, which is optimized for efficiency and cost-effectiveness for this use case.

## Architecture

- **News Scraper**: Handles web scraping from The Hindu website
- **Summarizer**: Integrates with Hugging Face API for text generation
- **Django Views**: Manages HTTP requests and responses
- **Frontend**: Responsive HTML/CSS/JavaScript with dark theme support

## Dependencies

- Django >= 4.2.0
- requests >= 2.31.0
- beautifulsoup4 >= 4.12.0
- dateparser >= 1.1.8
- huggingface-hub >= 0.19.0

## Notes

- Maximum lookback period is limited to 2 hours as per requirements
- The application does not mention sources or links in summaries
- All scraping is done asynchronously with proper error handling
- Mobile-responsive design without using Bootstrap or CSS transforms