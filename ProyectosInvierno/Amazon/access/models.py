from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.
class Usuario(AbstractUser):
    email = models.EmailField("Email", unique=True)
    age = models.IntegerField(
        "Edad",
        null=False,
        blank=False,
    )