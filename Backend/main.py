"""Compatibility entry point for ``fastapi dev main.py``.

Keep the implementation in ``app.main`` so both documented and shorthand
development commands start the same API, schema migrations, uploads, and routes.
"""
from app.main import app

__all__ = ["app"]
