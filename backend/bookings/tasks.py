from celery import shared_task
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from .models import Booking, ShowSeat

@shared_task
def release_expired_locks(booking_id):
    print(f"Running release_expired_locks for booking {booking_id}")
    try:
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)
            if booking.status == 'PENDING':
                booking.status = 'EXPIRED'
                booking.save()
                
                # Fetch and release seats associated with this booking
                booking_seats = booking.booking_seats.all()
                for bs in booking_seats:
                    seat = bs.show_seat
                    # Only release if it's currently locked (not booked by someone else)
                    if seat.status == 'LOCKED' and seat.locked_by == booking.user:
                        seat.status = 'AVAILABLE'
                        seat.locked_at = None
                        seat.locked_by = None
                        seat.save()
                print(f"Booking {booking_id} has expired. Seats released.")
            else:
                print(f"Booking {booking_id} is in status {booking.status}. No action needed.")
    except Booking.DoesNotExist:
        print(f"Booking {booking_id} does not exist.")
    except Exception as e:
        print(f"Error releasing locks for booking {booking_id}: {str(e)}")

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget

def generate_ticket_pdf(booking, show, movie, cinema, seats_str, recipient_email):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Letter size: 612 x 792 points
    # Drawing a premium ticket stub: 350 wide x 580 tall
    x_offset = 131  # (612 - 350) / 2
    y_offset = 106  # (792 - 580) / 2
    
    # Background card
    p.setFillColor(colors.HexColor('#12121a'))
    p.setStrokeColor(colors.HexColor('#2a2a35'))
    p.rect(x_offset, y_offset, 350, 580, fill=True, stroke=True)
    
    # Header bar
    p.setFillColor(colors.HexColor('#ff0844'))
    p.rect(x_offset, y_offset + 540, 350, 40, fill=True, stroke=False)
    
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 15)
    p.drawCentredString(x_offset + 175, y_offset + 552, "BOOKMYMOVIE TICKET")
    
    # Booking Code
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica-Bold", 9)
    p.drawString(x_offset + 20, y_offset + 505, f"BOOKING CODE: {booking.booking_code}")
    
    # Movie title
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 17)
    p.drawString(x_offset + 20, y_offset + 465, movie.title[:28])
    
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica", 10)
    p.drawString(x_offset + 20, y_offset + 445, f"Language: {movie.language}  |  Genre: {movie.genre}")
    
    # Dividers
    p.setStrokeColor(colors.HexColor('#2a2a35'))
    p.setLineWidth(1)
    p.line(x_offset + 20, y_offset + 420, x_offset + 330, y_offset + 420)
    
    # Cinema details
    p.setFillColor(colors.HexColor('#ff0844'))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(x_offset + 20, y_offset + 395, "CINEMA & THEATRE")
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(x_offset + 20, y_offset + 375, cinema.name[:38])
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica", 9)
    p.drawString(x_offset + 20, y_offset + 358, cinema.address[:48])
    p.drawString(x_offset + 20, y_offset + 341, show.screen.name)
    
    p.line(x_offset + 20, y_offset + 321, x_offset + 330, y_offset + 321)
    
    # Date & Time columns
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(x_offset + 20, y_offset + 301, "DATE")
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(x_offset + 20, y_offset + 283, str(show.date))
    
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(x_offset + 180, y_offset + 301, "TIME")
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(x_offset + 180, y_offset + 283, str(show.start_time))
    
    p.line(x_offset + 20, y_offset + 263, x_offset + 330, y_offset + 263)
    
    # Seats & Amount columns
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(x_offset + 20, y_offset + 243, "SEATS")
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(x_offset + 20, y_offset + 225, seats_str)
    
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(x_offset + 180, y_offset + 243, "AMOUNT PAID")
    p.setFillColor(colors.HexColor('#ff0844'))
    p.setFont("Helvetica-Bold", 13)
    p.drawString(x_offset + 180, y_offset + 225, f"Rs. {booking.total_amount}")
    
    p.line(x_offset + 20, y_offset + 205, x_offset + 330, y_offset + 205)
    
    # Footer and user info
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica-Oblique", 8)
    p.drawString(x_offset + 20, y_offset + 185, f"User: {booking.user.username} ({recipient_email[:35]})")
    
    # QR Code background white box
    p.setFillColor(colors.white)
    p.rect(x_offset + 125, y_offset + 75, 100, 100, fill=True, stroke=False)
    
    # Try to obtain the host IP dynamically so scanning from physical devices works
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        host_ip = s.getsockname()[0]
        s.close()
    except Exception:
        host_ip = "127.0.0.1"
        
    qr_data = f"http://{host_ip}:5173/verify-ticket/{booking.booking_code}"
    qr = QrCodeWidget(qr_data)
    qr.barWidth = 90
    qr.barHeight = 90
    
    d = Drawing(90, 90)
    d.add(qr)
    d.drawOn(p, x_offset + 130, y_offset + 80)
    
    # Cut dashed line
    p.setStrokeColor(colors.HexColor('#ff0844'))
    p.setDash(2, 2)
    p.line(x_offset, y_offset + 65, x_offset + 350, y_offset + 65)
    p.setDash(1, 0)
    
    p.setFillColor(colors.HexColor('#a0a0ab'))
    p.setFont("Helvetica", 9)
    p.drawCentredString(x_offset + 175, y_offset + 45, "Scan at Theatre Entrance")
    p.drawCentredString(x_offset + 175, y_offset + 25, "Please present this PDF at the ticket counter.")
    
    p.showPage()
    p.save()
    
    pdf_content = buffer.getvalue()
    buffer.close()
    return pdf_content

@shared_task
def send_ticket_email_task(booking_id):
    print(f"Running send_ticket_email_task for booking {booking_id}")
    try:
        booking = Booking.objects.select_related('show__movie', 'show__screen__cinema', 'user').get(id=booking_id)
        if booking.status == 'CONFIRMED':
            user = booking.user
            show = booking.show
            movie = show.movie
            cinema = show.screen.cinema
            
            # Fetch booked seats
            booking_seats = booking.booking_seats.select_related('show_seat').all()
            seats = [f"{bs.show_seat.row_name}{bs.show_seat.column_number}" for bs in booking_seats]
            seats_str = ", ".join(seats)
            
            subject = f"Ticket Confirmed: {movie.title}!"
            message = (
                f"Hi {user.username},\n\n"
                f"Your ticket has been confirmed! Here are the details:\n\n"
                f"Booking ID: {booking.id}\n"
                f"Movie: {movie.title} ({movie.language})\n"
                f"Cinema: {cinema.name}, {cinema.address}\n"
                f"Screen: {show.screen.name}\n"
                f"Date: {show.date}\n"
                f"Time: {show.start_time}\n"
                f"Seats: {seats_str}\n"
                f"Total Amount: Rs. {booking.total_amount}\n\n"
                f"Enjoy your movie!\n"
                f"BookMyMovie Team"
            )
            
            recipient_email = user.email if user.email else "user@example.com"
            
            # Generate the PDF ticket content
            pdf_content = generate_ticket_pdf(booking, show, movie, cinema, seats_str, recipient_email)

            from django.core.mail import EmailMessage
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@bookmymovie.com')
            
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=from_email,
                to=[recipient_email]
            )
            
            # Attach the ticket as a PDF file
            email.attach(f"Ticket_{booking.id}.pdf", pdf_content, "application/pdf")
            email.send(fail_silently=False)
            
            print(f"Confirmation email with PDF ticket attachment sent to {recipient_email} for booking {booking_id}.")
        else:
            print(f"Booking {booking_id} is not CONFIRMED (status: {booking.status}). Email not sent.")
    except Booking.DoesNotExist:
        print(f"Booking {booking_id} does not exist.")
    except Exception as e:
        print(f"Error sending email for booking {booking_id}: {str(e)}")
