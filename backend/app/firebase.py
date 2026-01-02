"""
Firebase Admin SDK initialization and utilities
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import lru_cache

from .config import get_settings


_firebase_app = None


def init_firebase():
    """Initialize Firebase Admin SDK."""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    settings = get_settings()

    # Check for credentials file
    creds_path = settings.google_application_credentials

    if creds_path and os.path.exists(creds_path):
        # Use service account credentials file
        cred = credentials.Certificate(creds_path)
        _firebase_app = firebase_admin.initialize_app(cred, {
            'projectId': settings.firebase_project_id,
        })
    else:
        # Use Application Default Credentials (works on Cloud Run)
        _firebase_app = firebase_admin.initialize_app(options={
            'projectId': settings.firebase_project_id,
        })

    return _firebase_app


@lru_cache()
def get_firestore_client():
    """Get Firestore client."""
    init_firebase()
    return firestore.client()


def verify_firebase_token(id_token: str) -> dict | None:
    """
    Verify a Firebase ID token and return the decoded claims.

    Args:
        id_token: The Firebase ID token to verify

    Returns:
        Decoded token claims if valid, None otherwise
    """
    init_firebase()
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None


def get_user_from_token(id_token: str) -> dict | None:
    """
    Get user data from a Firebase ID token.

    Args:
        id_token: The Firebase ID token

    Returns:
        User data dict with uid, email, etc. if valid
    """
    decoded = verify_firebase_token(id_token)
    if not decoded:
        return None

    return {
        "uid": decoded.get("uid"),
        "email": decoded.get("email"),
        "name": decoded.get("name"),
        "picture": decoded.get("picture"),
        "email_verified": decoded.get("email_verified", False),
        "is_anonymous": decoded.get("firebase", {}).get("sign_in_provider") == "anonymous",
    }
