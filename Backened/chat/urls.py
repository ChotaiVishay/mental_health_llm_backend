from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet
from . import views


router = DefaultRouter()
router.register(r'chat-sessions', ChatSessionViewSet, basename='chat-session')


urlpatterns = [
    # path('chat-sessions/', views.ChatSessionList.as_view(), name = 'ChatList'),
    # path('chat-sessions/<int:pk>/', views.ChatSessionDetailView.as_view(), name='ChatDetail'),
    path('', include(router.urls)),  
    path('chat-message/', views.ChatMessageAPIView.as_view(), name='ChatMessage'),
]
