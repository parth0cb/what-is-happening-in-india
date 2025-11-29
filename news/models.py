from django.db import models

# Create your models here.

class NewsSummary(models.Model):
    title = models.CharField(max_length=500)
    url = models.URLField()
    published_time = models.DateTimeField()
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
