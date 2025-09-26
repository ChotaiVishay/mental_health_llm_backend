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

class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, retrieving, updating, and deleting chat sessions.
    """
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer
    
class ChatMessageAPIView(APIView):
    """
    Receives a user message, sends it to the LLM, and returns the response.
    """
    def post(self, request, *args, **kwargs):
        # 1. Extract user message and session info from request
        user_message = request.data.get('message')
        session_id = request.data.get('session_id', None) # Optional: session_id to associate with a chat session
        
        if not user_message:
            return Response({'error': 'Missing message or session_id'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. (Optional) Save the user message to the database
        # Message.objects.create(session_id=session_id, content=user_message, sender='user')

        # 3. Send the message to the LLM (to be integrated)
        # For now, use a placeholder response
        try:
            llm_response = asyncio.run(chat_service.process_message(user_message, session_id=session_id))

            llm_reply = llm_response.get("message", "No reply from LLM.")

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # llm_response = "This is a placeholder response from the LLM."

        # 4. (Optional) Save the LLM response to the database
        # Message.objects.create(session_id=session_id, content=llm_response, sender='bot')

        # 5. Return the LLM response
        return Response({'response': llm_reply, 'session_id': session_id}, status=status.HTTP_200_OK)