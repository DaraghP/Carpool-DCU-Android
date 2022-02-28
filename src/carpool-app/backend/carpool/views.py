import json
from collections import namedtuple

import requests
from datetime import timedelta, datetime
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

                trip = {}
                user_status = "available"

                if carpool_user.current_trip is not None:
                    trip = model_to_dict(carpool_user.current_trip)
                    if carpool_user.id == carpool_user.current_trip.driver_id.uid.id:
                        user_status = "driver_busy"
                    else:
                        user_status = "passenger_busy"

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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_profile_description(request):
    """
    Sets profile description of a user who has sent the request
    """

    if request.method == "POST":
        profile_description = request.data.get("profileDescription")
        if type(profile_description) == str:
            request.user.profile_description = profile_description
            request.user.save()
            return Response(status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Gets profile of a user
    """

    if request.method == "POST":
        uid = request.data.get("uid")
        if CarpoolUser.objects.filter(id=uid).exists():
            user = CarpoolUser.objects.get(id=uid)
            return Response({
                "username": user.username,
                "first_name": user.first_name,
                "profile_description": user.profile_description
            }, status=status.HTTP_200_OK)
#
    return Response(status=status.HTTP_400_BAD_REQUEST)


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
            # trip.time_of_departure = datetime.strptime(trip.time_of_departure, "%H:%M %m/%d/%Y")
            # trip = get_route_details(trip)
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
            trip = request.user.current_trip

            people = CarpoolUser.objects.filter(current_trip=trip.id)

            ids_list = []
            for user in people:
                ids_list.append(user.id)
                user.status = "available"
                user.current_trip = None
                user.save()

            trip.delete()
            return Response({"uids": ids_list}, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_trips(request):
    """
    Used by passengers to search for trips
    """
    dcu_campuses = {
        "gla": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
        "pat": "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland"
    }

    if request.method == 'POST':
        passenger = CarpoolUser.objects.get(id=request.user.id)

        if passenger.status == "busy":
            return Response({"error": "You already have an ongoing trip."})

        passenger_start_dcu = request.data["start"]["name"] in dcu_campuses.values()

        active_driver_users = CarpoolUser.objects.exclude(current_trip=None)

        active_trip_id_list = [driver.current_trip.id for driver in active_driver_users if
                               driver.current_trip.id != None]
        if passenger_start_dcu:
            active_trips = Trip.objects.filter(id__in=active_trip_id_list).filter(start__name__in=dcu_campuses.values())
        else:
            active_trips = Trip.objects.filter(id__in=active_trip_id_list).filter(
                destination__name__in=dcu_campuses.values())

        sorted_trips = active_trips.order_by("time_of_departure")
        final_list = []
        for trip in sorted_trips:
            if passenger_start_dcu and (trip.start["name"] in dcu_campuses.values()):
                updated_trip = get_route_details(trip, request.data["destination"]["name"])

            elif (request.data["destination"]["name"] in dcu_campuses.values()) \
                    and (trip.destination["name"] in dcu_campuses.values()):
                updated_trip = get_route_details(trip, request.data["start"]["name"])

            print("new eta", updated_trip.ETA)

            final_list.append(updated_trip)

        final_sorted_list = sorted(final_list, key=lambda t: t.ETA)

        trips_serialized = json.loads(django_serializers.serialize("json", final_sorted_list))

        for index, trip in enumerate(trips_serialized):
            driver_name = Driver.objects.get(id=trips_serialized[index]["fields"]["driver_id"]).name

            if not request.data["isPassengerToDCU"]:
                is_campus_same = request.data["start"]["name"] == trip["fields"]["start"]["name"]
            else:
                is_campus_same = request.data["destination"]["name"] == trip["fields"]["destination"]["name"]

            trips_serialized[index] = {
                "pk": trip["pk"], "driver_name": driver_name, "isCampusSame": is_campus_same, **trip["fields"]
            }

        return Response(trips_serialized, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def join_trip(request):
    """
    Used by passengers to get trip data when a passengers request to a driver is accepted.
    Also used by drivers to get trip data when a passenger leaves the trip.
    """
    if request.method == "GET":
        if Trip.objects.filter(id=request.user.current_trip.id).exists():
            trip = Trip.objects.get(id=request.user.current_trip.id)
            return Response({"trip_data": model_to_dict(trip)}, status=status.HTTP_200_OK)

        return Response({"error": "Trip no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


def get_route_details(trip, passenger_location="", passenger_secondary_location=""):
    if len(trip.waypoints) < 1:
        waypoints = ""
    else:
        print(trip.waypoints.values())
        waypoints = "|".join([wp["name"] for wp in trip.waypoints.values()])

    directions_base_url = "https://maps.googleapis.com/maps/api/directions/json"
    directions_url = urllib.parse.quote(
        f"{directions_base_url}?destination={trip.destination['name']}&origin={trip.start['name']}&waypoints=optimize:true|{waypoints}|{passenger_location}|{passenger_secondary_location}&key={settings.GOOGLE_API_KEY}",
        safe='=?:/&'
    )
    print(directions_url)
    # TODO: Match address names using waypoint_order
    response = requests.get(directions_url)

    distance_calculation = 0
    duration_calculation = 0
    departure_time = datetime.timestamp(trip.time_of_departure)
    route = []
    for leg in response.json()["routes"][0]["legs"]:
        arrival_time = departure_time + int(leg["duration"]["value"])
        waypoint_info = {
            "start": leg["start_address"],
            "destination": leg["end_address"],
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "departure_time": datetime.fromtimestamp(departure_time).replace(microsecond=0).strftime("%H:%M %m/%d/%Y"),
            "arrival_time": datetime.fromtimestamp(arrival_time).replace(microsecond=0).strftime("%H:%M %m/%d/%Y")
        }
        # seconds= TIME.datetime.timestamp()

        if "km" in leg["distance"]["text"]:
            distance_calculation += float(leg["distance"]["text"].replace(",", "")[:-3])
        else:
            distance_calculation += float(leg["distance"]["text"][:-2]) // 1000

        duration_calculation += int(leg["duration"]["value"])

        departure_time += int(leg["duration"]["value"])

        # shows distance & duration between waypoints
        print(waypoint_info)
        route.append(waypoint_info)

    trip_time = timedelta(seconds=duration_calculation)
    eta = trip.time_of_departure + trip_time

    duration_calculation = str(timedelta(seconds=duration_calculation)).split(":")
    total_duration = f"{duration_calculation[0]} hours, {duration_calculation[1].lstrip('0')} min, {duration_calculation[2]} sec"

    # removes .0 from distance
    if str(distance_calculation)[-1] == "0":
        total_distance = str(distance_calculation)[:-2] + " km"
    else:
        total_distance = str(distance_calculation) + " km"

    trip.distance = total_distance
    trip.duration = total_duration
    trip.ETA = eta.replace(microsecond=0)
    trip.route = {"route": route}

    return trip


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_passenger_to_trip(request):

    dcu_campuses = {
        "gla": "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9",
        "pat": "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland"
    }

    if request.method == "POST":
        print("Adding passenger to trip...")
        passenger_start = request.data["passengerData"]["passengerStart"]
        passenger_dest = request.data["passengerData"]["passengerDestination"]
        trip_id = request.data.get("tripID")
        if CarpoolUser.objects.filter(id=request.data["passengerData"]["id"]).exists():
            passenger_user = CarpoolUser.objects.get(id=request.data["passengerData"]["id"])
            if Trip.objects.filter(id=trip_id).exists():
                trip = Trip.objects.get(id=trip_id)
                if trip.passengers.get(f"passenger{passenger_user.id}") is None: # it was
                    passenger_user.current_trip = trip  #
                    passenger_user.status = "passenger_busy" # theres an error in frontend with waypoints
                else:
                    return Response({"error": "passenger already in the same trip."}, status=status.HTTP_400_BAD_REQUEST)

                trip.passengers[f"passenger{passenger_user.id}"] = {
                    "passengerName": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                    "passengerID": request.data["passengerData"]["id"],
                    "passengerStart": passenger_start["name"],
                    "passengerDestination": passenger_dest["name"],
                }

                same_campus = (trip.start["name"] == passenger_start["name"]) or \
                              (trip.destination["name"] == passenger_dest["name"])

                if (trip.start["name"] in dcu_campuses.values()) and (passenger_start["name"] in dcu_campuses.values()): #
                    trip.waypoints[f"waypoint{len(trip.waypoints) + 1}"] = { #
                        "name": passenger_dest["name"],
                        "passenger": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                        "lat": passenger_dest["lat"],
                        "lng": passenger_dest["lng"],
                    }
                    trip.passengers[f"passenger{passenger_user.id}"]["passengerStart"] = trip.start["name"]

                elif (trip.destination["name"] in dcu_campuses.values()) and (passenger_dest["name"] in dcu_campuses.values()):
                    trip.waypoints[f"waypoint{len(trip.waypoints)+1}"] = {
                        "name": passenger_start["name"],
                        "passenger": f"{passenger_user.first_name} {passenger_user.last_name[0]}.",
                        "lat": passenger_start["lat"],
                        "lng": passenger_start["lng"],
                    }
                    trip.passengers[f"passenger{passenger_user.id}"]["passengerDestination"] = trip.destination["name"]

                trip.available_seats -= 1
                print("BEFORE:", trip.waypoints)
                route_details = get_route_details(trip)
                print("AFTER:", route_details.waypoints)
                trip_data = model_to_dict(route_details)

                passenger_user.save()
                route_details.save()
                return Response({"trip_data": trip_data, "is_same_campus": same_campus}, status=status.HTTP_200_OK)

            return Response({"error": "Trip no longer exists."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": "Passenger does not exist"}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_trip(request):
    if request.method == "POST":
        trip_id = request.data.get("tripID")
        if Trip.objects.filter(id=trip_id).exists():
            people = CarpoolUser.objects.filter(current_trip=trip_id)

            ids_list = []
            # trip = Trip.objects.get(id=trip_id)
            for user in people:
                ids_list.append(user.id)
                user.status = "available"
                user.current_trip = None
                user.save()

            return Response({"uids": ids_list}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Trip does not exist."}, status=status.HTTP_404_NOT_FOUND)

    return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def passenger_leave_trip(request):
    if request.method == "GET":
        passenger = request.user
        if passenger.current_trip is not None:
            trip = passenger.current_trip

            temp_passengers_dict = {**trip.passengers}
            locations_count = {}

            for key, passenger in trip.passengers.items():
                # to prevent removing leaving passengers waypoints if other passengers have it as well
                if passenger["passengerStart"] not in locations_count:
                    locations_count[passenger["passengerStart"]] = 1
                else:
                    locations_count[passenger["passengerStart"]] += 1

                if passenger["passengerDestination"] not in locations_count:
                    locations_count[passenger["passengerDestination"]] = 1
                else:
                    locations_count[passenger["passengerDestination"]] += 1

                temp_waypoints_dict = {**trip.waypoints}
                if int(passenger["passengerID"]) == request.user.id:
                    print("Remove passenger: ", request.user.id)
                    temp_passengers_dict.pop(key)
                    passenger_start = passenger["passengerStart"]
                    passenger_destination = passenger["passengerDestination"]
                    for waypoint_key, waypoint in trip.waypoints.items():
                        if waypoint["name"] == passenger_start or waypoint["name"] == passenger_destination:
                            if locations_count[waypoint["name"]] == 1:
                                temp_waypoints_dict.pop(waypoint_key)
                                locations_count[waypoint["name"]] = 0

                    trip.waypoints = temp_waypoints_dict

            passenger = request.user

            trip.passengers = temp_passengers_dict
            trip.available_seats += 1

            route_details = get_route_details(trip)
            route_details.save()

            passenger.current_trip = None
            passenger.status = "available"
            passenger.save()
            return Response({"status": "Passenger removed from trip.", "available_seats": trip.available_seats}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Passenger does not have an active trip."}, status=status.HTTP_204_NO_CONTENT)

    return Response(status=status.HTTP_400_BAD_REQUEST)
