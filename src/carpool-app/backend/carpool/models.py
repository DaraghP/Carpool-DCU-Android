from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
# recommend looking at rest framework docs
#
class CarpoolUser(AbstractUser):
    is_admin = models.BooleanField(default=False)
