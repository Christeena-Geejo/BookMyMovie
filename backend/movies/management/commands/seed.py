import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from movies.models import Location, Movie, Cinema, Screen, Show, Review


User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial BookMyMovie data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # 1. Create Users
        self.stdout.write('Creating users...')
        if not User.objects.filter(username='customer').exists():
            User.objects.create_user(
                username='customer',
                email='customer@example.com',
                password='password123',
                is_customer=True,
                is_cinema_manager=False
            )
            self.stdout.write('Created customer: customer / password123')
            
        if not User.objects.filter(username='manager').exists():
            User.objects.create_user(
                username='manager',
                email='manager@example.com',
                password='password123',
                is_customer=True,
                is_cinema_manager=True
            )
            self.stdout.write('Created manager: manager / password123')

        # 2. Create Locations
        self.stdout.write('Creating locations...')
        mumbai, _ = Location.objects.get_or_create(name='Mumbai')
        delhi, _ = Location.objects.get_or_create(name='Delhi')
        bangalore, _ = Location.objects.get_or_create(name='Bangalore')

        # 3. Create Movies
        self.stdout.write('Creating movies...')
        m1, _ = Movie.objects.get_or_create(
            title='Doctor Strange in the Multiverse of Madness',
            defaults={
                'description': 'Doctor Strange teams up with a mysterious teenage girl from his dreams who can travel across multiverses to battle multiple threats.',
                'duration_minutes': 126,
                'language': 'English',
                'genre': 'Action, Fantasy',
                'release_date': datetime.date(2022, 5, 6)
            }
        )
        m2, _ = Movie.objects.get_or_create(
            title='K.G.F: Chapter 2',
            defaults={
                'description': 'In the blood-soaked Kolar Gold Fields, Rocky\'s name strikes fear into his foes. While his allies look up to him, the government sees him as a threat.',
                'duration_minutes': 168,
                'language': 'Hindi',
                'genre': 'Action, Drama',
                'release_date': datetime.date(2022, 4, 14)
            }
        )
        m3, _ = Movie.objects.get_or_create(
            title='Avatar: The Way of Water',
            defaults={
                'description': 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
                'duration_minutes': 192,
                'language': 'English',
                'genre': 'Sci-Fi, Adventure',
                'release_date': datetime.date(2022, 12, 16)
            }
        )
        m4, _ = Movie.objects.get_or_create(
            title='RRR',
            defaults={
                'description': 'A fictitious story about two legendary revolutionaries and their journey away from home before they started fighting for their country in the 1920s.',
                'duration_minutes': 187,
                'language': 'Telugu',
                'genre': 'Action, Drama',
                'release_date': datetime.date(2022, 3, 25)
            }
        )

        # 4. Create Cinemas & Screens
        self.stdout.write('Creating cinemas and screens...')
        # Mumbai Cinemas
        c1, _ = Cinema.objects.get_or_create(
            name='PVR ECX: Citi Mall, Andheri',
            defaults={'address': '4th Floor, Citi Mall, Link Road, Andheri West, Mumbai', 'location': mumbai, 'approval_status': 'APPROVED'}
        )
        s1_1, _ = Screen.objects.get_or_create(cinema=c1, name='Screen 1', defaults={'rows': 10, 'columns': 12})
        s1_2, _ = Screen.objects.get_or_create(cinema=c1, name='IMAX 3D', defaults={'rows': 12, 'columns': 16})

        c2, _ = Cinema.objects.get_or_create(
            name='INOX: Inorbit Mall, Malad',
            defaults={'address': 'Inorbit Mall, Link Road, Malad West, Mumbai', 'location': mumbai, 'approval_status': 'APPROVED'}
        )
        s2_1, _ = Screen.objects.get_or_create(cinema=c2, name='Audi 1', defaults={'rows': 8, 'columns': 12})

        # Delhi Cinemas
        c3, _ = Cinema.objects.get_or_create(
            name='PVR: Director\'s Cut, Vasant Kunj',
            defaults={'address': 'Ambience Mall, Nelson Mandela Marg, Vasant Kunj, New Delhi', 'location': delhi, 'approval_status': 'APPROVED'}
        )
        s3_1, _ = Screen.objects.get_or_create(cinema=c3, name='Gold Class 1', defaults={'rows': 8, 'columns': 8})

        # Bangalore Cinemas
        c4, _ = Cinema.objects.get_or_create(
            name='PVR: Forum Mall, Koramangala',
            defaults={'address': 'The Forum Mall, Hosur Road, Koramangala, Bangalore', 'location': bangalore, 'approval_status': 'APPROVED'}
        )
        s4_1, _ = Screen.objects.get_or_create(cinema=c4, name='IMAX Screen', defaults={'rows': 12, 'columns': 15})

        # 5. Create Shows (For the next 3 days)
        self.stdout.write('Creating shows...')
        today = datetime.date.today()
        
        show_times = [
            (datetime.time(10, 0), datetime.time(13, 0)),
            (datetime.time(14, 0), datetime.time(17, 0)),
            (datetime.time(18, 0), datetime.time(21, 0)),
            (datetime.time(22, 0), datetime.time(1, 0)),
        ]

        # Check if we already have shows to avoid duplicate seats generation
        if Show.objects.exists():
            self.stdout.write('Shows already exist, skipping shows generation.')
        else:
            # Generate shows for Mumbai
            for offset in range(3):
                date = today + datetime.timedelta(days=offset)
                
                # Doctor Strange at PVR IMAX 3D (Mumbai)
                for start, end in show_times[:3]:
                    Show.objects.create(
                        movie=m1,
                        screen=s1_2,
                        date=date,
                        start_time=start,
                        end_time=end,
                        price_standard=180.00,
                        price_premium=280.00,
                        price_vip=450.00
                    )
                
                # KGF at PVR Screen 1 (Mumbai)
                for start, end in show_times[1:]:
                    Show.objects.create(
                        movie=m2,
                        screen=s1_1,
                        date=date,
                        start_time=start,
                        end_time=end,
                        price_standard=150.00,
                        price_premium=220.00,
                        price_vip=350.00
                    )

                # Avatar at INOX Audi 1 (Mumbai)
                for start, end in show_times[1:3]:
                    Show.objects.create(
                        movie=m3,
                        screen=s2_1,
                        date=date,
                        start_time=start,
                        end_time=end,
                        price_standard=160.00,
                        price_premium=240.00,
                        price_vip=400.00
                    )

                # RRR at PVR Forum (Bangalore)
                for start, end in show_times[:2]:
                    Show.objects.create(
                        movie=m4,
                        screen=s4_1,
                        date=date,
                        start_time=start,
                        end_time=end,
                        price_standard=140.00,
                        price_premium=220.00,
                        price_vip=380.00
                    )

                # Doctor Strange at PVR Director's Cut (Delhi)
                for start, end in show_times[2:]:
                    Show.objects.create(
                        movie=m1,
                        screen=s3_1,
                        date=date,
                        start_time=start,
                        end_time=end,
                        price_standard=250.00,
                        price_premium=400.00,
                        price_vip=600.00
                    )

        # 6. Create Reviews
        self.stdout.write('Creating reviews...')
        cust_user = User.objects.get(username='customer')
        mngr_user = User.objects.get(username='manager')
        
        shyam, _ = User.objects.get_or_create(
            username='shyam',
            defaults={'email': 'shyam@example.com', 'is_customer': True}
        )
        if shyam.password == '':
            shyam.set_password('password123')
            shyam.save()
            
        # Seed Doctor Strange reviews
        Review.objects.get_or_create(
            movie=m1,
            user=cust_user,
            defaults={'rating': 4, 'comment': 'Visually spectacular! Cumberbatch is great as always.'}
        )
        Review.objects.get_or_create(
            movie=m1,
            user=shyam,
            defaults={'rating': 5, 'comment': 'Loved the multiversal horror elements! Sam Raimi direction was awesome.'}
        )
        
        # Seed KGF reviews
        Review.objects.get_or_create(
            movie=m2,
            user=cust_user,
            defaults={'rating': 5, 'comment': 'Action sequences and bgm are absolutely top notch! Rocky bhai!'}
        )
        Review.objects.get_or_create(
            movie=m2,
            user=mngr_user,
            defaults={'rating': 4, 'comment': 'Heavy dialogues and great performance. A bit noisy but pure entertainment.'}
        )

        self.stdout.write('Database seeded successfully!')

