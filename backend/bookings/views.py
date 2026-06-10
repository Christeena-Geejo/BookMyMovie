from django.db import transaction
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import views, status, permissions, generics
from rest_framework.response import Response
from .models import ShowSeat, Booking, BookingSeat
from .serializers import ShowSeatSerializer, BookingSerializer
from movies.models import Show
from .tasks import release_expired_locks, send_ticket_email_task, generate_ticket_pdf

class ShowSeatListView(views.APIView):
    permission_classes = ()

    def get(self, request, show_id):
        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)

        # Before returning, check for any expired locks that might have bypassed celery
        # This is a safety fallback. If a seat is LOCKED and locked_at is older than 5 mins
        # but the booking is still pending (or doesn't exist), release it.
        now = timezone.now()
        five_minutes_ago = now - timezone.timedelta(minutes=5)
        
        expired_seats = ShowSeat.objects.filter(
            show=show,
            status='LOCKED',
            locked_at__lt=five_minutes_ago
        )
        
        if expired_seats.exists():
            with transaction.atomic():
                for seat in expired_seats:
                    # Find if there is a pending booking
                    pending_booking_seat = BookingSeat.objects.filter(show_seat=seat, booking__status='PENDING').first()
                    if pending_booking_seat:
                        booking = pending_booking_seat.booking
                        booking.status = 'EXPIRED'
                        booking.save()
                    
                    seat.status = 'AVAILABLE'
                    seat.locked_at = None
                    seat.locked_by = None
                    seat.save()

        # Query seats sorted by row name (A, B, C...) and column number
        seats = ShowSeat.objects.filter(show=show).order_by('row_name', 'column_number')
        serializer = ShowSeatSerializer(seats, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class SeatLockView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        show_id = request.data.get('show_id')
        seat_ids = request.data.get('seat_ids', []) # List of show seat IDs

        if not show_id or not seat_ids:
            return Response(
                {"error": "Both 'show_id' and 'seat_ids' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                # Release previous pending bookings of this user for this show to avoid self-lockout
                previous_bookings = Booking.objects.filter(user=request.user, show=show, status='PENDING')
                for pb in previous_bookings:
                    pb.status = 'EXPIRED'
                    pb.save()
                    for bs in pb.booking_seats.all():
                        seat = bs.show_seat
                        if seat.status == 'LOCKED' and seat.locked_by == request.user:
                            seat.status = 'AVAILABLE'
                            seat.locked_at = None
                            seat.locked_by = None
                            seat.save()

                # Lock the seats for update to prevent concurrent race conditions
                seats = ShowSeat.objects.select_for_update().filter(id__in=seat_ids, show=show)
                
                if len(seats) != len(seat_ids):
                    return Response(
                        {"error": "Some selected seats do not exist or do not belong to this show."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check if all seats are available
                unavailable_seats = [f"{s.row_name}{s.column_number}" for s in seats if s.status != 'AVAILABLE']
                if unavailable_seats:
                    return Response(
                        {"error": f"Seats {', '.join(unavailable_seats)} are no longer available."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Calculate total amount
                total_amount = sum(seat.price for seat in seats)

                # Create pending booking
                booking = Booking.objects.create(
                    user=request.user,
                    show=show,
                    status='PENDING',
                    total_amount=total_amount
                )

                # Update seats status to LOCKED
                now = timezone.now()
                for seat in seats:
                    seat.status = 'LOCKED'
                    seat.locked_at = now
                    seat.locked_by = request.user
                    seat.save()
                    
                    # Create link
                    BookingSeat.objects.create(booking=booking, show_seat=seat)

                # Celery is bypassed. Locks are cleaned up lazily in ShowSeatListView instead.

                serializer = BookingSerializer(booking)
                return Response({
                    "booking": serializer.data,
                    "expires_in_seconds": 300
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Failed to lock seats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BookingConfirmView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        
        if not booking_id:
            return Response(
                {"error": "'booking_id' is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().get(id=booking_id, user=request.user)
                
                if booking.status == 'CONFIRMED':
                    return Response(
                        {"error": "Booking is already confirmed."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif booking.status == 'EXPIRED':
                    return Response(
                        {"error": "This booking session has expired. Please try locking seats again."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Update booking status
                booking.status = 'CONFIRMED'
                booking.save()

                # Mark all associated seats as BOOKED
                booking_seats = booking.booking_seats.select_related('show_seat').all()
                for bs in booking_seats:
                    seat = bs.show_seat
                    seat.status = 'BOOKED'
                    seat.locked_at = None
                    seat.locked_by = None
                    seat.save()

                # Send confirmation email synchronously
                send_ticket_email_task(booking.id)

                serializer = BookingSerializer(booking)
                return Response(serializer.data, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found or does not belong to the current user."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to confirm booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserBookingsListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')

class BookingPDFDownloadView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.select_related('show__movie', 'show__screen__cinema', 'user').get(id=booking_id, user=request.user)
            if booking.status != 'CONFIRMED':
                return Response(
                    {"error": "This booking is not confirmed yet. Cannot generate ticket."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = booking.user
            show = booking.show
            movie = show.movie
            cinema = show.screen.cinema
            
            # Fetch booked seats
            booking_seats = booking.booking_seats.select_related('show_seat').all()
            seats = [f"{bs.show_seat.row_name}{bs.show_seat.column_number}" for bs in booking_seats]
            seats_str = ", ".join(seats)
            
            recipient_email = user.email if user.email else "user@example.com"
            
            # Generate the PDF ticket content
            pdf_content = generate_ticket_pdf(booking, show, movie, cinema, seats_str, recipient_email)
            
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Ticket_{booking.id}.pdf"'
            return response
            
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found or does not belong to the current user."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate ticket PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SeatToggleLockView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        show_id = request.data.get('show_id')
        seat_id = request.data.get('seat_id')
        action = request.data.get('action') # 'lock' or 'unlock'

        if not show_id or not seat_id or not action:
            return Response(
                {"error": "Fields 'show_id', 'seat_id', and 'action' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            show = Show.objects.get(id=show_id)
            seat = ShowSeat.objects.get(id=seat_id, show=show)
        except (Show.DoesNotExist, ShowSeat.DoesNotExist):
            return Response({"error": "Show or Seat not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                if action == 'lock':
                    seat = ShowSeat.objects.select_for_update().get(id=seat_id)
                    
                    if seat.status != 'AVAILABLE':
                        if seat.status == 'LOCKED' and seat.locked_by == request.user:
                            booking = Booking.objects.filter(user=request.user, show=show, status='PENDING').first()
                            return Response({
                                "message": "Seat already locked by you.",
                                "booking_id": booking.id if booking else None
                            }, status=status.HTTP_200_OK)
                        
                        return Response(
                            {"error": f"Seat {seat.row_name}{seat.column_number} is no longer available."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Find or create a PENDING booking for this user and show
                    booking = Booking.objects.filter(user=request.user, show=show, status='PENDING').first()
                    if not booking:
                        booking = Booking.objects.create(
                            user=request.user,
                            show=show,
                            status='PENDING',
                            total_amount=0
                        )
                        pass

                    # Create BookingSeat link
                    BookingSeat.objects.get_or_create(booking=booking, show_seat=seat)

                    # Update seat status
                    seat.status = 'LOCKED'
                    seat.locked_at = timezone.now()
                    seat.locked_by = request.user
                    seat.save()

                    # Recalculate booking total_amount
                    booking.total_amount = sum(bs.show_seat.price for bs in booking.booking_seats.all())
                    booking.save()

                    return Response({
                        "message": "Seat locked successfully.",
                        "booking_id": booking.id,
                        "expires_in_seconds": 300
                    }, status=status.HTTP_200_OK)

                elif action == 'unlock':
                    seat = ShowSeat.objects.select_for_update().get(id=seat_id)
                    
                    if seat.status == 'LOCKED' and seat.locked_by == request.user:
                        booking = Booking.objects.filter(user=request.user, show=show, status='PENDING').first()
                        if booking:
                            # Delete link
                            BookingSeat.objects.filter(booking=booking, show_seat=seat).delete()
                            
                            # Release seat
                            seat.status = 'AVAILABLE'
                            seat.locked_at = None
                            seat.locked_by = None
                            seat.save()
                            
                            # Check remaining seats
                            remaining_seats_count = booking.booking_seats.count()
                            if remaining_seats_count == 0:
                                booking.status = 'EXPIRED'
                                booking.save()
                            else:
                                booking.total_amount = sum(bs.show_seat.price for bs in booking.booking_seats.all())
                                booking.save()
                                
                        return Response({"message": "Seat unlocked successfully."}, status=status.HTTP_200_OK)
                    else:
                        return Response(
                            {"error": "This seat is not locked by you."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    return Response({"error": "Invalid action. Must be 'lock' or 'unlock'."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": f"Failed to toggle lock: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ActivePendingBookingView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        show_id = request.query_params.get('show_id')
        if not show_id:
            return Response({"error": "show_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            booking = Booking.objects.filter(user=request.user, show_id=show_id, status='PENDING').first()
            if not booking:
                return Response({"error": "No pending booking found for this show."}, status=status.HTTP_404_NOT_FOUND)
                
            elapsed = timezone.now() - booking.created_at
            remaining = 300 - int(elapsed.total_seconds())
            if remaining < 0:
                remaining = 0
                
            serializer = BookingSerializer(booking)
            return Response({
                "booking": serializer.data,
                "expires_in_seconds": remaining
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch pending booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

import razorpay
from django.conf import settings

class RazorpayOrderCreateView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({"error": "booking_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user, status='PENDING')
            
            # Amount in paise (1 INR = 100 paise)
            amount_in_paise = int(booking.total_amount * 100)
            
            is_mock_key = (settings.RAZORPAY_KEY_ID == 'rzp_test_mockKeyId123')
            
            if is_mock_key:
                # Simulate a successful order response for mock/test environment
                order_id = f"order_mockOrderId_{booking.id}"
                booking.razorpay_order_id = order_id
                booking.save()
                
                return Response({
                    "razorpay_order_id": order_id,
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "key_id": settings.RAZORPAY_KEY_ID
                }, status=status.HTTP_200_OK)
            
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            # Create order
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_booking_{booking.id}"
            })
            
            booking.razorpay_order_id = razorpay_order['id']
            booking.save()
            
            return Response({
                "razorpay_order_id": razorpay_order['id'],
                "amount": amount_in_paise,
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({"error": "Active pending booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Failed to create Razorpay order: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RazorpayPaymentVerifyView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not all([booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({"error": "Missing required signature verification parameters."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().get(id=booking_id, user=request.user)
                
                if booking.status == 'CONFIRMED':
                    serializer = BookingSerializer(booking)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                    
                if booking.status == 'EXPIRED':
                    return Response({"error": "This booking session has expired."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check signature
                params_dict = {
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature
                }
                
                # Special bypass for testing or local development
                is_mock_payment = (
                    settings.RAZORPAY_KEY_ID == 'rzp_test_mockKeyId123' and 
                    razorpay_signature == 'mock_signature'
                )
                
                if not is_mock_payment:
                    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                    client.utility.verify_payment_signature(params_dict)
                
                # Signature matches or bypass applies -> confirm booking
                booking.status = 'CONFIRMED'
                booking.razorpay_payment_id = razorpay_payment_id
                booking.razorpay_signature = razorpay_signature
                booking.save()
                
                # Mark associated seats as BOOKED
                booking_seats = booking.booking_seats.select_related('show_seat').all()
                for bs in booking_seats:
                    seat = bs.show_seat
                    seat.status = 'BOOKED'
                    seat.locked_at = None
                    seat.locked_by = None
                    seat.save()
                    
                # Send confirmation email
                send_ticket_email_task(booking.id)
                
                serializer = BookingSerializer(booking)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except razorpay.errors.SignatureVerificationError:
            return Response({"error": "Payment signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to verify payment: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TicketVerifyView(views.APIView):
    permission_classes = () # Allow public scanning by venue staff

    def get(self, request, booking_code):
        if not booking_code:
            return Response({"error": "Booking code is required.", "status": "INVALID"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().select_related(
                    'show__movie', 'show__screen__cinema', 'user'
                ).get(booking_code=booking_code)
                
                # 1. Check if confirmed
                if booking.status != 'CONFIRMED':
                    return Response({
                        "error": "This booking has not been confirmed or paid.",
                        "status": "UNPAID",
                        "booking": BookingSerializer(booking).data
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # 2. Check if date matches today's date
                today = timezone.localdate()
                if booking.show.date != today:
                    return Response({
                        "error": f"Show date mismatch. Ticket is for {booking.show.date}, but today is {today}.",
                        "status": "DATE_MISMATCH",
                        "booking": BookingSerializer(booking).data
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                # 3. Check if already scanned
                if booking.is_used:
                    return Response({
                        "error": "This ticket has already been scanned.",
                        "scanned_at": booking.scanned_at,
                        "status": "ALREADY_SCANNED",
                        "booking": BookingSerializer(booking).data
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                # 4. Mark as used
                booking.is_used = True
                booking.scanned_at = timezone.now()
                booking.save()
                
                return Response({
                    "status": "SUCCESS",
                    "message": "Ticket verified successfully. Entry approved!",
                    "booking": BookingSerializer(booking).data
                }, status=status.HTTP_200_OK)
                
        except Booking.DoesNotExist:
            return Response({
                "error": "Invalid ticket code. Booking record does not exist.",
                "status": "INVALID"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "error": f"Internal server error: {str(e)}",
                "status": "ERROR"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



