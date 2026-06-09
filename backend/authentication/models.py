from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_customer = models.BooleanField(default=True)
    is_cinema_manager = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} (Customer: {self.is_customer}, Manager: {self.is_cinema_manager})"
