# Halfway Meetup App

A smart web application that helps two friends find a **fair meeting location** and choose where to eat. Unlike simple geographic midpoint calculators, this app uses public transit travel times to ensure both users have **equal travel burden**, then discovers and enriches nearby restaurants with AI-generated descriptions.

## Features

- **Fair Midpoint Calculation**: Finds the geographic midpoint between two locations and intelligently adjusts it based on public transit travel times to ensure equal travel burden for both users
- **Smart Venue Discovery**: Searches for highly-rated restaurants and cafes (4.0+ stars, 50+ reviews) near the calculated midpoint
- **AI-Enhanced Venue Information**: Uses Claude AI to enrich venue data with curated descriptions, cuisine tags, vibes, and signature dishes
- **Collaborative Voting**: Both users vote on venue options with automatic winner selection
- **Session Management**: Creates shareable sessions with PIN codes for secure access
- **Real-time Updates**: Live polling of session state to keep both users synchronized
- **Interactive Maps**: Beautiful dark-themed Google Maps integration with custom markers

## Tech Stack

### Frontend
- **Next.js 15.1** with App Router
- **React 19.0** with TypeScript 5.7
- **Tailwind CSS 3.4** for styling
- **React Google Maps API** for map visualization

### Backend
- **FastAPI** (Python 3.11+)
- **SQLAlchemy 2.0** with async PostgreSQL support
- **Anthropic SDK** for Claude AI integration
- **HTTPX** for async HTTP requests

### External APIs
- **Google Maps Platform** (Maps JavaScript API, Places API, Geocoding API, Distance Matrix API)
- **Anthropic Claude API**

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.11+
- **Docker** and Docker Compose (for deployment)
- **Google Cloud Platform** account with Maps API access
- **Anthropic API** key

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/halfway-meetup-app.git
cd halfway-meetup-app
```

### 2. Google Maps API Setup

#### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Library**
4. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API

#### Create API Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key (you'll use this in environment variables)

#### Configure API Restrictions (Important for Production)

1. Click on your API key to edit
2. Under **Application restrictions**, select **HTTP referrers (websites)**
3. Add your allowed domains:
   ```
   http://localhost:3000/*           (local development)
   https://yourdomain.com/*          (production domain)
   https://www.yourdomain.com/*      (www subdomain)
   https://*.vercel.app/*            (if deploying to Vercel)
   ```
4. Under **API restrictions**, select **Restrict key**
5. Enable only the APIs listed above
6. Click **Save**

### 3. Anthropic API Setup

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **API Keys**
3. Create a new API key
4. Copy the key (you'll use this in environment variables)

### 4. Environment Variables

#### Backend Environment Variables

Create `backend/.env` (or export these variables):

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/halfway_db
# For SQLite (development): DATABASE_URL=sqlite+aiosqlite:///./data/app.db

# Google Maps API
GOOGLE_PLACES_API_KEY=your_google_api_key_here

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### Frontend Environment Variables

Create `.env.local`:

```bash
# Google Maps API (client-side)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key_here

# Base URL for API calls
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Backend URL (for Docker deployments)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 5. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
pip install -e .
cd ..
```

Or use a virtual environment (recommended):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
cd ..
```

## Running Locally

### Option 1: Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Your app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Run Manually

#### Start Backend
```bash
cd backend
# If using venv: source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

#### Start Frontend (in a new terminal)
```bash
npm run dev
```

Visit http://localhost:3000

## Deployment

This project uses Docker Compose for easy deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to AWS EC2 with automated GitHub Actions CI/CD.

### Quick Deployment Steps:

1. Set up Docker on your server
2. Configure environment variables in `.env`
3. Run `docker-compose up -d --build`
4. Set up GitHub Actions for auto-deployment (optional)

## Project Structure

```
halfway-meetup-app/
├── backend/                      # FastAPI backend
│   └── app/
│       ├── main.py              # FastAPI app & CORS config
│       ├── config.py            # Environment settings
│       ├── database.py          # SQLAlchemy setup
│       ├── models.py            # Database models
│       ├── schemas.py           # Pydantic schemas
│       ├── routers/             # API endpoints
│       │   ├── sessions.py      # Session CRUD
│       │   ├── join.py          # Join session
│       │   ├── compute.py       # Midpoint calculation
│       │   └── vote.py          # Voting logic
│       └── services/            # Business logic
│           ├── geocoding.py     # Google Geocoding
│           ├── routing.py       # Transit time calculation
│           ├── midpoint.py      # Fair midpoint algorithm
│           ├── places.py        # Venue search
│           └── venue_enrichment.py  # Claude AI enrichment
├── src/                         # Next.js frontend
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   └── session/[id]/
│   │       ├── page.tsx        # Session page
│   │       └── vote/
│   │           └── page.tsx    # Voting page
│   ├── components/             # React components
│   │   ├── MapDisplay.tsx      # Interactive map
│   │   ├── MapPinDrop.tsx      # Pin drop interface
│   │   ├── VenueCard.tsx       # Venue details
│   │   ├── VenueList.tsx       # Venue list
│   │   ├── SessionStatus.tsx   # Status indicator
│   │   └── ShareLink.tsx       # Share functionality
│   └── hooks/
│       └── useSessionPolling.ts  # Real-time updates
├── docker-compose.yml           # Docker orchestration
├── Dockerfile                   # Frontend container
├── backend/Dockerfile           # Backend container
└── .github/workflows/
    └── deploy.yml              # Auto-deployment workflow
```

## How It Works

### 1. User A Creates Session
- Drops a pin on the map at their location
- Backend validates the location using Google Geocoding API (snaps to nearest road)
- Creates a session with a unique ID and 4-digit PIN code
- Receives a shareable URL

### 2. User B Joins Session
- Opens the shared link
- Enters the PIN code to verify access
- Drops a pin at their location
- Backend validates and updates session status to "ready_to_compute"

### 3. Fair Midpoint Calculation
The app doesn't just calculate the geographic center—it adjusts for real-world travel times:

1. **Calculate geographic midpoint** (simple average of coordinates)
2. **Get transit times** for both users to the midpoint using Google Distance Matrix API
3. **Iterative adjustment**: If travel times differ significantly, shift the midpoint toward the slower user
4. **Converge**: Repeat until times are within 10% of each other (max 3 iterations)

This ensures both friends have **equal travel burden**, not just equal distance.

### 4. Venue Discovery
- Searches for restaurants/cafes near the fair midpoint (starting at 800m radius)
- Filters by quality: 4.0+ stars, 50+ reviews (relaxed to 3.8+, 30+ if needed)
- Expands search radius up to 3km if insufficient venues found
- Scores venues by: `rating × log(review_count)`
- Returns top 8 venues

### 5. AI Enrichment
Each venue is enhanced using Claude AI to generate:
- **Description**: What makes this place special
- **Cuisine tags**: e.g., "Japanese", "Ramen", "Casual"
- **Vibe tags**: e.g., "Cozy", "Date night", "Lively"
- **Best for**: e.g., "Casual catch-up", "Special occasion"
- **Signature dish**: Recommended item to try

### 6. Collaborative Voting
- Both users see the map with their locations, the midpoint, and venue markers
- Click on venues to view detailed cards with AI-generated information
- Each user votes for their preferred venue
- Winner is determined:
  - If both choose the same venue → that's the winner
  - If different choices → random selection
- Winner is displayed with a Google Maps link for directions

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

### Key Endpoints

#### Sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/{session_id}` - Get session details

#### Join
- `POST /api/sessions/{session_id}/join` - Join an existing session

#### Compute
- `POST /api/sessions/{session_id}/compute` - Calculate midpoint and find venues

#### Vote
- `POST /api/sessions/{session_id}/vote` - Submit a vote for a venue

## Database Schema

### Sessions Table
- Stores user locations (A and B)
- Fair midpoint coordinates
- Session status (waiting_for_b → ready_to_compute → computing → voting → completed)
- Travel times for both users
- PIN code and winner information

### Venues Table
- Google Place details (name, address, rating, etc.)
- AI-generated enrichment data
- Linked to parent session

### Votes Table
- User votes (user_a or user_b)
- Linked to session and venue

## Development Tips

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
npm test
```

### Viewing Database
```bash
# If using PostgreSQL
psql -h localhost -U your_user -d halfway_db

# If using SQLite
sqlite3 backend/data/app.db
```

### Hot Reload
Both frontend and backend support hot reload in development mode:
- Frontend: Changes trigger automatic rebuilds
- Backend: `uvicorn --reload` restarts on code changes

## Troubleshooting

### Google Maps not loading
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Check that Maps JavaScript API is enabled in Google Cloud Console
- Ensure API restrictions allow your domain (localhost:3000 for development)

### Backend can't connect to database
- Verify `DATABASE_URL` is correct in `backend/.env`
- For PostgreSQL: Ensure the database exists and is running
- For SQLite: Directory `backend/data/` will be created automatically

### Claude AI enrichment failing
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota in Anthropic Console
- App will gracefully degrade without enrichment if Claude is unavailable

### Port already in use
```bash
# Find what's using the port
lsof -i :3000  # or :8000

# Kill the process
kill -9 <PID>
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Maps Platform for location services
- Anthropic Claude for AI-powered venue enrichment
- FastAPI and Next.js communities for excellent documentation

