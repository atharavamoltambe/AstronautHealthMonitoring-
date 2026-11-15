import os
import sys
from urllib.parse import parse_qs, urlencode

# Ensure backend directory is in the Python search path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app


class VercelPathMiddleware:
    """Unwraps Vercel's rewrite query parameter or headers to restore the true requested URL path for FastAPI."""
    def __init__(self, inner_app):
        self.inner_app = inner_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            target_path = None
            headers = dict(scope.get("headers", []))

            # 1. First priority: Check query string for explicit __path__ passed by vercel.json rewrite
            query_bytes = scope.get("query_string", b"")
            if b"__path__" in query_bytes:
                try:
                    query_str = query_bytes.decode("utf-8")
                    params = parse_qs(query_str, keep_blank_values=True)
                    if "__path__" in params:
                        raw_val = params.pop("__path__")[0]
                        target_path = raw_val if raw_val.startswith("/") else f"/{raw_val}"
                        scope["query_string"] = urlencode(params, doseq=True).encode("utf-8")
                except Exception:
                    pass

            # 2. Second priority: x-forwarded-uri header (original URI before Vercel rewrites)
            if not target_path:
                forwarded_uri = headers.get(b"x-forwarded-uri")
                if forwarded_uri:
                    try:
                        decoded = forwarded_uri.decode("utf-8").split("?")[0]
                        if decoded and decoded not in ("/api/index.py", "/api/index"):
                            target_path = decoded
                    except Exception:
                        pass

            # 3. Third priority: x-invoke-path / x-matched-path (if not the internal lambda path)
            if not target_path:
                for h_key in (b"x-invoke-path", b"x-matched-path"):
                    val = headers.get(h_key)
                    if val:
                        try:
                            decoded = val.decode("utf-8").split("?")[0]
                            if decoded and decoded not in ("/api/index.py", "/api/index"):
                                target_path = decoded
                                break
                        except Exception:
                            pass

            # 4. Fallback: if target_path is still None or points to internal lambda path, default to "/"
            if not target_path or target_path in ("/api/index.py", "/api/index"):
                curr = scope.get("path", "")
                if curr in ("/api/index.py", "/api/index", ""):
                    target_path = "/"
                else:
                    target_path = curr

            scope["path"] = target_path
            scope["raw_path"] = target_path.encode("utf-8")

        await self.inner_app(scope, receive, send)


app = VercelPathMiddleware(app)
