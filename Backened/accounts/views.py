from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from django.contrib.auth.models import User

# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serialzer = self.get_serializer(data=request.data)
        serialzer.is_valid(raise_exception=True)
        user = serialzer.save()
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            "Message": 'Registration Successful',
            'user' : UserSerializer(user).data,
            "token": token.key
        }, status=status.HTTP_201_CREATED) 

@api_view(['POST'])
@permission_classes([AllowAny])
def LoginView(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user'] 
        # login(request, user)
        # token, created = Token.objects.get_or_create(user=user)

        return Response({
            'message': 'Login Successful',
            'user': UserSerializer(user).data,
            # 'token': token.key
        }, status=status.HTTP_200_OK)
