# DelQuant API Documentation

Public reference for the DelQuant NBA projection service.

## Today’s projections

`GET /projections/today`

Returns the current projection contract for the available player pool. The feed is designed for scheduled, pre-game consumption by fantasy platforms, sportsbooks, media products, analytics tools, and other NBA applications.

### Request

```bash
curl "$DELQUANT_BASE_URL/projections/today" \
  -H "X-API-Key: $DELQUANT_API_KEY"
```

The production service URL and API key are supplied during the technical handoff. Do not commit credentials to source control.

### Response

```json
{
  "players": [
    {
      "player_id": "203999",
      "name": "Example Player",
      "team": "DEN",
      "position": "C",
      "projected_minutes": 34.2,
      "is_b2b": false,
      "pts": 26.8,
      "pts_std": 5.42,
      "pts_conf": 0.72,
      "reb": 12.1,
      "reb_std": 2.88,
      "reb_conf": 0.69,
      "ast": 8.9,
      "ast_std": 2.41,
      "ast_conf": 0.70,
      "fg3m": 1.2,
      "fg3m_std": 0.66,
      "fg3m_conf": 0.61,
      "stl": 1.3,
      "stl_std": 0.54,
      "stl_conf": 0.67,
      "blk": 0.9,
      "blk_std": 0.50,
      "blk_conf": 0.62
    }
  ]
}
```

## Field guide

| Field | Meaning |
|---|---|
| `player_id` | DelQuant’s canonical player identifier |
| `projected_minutes` | Expected minutes for the projection window |
| `pts`, `reb`, `ast`, `fg3m`, `stl`, `blk` | Category projections |
| `*_std` | Estimated standard deviation for the category |
| `*_conf` | Confidence surface for the category, returned on a bounded scale |
| `is_b2b` | Whether the player is in a back-to-back context where available |

Consumers should retain both their own universal player ID and DelQuant’s `player_id` when mapping the feed into an existing platform.

## Supporting endpoints

- `GET /health` — service liveness and version.
- `GET /players/lookup` — resolve a name or ID to a canonical player record.
- `GET /api/game-day/projections` — retrieve a dated game slate with opponent, location, rest, minutes, and contextual variance.
- `GET /api/local/historical-projections` — retrieve no-lookahead projections for a past decision date.
- `GET /api/team/player-profile` — retrieve projection, player context, archetype, risk, and historical comparison fields where available.

## Short-horizon service profiles

DelQuant separates the source projection layer from downstream decision products. The core feed remains the structural projection; short-horizon profiles add recency or slate context for the decision being made.

- **WinstAPlayer** — market-focused player workflow using responsive projections for individual-market research and comparison. It consumes the structural feed plus the appropriate recency or game-day context; market filters, edge thresholds, and staking remain downstream application logic.
- **DFSRase** — DFS-focused slate workflow using dated game-day projections and lineup tools. Salary, ownership, contest, exposure, and lineup rules remain in the DFS application layer.

The primary integration surfaces are `GET /projections/today`, `GET /api/game-day/projections`, `POST /tools/lineup/optimize`, and `GET /tools/streaming-candidates`. Request the required horizon/profile contract during onboarding; do not treat either downstream service as a replacement for the structural projection.

## Authentication and errors

Protected requests use:

```http
X-API-Key: YOUR_API_KEY
```

- `200` — request succeeded
- `401` — missing or invalid API key
- `404` — player, date, or artifact unavailable
- `422` — invalid parameter or request body
- `503` — required service configuration unavailable

## Operating model

- API version: `1.2.0`
- Refresh: nightly, with optional morning refresh
- Delivery: JSON API, batch feed, or report bundle
- Initial package: scheduled/pre-game delivery; live in-game updates are not included

For the full interactive guide and downloadable Python examples, see the [developer documentation](https://delquant.com/developers/).
