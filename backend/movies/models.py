from django.db import models
from django.conf import settings


class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration_minutes = models.IntegerField(help_text="Duration in minutes")
    language = models.CharField(max_length=100)
    genre = models.CharField(max_length=100)
    poster = models.ImageField(upload_to='movie_posters/', blank=True, null=True)
    release_date = models.DateField()

    approval_status = models.CharField(
        max_length=20,
        choices=(('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')),
        default='PENDING'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_movies'
    )

    def __str__(self):
        return f"{self.title} ({self.language})"


class Cinema(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='cinemas')
    approval_status = models.CharField(
        max_length=20,
        choices=(('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')),
        default='PENDING'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_cinemas'
    )

    def __str__(self):
        return f"{self.name} - {self.location.name}"

class Screen(models.Model):
    cinema = models.ForeignKey(Cinema, on_delete=models.CASCADE, related_name='screens')
    name = models.CharField(max_length=100, help_text="e.g. Screen 1, IMAX")
    rows = models.IntegerField(default=10, help_text="Number of rows (A-Z representation)")
    columns = models.IntegerField(default=15, help_text="Number of seats per row")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_screens'
    )

    def __str__(self):
        return f"{self.cinema.name} - {self.name}"

class SeatTemplate(models.Model):
    SEAT_TYPES = (
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
        ('VIP', 'VIP'),
    )
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='seat_templates')
    row_name = models.CharField(max_length=5, help_text="e.g. A, B, C")
    column_number = models.IntegerField()
    seat_type = models.CharField(max_length=20, choices=SEAT_TYPES, default='STANDARD')

    class Meta:
        unique_together = ('screen', 'row_name', 'column_number')

    def __str__(self):
        return f"{self.screen} Seat {self.row_name}{self.column_number} ({self.seat_type})"

class Show(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='shows')
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='shows')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Base prices for different seat tiers in this show
    price_standard = models.DecimalField(max_digits=8, decimal_places=2, default=150.00)
    price_premium = models.DecimalField(max_digits=8, decimal_places=2, default=250.00)
    price_vip = models.DecimalField(max_digits=8, decimal_places=2, default=400.00)

    approval_status = models.CharField(
        max_length=20,
        choices=(('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')),
        default='PENDING'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_shows'
    )

    def __str__(self):
        return f"{self.movie.title} at {self.screen.cinema.name} ({self.date} {self.start_time})"


class Review(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(help_text="Rating from 1 to 5")
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Removed unique_together constraint to allow multiple reviews per user per movie

    def __str__(self):
        return f"{self.user.username}'s review of {self.movie.title} - {self.rating} stars"

