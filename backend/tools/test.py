"""Run migrations and tests only on the dedicated local test database."""

import os
import subprocess
import sys

from sqlalchemy.engine import make_url

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from app.config import config

url = make_url(config().database_url)
if url.host not in {"127.0.0.1", "localhost"}:
    raise SystemExit("Use a local database for this test helper.")
url = url.set(database="zilal_test").render_as_string(hide_password=False)
env = dict(os.environ, DATABASE_URL=url, TEST_DATABASE_URL=url)
subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], env=env, check=True)
raise SystemExit(subprocess.run([sys.executable, "-m", "pytest", "-q"], env=env).returncode)
