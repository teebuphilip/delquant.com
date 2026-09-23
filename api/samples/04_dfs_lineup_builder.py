"""
SportsStack sample: build an optimized DFS lineup from a candidate pool.

Use case: SportsStack DFS consumer provides a pool of player IDs (from today's slate).
This script resolves DBB2 IDs, calls the lineup optimizer, and renders the result.
"""

import os
import requests
from typing import Optional

BASE_URL = os.environ["DBB2_BASE_URL"]

CANDIDATE_PLAYER_NAMES = [
    "203999",  # Nikola Jokić; ID lookup avoids accent-sensitive name matching.
    "Shai Gilgeous-Alexander",
    "Jalen Johnson",
    "A.J. Lawson",
    "Aaron Gordon",
]

ROSTER_SIZE = 5


def lookup_player_id(name: str) -> Optional[str]:
    resp = requests.get(
        f"{BASE_URL}/players/lookup",
        params={"query": name, "limit": 1},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    players = resp.json().get("players", [])
    return players[0]["player_id"] if players else None


def optimize_lineup(player_ids: list[str], roster_size: int) -> dict:
    resp = requests.post(
        f"{BASE_URL}/tools/lineup/optimize",
        json={"player_ids": player_ids, "roster_size": roster_size},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def main():
    print("Resolving player IDs...")
    player_ids = []
    for name in CANDIDATE_PLAYER_NAMES:
        pid = lookup_player_id(name)
        if pid:
            player_ids.append(pid)
            print(f"  {name} -> {pid}")
        else:
            print(f"  {name} -> not found, skipping")

    if not player_ids:
        print("No valid player IDs resolved. Exiting.")
        return

    print(f"\nOptimizing lineup (roster_size={ROSTER_SIZE}) from {len(player_ids)} candidates...")
    result = optimize_lineup(player_ids, ROSTER_SIZE)

    lineup = result.get("lineup", [])
    bench = result.get("bench", [])
    total = result.get("projected_total_fantasy_points", 0)

    print(f"\nOptimal Lineup  ({total:.1f} projected fantasy points)")
    print("-" * 50)
    for p in lineup:
        print(
            f"  {p.get('name', p['player_id']):25s}  "
            f"{p.get('position', ''):2s}  {p.get('team', ''):3s}  "
            f"fpts={p.get('fantasy_points', 0):.1f}"
        )

    if bench:
        print(f"\nBench")
        for p in bench:
            print(f"  {p.get('name', p['player_id']):25s}  fpts={p.get('fantasy_points', 0):.1f}")


if __name__ == "__main__":
    main()
