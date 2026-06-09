from django.urls import path
from .views import (
    ShowSeatListView, SeatLockView, BookingConfirmView, 
    UserBookingsListView, BookingPDFDownloadView, 
    SeatToggleLockView, ActivePendingBookingView,
    RazorpayOrderCreateView, RazorpayPaymentVerifyView,
    TicketVerifyView
)

urlpatterns = [
    path('shows/<int:show_id>/seats/', ShowSeatListView.as_view(), name='show_seats'),
    path('bookings/lock/', SeatLockView.as_view(), name='seat_lock'),
    path('bookings/confirm/', BookingConfirmView.as_view(), name='booking_confirm'),
    path('bookings/my-bookings/', UserBookingsListView.as_view(), name='user_bookings'),
    path('bookings/<int:booking_id>/pdf/', BookingPDFDownloadView.as_view(), name='booking_pdf_download'),
    path('bookings/toggle-lock/', SeatToggleLockView.as_view(), name='seat_toggle_lock'),
    path('bookings/active-pending/', ActivePendingBookingView.as_view(), name='active_pending_booking'),
    path('bookings/create-razorpay-order/', RazorpayOrderCreateView.as_view(), name='create_razorpay_order'),
    path('bookings/verify-razorpay-payment/', RazorpayPaymentVerifyView.as_view(), name='verify_razorpay_payment'),
    path('bookings/verify/<str:booking_code>/', TicketVerifyView.as_view(), name='ticket_verify'),
]
