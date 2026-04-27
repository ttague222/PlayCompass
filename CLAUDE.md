# PlayCompass

Activity discovery app for families — personalized recommendations helping parents find fun activities for their kids. Live on Google Play (Android only).

- **GitHub:** https://github.com/ttague222/PlayCompass
- **Google Play:** https://play.google.com/store/apps/details?id=com.playcompass.app

## Structure

```
PlayCompass/
├── mobile-app/      # React Native + Expo (Android)
├── backend/         # Python FastAPI recommendation engine
│   ├── app/         # API routes and logic
│   ├── config/
│   ├── functions/
│   └── tests/
└── functions/       # Firebase Cloud Functions
```

## Tech Stack
- **Mobile:** React Native, Expo
- **Backend:** Python, FastAPI, Firebase Firestore
- **Infrastructure:** Firebase, Docker, Cloud Build

## Running Locally

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload

# Mobile
cd mobile-app
npm install
npx expo start
```

## Key Notes
- Android only — not on iOS App Store
- Never commit `.env` or Firebase service account files
