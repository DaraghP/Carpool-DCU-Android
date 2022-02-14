import json
import requests
from django.http import JsonResponse
from django.core import serializers as django_serializers
from django.forms.models import model_to_dict
from django.contrib.auth import authenticate, login as django_login
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import *
from .models import *
from django.conf import settings
import urllib

# Create your views here.
#

"""
Carpool API
"""

@api_view(["POST"])
def register(request):
    """
    Users will send registration data on the app,
    the registration data needs to be validated before creating the user,
    such validation could be checking if the user already exists, or if the passwords entered do not match.
    (see the check_registration_data method for more info in serializers.py)

    If registration data is valid, a user is created along with their authorization token,
    their user data is sent back in the response, and they are logged into django.
    Otherwise, if invalid, an appropriate error message is sent back.
    """

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
            return Response(is_registration_correct)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
    """
    Users will send login data on the app.

    If login data is valid, the user's data is sent back.
    Otherwise, if invalid, an appropriate error message is sent back.
    """

    if request.method == "POST":
        name = request.data.get("username")
        password = request.data.get("password")
        if name and password:
            carpool_user = authenticate(username=name, password=password)
            if carpool_user is not None:
                django_login(request, carpool_user)
                token, created = Token.objects.get_or_create(user=carpool_user)
                return Response({"id": carpool_user.id, "username": carpool_user.username, "token": token.key})
            else:
                return Response("Incorrect username or password.")

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Users can logout through the settings menu.
    Users send their auth token to be destroyed then we send back a 200 response to signal React Native to go back to
    the login and registration screens.
    """

    request.user.auth_token.delete()
    return Response(status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Users can delete through the settings menu for account.
    Users send their auth token to be destroyed then we send back a 200 response to signal React Native to go back to
    the login and registration screens. All data related to the user should be deleted.
    """

    request.user.delete()
    return Response(status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_driver(request):
    """
    Gets driver, if they exist, their details are sent back in the response,
    otherwise it returns status 404.
    """

    if Driver.objects.filter(uid = request.user.id).exists():
        print("Driver exists!", request.user.id)
    else:
        print("Driver does not exist yet. Fill out form")
        return Response(status=status.HTTP_404_NOT_FOUND)

    return Response({}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_driver(request):
    """
    Creates driver if they already don't exist, and returns their details,
    if the driver already exists an error is sent back in the response.    
    """

    if request.method == "POST":
        is_vehicle_valid = True  # TODO: validate car details
        if is_vehicle_valid is True:
            user = request.user
            name = f"{user.first_name} {user.last_name[0]}."
            temp_car = CarSerializer(data=request.data)
            car = temp_car.create(request.data)
            driver_data = {"name": name, "car": car, "uid": request.user}

            driver = DriverSerializer(data=request.data)
            driver.create(driver_data)

            return Response(request.data, status=status.HTTP_201_CREATED)

        else:
            return Response({"error": ""}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def create_passenger(request):
    if Passenger.objects.filter(uid=request.user.id).exists():
        print("Passenger already exists!")
        return Response({"error": ""}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = CarpoolUser.objects.get(id=request.user.id)
        name = f"{user.first_name} {user.last_name[0]}."
        passenger_data = {"name": name, "uid": request.user}
        passenger = PassengerSerializer(data=passenger_data)
        passenger.create(passenger_data)

        print("New Passenger:", name)
        return Response(status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_trip(request):
    """
    Creates trip for driver, for the passengers to search for. 
    """

    if request.method == 'POST':
        driver = Driver.objects.get(uid=request.user.id)
        trip = TripSerializer({"driver_id": driver, **request.data})
        trip.create({"driver_id": driver, **request.data})
        return Response(status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_trips(request):
    """
    Used by passengers to search for trips
    """

    if request.method == 'POST':
        passenger = CarpoolUser.objects.get(id=request.user.id)

        all_trips = Trip.objects.all()
        sorted_trips = all_trips.order_by("time_of_departure") 

        trips_serialized = json.loads(django_serializers.serialize("json", sorted_trips))

        for index, trip in enumerate(trips_serialized):
            driver_name = Driver.objects.get(id=trips_serialized[index]["fields"]["driver_id"]).name
            trips_serialized[index] = {"pk": trip["pk"], "driver_name": driver_name, **trip["fields"]}

        distance_matrix_base_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        directions_base_url = "https://maps.googleapis.com/maps/api/directions/json"

        waypoints = "|".join([wp["name"] for wp in trips_serialized[3]['waypoints'].values()])

        distancematrix_url = urllib.parse.quote(f"{distance_matrix_base_url}?destinations={trips_serialized[2]['destination']['name']}|{request.data['start']['name']}&origins={trips_serialized[2]['start']['name']}&key={settings.GOOGLE_API_KEY}", safe='=?:/&')
        directions_url = urllib.parse.quote(f"{directions_base_url}?destination={trips_serialized[3]['destination']['name']}&origin={trips_serialized[3]['start']['name']}&waypoints={waypoints}|{request.data['start']['name']}&key={settings.GOOGLE_API_KEY}", safe='=?:/&')

        response = requests.get(directions_url)


        for leg in response.json()["routes"][0]["legs"]: 
            trip_data = {
                "Start" : leg["start_address"],
                "Destination" : leg["end_address"],
                "distance" : leg["distance"]["text"],
                "duration" : leg["duration"]["text"],
            }

            # shows distance & duration between waypoints
            print(trip_data) 
        

        # TODO : make the algorithm to sort the trips
        return Response(trips_serialized, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)
