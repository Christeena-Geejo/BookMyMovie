from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Movie, Review
import datetime

User = get_user_model()

class ReviewAPITests(APITestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            username='reviewer',
            email='reviewer@example.com',
            password='password123'
        )
        self.movie = Movie.objects.create(
            title='Inception',
            description='A thief who steals corporate secrets through the use of dream-sharing technology...',
            duration_minutes=148,
            language='English',
            genre='Sci-Fi, Thriller',
            release_date=datetime.date(2010, 7, 16)
        )
        self.list_create_url = reverse('movie_reviews', kwargs={'movie_id': self.movie.id})

    def test_list_reviews_empty(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_review_unauthenticated(self):
        data = {
            'rating': 5,
            'comment': 'Masterpiece!'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_review_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'rating': 5,
            'comment': 'Mind-blowing movie!'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['rating'], 5)
        
        # Verify Review exists in DB
        self.assertEqual(Review.objects.count(), 1)
        review = Review.objects.first()
        self.assertEqual(review.comment, 'Mind-blowing movie!')
        
        # Verify Movie serialization now returns avg rating and count
        detail_url = reverse('movie_detail', kwargs={'pk': self.movie.id})
        movie_response = self.client.get(detail_url)
        self.assertEqual(movie_response.data['average_rating'], 5.0)
        self.assertEqual(movie_response.data['reviews_count'], 1)

    def test_duplicate_reviews_are_allowed(self):
        self.client.force_authenticate(user=self.user)
        Review.objects.create(
            movie=self.movie,
            user=self.user,
            rating=4,
            comment='Good'
        )
        
        data = {
            'rating': 5,
            'comment': 'Another review'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 2)


    def test_invalid_rating_range(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'rating': 6, # invalid
            'comment': 'Too good'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)

class MovieApprovalTests(APITestCase):
    def setUp(self):
        from movies.models import Location, Cinema, Screen
        # Create users
        self.customer = User.objects.create_user(username='cust', password='password123', is_customer=True)
        self.manager = User.objects.create_user(username='mngr', password='password123', is_cinema_manager=True)
        self.admin = User.objects.create_user(username='adm', password='password123', is_staff=True, is_superuser=True)
        
        self.location = Location.objects.create(name='CityA')
        self.cinema = Cinema.objects.create(name='CinemaA', address='Address', location=self.location)
        self.screen = Screen.objects.create(cinema=self.cinema, name='ScreenA', rows=5, columns=5)

    def test_organizer_movie_submission(self):
        self.client.force_authenticate(user=self.manager)
        url = reverse('organizer_movies')
        data = {
            'title': 'New Indie Film',
            'description': 'A very deep indie story.',
            'duration_minutes': 90,
            'language': 'English',
            'genre': 'Drama',
            'release_date': '2026-06-08'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['approval_status'], 'PENDING')
        self.assertEqual(Movie.objects.filter(title='New Indie Film').count(), 1)

    def test_unauthorized_movie_submission_fails(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('organizer_movies')
        data = {
            'title': 'Indie Fails',
            'description': 'Description',
            'duration_minutes': 90,
            'language': 'English',
            'genre': 'Drama',
            'release_date': '2026-06-08'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_movie_approval(self):
        movie = Movie.objects.create(
            title='Pending Movie',
            description='Desc',
            duration_minutes=100,
            language='English',
            genre='Comedy',
            release_date='2026-06-08',
            approval_status='PENDING'
        )
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin_movie_approve', kwargs={'movie_id': movie.id})
        response = self.client.post(url, {'status': 'APPROVED'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify approved
        movie.refresh_from_db()
        self.assertEqual(movie.approval_status, 'APPROVED')

    def test_customer_views_only_approved_movies(self):
        # Create approved movie
        Movie.objects.create(
            title='Approved Movie',
            description='Desc',
            duration_minutes=100,
            language='English',
            genre='Comedy',
            release_date='2026-06-08',
            approval_status='APPROVED'
        )
        # Create pending movie
        Movie.objects.create(
            title='Secret Pending Movie',
            description='Desc',
            duration_minutes=100,
            language='English',
            genre='Comedy',
            release_date='2026-06-08',
            approval_status='PENDING'
        )
        
        url = reverse('movie_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only list Approved Movie, not Secret Pending Movie
        titles = [m['title'] for m in response.data]
        self.assertIn('Approved Movie', titles)
        self.assertNotIn('Secret Pending Movie', titles)


class CinemaApprovalTests(APITestCase):
    def setUp(self):
        from movies.models import Location, Cinema, Screen
        # Create users
        self.customer = User.objects.create_user(username='cust2', password='password123', is_customer=True)
        self.manager = User.objects.create_user(username='mngr2', password='password123', is_cinema_manager=True)
        self.admin = User.objects.create_user(username='adm2', password='password123', is_staff=True, is_superuser=True)
        self.location = Location.objects.create(name='CityB')

    def test_cinema_submission_pending(self):
        self.client.force_authenticate(user=self.manager)
        url = reverse('organizer_cinemas')
        data = {
            'name': 'New Multiplex',
            'address': '123 Street',
            'location': self.location.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['approval_status'], 'PENDING')
        
        from movies.models import Cinema
        cinema = Cinema.objects.get(name='New Multiplex')
        self.assertEqual(cinema.approval_status, 'PENDING')
        self.assertEqual(cinema.submitted_by, self.manager)

    def test_screen_requires_approved_cinema(self):
        from movies.models import Cinema
        # Cinema that is pending approval
        cinema_pending = Cinema.objects.create(
            name='Pending Cinema',
            address='123 Road',
            location=self.location,
            approval_status='PENDING',
            submitted_by=self.manager
        )
        # Cinema that is approved
        cinema_approved = Cinema.objects.create(
            name='Approved Cinema',
            address='123 Road',
            location=self.location,
            approval_status='APPROVED',
            submitted_by=self.manager
        )
        
        self.client.force_authenticate(user=self.manager)
        url = reverse('organizer_screens')
        
        # Try creating screen for pending cinema
        data_pending = {
            'cinema': cinema_pending.id,
            'name': 'Audi 1',
            'rows': 10,
            'columns': 10
        }
        response = self.client.post(url, data_pending, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot add screens to an unapproved cinema', str(response.data))

        # Try creating screen for approved cinema
        data_approved = {
            'cinema': cinema_approved.id,
            'name': 'Audi 1',
            'rows': 10,
            'columns': 10
        }
        response = self.client.post(url, data_approved, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_cinema_approval(self):
        from movies.models import Cinema
        cinema = Cinema.objects.create(
            name='To Approve',
            address='123 Road',
            location=self.location,
            approval_status='PENDING',
            submitted_by=self.manager
        )
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin_cinema_approve', kwargs={'cinema_id': cinema.id})
        
        response = self.client.post(url, {'status': 'APPROVED'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cinema.refresh_from_db()
        self.assertEqual(cinema.approval_status, 'APPROVED')

