from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from .models import Location, Movie, Cinema, Show, Review
from .serializers import LocationSerializer, MovieSerializer, ShowSerializer, ReviewSerializer


class LocationListView(generics.ListAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = ()

class MovieListView(generics.ListAPIView):
    serializer_class = MovieSerializer
    permission_classes = ()

    def get_queryset(self):
        queryset = Movie.objects.filter(approval_status='APPROVED')
        location_name = self.request.query_params.get('location')
        if location_name:
            queryset = queryset.filter(
                shows__screen__cinema__location__name=location_name, 
                shows__approval_status='APPROVED',
                shows__screen__cinema__approval_status='APPROVED'
            ).distinct()
        return queryset


class MovieDetailView(generics.RetrieveAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = ()

class MovieShowsListView(views.APIView):
    permission_classes = ()

    def get(self, request, movie_id):
        location = request.query_params.get('location')
        date_str = request.query_params.get('date')

        if not location or not date_str:
            return Response(
                {"error": "Both 'location' and 'date' query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        parsed_date = parse_date(date_str)
        if not parsed_date:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get shows for the movie on this date and location
        shows = Show.objects.filter(
            movie_id=movie_id,
            screen__cinema__location__name=location,
            date=parsed_date,
            approval_status='APPROVED',
            movie__approval_status='APPROVED',
            screen__cinema__approval_status='APPROVED'
        ).select_related('screen__cinema')


        # Group shows by cinema
        cinema_shows = {}
        for show in shows:
            cinema = show.screen.cinema
            if cinema.id not in cinema_shows:
                cinema_shows[cinema.id] = {
                    "cinema_id": cinema.id,
                    "cinema_name": cinema.name,
                    "address": cinema.address,
                    "shows": []
                }
            
            show_data = ShowSerializer(show).data
            cinema_shows[cinema.id]["shows"].append(show_data)

        return Response(list(cinema_shows.values()), status=status.HTTP_200_OK)

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        movie_id = self.kwargs.get('movie_id')
        return Review.objects.filter(movie_id=movie_id).order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        movie_id = self.kwargs.get('movie_id')
        serializer.save(user=self.request.user, movie_id=movie_id)

from rest_framework.permissions import BasePermission
from .serializers import ScreenSerializer, CinemaSerializer
from .models import Screen, Cinema

class IsCinemaManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_cinema_manager or request.user.is_staff)

class IsAdminUserOrStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)

class OrganizerCinemaListCreateView(generics.ListCreateAPIView):
    serializer_class = CinemaSerializer
    permission_classes = (IsCinemaManager,)

    def get_queryset(self):
        return Cinema.objects.filter(submitted_by=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user, approval_status='PENDING')

class OrganizerScreenListCreateView(generics.ListCreateAPIView):
    serializer_class = ScreenSerializer
    permission_classes = (IsCinemaManager,)

    def get_queryset(self):
        return Screen.objects.filter(submitted_by=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        cinema = serializer.validated_data.get('cinema')
        if cinema.submitted_by != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You do not have permission to add screens to this cinema.")
        if cinema.approval_status != 'APPROVED':
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot add screens to an unapproved cinema.")
        serializer.save(submitted_by=self.request.user)

class OrganizerMovieCreateView(generics.ListCreateAPIView):
    serializer_class = MovieSerializer
    permission_classes = (IsCinemaManager,)

    def get_queryset(self):
        return Movie.objects.filter(submitted_by=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user, approval_status='PENDING')

class OrganizerShowCreateView(generics.ListCreateAPIView):
    serializer_class = ShowSerializer
    permission_classes = (IsCinemaManager,)

    def get_queryset(self):
        return Show.objects.filter(submitted_by=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user, approval_status='PENDING')

class OrganizerDashboardDataView(views.APIView):
    permission_classes = (IsCinemaManager,)

    def get(self, request):
        movies = Movie.objects.filter(submitted_by=request.user).order_by('-id')
        shows = Show.objects.filter(submitted_by=request.user).order_by('-id')
        cinemas = Cinema.objects.filter(submitted_by=request.user).order_by('-id')
        screens = Screen.objects.filter(submitted_by=request.user).order_by('-id')
        
        movies_data = MovieSerializer(movies, many=True).data
        shows_data = ShowSerializer(shows, many=True).data
        cinemas_data = CinemaSerializer(cinemas, many=True).data
        screens_data = ScreenSerializer(screens, many=True).data
        
        return Response({
            "movies": movies_data,
            "shows": shows_data,
            "cinemas": cinemas_data,
            "screens": screens_data
        }, status=status.HTTP_200_OK)

class OrganizerScreenListView(generics.ListAPIView):
    serializer_class = ScreenSerializer
    permission_classes = (IsCinemaManager,)

    def get_queryset(self):
        # Only return screens of approved cinemas submitted by the user
        return Screen.objects.filter(
            cinema__approval_status='APPROVED',
            cinema__submitted_by=self.request.user
        ).order_by('-id')

class OrganizerApprovedMovieListView(generics.ListAPIView):
    queryset = Movie.objects.filter(approval_status='APPROVED')
    serializer_class = MovieSerializer
    permission_classes = (IsCinemaManager,)

class AdminCinemaApprovalView(views.APIView):
    permission_classes = (IsAdminUserOrStaff,)

    def post(self, request, cinema_id):
        try:
            cinema = Cinema.objects.get(id=cinema_id)
        except Cinema.DoesNotExist:
            return Response({"error": "Cinema not found."}, status=status.HTTP_404_NOT_FOUND)
            
        approval = request.data.get('status')
        if approval not in ['APPROVED', 'REJECTED']:
            return Response({"error": "Invalid status. Use APPROVED or REJECTED."}, status=status.HTTP_400_BAD_REQUEST)
            
        cinema.approval_status = approval
        cinema.save()
        return Response(CinemaSerializer(cinema).data, status=status.HTTP_200_OK)

class AdminMovieApprovalView(views.APIView):
    permission_classes = (IsAdminUserOrStaff,)

    def post(self, request, movie_id):
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response({"error": "Movie not found."}, status=status.HTTP_404_NOT_FOUND)
            
        approval = request.data.get('status')
        if approval not in ['APPROVED', 'REJECTED']:
            return Response({"error": "Invalid status. Use APPROVED or REJECTED."}, status=status.HTTP_400_BAD_REQUEST)
            
        movie.approval_status = approval
        movie.save()
        return Response(MovieSerializer(movie).data, status=status.HTTP_200_OK)

class AdminShowApprovalView(views.APIView):
    permission_classes = (IsAdminUserOrStaff,)

    def post(self, request, show_id):
        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)
            
        approval = request.data.get('status')
        if approval not in ['APPROVED', 'REJECTED']:
            return Response({"error": "Invalid status. Use APPROVED or REJECTED."}, status=status.HTTP_400_BAD_REQUEST)
            
        if approval == 'APPROVED':
            if show.movie.approval_status != 'APPROVED':
                return Response(
                    {"error": "Cannot approve show: The movie for this show is not approved yet."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if show.screen.cinema.approval_status != 'APPROVED':
                return Response(
                    {"error": "Cannot approve show: The cinema for this show is not approved yet."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        show.approval_status = approval
        show.save()
        return Response(ShowSerializer(show).data, status=status.HTTP_200_OK)


