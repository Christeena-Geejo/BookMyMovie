from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from movies.models import Location, Movie, Cinema, Screen, Show
from bookings.models import ShowSeat, Booking, BookingSeat
from bookings.tasks import release_expired_locks
import datetime

User = get_user_model()

class BookingAPITests(APITestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            username='testcustomer',
            email='testcustomer@example.com',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

        # Create basic cinema details
        self.location = Location.objects.create(name='TestCity')
        self.movie = Movie.objects.create(
            title='Test Movie',
            description='Test description',
            duration_minutes=120,
            language='English',
            genre='Drama',
            release_date=datetime.date.today()
        )
        self.cinema = Cinema.objects.create(
            name='Test Cinema',
            address='123 Test St',
            location=self.location
        )
        # 2 rows, 5 columns = 10 seats
        self.screen = Screen.objects.create(
            cinema=self.cinema,
            name='Screen 1',
            rows=2,
            columns=5
        )
        
        # Creating show will trigger post_save signal creating 10 ShowSeats
        self.show = Show.objects.create(
            movie=self.movie,
            screen=self.screen,
            date=datetime.date.today(),
            start_time=datetime.time(14, 0),
            end_time=datetime.time(16, 0),
            price_standard=100.00,
            price_premium=150.00,
            price_vip=200.00
        )
        
        # Get references to some seats
        self.show_seats = list(ShowSeat.objects.filter(show=self.show))
        self.seat1 = self.show_seats[0]
        self.seat2 = self.show_seats[1]

    def test_get_seats_list(self):
        url = reverse('show_seats', kwargs={'show_id': self.show.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 10) # 2 rows * 5 columns

    def test_seat_locking_success(self):
        url = reverse('seat_lock')
        data = {
            'show_id': self.show.id,
            'seat_ids': [self.seat1.id, self.seat2.id]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Booking created
        booking_id = response.data['booking']['id']
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'PENDING')
        self.assertEqual(booking.total_amount, self.seat1.price + self.seat2.price)
        
        # Verify seats locked in DB
        seat1_db = ShowSeat.objects.get(id=self.seat1.id)
        seat2_db = ShowSeat.objects.get(id=self.seat2.id)
        self.assertEqual(seat1_db.status, 'LOCKED')
        self.assertEqual(seat1_db.locked_by, self.user)
        self.assertEqual(seat2_db.status, 'LOCKED')
        self.assertEqual(seat2_db.locked_by, self.user)

    def test_seat_locking_conflict(self):
        # First lock the seats
        url = reverse('seat_lock')
        data = {
            'show_id': self.show.id,
            'seat_ids': [self.seat1.id]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Create a second user and authenticate as them
        user2 = User.objects.create_user(
            username='testcustomer2',
            email='testcustomer2@example.com',
            password='password123'
        )
        self.client.force_authenticate(user=user2)
        
        # Try to lock the same seat again (should fail)
        response2 = self.client.post(url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('are no longer available', response2.data['error'])

    def test_celery_lock_release(self):
        # Lock seats
        url = reverse('seat_lock')
        data = {
            'show_id': self.show.id,
            'seat_ids': [self.seat1.id]
        }
        response = self.client.post(url, data, format='json')
        booking_id = response.data['booking']['id']
        
        # Verify locked
        seat_db = ShowSeat.objects.get(id=self.seat1.id)
        self.assertEqual(seat_db.status, 'LOCKED')
        
        # Manually run the Celery task synchronously
        release_expired_locks(booking_id)
        
        # Check booking is expired and seat is available
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'EXPIRED')
        
        seat_db_after = ShowSeat.objects.get(id=self.seat1.id)
        self.assertEqual(seat_db_after.status, 'AVAILABLE')
        self.assertIsNone(seat_db_after.locked_by)
        self.assertIsNone(seat_db_after.locked_at)

    def test_booking_confirmation(self):
        # Lock seats
        url_lock = reverse('seat_lock')
        data_lock = {
            'show_id': self.show.id,
            'seat_ids': [self.seat1.id]
        }
        response_lock = self.client.post(url_lock, data_lock, format='json')
        booking_id = response_lock.data['booking']['id']
        
        # Confirm booking
        url_confirm = reverse('booking_confirm')
        data_confirm = {'booking_id': booking_id}
        response_confirm = self.client.post(url_confirm, data_confirm, format='json')
        self.assertEqual(response_confirm.status_code, status.HTTP_200_OK)
        
        # Verify Booking is CONFIRMED and seats BOOKED
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'CONFIRMED')
        
        seat_db = ShowSeat.objects.get(id=self.seat1.id)
        self.assertEqual(seat_db.status, 'BOOKED')
        self.assertIsNone(seat_db.locked_by)
        self.assertIsNone(seat_db.locked_at)
