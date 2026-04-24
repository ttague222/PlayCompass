# PlayCompass — Activity discovery for families

> Helping parents find fun, engaging activities for their kids.

Finding the right activity for your kid — based on their age, interests, and energy level — takes more effort than it should. PlayCompass makes it effortless, surfacing personalized activity recommendations that parents can actually use.

[![Google Play](https://img.shields.io/badge/Get_it_on-Google_Play-414141?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=com.playcompass.app)

---

## Architecture

```
PlayCompass/
├── backend/         # FastAPI recommendation engine (Python)
│   ├── recommendation_engine.py
│   └── activities_data.py
└── frontend/        # JavaScript UI
```

---

## Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=flat&logo=Firebase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)

---

## Key Features

- **Personalized recommendations** — activities matched to your child's age and interests
- **Curated activity catalog** — quality-filtered content parents can trust
- **Firebase backend** — real-time data and user profiles
- **Recommendation engine** — Python-powered matching logic

---

## Getting Started

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

---

Built by [Watchlight Interactive](https://watchlightinteractive.com)
