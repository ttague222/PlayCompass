# PlayCompass Backend

FastAPI backend for PlayCompass - Smart activity recommendations for families.

## Local Development

### Prerequisites
- Python 3.11+
- pip

### Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Run the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

5. Open API docs: http://localhost:8080/docs

## API Endpoints

### Health
- `GET /` - Health check
- `GET /health` - Health check for Cloud Run
- `GET /info` - API information

### Recommendations
- `POST /recommendations` - Get personalized activity recommendations
- `GET /recommendations/quick` - Quick recommendations by age and time
- `GET /recommendations/random` - Get a random suitable activity

### Activities
- `GET /activities` - List all activities (with filtering)
- `GET /activities/{id}` - Get activity details
- `GET /activities/categories/list` - List categories

### History (requires auth)
- `POST /history` - Save activity history
- `GET /history` - Get user's activity history

## Deployment to Cloud Run

### Prerequisites
- Google Cloud CLI (`gcloud`)
- Docker (for local testing)
- GCP Project with Cloud Run API enabled

### Manual Deployment

```bash
# Set project
gcloud config set project playcompass

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and deploy
gcloud run deploy playcompass-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars FIREBASE_PROJECT_ID=playcompass
```

### Automated Deployment (Cloud Build)

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings and configuration
│   ├── firebase.py          # Firebase Admin SDK
│   ├── models.py            # Pydantic models
│   ├── activities_data.py   # Activity catalog
│   └── recommendation_engine.py  # Recommendation logic
├── Dockerfile
├── requirements.txt
├── cloudbuild.yaml
├── .env.example
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `PORT` | Server port | `8080` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `playcompass` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | (auto on Cloud Run) |
| `CORS_ORIGINS` | Allowed CORS origins | localhost |
