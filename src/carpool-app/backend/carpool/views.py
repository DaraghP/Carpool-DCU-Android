from django.http import JsonResponse
from django.contrib.auth import authenticate, login as django_login
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import CarpoolUserSerializer


# Create your views here.
#
def index(request):
    format = request.GET.get("format", "")

    if format == "json":
        return JsonResponse({"test": "working"})


@api_view(["POST"])
def register(request):
    if request.method == "POST":
        is_registration_correct = CarpoolUserSerializer.check_registration_data(data=request.data)
        if is_registration_correct is True:
            carpool_user = CarpoolUserSerializer(data=request.data)
            if carpool_user.is_valid():
                temp_user = carpool_user.create(request.data)
                token = Token.objects.create(user=temp_user)

                user_data = {"username": temp_user.username, "token": token.key}

                django_login(request, temp_user)

                return Response(user_data, status=status.HTTP_201_CREATED)
            return Response({"error": "could not register user."})
        else:
            return Response({"error": is_registration_correct})

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
    if request.method == "POST":
        name = request.data.get("username")
        password = request.data.get("password")
        if name and password:
            carpool_user = authenticate(username=name, password=password)
            if carpool_user is not None:
                django_login(request, carpool_user)
                return Response({"id": carpool_user.id, "username": carpool_user.username})
            else:
                return Response("Incorrect username or password")

    return Response(status=status.HTTP_400_BAD_REQUEST)
