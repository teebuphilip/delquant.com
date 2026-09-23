"""
SportsStack sample: query the competitive-traits proxy layer.

Use case: SportsStack presents position-relative player traits and team-level
competitive context alongside projections and roster-construction tools.
"""

import argparse
import os

import requests


BASE_URL = os.environ["DBB2_BASE_URL"].rstrip("/")


def get_json(path: str, **params) -> dict:
    response = requests.get(f"{BASE_URL}{path}", params=params, timeout=15)
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(description="Query DBB2 competitive traits")
    parser.add_argument("--team", default="DEN", help="NBA team abbreviation")
    parser.add_argument("--position", default="C", help="Position code")
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    summary = get_json("/tools/roster-construction/competitive-traits/summary")
    baselines = get_json(
        "/tools/roster-construction/competitive-traits/baselines",
        position=args.position,
        limit=args.limit,
    )
    players = get_json(
        "/tools/roster-construction/competitive-traits/players",
        team=args.team,
        limit=args.limit,
    )
    team = get_json(
        f"/tools/roster-construction/competitive-traits/teams/{args.team}"
    )

    print("Competitive traits layer")
    print(f"  mode: {summary.get('mode', 'n/a')}")
    print(f"  traits: {', '.join(summary.get('trait_columns', []))}")

    print(f"\n{args.position} baselines ({baselines.get('count', 0)} rows)")
    for row in baselines.get("baselines", []):
        print(
            f"  {row.get('position', args.position)}  "
            f"sample={row.get('sample_size', 'n/a')}  "
            f"minutes_mean={row.get('minutes_mean', 'n/a')}  "
            f"points_mean={row.get('points_mean', 'n/a')}  "
            f"rebounds_mean={row.get('rebounds_mean', 'n/a')}"
        )

    print(f"\n{args.team} projected players ({players.get('count', 0)} rows)")
    for player in players.get("players", []):
        print(
            f"  {player.get('player', player.get('name', 'Unknown')):25s}  "
            f"score={player.get('competitive_score', 'n/a')}  "
            f"signal={player.get('competitive_signal', 'n/a')}"
        )

    print(f"\n{args.team} team report")
    print(f"  players: {team.get('count', 0)}")
    print(f"  signal_counts: {team.get('signal_counts', {})}")
    if team.get("summary"):
        print(f"  summary: {team['summary']}")


if __name__ == "__main__":
    main()
