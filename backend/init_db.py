import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookmymovie.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'Admin123!')
    print("Admin user created successfully.")
else:
    # Optional: ensure password is correct in case it got messed up
    u = User.objects.get(username='admin')
    u.set_password('Admin123!')
    u.is_staff = True
    u.is_superuser = True
    u.save()
    print("Admin user already existed, password reset to Admin123!.")
