"""
Tests for history endpoints (require authentication).
"""

import pytest
from unittest.mock import MagicMock


class TestSaveHistory:
    """Tests for POST /history endpoint."""

    def test_save_history_unauthenticated(self, client, mock_unauthenticated):
        """Test saving history without authentication returns 401."""
        response = client.post("/history", json={
            "entries": [{
                "activity_id": "act_001",
                "activity_title": "Dance Party",
                "activity_emoji": "💃",
                "timestamp": "2024-01-01T10:00:00Z",
                "liked": True,
                "completed": True,
            }]
        })
        assert response.status_code == 401
        assert "authentication required" in response.json()["error"].lower()

    def test_save_history_authenticated(self, client, mock_firebase):
        """Test saving history with authentication."""
        # Mock Firestore add operation
        mock_collection = MagicMock()
        mock_history_ref = MagicMock()
        mock_firebase["db"].collection.return_value.document.return_value.collection.return_value = mock_history_ref

        response = client.post(
            "/history",
            json={
                "entries": [{
                    "activity_id": "act_001",
                    "activity_title": "Dance Party",
                    "activity_emoji": "💃",
                    "timestamp": "2024-01-01T10:00:00Z",
                    "liked": True,
                    "completed": True,
                }]
            },
            headers={"Authorization": "Bearer test_token"}
        )
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["saved_count"] == 1
        assert data["user_id"] == "test_user_123"


class TestGetHistory:
    """Tests for GET /history endpoint."""

    def test_get_history_unauthenticated(self, client, mock_unauthenticated):
        """Test getting history without authentication returns 401."""
        response = client.get("/history")
        assert response.status_code == 401
        assert "authentication required" in response.json()["error"].lower()

    def test_get_history_authenticated(self, client, mock_firebase):
        """Test getting history with authentication."""
        # Mock Firestore query
        mock_doc = MagicMock()
        mock_doc.id = "history_1"
        mock_doc.to_dict.return_value = {
            "activity_id": "act_001",
            "activity_title": "Dance Party",
            "liked": True,
        }

        mock_query = MagicMock()
        mock_query.stream.return_value = [mock_doc]

        mock_firebase["db"].collection.return_value.document.return_value.collection.return_value.order_by.return_value.limit.return_value = mock_query

        response = client.get(
            "/history",
            headers={"Authorization": "Bearer test_token"}
        )
        assert response.status_code == 200

        data = response.json()
        assert "history" in data
        assert "count" in data
        assert data["user_id"] == "test_user_123"

    def test_get_history_with_limit(self, client, mock_firebase):
        """Test getting history with custom limit."""
        mock_query = MagicMock()
        mock_query.stream.return_value = []

        mock_firebase["db"].collection.return_value.document.return_value.collection.return_value.order_by.return_value.limit.return_value = mock_query

        response = client.get(
            "/history?limit=10",
            headers={"Authorization": "Bearer test_token"}
        )
        assert response.status_code == 200
