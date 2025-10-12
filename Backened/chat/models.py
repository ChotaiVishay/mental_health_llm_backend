from django.db import models
import uuid

# Create your models here.
class ChatSession(models.Model):
    title = models.CharField(max_length=100)
    # user_id = models.ForeignKey('auth.User', on_delete=models.CASCADE, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat Session {self.id} created at {self.title}"
    
    @property
    def message_count(self):
        return self.messages.count()

class Message(models.Model):
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('bot', 'Bot'),
        ('system', 'System'),
        ]
    
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name = 'messages')
    message_type = models.CharField(choices=MESSAGE_TYPES, max_length=10)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}...."
