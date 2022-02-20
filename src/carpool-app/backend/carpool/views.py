import json
import requests
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

                user_data = {"id": temp_user.id, "username": temp_user.username, "token": token.key}
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
                driver = Driver.objects.filter(uid=carpool_user.id)

                trip = {}
                user_status = "available"
                if driver.exists():
                    driver = driver.get(uid=carpool_user.id)

                    if Trip.objects.filter(driver_id=driver.id).exists():
                        trip = model_to_dict(Trip.objects.get(driver_id=driver.id))
                        user_status = "driver_busy"
                # if passenger trip exists:
                #    user_status = "passenger_busy"
                else:
                    user_status = "available"

                return Response({
                    "id": carpool_user.id,
                    "username": carpool_user.username,
                    "first_name": carpool_user.first_name,
                    "last_name": carpool_user.last_name,
                    "status": user_status,
                    "trip_data": trip,
                    "token": token.key
                })
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
    # may need to return car information in future
    return Response({"driver_exists": Driver.objects.filter(uid=request.user.id).exists()}, status=status.HTTP_200_OK)


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
        if request.user.status == "available":
            driver = Driver.objects.get(uid=request.user.id)
            trip = TripSerializer({"driver_id": driver, **request.data})
            trip = trip.create({"driver_id": driver, **request.data})
            request.user.current_trip = trip
            request.user.status = "driver_busy"
            request.user.save()
            return Response({"tripID": trip.id, "driverID": driver.id}, status=status.HTTP_200_OK)
        return Response({"error": "You already have an ongoing trip."})

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_trip(request):
    """
    Removes drivers trip
    """

    if request.method == "POST":
        if request.user.status != "available":
            driver = Driver.objects.get(uid=request.user.id)
            trip = Trip.objects.get(driver_id=driver.id)
            request.user.current_trip = None
            trip.delete()

            request.user.status = "available"
            request.user.save()
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

        if passenger.status == "busy":
            return Response({"error": "You already have an ongoing trip."})

        all_trips = Trip.objects.all()
        sorted_trips = all_trips.order_by("time_of_departure") 

        trips_serialized = json.loads(django_serializers.serialize("json", sorted_trips))

        for index, trip in enumerate(trips_serialized):
            driver_name = Driver.objects.get(id=trips_serialized[index]["fields"]["driver_id"]).name
            trips_serialized[index] = {"pk": trip["pk"], "driver_name": driver_name, **trip["fields"]}

        distance_matrix_base_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        directions_base_url = "https://maps.googleapis.com/maps/api/directions/json"

        # TODO: remove this later
        if len(trips_serialized) < 1:
            return Response({}, status=status.HTTP_200_OK)

        if len(trips_serialized[0]["waypoints"]) < 1:
            waypoints = ""
        else:
            waypoints = "|".join([wp["name"] for wp in trips_serialized[0]['waypoints'].values()])

        # distancematrix_url = urllib.parse.quote(f"{distance_matrix_base_url}?destinations={trips_serialized[2]['destination']['name']}|{request.data['start']['name']}&origins={trips_serialized[2]['start']['name']}&key={settings.GOOGLE_API_KEY}", safe='=?:/&')
        directions_url = urllib.parse.quote(f"{directions_base_url}?destination={trips_serialized[0]['destination']['name']}&origin={trips_serialized[0]['start']['name']}&waypoints={waypoints}|{request.data['start']['name']}&key={settings.GOOGLE_API_KEY}", safe='=?:/&')

        response = requests.get(directions_url)

        for leg in response.json()["routes"][0]["legs"]:
            trip_data = {
               "Start" : leg["start_address"], #
               "Destination" : leg["end_address"],
               "distance" : leg["distance"]["text"],
               "duration" : leg["duration"]["text"],
            }

            # shows distance & duration between waypoints
            print(trip_data)

        # TODO : make the algorithm to sort the trips
        return Response(trips_serialized, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_trip(request):
    """
    Used by passengers to get trip data when a passengers request to a driver is accepted
    """

    if request.method == "POST":
        trip_id = request.data.get("tripID")
        if Trip.objects.filter(id=trip_id).exists():
            trip = Trip.objects.get(id=trip_id)
            if request.user.current_trip is not trip:
                request.user.current_trip = trip

            request.user.save()
            trip.save()

            return Response({"trip_data": model_to_dict(trip)})

        return Response({"error": "Trip no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_passenger_to_trip(request):  # request.data = {tripID: A, passengerData : {id: B, name: C, passengerLocation: {name: D, lat: E, lng: F}}}
    # Add passenger to trip.passengers
    # Add passenger's starting_location to trip.waypoints
    # Update passenger status to "passenger_busy"
    if request.method == "POST":
        print("Adding passenger to trip...")
        trip_id = request.data.get("tripID")
        if CarpoolUser.objects.filter(id=request.data["passengerData"]["id"]).exists():
            passenger_user = CarpoolUser.objects.get(id=request.data["passengerData"]["id"])
            if Trip.objects.filter(id=trip_id).exists():
                trip = Trip.objects.get(id=trip_id)
                if trip.passengers.get(f"passenger{passenger_user.id}") is None:
                    passenger_user.current_trip = trip
                    passenger_user.status = "passenger_busy"
                else:
                    return Response({"error": "passenger already in the same trip."}, status=status.HTTP_400_BAD_REQUEST)

                trip.passengers[f"passenger{passenger_user.id}"] = {
                    "passengerName": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                    "passengerID": request.data["passengerData"]["id"],
                    "passengerLocation": request.data["passengerData"]["passengerLocation"]["name"],
                }
                trip.waypoints[f"waypoint{len(trip.waypoints)+1}"] = {
                    "name": request.data["passengerData"]["passengerLocation"]["name"],
                    "lat": request.data["passengerData"]["passengerLocation"]["lat"],
                    "lng": request.data["passengerData"]["passengerLocation"]["lng"],
                }
                trip.available_seats -= 1

                passenger_user.save()
                trip.save()

                trip_data = model_to_dict(trip)
                return Response({"trip_data": trip_data}, status=status.HTTP_200_OK)

            return Response({"error": "Trip no longer exists."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": "Passenger does not exist"}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)
