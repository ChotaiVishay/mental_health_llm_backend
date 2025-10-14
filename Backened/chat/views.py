from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.detail import DetailView
from django.shortcuts import render
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from .models import ChatSession, Message
from .serializers import *
from rest_framework.views import APIView
import asyncio
from llm.services.chat_service import chat_service
import httpx

class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, retrieving, updating, and deleting chat sessions.
    """
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer
    
class ChatMessageAPIView(APIView):
    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message')
        session_id = request.data.get('session_id', None)
        
        if not user_message:
            return Response({'error': 'Missing message'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Call your FastAPI service on AWS
            fastapi_url = "https://your-aws-fastapi-url.com/api/v1/chat/chat"
            
            with httpx.Client() as client:
                response = client.post(
                    fastapi_url,
                    json={"message": user_message, "session_id": session_id},
                    timeout=30.0
                )
                response.raise_for_status()
                llm_response = response.json()

            return Response({
                'response': llm_response.get('message'),
                'session_id': llm_response.get('session_id')
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)