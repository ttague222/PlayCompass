"""
Tests for activity catalog endpoints.
"""

import pytest


class TestListActivities:
    """Tests for GET /activities endpoint."""

    def test_list_activities_success(self, client):
        """Test listing all activities."""
        response = client.get("/activities")
        assert response.status_code == 200

        data = response.json()
        assert "activities" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert len(data["activities"]) > 0

    def test_list_activities_pagination(self, client):
        """Test activity listing with pagination."""
        response = client.get("/activities?limit=5&offset=0")
        assert response.status_code == 200

        data = response.json()
        assert len(data["activities"]) <= 5
        assert data["limit"] == 5
        assert data["offset"] == 0

    def test_list_activities_category_filter(self, client):
        """Test filtering activities by category."""
        response = client.get("/activities?category=active")
        assert response.status_code == 200

        data = response.json()
        for activity in data["activities"]:
            assert activity["category"] == "active"

    def test_list_activities_location_filter(self, client):
        """Test filtering activities by location."""
        response = client.get("/activities?location=indoor")
        assert response.status_code == 200

        data = response.json()
        for activity in data["activities"]:
            assert activity["location"] in ["indoor", "both"]

    def test_list_activities_duration_filter(self, client):
        """Test filtering activities by duration."""
        response = client.get("/activities?duration=short")
        assert response.status_code == 200

        data = response.json()
        for activity in data["activities"]:
            assert activity["duration"] == "short"

    def test_list_activities_search(self, client):
        """Test searching activities by title/tags."""
        response = client.get("/activities?search=dance")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] > 0
        # At least one result should contain "dance"
        found_match = False
        for activity in data["activities"]:
            title_match = "dance" in activity["title"].lower()
            desc_match = "dance" in activity["description"].lower()
            tag_match = any("dance" in tag.lower() for tag in activity.get("tags", []))
            if title_match or desc_match or tag_match:
                found_match = True
                break
        assert found_match

    def test_list_activities_combined_filters(self, client):
        """Test combining multiple filters."""
        response = client.get("/activities?category=active&location=indoor&duration=short")
        assert response.status_code == 200

        data = response.json()
        for activity in data["activities"]:
            assert activity["category"] == "active"
            assert activity["location"] in ["indoor", "both"]
            assert activity["duration"] == "short"


class TestGetActivity:
    """Tests for GET /activities/{activity_id} endpoint."""

    def test_get_activity_success(self, client):
        """Test getting a specific activity by ID."""
        # First get list to find a valid ID
        list_response = client.get("/activities?limit=1")
        activity_id = list_response.json()["activities"][0]["id"]

        response = client.get(f"/activities/{activity_id}")
        assert response.status_code == 200

        data = response.json()
        assert "activity" in data
        assert data["activity"]["id"] == activity_id

    def test_get_activity_not_found(self, client):
        """Test getting a non-existent activity returns 404."""
        response = client.get("/activities/nonexistent_activity_id_12345")
        assert response.status_code == 404
        assert "not found" in response.json()["error"].lower()


class TestListCategories:
    """Tests for GET /activities/categories/list endpoint."""

    def test_list_categories_success(self, client):
        """Test listing activity categories."""
        response = client.get("/activities/categories/list")
        assert response.status_code == 200

        data = response.json()
        assert "categories" in data
        assert "total_activities" in data
        assert len(data["categories"]) > 0

        # Each category should have id and count
        for category in data["categories"]:
            assert "id" in category
            assert "count" in category
            assert category["count"] > 0
