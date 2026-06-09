from django.contrib import admin
from .models import Location, Movie, Cinema, Screen, SeatTemplate, Show, Review

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'language', 'genre', 'release_date', 'approval_status', 'submitted_by')
    list_filter = ('language', 'genre', 'approval_status')
    search_fields = ('title', 'description')
    list_editable = ('approval_status',)

@admin.register(Cinema)
class CinemaAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'approval_status', 'submitted_by')
    list_filter = ('location', 'approval_status')
    search_fields = ('name', 'address')
    list_editable = ('approval_status',)

@admin.register(Screen)
class ScreenAdmin(admin.ModelAdmin):
    list_display = ('name', 'cinema', 'rows', 'columns', 'submitted_by')
    list_filter = ('cinema',)
    search_fields = ('name', 'cinema__name')

@admin.register(SeatTemplate)
class SeatTemplateAdmin(admin.ModelAdmin):
    list_display = ('screen', 'row_name', 'column_number', 'seat_type')
    list_filter = ('seat_type', 'screen__cinema', 'screen')
    search_fields = ('row_name',)

@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ('movie', 'screen', 'date', 'start_time', 'end_time', 'approval_status', 'submitted_by')
    list_filter = ('date', 'approval_status', 'screen__cinema', 'movie')
    list_editable = ('approval_status',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('movie', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'movie')
    search_fields = ('comment', 'user__username', 'movie__title')

