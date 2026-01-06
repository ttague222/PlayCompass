"""
Tests for recommendation endpoints.
"""

import pytest


class TestRecommendationsEndpoint:
    """Tests for POST /recommendations endpoint."""

    def test_recommendations_success(self, client, sample_recommendation_request):
        """Test successful recommendation request."""
        response = client.post("/recommendations", json=sample_recommendation_request)
        assert response.status_code == 200

        data = response.json()
        assert "activities" in data
        assert "total_available" in data
        assert "filters_applied" in data
        assert len(data["activities"]) <= sample_recommendation_request["count"]

    def test_recommendations_no_kids(self, client):
        """Test recommendation request without kids returns 400."""
        response = client.post("/recommendations", json={
            "kids": [],
            "duration": "short",
        })
        assert response.status_code == 400
        assert "kid profile is required" in response.json()["error"].lower()

    def test_recommendations_with_filters(self, client, sample_kids):
        """Test recommendations with various filters."""
        response = client.post("/recommendations", json={
            "kids": sample_kids,
            "duration": "medium",
            "location": "outdoor",
            "energy": "high",
            "count": 3,
        })
        assert response.status_code == 200

        data = response.json()
        filters = data["filters_applied"]
        assert filters["duration"] == "medium"
        assert filters["location"] == "outdoor"
        assert filters["energy"] == "high"

    def test_recommendations_minimum_request(self, client, sample_kid):
        """Test recommendations with minimal required fields (kids + duration)."""
        response = client.post("/recommendations", json={
            "kids": [sample_kid],
            "duration": "short",
        })
        assert response.status_code == 200
        assert "activities" in response.json()


class TestQuickRecommendations:
    """Tests for GET /recommendations/quick endpoint."""

    def test_quick_recommendations_success(self, client):
        """Test quick recommendations with valid ages."""
        response = client.get("/recommendations/quick?ages=5,8&minutes=30")
        assert response.status_code == 200

        data = response.json()
        assert "activities" in data
        assert "count" in data
        assert "query" in data
        assert data["query"]["ages"] == [5, 8]
        assert data["query"]["minutes"] == 30

    def test_quick_recommendations_with_location(self, client):
        """Test quick recommendations with location filter."""
        response = client.get("/recommendations/quick?ages=7&minutes=45&location=indoor")
        assert response.status_code == 200

        data = response.json()
        assert data["query"]["location"] == "indoor"

    def test_quick_recommendations_custom_count(self, client):
        """Test quick recommendations with custom count."""
        response = client.get("/recommendations/quick?ages=6&minutes=20&count=3")
        assert response.status_code == 200

        data = response.json()
        assert len(data["activities"]) <= 3

    def test_quick_recommendations_invalid_ages(self, client):
        """Test quick recommendations with invalid ages format."""
        response = client.get("/recommendations/quick?ages=abc&minutes=30")
        assert response.status_code == 400
        assert "invalid ages format" in response.json()["error"].lower()

    def test_quick_recommendations_missing_ages(self, client):
        """Test quick recommendations without required ages parameter."""
        response = client.get("/recommendations/quick?minutes=30")
        assert response.status_code == 422  # FastAPI validation error


class TestRandomActivity:
    """Tests for GET /recommendations/random endpoint."""

    def test_random_activity_success(self, client):
        """Test getting a random activity."""
        response = client.get("/recommendations/random?ages=7")
        assert response.status_code == 200

        data = response.json()
        assert "activity" in data
        activity = data["activity"]
        assert "id" in activity
        assert "title" in activity
        assert "description" in activity

    def test_random_activity_with_filters(self, client):
        """Test random activity with location and energy filters."""
        response = client.get("/recommendations/random?ages=5,10&location=indoor&energy=low")
        assert response.status_code == 200
        assert "activity" in response.json()

    def test_random_activity_invalid_ages(self, client):
        """Test random activity with invalid ages."""
        response = client.get("/recommendations/random?ages=not_a_number")
        assert response.status_code == 400
