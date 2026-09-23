"""
SportsStack sample: ingest DELQUANT daily projections and map to universal player IDs.

Use case: SportsStack pulls DELQUANT's projection feed each morning, maps DELQUANT player_id
to SportsStack's universal ID, and stores the enriched records for downstream consumers.
"""

import os
import requests
from typing import Optional

BASE_URL = os.environ["DELQUANT_BASE_URL"]
API_KEY = os.environ["DELQUANT_API_KEY"]

SPORTSSTACK_ID_MAP = {
    "203999": "ss_player_00001",
    "1628983": "ss_player_00002",
    "1630552": "ss_player_00003",
}


def resolve_player_id(name_or_id: str) -> Optional[dict]:
    resp = requests.get(
        f"{BASE_URL}/players/lookup",
        params={"query": name_or_id, "limit": 1},
        headers={"X-API-Key": API_KEY},
        timeout=10,
    )
    resp.raise_for_status()
    players = resp.json().get("players", [])
    return players[0] if players else None


def fetch_today_projections() -> list[dict]:
    resp = requests.get(f"{BASE_URL}/projections/today", timeout=10)
    resp.raise_for_status()
    return resp.json().get("players", [])


def enrich_with_universal_id(player: dict) -> dict:
    delquant_id = player["player_id"]
    universal_id = SPORTSSTACK_ID_MAP.get(delquant_id, f"unmapped_{delquant_id}")
    return {**player, "ss_universal_id": universal_id}


def main():
    players = fetch_today_projections()
    print(f"Fetched {len(players)} players from DELQUANT")

    enriched = [enrich_with_universal_id(p) for p in players]

    unmapped = [p for p in enriched if p["ss_universal_id"].startswith("unmapped_")]
    if unmapped:
        print(f"Warning: {len(unmapped)} players have no universal ID mapping")
        for p in unmapped[:5]:
            print(f"  {p['name']} ({p['player_id']})")

    mapped = [p for p in enriched if not p["ss_universal_id"].startswith("unmapped_")]
    print(f"\nSuccessfully mapped {len(mapped)} players")

    for p in mapped[:3]:
        print(
            f"  {p['name']:25s}  delquant={p['player_id']}  ss={p['ss_universal_id']}"
            f"  pts={p['pts']:.1f} ({p['pts_conf']:.0%} conf)"
            f"  min={p.get('projected_minutes', 'n/a')}"
        )


if __name__ == "__main__":
    main()
