# from django.http import HttpResponse
from django.shortcuts import render

def Homepage(request):
    # return HttpResponse("Hello World! Hi.")
    return render(request, 'home.html')

def about(request):
    # return HttpResponse("My About page.")
        return render(request, 'about.html')

def chatbot(request):
      return render(request, 'chat.html')
