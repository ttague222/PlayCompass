"""
Tests for the recommendation engine logic.
"""

import pytest
from app.recommendation_engine import (
    get_age_group_from_age,
    get_age_groups_from_kids,
    get_interests_from_kids,
    filter_activities,
    calculate_relevance_score,
)
from app.models import Kid


class TestAgeGroupMapping:
    """Tests for age to age group mapping."""

    def test_toddler_age(self):
        """Test toddler age mapping (1-3)."""
        assert get_age_group_from_age(1) == "toddler"
        assert get_age_group_from_age(2) == "toddler"
        assert get_age_group_from_age(3) == "toddler"

    def test_preschool_age(self):
        """Test preschool age mapping (4-5)."""
        assert get_age_group_from_age(4) == "preschool"
        assert get_age_group_from_age(5) == "preschool"

    def test_early_elementary_age(self):
        """Test early elementary age mapping (6-8)."""
        assert get_age_group_from_age(6) == "early_elementary"
        assert get_age_group_from_age(7) == "early_elementary"
        assert get_age_group_from_age(8) == "early_elementary"

    def test_late_elementary_age(self):
        """Test late elementary age mapping (9-11)."""
        assert get_age_group_from_age(9) == "late_elementary"
        assert get_age_group_from_age(10) == "late_elementary"
        assert get_age_group_from_age(11) == "late_elementary"

    def test_middle_school_age(self):
        """Test middle school age mapping (12-14)."""
        assert get_age_group_from_age(12) == "middle_school"
        assert get_age_group_from_age(13) == "middle_school"
        assert get_age_group_from_age(14) == "middle_school"

    def test_high_school_age(self):
        """Test high school age mapping (15-18)."""
        assert get_age_group_from_age(15) == "high_school"
        assert get_age_group_from_age(16) == "high_school"
        assert get_age_group_from_age(17) == "high_school"
        assert get_age_group_from_age(18) == "high_school"

    def test_edge_case_age(self):
        """Test fallback for edge case ages."""
        # Age 0 or negative should get fallback
        result = get_age_group_from_age(0)
        assert result == "late_elementary"  # Default fallback

        # Age 19+ should get fallback
        result = get_age_group_from_age(19)
        assert result == "late_elementary"


class TestKidProcessing:
    """Tests for processing kid data."""

    def test_get_age_groups_from_kids(self):
        """Test extracting age groups from kid list."""
        kids = [
            Kid(id="1", name="A", age=5, interests=[]),
            Kid(id="2", name="B", age=8, interests=[]),
        ]
        age_groups = get_age_groups_from_kids(kids)

        assert "preschool" in age_groups
        assert "early_elementary" in age_groups
        assert len(age_groups) == 2

    def test_get_age_groups_from_kids_same_group(self):
        """Test extracting age groups when kids are in same group."""
        kids = [
            Kid(id="1", name="A", age=6, interests=[]),
            Kid(id="2", name="B", age=7, interests=[]),
        ]
        age_groups = get_age_groups_from_kids(kids)

        assert "early_elementary" in age_groups
        assert len(age_groups) == 1

    def test_get_interests_from_kids(self):
        """Test extracting interests from kid list."""
        kids = [
            Kid(id="1", name="A", age=5, interests=["art", "music"]),
            Kid(id="2", name="B", age=8, interests=["sports", "music"]),
        ]
        interests = get_interests_from_kids(kids)

        assert "art" in interests
        assert "music" in interests
        assert "sports" in interests
        assert len(interests) == 3  # Duplicates removed

    def test_get_interests_from_kids_empty(self):
        """Test extracting interests when kids have none."""
        kids = [
            Kid(id="1", name="A", age=5, interests=[]),
        ]
        interests = get_interests_from_kids(kids)
        assert interests == []


class TestFilterActivities:
    """Tests for activity filtering."""

    def test_filter_by_location(self):
        """Test filtering by location."""
        filtered = filter_activities(location="indoor")
        for activity in filtered:
            assert activity["location"] in ["indoor", "both"]

    def test_filter_by_duration(self):
        """Test filtering by duration."""
        filtered = filter_activities(duration="short")
        for activity in filtered:
            assert activity["duration"] == "short"

    def test_filter_by_energy(self):
        """Test filtering by energy level."""
        filtered = filter_activities(energy="high")
        for activity in filtered:
            assert activity["energy"] == "high"

    def test_filter_by_excluded_ids(self):
        """Test excluding specific activity IDs."""
        filtered = filter_activities(excluded_ids=["act_001", "act_002"])
        for activity in filtered:
            assert activity["id"] not in ["act_001", "act_002"]

    def test_filter_combined(self):
        """Test combining multiple filters."""
        filtered = filter_activities(
            duration="short",
            location="indoor",
            energy="medium",
        )
        for activity in filtered:
            assert activity["duration"] == "short"
            assert activity["location"] in ["indoor", "both"]
            assert activity["energy"] == "medium"


class TestRelevanceScore:
    """Tests for relevance score calculation."""

    def test_base_score_from_popularity(self):
        """Test that base score comes from popularity."""
        activity = {"popularity_score": 80, "interests": [], "age_groups": []}
        score = calculate_relevance_score(activity, [], [])
        assert score == 80

    def test_interest_bonus(self):
        """Test bonus for matching interests."""
        activity = {
            "popularity_score": 50,
            "interests": ["sports", "games"],
            "age_groups": [],
        }
        score = calculate_relevance_score(activity, ["sports"], [])
        assert score == 60  # 50 + 10 for one interest match

    def test_multiple_interest_bonus(self):
        """Test bonus for multiple matching interests."""
        activity = {
            "popularity_score": 50,
            "interests": ["sports", "games", "music"],
            "age_groups": [],
        }
        score = calculate_relevance_score(activity, ["sports", "games"], [])
        assert score == 70  # 50 + 20 for two interest matches

    def test_age_coverage_bonus(self):
        """Test bonus for activities covering all kid age groups."""
        activity = {
            "popularity_score": 50,
            "interests": [],
            "age_groups": ["preschool", "early_elementary"],
        }
        score = calculate_relevance_score(
            activity,
            [],
            ["preschool", "early_elementary"],
        )
        assert score == 65  # 50 + 15 for covering all age groups
