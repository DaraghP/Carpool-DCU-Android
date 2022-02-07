from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
# Create your models here.


class CarpoolUser(AbstractUser):
    id = models.AutoField(primary_key=True)
    is_admin = models.BooleanField(default=False)
    phone_no = models.DecimalField(max_digits=13, decimal_places=0, default="0871234567")
    photo = models.FileField(upload_to='defaults/', default="defaults/person-outline.svg")


class Driver(models.Model):
    id = models.AutoField(primary_key=True)
    uid = models.ForeignKey("CarpoolUser", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    car = models.ForeignKey("Car", null=True, on_delete=models.CASCADE)
    # current_trip = models.ForeignKey("Trip", null=True, on_delete=models.CASCADE)


class Passenger(models.Model):
    id = models.AutoField(primary_key=True)
    uid = models.ForeignKey("CarpoolUser", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    current_trip = models.ForeignKey("Trip", null=True, on_delete=models.CASCADE)

# 
class Trip(models.Model):
    id = models.AutoField(primary_key=True)
    driver_id = models.ForeignKey("Driver", on_delete=models.CASCADE)
    time_of_departure = models.DateTimeField(default=timezone.now())
    start = models.JSONField(default=dict)
    destination = models.JSONField(default=dict)
    waypoints = models.JSONField(default=dict)
    distance = models.CharField(default="0", max_length=150)
    duration = models.CharField(default="0", max_length=150)
    passengers = models.JSONField(default=dict)
    available_seats = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    # TODO: constraints

class Car(models.Model):
    id = models.AutoField(primary_key=True)
    make = models.CharField(max_length=150)
    model = models.CharField(max_length=150)
    colour = models.CharField(max_length=150)
    license_plate = models.CharField(max_length=150)


class Constraints(models.Model):
    id = models.AutoField(primary_key=True)

