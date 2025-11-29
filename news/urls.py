from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/get-news-summary/', views.get_news_summary, name='get_news_summary'),
    path('api/check-summarizer/', views.check_summarizer_status, name='check_summarizer'),
]