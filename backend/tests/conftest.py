"""
Pytest fixtures and configuration for PlayCompass backend tests.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_firebase():
    """Mock Firebase authentication and Firestore."""
    with patch("app.main.get_user_from_token") as mock_auth, \
         patch("app.main.get_firestore_client") as mock_firestore:

        # Default: return authenticated user
        mock_auth.return_value = {"uid": "test_user_123", "email": "test@example.com"}

        # Mock Firestore client
        mock_db = MagicMock()
        mock_firestore.return_value = mock_db

        yield {
            "auth": mock_auth,
            "firestore": mock_firestore,
            "db": mock_db,
        }


@pytest.fixture
def mock_unauthenticated():
    """Mock unauthenticated requests."""
    with patch("app.main.get_user_from_token") as mock_auth:
        mock_auth.return_value = None
        yield mock_auth


@pytest.fixture
def sample_kid():
    """Sample kid data for testing."""
    return {
        "id": "kid_1",
        "name": "Test Kid",
        "age": 7,
        "interests": ["sports", "games"],
    }


@pytest.fixture
def sample_kids():
    """Multiple sample kids for testing."""
    return [
        {"id": "kid_1", "name": "Alice", "age": 5, "interests": ["art", "music"]},
        {"id": "kid_2", "name": "Bob", "age": 8, "interests": ["sports", "science"]},
    ]


@pytest.fixture
def sample_recommendation_request(sample_kids):
    """Sample recommendation request."""
    return {
        "kids": sample_kids,
        "duration": "short",
        "location": "indoor",
        "energy": "medium",
        "count": 5,
    }
