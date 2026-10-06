"""Generate development-only env files without exposing passwords or replacing existing files."""

import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[2]
files = [root / ".env", root / "backend/.env", root / "frontend/.env.local"]
if any(path.exists() for path in files):
    raise SystemExit(
        "Existing environment files found. Nothing was changed; see backend/README.md."
    )
password = secrets.token_urlsafe(32)
values = [
    f"POSTGRES_PASSWORD={password}\n",
    f"DATABASE_URL=postgresql+psycopg://zilal:{password}@127.0.0.1:5433/zilal\nSITE_ORIGIN=http://localhost:3000\nAPP_ENV=development\n",
    "PLATFORM_MODE=server\nBACKEND_URL=http://127.0.0.1:8000\nSITE_ORIGIN=http://localhost:3000\n",
]
for path, value in zip(files, values, strict=True):
    path.write_text(value, encoding="utf-8")
    path.chmod(0o600)
print("Local environment files created. Development password was generated and is not printed.")
