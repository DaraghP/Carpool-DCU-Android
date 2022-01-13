from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


class CarpoolUser(AbstractUser):
    id = models.AutoField(primary_key=True)
    is_admin = models.BooleanField(default=False)
