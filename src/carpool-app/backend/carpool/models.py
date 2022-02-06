from django.db import models
from django.contrib.auth.models import AbstractUser

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


class Trip(models.Model):
    id = models.AutoField(primary_key=True)
    start = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    distance = models.DecimalField(max_digits=10000, decimal_places=2)
    driver_id = models.ForeignKey("Driver", on_delete=models.CASCADE)
    passenger_id = models.ForeignKey("Passenger", on_delete=models.CASCADE)
    # constraints = models.OneToOneField(Constraints, on_delete=models.CASCADE)


class Car(models.Model):
    id = models.AutoField(primary_key=True)
    make = models.CharField(max_length=150)
    model = models.CharField(max_length=150)
    colour = models.CharField(max_length=150)
    license_plate = models.CharField(max_length=150)


class Constraints(models.Model):
    id = models.AutoField(primary_key=True)

