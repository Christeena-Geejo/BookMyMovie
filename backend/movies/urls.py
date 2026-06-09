from django.urls import path
from .views import (
    LocationListView, MovieListView, MovieDetailView, MovieShowsListView, 
    ReviewListCreateView, OrganizerMovieCreateView, OrganizerShowCreateView, 
    OrganizerDashboardDataView, OrganizerScreenListView, OrganizerApprovedMovieListView, 
    OrganizerCinemaListCreateView, OrganizerScreenListCreateView,
    AdminMovieApprovalView, AdminShowApprovalView, AdminCinemaApprovalView
)

urlpatterns = [
    path('locations/', LocationListView.as_view(), name='location_list'),
    path('movies/', MovieListView.as_view(), name='movie_list'),
    path('movies/<int:pk>/', MovieDetailView.as_view(), name='movie_detail'),
    path('movies/<int:movie_id>/shows/', MovieShowsListView.as_view(), name='movie_shows_list'),
    path('movies/<int:movie_id>/reviews/', ReviewListCreateView.as_view(), name='movie_reviews'),
    
    # Organizer routes
    path('organizer/cinemas/', OrganizerCinemaListCreateView.as_view(), name='organizer_cinemas'),
    path('organizer/screens/', OrganizerScreenListCreateView.as_view(), name='organizer_screens'),
    path('organizer/screens/approved/', OrganizerScreenListView.as_view(), name='organizer_screens_approved'),
    path('organizer/movies/', OrganizerMovieCreateView.as_view(), name='organizer_movies'),
    path('organizer/shows/', OrganizerShowCreateView.as_view(), name='organizer_shows'),
    path('organizer/dashboard/', OrganizerDashboardDataView.as_view(), name='organizer_dashboard'),
    path('organizer/approved-movies/', OrganizerApprovedMovieListView.as_view(), name='organizer_approved_movies'),
    
    # Admin approval routes
    path('admin/cinemas/<int:cinema_id>/approve/', AdminCinemaApprovalView.as_view(), name='admin_cinema_approve'),
    path('admin/movies/<int:movie_id>/approve/', AdminMovieApprovalView.as_view(), name='admin_movie_approve'),
    path('admin/shows/<int:show_id>/approve/', AdminShowApprovalView.as_view(), name='admin_show_approve'),
]


