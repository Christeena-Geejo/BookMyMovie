from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Roles', {'fields': ('is_customer', 'is_cinema_manager')}),
    )
    list_display = UserAdmin.list_display + ('is_customer', 'is_cinema_manager')

