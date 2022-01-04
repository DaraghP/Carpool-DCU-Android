from django.shortcuts import render
from django.http import HttpResponse, JsonResponse

# Create your views here.

def index(request):
    format = request.GET.get("format", "")

    if format == "json":
        return JsonResponse({"test": "working"})
