from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = {'id', 'message_type', 'content', 'timestamp'}
        read_only_fields = ['id', 'timestamp']

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many = True, read_only = True)
    message_count = serializers.ReadOnlyField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'message_count']

