from django.contrib import admin
from .models import ShowSeat, Booking, BookingSeat

@admin.register(ShowSeat)
class ShowSeatAdmin(admin.ModelAdmin):
    list_display = ('show', 'row_name', 'column_number', 'seat_type', 'price', 'status', 'locked_by')
    list_filter = ('status', 'seat_type', 'show__date', 'show__movie')
    search_fields = ('row_name', 'show__movie__title', 'show__screen__cinema__name')

class BookingSeatInline(admin.TabularInline):
    model = BookingSeat
    extra = 0

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'show', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at', 'show__movie')
    search_fields = ('user__username', 'user__email', 'show__movie__title')
    inlines = [BookingSeatInline]

@admin.register(BookingSeat)
class BookingSeatAdmin(admin.ModelAdmin):
    list_display = ('booking', 'show_seat')

