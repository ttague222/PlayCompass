"""
Tests for health and info endpoints.
"""

import pytest


def test_root_endpoint(client):
    """Test root endpoint returns healthy status."""
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"


def test_info_endpoint(client):
    """Test API info endpoint."""
    response = client.get("/info")
    assert response.status_code == 200

    data = response.json()
    assert "name" in data
    assert "version" in data
    assert "activity_count" in data
    assert data["activity_count"] > 0
    assert "endpoints" in data

    # Check all expected endpoints are listed
    endpoints = data["endpoints"]
    assert "health" in endpoints
    assert "recommendations" in endpoints
    assert "activities" in endpoints
