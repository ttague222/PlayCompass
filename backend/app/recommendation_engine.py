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
)


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
    interests: Optional[list[str]] = None,
    excluded_ids: Optional[list[str]] = None,
) -> list[dict]:
    """
    Filter activities based on criteria.

    Args:
        age_groups: List of age group IDs (activities must match ALL)
        duration: Duration ID
        location: Location ID (indoor/outdoor/both)
        energy: Energy level ID
        interests: List of interest IDs (activities match ANY)
        excluded_ids: List of activity IDs to exclude

    Returns:
        List of matching activities
    """
    result = list(ACTIVITIES)

    # Filter by excluded IDs
    if excluded_ids:
        result = [a for a in result if a["id"] not in excluded_ids]

    # Filter by age groups (must match ALL specified age groups)
    if age_groups:
        result = [
            a for a in result
            if all(ag in a["age_groups"] for ag in age_groups)
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

    # Filter by interests (match ANY)
    if interests:
        result = [
            a for a in result
            if any(interest in a["interests"] for interest in interests)
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

    # Bonus for activities that span more age groups (good for multiple kids)
    age_coverage = sum(
        1 for ag in kid_age_groups
        if ag in activity.get("age_groups", [])
    )
    if len(kid_age_groups) > 1 and age_coverage == len(kid_age_groups):
        score += 15  # Bonus for activities all kids can do together

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

    # Build filters dict for response
    filters_applied = {
        "age_groups": age_groups,
        "duration": request.duration.value if request.duration else None,
        "location": request.location.value if request.location else None,
        "energy": request.energy.value if request.energy else None,
        "kid_count": len(request.kids),
        "interests_matched": interests,
    }

    # Filter activities
    filtered = filter_activities(
        age_groups=age_groups,
        duration=request.duration.value if request.duration else None,
        location=request.location.value if request.location else None,
        energy=request.energy.value if request.energy else None,
        excluded_ids=request.excluded_activity_ids,
    )

    total_available = len(filtered)

    # Calculate relevance scores with randomization for variety
    scored_activities = []
    for activity in filtered:
        score = calculate_relevance_score(activity, interests, age_groups)
        # Add random factor (0-5) to introduce variety among similar activities
        random_factor = random.uniform(0, 5)
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
