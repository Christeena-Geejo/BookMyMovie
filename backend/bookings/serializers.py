from rest_framework import serializers
from .models import ShowSeat, Booking, BookingSeat

class ShowSeatSerializer(serializers.ModelSerializer):
    is_locked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = ShowSeat
        fields = ('id', 'row_name', 'column_number', 'seat_type', 'price', 'status', 'is_locked_by_me')

    def get_is_locked_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.status == 'LOCKED' and obj.locked_by == request.user
        return False

class BookingSeatSerializer(serializers.ModelSerializer):
    seat_label = serializers.SerializerMethodField()
    seat_type = serializers.CharField(source='show_seat.seat_type', read_only=True)
    price = serializers.DecimalField(source='show_seat.price', max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = BookingSeat
        fields = ('id', 'show_seat', 'seat_label', 'seat_type', 'price')

    def get_seat_label(self, obj):
        return f"{obj.show_seat.row_name}{obj.show_seat.column_number}"

class BookingSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='show.movie.title', read_only=True)
    cinema_name = serializers.CharField(source='show.screen.cinema.name', read_only=True)
    screen_name = serializers.CharField(source='show.screen.name', read_only=True)
    show_date = serializers.DateField(source='show.date', read_only=True)
    show_time = serializers.TimeField(source='show.start_time', read_only=True)
    booking_seats = BookingSeatSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'username', 'email', 'show', 'movie_title', 'cinema_name', 'screen_name',
            'show_date', 'show_time', 'status', 'total_amount', 'created_at', 'booking_seats',
            'booking_code', 'is_used', 'scanned_at'
        )
