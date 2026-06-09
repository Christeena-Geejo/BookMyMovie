from rest_framework import serializers
from django.db.models import Avg
from .models import Location, Movie, Cinema, Screen, Show, Review

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'movie', 'username', 'rating', 'comment', 'created_at')
        read_only_fields = ('username', 'created_at', 'movie')


    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class MovieSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = '__all__'

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg is not None else 0.0

    def get_reviews_count(self, obj):
        return obj.reviews.count()


class ScreenSerializer(serializers.ModelSerializer):
    cinema_name = serializers.CharField(source='cinema.name', read_only=True)

    class Meta:
        model = Screen
        fields = ('id', 'cinema', 'cinema_name', 'name', 'rows', 'columns')

class CinemaSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = Cinema
        fields = ('id', 'name', 'address', 'location', 'location_name', 'approval_status')
        read_only_fields = ('approval_status',)

class ShowSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    cinema_name = serializers.CharField(source='screen.cinema.name', read_only=True)
    screen_name = serializers.CharField(source='screen.name', read_only=True)

    class Meta:
        model = Show
        fields = (
            'id', 'movie', 'movie_title', 'screen', 'screen_name', 
            'cinema_name', 'date', 'start_time', 'end_time', 
            'price_standard', 'price_premium', 'price_vip', 'approval_status'
        )

