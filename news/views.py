from django.shortcuts import render
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .scrapers import NewsScraper, NewsSummarizer
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time


def index(request):
    return render(request, 'news/index.html')


@csrf_exempt
@require_http_methods(["POST"])
def get_news_summary(request):
    try:
        data = json.loads(request.body)
        lookback_minutes = min(int(data.get('lookback_minutes', 60)), 120)
        summary_type = data.get('summary_type', 'sentence')
        
        scraper = NewsScraper()
        summarizer = NewsSummarizer()
        
        # Step 1: Scrape articles
        articles = scraper.scrape_articles(lookback_minutes)
        
        if not articles:
            return JsonResponse({
                'status': 'error',
                'message': 'No articles found in the specified time range'
            })
        
        # Step 2: Summarize articles with real-time progress
        summaries = []
        summarizer_available = summarizer.is_available()
        total_articles = len(articles)
        
        def generate_progress():
            # Send initial progress
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Processing articles...', 'progress': 30})}\n\n"
            
            for i, article in enumerate(articles):
                if summarizer_available:
                    yield f"data: {json.dumps({'type': 'progress', 'message': f'Summarizing {i+1}/{total_articles}...', 'progress': 30 + (i+1)/total_articles * 50})}\n\n"
                    summary = summarizer.summarize_article(article['full_text'], summary_type)
                    if summary:
                        summary_data = {
                            'summary': summary,
                            'published_time': article['published_time'].isoformat()
                        }
                        summaries.append(summary_data)
                        yield f"data: {json.dumps({'type': 'summary', **summary_data})}\n\n"
                    yield f"data: {json.dumps({'type': 'tokens', 'input_tokens': summarizer.total_input_tokens, 'output_tokens': summarizer.total_output_tokens})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'progress', 'message': f'Processing {i+1}/{total_articles}...', 'progress': 30 + (i+1)/total_articles * 50})}\n\n"
                    # If summarizer is not available, show configuration message
                    summary_data = {
                        'summary': 'Configure LLM settings in environment variables to enable summarization.',
                        'published_time': article['published_time'].isoformat()
                    }
                    summaries.append(summary_data)
                    yield f"data: {json.dumps({'type': 'summary', **summary_data})}\n\n"
                    yield f"data: {json.dumps({'type': 'tokens', 'input_tokens': 0, 'output_tokens': 0})}\n\n"
            
            # Send final result
            yield f"data: {json.dumps({'type': 'result', 'status': 'success', 'summaries': summaries, 'summarizer_available': summarizer_available, 'total_input_tokens': summarizer.total_input_tokens, 'total_output_tokens': summarizer.total_output_tokens})}\n\n"
        
        return StreamingHttpResponse(generate_progress(), content_type='text/plain')
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })


@csrf_exempt
@require_http_methods(["GET"])
def check_summarizer_status(request):
    summarizer = NewsSummarizer()
    return JsonResponse({
        'available': summarizer.is_available()
    })
