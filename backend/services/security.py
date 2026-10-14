"""
Auth primitives (Feature 5): password hashing (bcrypt), JWT issue/verify, and
FastAPI dependencies. Auth is OPTIONAL — endpoints work anonymously (user_id
NULL) and scope to a user only when a valid token is sent, so the app stays
usable for quick demos while logged-in users get private history.
"""
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings

ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.JWT_SECRET, algorithm=ALGORITHM)


def _decode(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


async def get_optional_user_id(cred: HTTPAuthorizationCredentials = Depends(_bearer)) -> int | None:
    return _decode(cred.credentials) if cred else None


async def get_current_user_id(cred: HTTPAuthorizationCredentials = Depends(_bearer)) -> int:
    uid = _decode(cred.credentials) if cred else None
    if uid is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return uid
