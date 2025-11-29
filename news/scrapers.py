import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
import dateparser
import os
import json
from openai import OpenAI


class NewsScraper:
    def __init__(self):
        self.base_url = 'https://www.thehindu.com/latest-news/'
        
    def scrape_articles(self, lookback_minutes=120):
        articles = []
        try:
            resp = requests.get(self.base_url, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            article_elements = soup.select('ul.timeline-with-img li .element')
            now = datetime.now(timezone.utc).astimezone()
            
            for i, article in enumerate(article_elements):
                time_div = article.select_one('.news-time.time')
                if not time_div or not time_div.has_attr('data-published'):
                    continue
                
                published_time = dateparser.parse(str(time_div['data-published']))
                if not published_time:
                    continue
                    
                time_diff = now - published_time
                if time_diff > timedelta(minutes=lookback_minutes):
                    break
                
                article_title = article.select_one('h3.title a')
                if not article_title:
                    continue
                    
                article_url = article_title['href']
                title = article_title.get_text().strip()
                
                full_text = self._get_article_text(article_url)
                if not full_text:
                    continue
                
                articles.append({
                    'title': title,
                    'url': article_url,
                    'published_time': published_time,
                    'full_text': full_text
                })
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            
        return articles
    
    def _get_article_text(self, article_url):
        try:
            article_resp = requests.get(article_url, timeout=10)
            article_resp.raise_for_status()
            article_soup = BeautifulSoup(article_resp.text, 'html.parser')
            paragraphs = article_soup.find_all('p')
            full_text = "\n".join(p.get_text().strip() for p in paragraphs if p.get_text().strip())
            return full_text
        except Exception as e:
            return None


class NewsSummarizer:
    def __init__(self):
        self.api_key = os.environ.get('LLM_API_KEY')
        self.base_url = os.environ.get('LLM_API_URL', 'https://api.openai.com/v1')
        self.model_name = os.environ.get('LLM_MODEL_NAME', 'gpt-3.5-turbo')
        self.total_input_tokens = 0
        self.total_output_tokens = 0

        if self.api_key:
            try:
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            except Exception as e:
                self.client = None
        else:
            self.client = None
        
    def summarize_article(self, article_text, summary_type="sentence"):
        if not self.client:
            return None
            
        try:
            # Create prompt based on summary type
            prompt = f"Sumarize article in one {summary_type} without mentioning the article. Also, do not mention date unless the news is date specific.\n\nNews article:\n\n{article_text}\n\n---\nSummary:"
            
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.7
            )

            summary = response.choices[0].message.content.strip() if response.choices[0].message.content else ""
            self.total_input_tokens += response.usage.prompt_tokens
            self.total_output_tokens += response.usage.completion_tokens
            return summary
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
    
    def is_available(self):
        return self.client is not None