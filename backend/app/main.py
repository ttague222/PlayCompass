"""
PlayCompass Backend API

FastAPI application for activity recommendations.
"""

from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings, Settings
from .firebase import get_user_from_token, get_firestore_client
from .models import (
    RecommendationRequest,
    RecommendationResponse,
    Activity,
    HealthResponse,
    ErrorResponse,
    SaveHistoryRequest,
    Kid,
    Duration,
    Location,
    EnergyLevel,
)
from .recommendation_engine import (
    get_recommendations,
    get_quick_recommendations,
    get_random_activity,
)
from .activities_data import get_all_activities, get_activity_by_id, get_activity_count


# Initialize FastAPI app
app = FastAPI(
    title="PlayCompass API",
    description="Backend API for PlayCompass - Smart activity recommendations for families",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Get settings
settings = get_settings()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get current user from Firebase token
async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Optional[dict]:
    """
    Extract and verify user from Authorization header.
    Returns None if no token or invalid token (allows anonymous access).
    """
    if not authorization:
        return None

    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    user = get_user_from_token(token)
    return user


# ============================================
# Health & Info Endpoints
# ============================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Cloud Run."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.get("/info")
async def api_info():
    """Get API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "activity_count": get_activity_count(),
        "endpoints": {
            "health": "/health",
            "recommendations": "/recommendations",
            "quick_recommendations": "/recommendations/quick",
            "random_activity": "/recommendations/random",
            "activities": "/activities",
            "activity_detail": "/activities/{id}",
            "history": "/history",
        },
    }


# ============================================
# Recommendation Endpoints
# ============================================

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_activity_recommendations(
    request: RecommendationRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """
    Get personalized activity recommendations.

    Requires:
    - List of kids with ages and interests
    - Duration preference
    - Optional location and energy preferences
    """
    if not request.kids:
        raise HTTPException(
            status_code=400,
            detail="At least one kid profile is required for recommendations",
        )

    try:
        activities, total_available, filters_applied = get_recommendations(request)

        # Convert to Activity models
        activity_models = [
            Activity(
                id=a["id"],
                title=a["title"],
                description=a["description"],
                emoji=a["emoji"],
                category=a["category"],
                age_groups=a["age_groups"],
                location=a["location"],
                duration=a["duration"],
                energy=a["energy"],
                materials=a["materials"],
                participants=a["participants"],
                interests=a.get("interests", []),
                tags=a.get("tags", []),
                weather=a.get("weather"),
                instructions=a.get("instructions", []),
                tips=a.get("tips", []),
                variations=a.get("variations", []),
                adult_supervision=a.get("adult_supervision", False),
                popularity_score=a.get("popularity_score", 50),
                relevance_score=a.get("relevance_score"),
            )
            for a in activities
        ]

        return RecommendationResponse(
            activities=activity_models,
            total_available=total_available,
            filters_applied=filters_applied,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}",
        )


@app.get("/recommendations/quick")
async def quick_recommendations(
    ages: str = Query(..., description="Comma-separated list of kid ages"),
    minutes: int = Query(30, ge=5, le=480, description="Available time in minutes"),
    location: Optional[str] = Query(None, description="indoor, outdoor, or both"),
    count: int = Query(5, ge=1, le=20, description="Number of recommendations"),
    user: Optional[dict] = Depends(get_current_user),
):
    """
    Quick recommendations endpoint for simpler queries.

    Example: /recommendations/quick?ages=5,8&minutes=30&location=indoor
    """
    try:
        # Parse ages
        age_list = [int(a.strip()) for a in ages.split(",")]
        kids = [Kid(id=f"kid_{i}", name=f"Kid {i+1}", age=age) for i, age in enumerate(age_list)]

        activities = get_quick_recommendations(
            kids=kids,
            available_minutes=minutes,
            location=location,
            count=count,
        )

        return {
            "activities": activities,
            "count": len(activities),
            "query": {
                "ages": age_list,
                "minutes": minutes,
                "location": location,
            },
        }

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid ages format. Use comma-separated integers (e.g., '5,8,12')",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating quick recommendations: {str(e)}",
        )


@app.get("/recommendations/random")
async def random_activity(
    ages: str = Query(..., description="Comma-separated list of kid ages"),
    location: Optional[str] = Query(None, description="indoor, outdoor, or both"),
    energy: Optional[str] = Query(None, description="low, medium, or high"),
    user: Optional[dict] = Depends(get_current_user),
):
    """
    Get a single random activity suitable for the kids.

    Example: /recommendations/random?ages=5,8&location=indoor
    """
    try:
        # Parse ages
        age_list = [int(a.strip()) for a in ages.split(",")]
        kids = [Kid(id=f"kid_{i}", name=f"Kid {i+1}", age=age) for i, age in enumerate(age_list)]

        activity = get_random_activity(
            kids=kids,
            location=location,
            energy=energy,
        )

        if not activity:
            raise HTTPException(
                status_code=404,
                detail="No suitable activity found for the given criteria",
            )

        return {"activity": activity}

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid ages format. Use comma-separated integers",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting random activity: {str(e)}",
        )


# ============================================
# Activity Catalog Endpoints
# ============================================

@app.get("/activities")
async def list_activities(
    category: Optional[str] = Query(None, description="Filter by category"),
    age_group: Optional[str] = Query(None, description="Filter by age group"),
    duration: Optional[str] = Query(None, description="Filter by duration"),
    location: Optional[str] = Query(None, description="Filter by location"),
    search: Optional[str] = Query(None, description="Search in title and tags"),
    limit: int = Query(50, ge=1, le=200, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    List all activities with optional filtering.
    """
    activities = get_all_activities()

    # Apply filters
    if category:
        activities = [a for a in activities if a["category"] == category]

    if age_group:
        activities = [a for a in activities if age_group in a["age_groups"]]

    if duration:
        activities = [a for a in activities if a["duration"] == duration]

    if location and location != "both":
        activities = [a for a in activities if a["location"] == location or a["location"] == "both"]

    if search:
        search_lower = search.lower()
        activities = [
            a for a in activities
            if search_lower in a["title"].lower()
            or any(search_lower in tag.lower() for tag in a.get("tags", []))
            or search_lower in a["description"].lower()
        ]

    total = len(activities)

    # Apply pagination
    activities = activities[offset:offset + limit]

    return {
        "activities": activities,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/activities/{activity_id}")
async def get_activity(activity_id: str):
    """Get a specific activity by ID."""
    activity = get_activity_by_id(activity_id)

    if not activity:
        raise HTTPException(
            status_code=404,
            detail=f"Activity with ID '{activity_id}' not found",
        )

    return {"activity": activity}


@app.get("/activities/categories/list")
async def list_categories():
    """Get list of all activity categories with counts."""
    activities = get_all_activities()

    categories = {}
    for activity in activities:
        cat = activity["category"]
        if cat not in categories:
            categories[cat] = {"id": cat, "count": 0}
        categories[cat]["count"] += 1

    return {
        "categories": list(categories.values()),
        "total_activities": len(activities),
    }


# ============================================
# History Endpoints (requires auth)
# ============================================

@app.post("/history")
async def save_history(
    request: SaveHistoryRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """
    Save activity history for the authenticated user.
    Requires Firebase authentication.
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to save history",
        )

    try:
        db = get_firestore_client()
        user_ref = db.collection("users").document(user["uid"])

        # Add history entries
        history_ref = user_ref.collection("activity_history")

        saved_count = 0
        for entry in request.entries:
            history_ref.add({
                "activity_id": entry.activity_id,
                "activity_title": entry.activity_title,
                "activity_emoji": entry.activity_emoji,
                "timestamp": entry.timestamp,
                "liked": entry.liked,
                "duration": entry.duration.value if entry.duration else None,
                "completed": entry.completed,
                "notes": entry.notes,
                "created_at": datetime.utcnow().isoformat(),
            })
            saved_count += 1

        return {
            "success": True,
            "saved_count": saved_count,
            "user_id": user["uid"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving history: {str(e)}",
        )


@app.get("/history")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    user: Optional[dict] = Depends(get_current_user),
):
    """
    Get activity history for the authenticated user.
    Requires Firebase authentication.
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to view history",
        )

    try:
        db = get_firestore_client()
        history_ref = (
            db.collection("users")
            .document(user["uid"])
            .collection("activity_history")
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
        )

        docs = history_ref.stream()
        history = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            history.append(data)

        return {
            "history": history,
            "count": len(history),
            "user_id": user["uid"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching history: {str(e)}",
        )


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# Run with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
