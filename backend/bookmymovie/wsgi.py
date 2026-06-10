import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookmymovie.settings')

application = get_wsgi_application()

try:
    from django.contrib.auth import get_user_model
    from django.db import transaction
    User = get_user_model()
    with transaction.atomic():
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'Admin123!')
        else:
            u = User.objects.get(username='admin')
            u.set_password('Admin123!')
            u.is_staff = True
            u.is_superuser = True
            u.save()
except Exception as e:
    print("Auto-admin creation failed:", e)
