# DBB2 / SportsStack Integration Samples

Six working Python samples covering the primary SportsStack integration use cases.

## Setup

```bash
pip install requests
export DBB2_BASE_URL=<preview URL supplied with trial key>
export DBB2_API_KEY=<trial key>
```

## Samples

### 01 — Ingest Projections
```bash
python 01_ingest_projections.py
```
Fetches today's DBB2 projection feed and maps DBB2 player IDs to SportsStack
universal IDs. This is the first step in any integration — run it once per day
after the nightly refresh.

### 02 — Provider Comparison
```bash
python 02_provider_comparison.py
```
Compares DBB2 projections against a provider consensus and surfaces divergences
above a configurable threshold. Produces a ranked list of disagreements by stat
and direction (HIGHER / LOWER).

### 03 — Player Intelligence Card
```bash
python 03_player_intelligence_card.py "Nikola Jokic"
```
Pulls the full player profile — projection, variance, archetype, historical
comps — and renders a structured card. Accepts player name as an argument.

### 04 — DFS Lineup Builder
```bash
python 04_dfs_lineup_builder.py
```
Resolves a candidate pool of player names to DBB2 IDs, calls the lineup
optimizer, and renders the optimal lineup with projected fantasy points.

### 05 — Sportsbook Signal Scanner
```bash
python 05_sportsbook_signal_scanner.py
```
Compares DBB2 category projections against today's market lines. Flags
props where DBB2 shows a material edge above a minimum threshold and
ranks them by edge magnitude.

### 06 — Competitive Traits
```bash
python 06_competitive_traits.py --team DEN --position C
```
Queries the competitive-traits summary, position baseline, filtered player, and
team report endpoints and renders the available trait context.

## Notes

- All samples use `DBB2_BASE_URL` and `DBB2_API_KEY` from environment.
- Player IDs and market lines in samples 02, 04, and 05 are placeholders.
  Replace with real IDs from the `/players/lookup` endpoint.
- Samples are intentionally simple — no retry logic, no persistence layer.
  They demonstrate the API contract, not production patterns.
