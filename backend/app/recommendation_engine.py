"""
PlayCompass Recommendation Engine

Server-side activity filtering and recommendation logic.
"""

import random
from typing import Optional
from .activities_data import ACTIVITIES, get_all_activities
from .models import (
    Kid,
    RecommendationRequest,
    Activity,
    AgeGroup,
    Duration,
    Location,
    EnergyLevel,
    Season,
    WeatherCondition,
)
from datetime import datetime


# Age group mapping for child ages
AGE_GROUP_MAPPING = {
    (1, 3): "toddler",
    (4, 5): "preschool",
    (6, 8): "early_elementary",
    (9, 11): "late_elementary",
    (12, 14): "middle_school",
    (15, 18): "high_school",
}

# Duration time ranges (in minutes)
DURATION_RANGES = {
    "quick": (5, 15),
    "short": (15, 30),
    "medium": (30, 60),
    "long": (60, 120),
    "extended": (120, 999),
}

# Season mapping by month
MONTH_TO_SEASON = {
    1: "winter", 2: "winter", 3: "spring",
    4: "spring", 5: "spring", 6: "summer",
    7: "summer", 8: "summer", 9: "fall",
    10: "fall", 11: "fall", 12: "winter",
}


def get_current_season() -> str:
    """Get the current season based on the month."""
    return MONTH_TO_SEASON.get(datetime.now().month, "any")


def get_age_group_from_age(age: int) -> str:
    """Convert a child's age to an age group ID."""
    for (min_age, max_age), group_id in AGE_GROUP_MAPPING.items():
        if min_age <= age <= max_age:
            return group_id
    return "late_elementary"  # Default fallback


def get_age_groups_from_kids(kids: list[Kid]) -> list[str]:
    """Get unique age groups from a list of kids."""
    age_groups = set()
    for kid in kids:
        age_groups.add(get_age_group_from_age(kid.age))
    return list(age_groups)


def get_interests_from_kids(kids: list[Kid]) -> list[str]:
    """Get unique interests from a list of kids."""
    interests = set()
    for kid in kids:
        for interest in kid.interests:
            interests.add(interest)
    return list(interests)


def filter_activities(
    age_groups: Optional[list[str]] = None,
    duration: Optional[str] = None,
    location: Optional[str] = None,
    energy: Optional[str] = None,
    materials: Optional[str] = None,
    interests: Optional[list[str]] = None,
    excluded_ids: Optional[list[str]] = None,
    season: Optional[str] = None,
    weather: Optional[str] = None,
    include_premium: bool = False,
) -> list[dict]:
    """
    Filter activities based on criteria.

    Args:
        age_groups: List of age group IDs (activities must match ANY)
        duration: Duration ID
        location: Location ID (indoor/outdoor/both)
        energy: Energy level ID
        materials: Materials filter ('none', 'basic', or 'any'/None for all)
        interests: List of interest IDs (activities match ANY)
        excluded_ids: List of activity IDs to exclude
        season: Season to filter for (spring/summer/fall/winter)
        weather: Current weather condition
        include_premium: Whether to include premium-only activities

    Returns:
        List of matching activities
    """
    result = list(ACTIVITIES)

    # Filter by excluded IDs
    if excluded_ids:
        result = [a for a in result if a["id"] not in excluded_ids]

    # Filter premium activities (only include if user has premium)
    if not include_premium:
        result = [a for a in result if not a.get("premium", False)]

    # Filter by age groups (must match ANY specified age group)
    # Activities that match more age groups will get higher relevance scores later
    if age_groups:
        result = [
            a for a in result
            if any(ag in a["age_groups"] for ag in age_groups)
        ]

    # Filter by duration
    if duration:
        result = [a for a in result if a["duration"] == duration]

    # Filter by location
    if location and location != "both":
        result = [
            a for a in result
            if a["location"] == location or a["location"] == "both"
        ]

    # Filter by energy level
    if energy:
        result = [a for a in result if a["energy"] == energy]

    # Filter by materials
    # 'none' = only activities with no supplies
    # 'basic' = activities with no supplies OR basic household items
    # 'any' or None = all activities
    if materials and materials != "any":
        if materials == "none":
            result = [a for a in result if a.get("materials") == "none"]
        elif materials == "basic":
            result = [a for a in result if a.get("materials") in ["none", "basic"]]

    # Filter by interests (match ANY)
    if interests:
        result = [
            a for a in result
            if any(interest in a["interests"] for interest in interests)
        ]

    # Filter by season (include activities for specific season or 'any' season)
    if season and season != "any":
        result = [
            a for a in result
            if a.get("season", "any") in [season, "any"]
        ]

    # Filter by weather (include activities suitable for current weather)
    if weather and weather != "any":
        result = [
            a for a in result
            if not a.get("weather_conditions") or  # No weather restrictions
            weather in a.get("weather_conditions", []) or
            "any" in a.get("weather_conditions", [])
        ]

    return result


def calculate_relevance_score(
    activity: dict,
    kid_interests: list[str],
    kid_age_groups: list[str],
) -> float:
    """
    Calculate a relevance score for an activity based on kid preferences.

    Args:
        activity: Activity dict
        kid_interests: Combined interests from all kids
        kid_age_groups: Age groups from all kids

    Returns:
        Relevance score (higher = more relevant)
    """
    score = activity.get("popularity_score", 50)

    # Bonus for matching interests
    if kid_interests:
        interest_matches = sum(
            1 for interest in activity.get("interests", [])
            if interest in kid_interests
        )
        score += interest_matches * 10

    # Bonus for activities that match kid age groups
    age_coverage = sum(
        1 for ag in kid_age_groups
        if ag in activity.get("age_groups", [])
    )
    # Give points for each age group matched
    score += age_coverage * 10
    # Extra bonus if activity works for ALL kids (great for siblings)
    if len(kid_age_groups) > 1 and age_coverage == len(kid_age_groups):
        score += 20  # Strong bonus for activities all kids can do together

    return score


def get_recommendations(request: RecommendationRequest) -> tuple[list[dict], int, dict]:
    """
    Get activity recommendations based on request criteria.

    Args:
        request: RecommendationRequest with kids, duration, location, etc.

    Returns:
        Tuple of (activities, total_available, filters_applied)
    """
    # Extract criteria from kids
    age_groups = get_age_groups_from_kids(request.kids)
    interests = get_interests_from_kids(request.kids)

    # Determine season (auto-detect if 'current' or not specified for premium users)
    season = request.season
    if season == "current":
        season = get_current_season()

    # Check if user has premium access
    # Premium tiers: 'plus' and 'family' get access to premium content
    has_premium = request.subscription_tier in ["plus", "family"]

    # Build filters dict for response
    filters_applied = {
        "age_groups": age_groups,
        "duration": request.duration.value if request.duration else None,
        "location": request.location.value if request.location else None,
        "energy": request.energy.value if request.energy else None,
        "materials": request.materials,
        "season": season,
        "weather": request.weather,
        "subscription_tier": request.subscription_tier,
        "kid_count": len(request.kids),
        "interests_matched": interests,
    }

    # Filter activities
    filtered = filter_activities(
        age_groups=age_groups,
        duration=request.duration.value if request.duration else None,
        location=request.location.value if request.location else None,
        energy=request.energy.value if request.energy else None,
        materials=request.materials,
        excluded_ids=request.excluded_activity_ids,
        season=season if has_premium else None,  # Only filter by season for premium
        weather=request.weather if has_premium else None,  # Only filter by weather for premium
        include_premium=has_premium,
    )

    total_available = len(filtered)

    # Calculate relevance scores with randomization for variety
    scored_activities = []
    for activity in filtered:
        score = calculate_relevance_score(activity, interests, age_groups)
        # Add random factor (0-5) to introduce variety among similar activities
        random_factor = random.uniform(0, 5)

        # Bonus for seasonal activities in current season (for premium users)
        if has_premium and season:
            activity_season = activity.get("season", "any")
            if activity_season == season:
                score += 15  # Boost seasonal activities in current season

        # Bonus for weather-appropriate activities (for premium users)
        if has_premium and request.weather:
            weather_conditions = activity.get("weather_conditions", [])
            if request.weather in weather_conditions:
                score += 10  # Boost weather-appropriate activities

        activity_with_score = {**activity, "relevance_score": score + random_factor}
        scored_activities.append(activity_with_score)

    # Sort by relevance score (descending) - now includes randomization
    scored_activities.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Limit to requested count
    result = scored_activities[:request.count]

    return result, total_available, filters_applied


def get_quick_recommendations(
    kids: list[Kid],
    available_minutes: int,
    location: Optional[str] = None,
    count: int = 5,
) -> list[dict]:
    """
    Quick recommendation for limited time.

    Args:
        kids: List of kids
        available_minutes: Minutes available
        location: Optional location preference
        count: Number of recommendations to return

    Returns:
        List of recommended activities
    """
    age_groups = get_age_groups_from_kids(kids)
    interests = get_interests_from_kids(kids)

    # Determine appropriate duration
    if available_minutes <= 15:
        duration = "quick"
    elif available_minutes <= 30:
        duration = "short"
    elif available_minutes <= 60:
        duration = "medium"
    elif available_minutes <= 120:
        duration = "long"
    else:
        duration = "extended"

    # Filter activities
    filtered = filter_activities(
        age_groups=age_groups,
        duration=duration,
        location=location,
    )

    # Score and sort
    scored = []
    for activity in filtered:
        score = calculate_relevance_score(activity, interests, age_groups)
        scored.append({**activity, "relevance_score": score})

    scored.sort(key=lambda x: x["relevance_score"], reverse=True)

    return scored[:count]


def get_random_activity(
    kids: list[Kid],
    location: Optional[str] = None,
    energy: Optional[str] = None,
) -> dict | None:
    """
    Get a random suitable activity.

    Args:
        kids: List of kids
        location: Optional location preference
        energy: Optional energy preference

    Returns:
        Random activity or None
    """
    import random

    age_groups = get_age_groups_from_kids(kids)

    filtered = filter_activities(
        age_groups=age_groups,
        location=location,
        energy=energy,
    )

    if not filtered:
        return None

    return random.choice(filtered)
