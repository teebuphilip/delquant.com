"""
SportsStack sample: scan for sportsbook prop opportunities.

Use case: SportsStack sportsbook consumer provides today's market lines. This script
compares DELQUANT category projections against those lines, flags significant divergences,
and ranks them by edge magnitude.
"""

import os
import requests

BASE_URL = os.environ["DELQUANT_BASE_URL"]

MARKET_LINES = {
    "203999": {"pts": 24.5, "reb": 11.5, "ast": 8.5},
    "1628983": {"pts": 26.5, "reb": 4.5, "ast": 5.5},
    "1630552": {"pts": 20.5, "reb": 9.5, "ast": 2.5},
}

MIN_EDGE = 1.5


def fetch_today_projections() -> dict[str, dict]:
    resp = requests.get(f"{BASE_URL}/projections/today", timeout=10)
    resp.raise_for_status()
    return {p["player_id"]: p for p in resp.json().get("players", [])}



def scan_signals(delquant: dict[str, dict]) -> list[dict]:
    signals = []
    for player_id, lines in MARKET_LINES.items():
        if player_id not in delquant:
            continue
        player = delquant[player_id]
        for stat, line in lines.items():
            delquant_val = player.get(stat)
            if delquant_val is None:
                continue
            edge = delquant_val - line
            if abs(edge) < MIN_EDGE:
                continue
            signals.append({
                "player_id": player_id,
                "name": player["name"],
                "team": player["team"],
                "stat": stat,
                "projection": delquant_val,
                "line": line,
                "edge": edge,
                "side": "OVER" if edge > 0 else "UNDER",
                "score": abs(edge),
            })
    signals.sort(key=lambda x: x["score"], reverse=True)
    return signals


def main():
    delquant = fetch_today_projections()
    print(f"Loaded {len(delquant)} DELQUANT projections")
    print(f"Scanning against {len(MARKET_LINES)} player market lines")
    print(f"Filter: edge >= {MIN_EDGE}\n")

    signals = scan_signals(delquant)

    if not signals:
        print("No signals meeting threshold today.")
        return

    print(f"{'Player':<25}  {'Stat':4}  {'Proj':5}  {'Line':5}  {'Edge':>5}  {'Side':5}  {'Score':5}")
    print("-" * 65)
    for s in signals:
        print(
            f"  {s['name']:<23}  {s['stat']:4}  "
            f"{s['projection']:5.1f}  {s['line']:5.1f}  "
            f"{s['edge']:+5.1f}  {s['side']:5}  "
            f"{s['score']:5.2f}"
        )


if __name__ == "__main__":
    main()
