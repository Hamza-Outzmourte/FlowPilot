"""In-memory store for demo workflows and execution results.

This is a lightweight stand-in for the database layer; sufficient to run
workflows end-to-end during development without PostgreSQL.
"""

from __future__ import annotations

from typing import Any

WORKFLOWS: dict[str, dict[str, Any]] = {}
EXECUTIONS: dict[str, dict[str, Any]] = {}
CREDENTIALS: dict[str, dict[str, str]] = {}