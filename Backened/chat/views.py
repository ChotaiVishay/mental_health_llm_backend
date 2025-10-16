from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
import asyncio
import httpx

from .models import ChatSession, Message
from .serializers import ChatSessionSerializer
from llm.services.chat_service import chat_service


class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, retrieving, updating, and deleting chat sessions.
    """
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer


class ChatMessageAPIView(APIView):
    """
    Receives a user message and routes it to either:
      1) Local LLM service (chat_service) — includes special 'service_form' handling
      2) External FastAPI service (via httpx) — for AWS proxy calls

    Routing rules (first match wins):
      - If request.query_params['via'] == 'fastapi'  -> use FastAPI proxy
      - elif settings.CHAT_BACKEND == 'fastapi'      -> use FastAPI proxy
      - else                                         -> use local chat_service
    """
    def post(self, request, *args, **kwargs):
        payload = request.data
        user_message = payload.get('message')
        session_id = payload.get('session_id')

        # --- Routing decision ---
        via = (request.query_params.get('via') or '').lower()
        backend_pref = getattr(settings, 'CHAT_BACKEND', '').lower()
        use_fastapi = via == 'fastapi' or backend_pref == 'fastapi'

        # --- FastAPI proxy path (preserves your second snippet behavior) ---
        if use_fastapi:
            try:
                fastapi_url = getattr(
                    settings,
                    'FASTAPI_CHAT_URL',
                    # fallback (replace with your real URL)
                    'https://your-aws-fastapi-url.com/api/v1/chat/chat'
                )

                # Forward the original payload so FastAPI can support forms/etc. if it does
                with httpx.Client() as client:
                    resp = client.post(
                        fastapi_url,
                        json=payload,
                        timeout=30.0
                    )
                    resp.raise_for_status()
                    llm_response = resp.json()

                # Return a superset (include 'action' if FastAPI provides it)
                return Response(
                    {
                        'response': llm_response.get('message'),
                        'session_id': llm_response.get('session_id'),
                        'action': llm_response.get('action')
                    },
                    status=status.HTTP_200_OK
                )
            except httpx.HTTPError as e:
                return Response({'error': f'FastAPI proxy error: {e}'}, status=status.HTTP_502_BAD_GATEWAY)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- Local LLM path (preserves your first snippet, including service_form handling) ---
        # Special service_form submission path (bypasses missing message guard)
        if payload.get("type") == "service_form":
            try:
                llm_response = asyncio.run(
                    chat_service.process_message(
                        payload,
                        session_id=session_id,
                    )
                )
                return Response(
                    {
                        "response": llm_response.get("message"),
                        "session_id": llm_response.get("session_id"),
                        "action": llm_response.get("action"),
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # For normal chat messages, require 'message'
        if not user_message:
            return Response({'error': 'Missing message or session_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            llm_response = asyncio.run(
                chat_service.process_message(user_message, session_id=session_id)
            )
            llm_reply = llm_response.get("message", "No reply from LLM.")
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {
                'response': llm_reply,
                'session_id': llm_response.get("session_id"),
                'action': llm_response.get("action"),
            },
            status=status.HTTP_200_OK
        )