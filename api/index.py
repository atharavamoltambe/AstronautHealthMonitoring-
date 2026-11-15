import os
import sys

# Ensure backend directory is in the Python search path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app


class VercelPathMiddleware:
    """Unwraps Vercel's rewrite headers to restore the true requested URL path for FastAPI."""
    def __init__(self, inner_app):
        self.inner_app = inner_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            # Vercel sends the true original path in x-matched-path or x-forwarded-uri
            matched_path = (
                headers.get(b"x-matched-path")
                or headers.get(b"x-forwarded-uri")
                or headers.get(b"x-invoke-path")
            )
            if matched_path:
                decoded = matched_path.decode("utf-8")
                scope["path"] = decoded.split("?")[0]
        await self.inner_app(scope, receive, send)


app = VercelPathMiddleware(app)
