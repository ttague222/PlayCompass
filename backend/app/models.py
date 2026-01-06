"""
PlayCompass API Models (Pydantic schemas)
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# Enums matching the mobile app's activity schema
class AgeGroup(str, Enum):
    TODDLER = "toddler"
    PRESCHOOL = "preschool"
    EARLY_ELEMENTARY = "early_elementary"
    LATE_ELEMENTARY = "late_elementary"
    MIDDLE_SCHOOL = "middle_school"
    HIGH_SCHOOL = "high_school"


class Category(str, Enum):
    ACTIVE = "active"
    CREATIVE = "creative"
    EDUCATIONAL = "educational"
    SOCIAL = "social"
    CALM = "calm"
    OUTDOOR = "outdoor"
    MUSIC = "music"
    GAMES = "games"


class Location(str, Enum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    BOTH = "both"


class Duration(str, Enum):
    QUICK = "quick"      # 5-15 min
    SHORT = "short"      # 15-30 min
    MEDIUM = "medium"    # 30-60 min
    LONG = "long"        # 1-2 hours
    EXTENDED = "extended"  # 2+ hours


class EnergyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Materials(str, Enum):
    NONE = "none"
    BASIC = "basic"
    CRAFT = "craft"
    SPORTS = "sports"
    KITCHEN = "kitchen"
    TECH = "tech"
    SPECIAL = "special"


class Season(str, Enum):
    SPRING = "spring"
    SUMMER = "summer"
    FALL = "fall"
    WINTER = "winter"
    ANY = "any"


class WeatherCondition(str, Enum):
    SUNNY = "sunny"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    SNOWY = "snowy"
    ANY = "any"


# Request/Response Models
class Kid(BaseModel):
    """Child profile for recommendation context."""
    id: str
    name: str
    age: int = Field(ge=1, le=18)
    interests: list[str] = []
    avatar: Optional[str] = None


class RecommendationRequest(BaseModel):
    """Request for activity recommendations."""
    kids: list[Kid]
    duration: Duration
    location: Optional[Location] = Location.BOTH
    energy: Optional[EnergyLevel] = None
    materials: Optional[str] = None  # 'none', 'basic', or 'any' (null = any)
    season: Optional[str] = None  # spring/summer/fall/winter or 'current' for auto-detect
    weather: Optional[str] = None  # sunny/cloudy/rainy/snowy for weather-aware filtering
    subscription_tier: Optional[str] = "free"  # User's subscription tier
    excluded_activity_ids: list[str] = []
    count: int = Field(default=10, ge=1, le=20)


class Activity(BaseModel):
    """Activity recommendation response."""
    id: str
    title: str
    description: str
    emoji: str
    category: Category
    age_groups: list[AgeGroup]
    location: Location
    duration: Duration
    energy: EnergyLevel
    materials: Materials
    participants: str
    interests: list[str] = []
    tags: list[str] = []
    weather: Optional[str] = None
    season: Optional[str] = "any"  # Season when activity is best suited
    weather_conditions: list[str] = []  # Weather conditions suitable for activity
    premium: bool = False  # Whether activity requires premium subscription
    instructions: list[str] = []
    tips: list[str] = []
    variations: list[str] = []
    adult_supervision: bool = False
    popularity_score: int = 50
    relevance_score: Optional[float] = None


class RecommendationResponse(BaseModel):
    """Response containing activity recommendations."""
    activities: list[Activity]
    total_available: int
    filters_applied: dict


class HistoryEntry(BaseModel):
    """Activity history entry for storage."""
    activity_id: str
    activity_title: str
    activity_emoji: str
    timestamp: str
    liked: bool
    duration: Optional[Duration] = None
    completed: bool = False
    notes: Optional[str] = None


class SaveHistoryRequest(BaseModel):
    """Request to save activity history."""
    entries: list[HistoryEntry]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: str


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
