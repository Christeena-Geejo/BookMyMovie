# BookMyMovie

BookMyMovie is a full-stack movie ticket booking application designed to handle multiple user roles, concurrent seat reservations, dynamic scheduling, and seamless ticket verification. 

## 🚀 Features

- **Role-based Architecture:** 
  - **Customers:** Browse movies, select seats, make payments, and view generated PDF tickets.
  - **Cinema Managers:** Add cinema locations, manage screen layouts, schedule shows, and scan/verify tickets at the entrance.
  - **Admins:** Approve or reject cinemas, screens, movies, and scheduled shows via an approval workflow.
- **Concurrent Seat Locking:** Ensures that two users cannot book the same seat simultaneously. Seats are temporarily locked for 5 minutes during the checkout process using database transaction locks and Celery background tasks.
- **PDF Ticket Generation:** Automatically generates a premium, downloadable PDF ticket with a unique QR code upon payment confirmation.
- **In-Person Ticket Verification:** Includes a built-in web-based QR code scanner for Cinema Managers to validate tickets securely at the venue, preventing duplicate entries.
- **Mock Payment Gateway:** Integrated with Razorpay for secure checkout (currently configured in mock/test mode).

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite
- Context API (State Management)
- Lucide React (Icons)
- HTML5-QRCode (Scanner)

**Backend:**
- Python 3.x
- Django & Django REST Framework (DRF)
- SQLite (Default) / PostgreSQL (Production ready)
- Celery (Background tasks for seat lock expiration and emails)
- ReportLab (PDF Generation)
- SimpleJWT (Authentication)

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Christeena-Geejo/BookMyMovie.git
cd BookMyMovie
```

### 2. Backend Setup
Navigate to the `backend` directory and set up a Python virtual environment.
```bash
cd backend
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create a superuser (Admin)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

*(Note: To handle automatic seat lock expirations, ensure you have a Redis broker installed and start the Celery worker process: `celery -A bookmymovie worker -l INFO`)*

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, and install dependencies.
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8000`.

## 🐳 Docker Setup
Alternatively, you can run the entire stack using Docker Compose.

```bash
# From the root directory
docker-compose up --build
```
This will spin up the backend, frontend, and necessary worker containers simultaneously. 

## 📖 Usage Flow

1. **Register as a Manager:** Check the "Register as Cinema Manager" box during signup.
2. **Submit Resources:** Go to the Manager Dashboard and submit a Cinema, Screen, Movie, and Showtime.
3. **Admin Approval:** Log in with a superuser account to the Django Admin panel and approve the submissions.
4. **Customer Booking:** Create a standard user account, browse the approved shows, lock a seat, and complete the mock checkout.
5. **Scanning:** Download the generated ticket PDF. Log back in as the Manager, open the "Scan Ticket QR" tab, and hold the QR code up to your camera to verify entry!

## 📄 License
This project is for demonstration and educational purposes.
