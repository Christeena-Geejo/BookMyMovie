from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from movies.models import Show, SeatTemplate

class ShowSeat(models.Model):
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('LOCKED', 'Locked'),
        ('BOOKED', 'Booked'),
    )
    SEAT_TYPES = (
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
        ('VIP', 'VIP'),
    )
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='seats')
    row_name = models.CharField(max_length=5)
    column_number = models.IntegerField()
    seat_type = models.CharField(max_length=20, choices=SEAT_TYPES, default='STANDARD')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='locked_seats'
    )

    class Meta:
        unique_together = ('show', 'row_name', 'column_number')

    def __str__(self):
        return f"{self.show} - Seat {self.row_name}{self.column_number} ({self.status})"

class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('CONFIRMED', 'Confirmed'),
        ('EXPIRED', 'Expired/Cancelled'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Razorpay payment fields
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=200, null=True, blank=True)
    
    # Ticket verification fields
    booking_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_used = models.BooleanField(default=False)
    scanned_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        import random
        import string
        from django.utils import timezone
        
        if not self.booking_code:
            year = timezone.now().year
            while True:
                # e.g., BMS-2026-A1B2C3
                code = f"BMS-{year}-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
                if not Booking.objects.filter(booking_code=code).exists():
                    self.booking_code = code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.booking_code or self.id} - {self.user.username} - {self.status}"

class BookingSeat(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_seats')
    show_seat = models.ForeignKey(ShowSeat, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('booking', 'show_seat')

    def __str__(self):
        return f"Booking {self.booking.id} - Seat {self.show_seat.row_name}{self.show_seat.column_number}"

from decimal import Decimal

# Signal to automatically generate ShowSeats when a Show is created
@receiver(post_save, sender=Show)
def create_show_seats(sender, instance, created, **kwargs):
    if not created:
        return
        
    screen = instance.screen
    templates = SeatTemplate.objects.filter(screen=screen)
    
    if templates.exists():
        # Use existing templates
        show_seats = []
        for t in templates:
            show_seats.append(
                ShowSeat(
                    show=instance,
                    row_name=t.row_name,
                    column_number=t.column_number,
                    seat_type='STANDARD',
                    price=Decimal('100.00'),
                    status='AVAILABLE'
                )
            )
        ShowSeat.objects.bulk_create(show_seats)
    else:
        # Generate default grid layout based on screen rows and columns
        show_seats = []
        rows = screen.rows
        cols = screen.columns
        
        for r in range(1, rows + 1):
            row_name = chr(64 + r)  # A, B, C...
            for c in range(1, cols + 1):
                show_seats.append(
                    ShowSeat(
                        show=instance,
                        row_name=row_name,
                        column_number=c,
                        seat_type='STANDARD',
                        price=Decimal('100.00'),
                        status='AVAILABLE'
                    )
                )
        ShowSeat.objects.bulk_create(show_seats)

