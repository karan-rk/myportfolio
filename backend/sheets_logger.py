"""Query logger — appends every AI query as a row to Google Sheets.

Required environment variables (set in Render dashboard):
  GOOGLE_SHEETS_ID    — the spreadsheet ID from the URL
  GOOGLE_SHEETS_CREDS — the full service-account JSON as a single-line string

Sheet columns (A–J):
  Timestamp | Question | Intent | Role | Confidence | Abstained |
  Response Type | Top Score | Latency (ms) | Answer Preview
"""
import json
import os
import threading
from datetime import datetime, timezone

SHEETS_ID = os.getenv("GOOGLE_SHEETS_ID", "")
SHEETS_CREDS_JSON = os.getenv("GOOGLE_SHEETS_CREDS", "")
_sheets_service = None
_sheets_lock = threading.Lock()


def _get_sheets_service():
    """Lazily initialize and cache the Google Sheets API service."""
    global _sheets_service
    if _sheets_service is not None:
        return _sheets_service
    if not SHEETS_CREDS_JSON or not SHEETS_ID:
        return None
    with _sheets_lock:
        if _sheets_service is not None:
            return _sheets_service
        try:
            from google.oauth2.service_account import Credentials
            from googleapiclient.discovery import build
            creds_info = json.loads(SHEETS_CREDS_JSON)
            creds = Credentials.from_service_account_info(
                creds_info,
                scopes=["https://www.googleapis.com/auth/spreadsheets"],
            )
            _sheets_service = build("sheets", "v4", credentials=creds, cache_discovery=False)
            print("SHEETS: service initialized", flush=True)
        except Exception as err:
            print(f"SHEETS: init failed -- {err}", flush=True)
    return _sheets_service


def log_query_async(query, response):
    """Fire-and-forget: append one row to the Google Sheet."""
    if not SHEETS_CREDS_JSON or not SHEETS_ID:
        return

    def _log():
        try:
            service = _get_sheets_service()
            if not service:
                return
            trace = response.get("trace", {})
            answer = response.get("answer", "")
            answer_preview = (answer[:200] + "...") if len(answer) > 200 else answer
            row = [
                datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                query,
                trace.get("intent", ""),
                trace.get("role", ""),
                response.get("confidence", ""),
                "Yes" if response.get("abstained") else "No",
                response.get("response_type", ""),
                str(trace.get("top_score", "")),
                str(response.get("latency_ms", "")),
                answer_preview,
            ]
            service.spreadsheets().values().append(
                spreadsheetId=SHEETS_ID,
                range="Sheet1!A:J",
                valueInputOption="RAW",
                body={"values": [row]},
            ).execute()
        except Exception as err:
            print(f"SHEETS LOG ERROR: {err}", flush=True)

    threading.Thread(target=_log, daemon=True).start()
