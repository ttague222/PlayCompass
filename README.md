# PlayCompass — Activity discovery for families

> Helping parents find fun, engaging activities for their kids.

Finding the right activity for your child — filtered by age, interests, and energy level — takes more effort than it should. PlayCompass makes it effortless, surfacing personalized recommendations that parents can actually use.

[![Google Play](https://img.shields.io/badge/Get_it_on-Google_Play-414141?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=com.playcompass.app)

---

## Architecture

```
PlayCompass/
├── backend/         # Python recommendation engine + Firebase
│   ├── recommendation_engine.py
│   └── activities_data.py
├── mobile-app/      # React Native + Expo (Android)
└── functions/       # Firebase Cloud Functions
```

---

## Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=flat&logo=Firebase&logoColor=white)

---

## Key Features

- **Personalized recommendations** — activities matched to your child's age, interests, and energy level
- **Curated catalog** — quality-filtered content parents can trust
- **Recommendation engine** — Python-powered matching logic with Firebase backend
- **Real-time profiles** — Firestore-backed user profiles that improve recommendations over time

---

## Getting Started

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Mobile app
cd mobile-app
npm install
npx expo start
```

---

Built by [Watchlight Interactive](https://watchlightinteractive.com)
