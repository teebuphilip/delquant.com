"""
SportsStack sample: build a player intelligence card.

Use case: SportsStack customer requests a full player view. This script pulls the
player profile endpoint and renders a structured card with projection, variance,
archetype context, and historical comparisons.
"""

import os
import sys
import requests

BASE_URL = os.environ["DBB2_BASE_URL"]


def fetch_player_card(player_name: str, comp_count: int = 3) -> dict:
    resp = requests.get(
        f"{BASE_URL}/api/team/player-profile",
        params={"player_name": player_name, "comp_count": comp_count},
        timeout=10,
    )
    if resp.status_code == 404:
        print(f"Player not found: {player_name}")
        sys.exit(1)
    resp.raise_for_status()
    return resp.json()


def render_card(card: dict):
    player = card.get("player", {})
    projection = card.get("projection", {})
    variance = card.get("variance_and_confidence", {})
    archetype = card.get("archetype_profile")
    comps = card.get("historical_comps", [])
    flags = card.get("capability_flags", {})

    print("=" * 60)
    print(f"  {player.get('name', 'Unknown')}  |  {player.get('team')}  |  {player.get('position')}")
    print("=" * 60)

    if projection:
        pts = projection.get("points") or projection.get("pts")
        reb = projection.get("rebounds") or projection.get("reb")
        ast = projection.get("assists") or projection.get("ast")
        min_ = projection.get("projected_minutes") or projection.get("minutes")
        print(f"\n  Projection")
        print(f"    PTS {pts:.1f}   REB {reb:.1f}   AST {ast:.1f}   MIN {min_:.1f}")
    else:
        print("\n  Projection: unavailable")

    props = variance.get("props", {})
    if props:
        print(f"\n  Variance (std dev)")
        for stat, data in list(props.items())[:3]:
            std = data.get("std") if isinstance(data, dict) else None
            proj = data.get("projection") if isinstance(data, dict) else None
            if std is not None:
                print(f"    {stat:20s}  proj={proj:.1f}  std={std:.2f}" if proj is not None else f"    {stat:20s}  std={std:.2f}")

    if archetype:
        role = archetype.get("archetype_role") or archetype.get("archetype")
        print(f"\n  Archetype: {role}")
    elif flags.get("archetype_role") is False:
        print("\n  Archetype: not available in current snapshot")

    if comps:
        print(f"\n  Historical Comps")
        for comp in comps[:3]:
            name = comp.get("player_name") or comp.get("name")
            season = comp.get("season") or comp.get("comp_season")
            sim = comp.get("similarity")
            sim_str = f"  sim={sim:.2f}" if sim else ""
            print(f"    {name}  {season}{sim_str}")
    elif flags.get("historical_comps") is False:
        print("\n  Historical Comps: not available in current snapshot")

    print()


def main():
    player_name = sys.argv[1] if len(sys.argv) > 1 else "Example Player"
    card = fetch_player_card(player_name)
    render_card(card)


if __name__ == "__main__":
    main()
