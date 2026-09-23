"""
SportsStack sample: compare DELQUANT projections against provider consensus lines.

Use case: SportsStack aggregates projections from multiple providers. This script
identifies players where DELQUANT disagrees materially with consensus and surfaces those
as divergence signals for downstream consumers.
"""

import os
import requests

BASE_URL = os.environ["DELQUANT_BASE_URL"]

CONSENSUS_PROJECTIONS = {
    "203999": {"pts": 23.1, "reb": 11.2, "ast": 8.5},
    "1628983": {"pts": 27.4, "reb": 4.1, "ast": 6.2},
    "1630552": {"pts": 19.8, "reb": 9.5, "ast": 2.1},
}

DIVERGENCE_THRESHOLD = 0.10


def fetch_today_projections() -> dict[str, dict]:
    resp = requests.get(f"{BASE_URL}/projections/today", timeout=10)
    resp.raise_for_status()
    players = resp.json().get("players", [])
    return {p["player_id"]: p for p in players}


def compute_divergence(delquant_val: float, consensus_val: float) -> float:
    if consensus_val == 0:
        return 0.0
    return (delquant_val - consensus_val) / consensus_val


def find_divergences(delquant: dict[str, dict]) -> list[dict]:
    divergences = []
    for player_id, consensus in CONSENSUS_PROJECTIONS.items():
        if player_id not in delquant:
            continue
        player = delquant[player_id]
        for stat, consensus_val in consensus.items():
            delquant_val = player.get(stat)
            if delquant_val is None:
                continue
            delta = compute_divergence(delquant_val, consensus_val)
            if abs(delta) >= DIVERGENCE_THRESHOLD:
                divergences.append({
                    "player_id": player_id,
                    "name": player["name"],
                    "team": player["team"],
                    "stat": stat,
                    "delquant": delquant_val,
                    "consensus": consensus_val,
                    "delta_pct": delta,
                    "direction": "HIGHER" if delta > 0 else "LOWER",
                })
    divergences.sort(key=lambda x: abs(x["delta_pct"]), reverse=True)
    return divergences


def main():
    delquant = fetch_today_projections()
    print(f"Loaded {len(delquant)} DELQUANT projections")

    divergences = find_divergences(delquant)
    print(f"\nFound {len(divergences)} divergences >= {DIVERGENCE_THRESHOLD:.0%}\n")

    for d in divergences:
        print(
            f"  {d['name']:25s}  {d['stat']:3s}  "
            f"DELQUANT={d['delquant']:.1f}  consensus={d['consensus']:.1f}  "
            f"delta={d['delta_pct']:+.1%}  [{d['direction']}]"
        )


if __name__ == "__main__":
    main()
