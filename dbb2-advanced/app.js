(() => {
  const DEFAULTS = {
    sample: "./data/strict_wins_player_scores.csv",
    summary: "./data/strict_wins_summary.json",
    vorpSummary: "./data/strict_wins_vorp_comparison.json",
    vorpCsv: "./data/strict_wins_vorp_comparison.csv",
  };

  const NUMBER = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const formatFloat = (value, digits = 3) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "--";
    return n.toFixed(digits);
  };

  const formatCompact = (value, digits = 2) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "--";
    return n.toFixed(digits);
  };

  const splitCsvLine = (line) => {
    const out = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        out.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    out.push(current);
    return out;
  };

  const parseCsv = (text) => {
    const lines = String(text || "")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (!lines.length) return [];
    const headers = splitCsvLine(lines[0]).map((value) => value.trim());
    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = (values[index] ?? "").trim();
      });
      return row;
    });
  };

  const fetchCsv = async (path) => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Unable to load CSV: ${path}`);
    }
    return parseCsv(await response.text());
  };

  const fetchJson = async (path) => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Unable to load JSON: ${path}`);
    }
    return response.json();
  };

  const renderList = (container, items) => {
    if (!container) return;
    container.innerHTML = items
      .map(
        ([label, value]) => `
          <div class="list-row">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `,
      )
      .join("");
  };

  const renderTable = (container, rows, columns) => {
    if (!container) return;
    const head = columns
      .map((column) => `<th>${escapeHtml(column.label)}</th>`)
      .join("");
    const body = rows
      .map((row) => {
        const cells = columns
          .map((column) => {
            const raw = row[column.key];
            const rendered = column.render ? column.render(raw, row) : raw;
            return `<td>${escapeHtml(rendered ?? "--")}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    container.innerHTML = `
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    `;
  };

  const buildDefaultPair = (rows) => {
    const preferred = [
      "Shai Gilgeous-Alexander",
      "Nikola Jokić",
      "Nikola Jokic",
      "Jayson Tatum",
      "Luka Dončić",
      "Luka Doncic",
      "Stephen Curry",
    ];
    const matches = preferred
      .map((name) => rows.find((row) => normalizeText(row.player_name) === normalizeText(name)))
      .filter(Boolean);
    if (matches.length >= 2) return [matches[0], matches[1]];
    if (rows.length >= 2) return [rows[0], rows[1]];
    return [rows[0] || null, rows[0] || null];
  };

  const getField = (row, key, digits = 3) => formatFloat(NUMBER(row?.[key], NaN), digits);

  async function mount(root) {
    const samplePath = root.dataset.sample || DEFAULTS.sample;
    const summaryPath = root.dataset.summary || DEFAULTS.summary;
    const vorpSummaryPath = root.dataset.vorpSummary || DEFAULTS.vorpSummary;
    const vorpCsvPath = root.dataset.vorpCsv || DEFAULTS.vorpCsv;
    const scope = root.ownerDocument || document;
    const status = scope.querySelector("[data-status]");
    const summary = scope.querySelector("[data-summary]");
    const detailSummary = scope.querySelector("[data-detail-summary]");
    const modelSummary = scope.querySelector("[data-model-summary]");
    const gapSummary = scope.querySelector("[data-gap-summary]");
    const totalCallout = scope.querySelector("[data-total-callout]");
    const table = scope.querySelector("[data-table]");
    const vorpSummary = scope.querySelector("[data-vorp-summary]");
    const vorpTable = scope.querySelector("[data-vorp-table]");
    const compareBtn = scope.querySelector("[data-compare]");
    const playerAInput = scope.querySelector("[data-player-a]");
    const playerBInput = scope.querySelector("[data-player-b]");

    let rows = [];
    let summaryBundle = {};
    let vorpBundle = {};
    let vorpRows = [];

    const render = () => {
      if (!rows.length) return;
      const leftName = String(playerAInput?.value || "").trim();
      const rightName = String(playerBInput?.value || "").trim();
      const left = rows.find((row) => normalizeText(row.player_name) === normalizeText(leftName));
      const right = rows.find((row) => normalizeText(row.player_name) === normalizeText(rightName));
      if (!left || !right) {
        status.textContent = "Select two players from the loaded pool.";
        return;
      }

      const leftWins = NUMBER(left.strict_wins, 0);
      const rightWins = NUMBER(right.strict_wins, 0);
      const gap = Number((leftWins - rightWins).toFixed(3));
      const direction = gap >= 0 ? "better than" : "worse than";
      const magnitude = Math.abs(gap).toFixed(3);

      const tableRows = [
        {
          slot: "A",
          ...left,
          gap_from_baseline: left.strict_wins_gap_from_baseline,
        },
        {
          slot: "B",
          ...right,
          gap_from_baseline: right.strict_wins_gap_from_baseline,
        },
      ];

      renderTable(table, tableRows, [
        { key: "slot", label: "Slot" },
        { key: "player_name", label: "Player" },
        { key: "team", label: "Team" },
        { key: "position", label: "Pos" },
        { key: "projected_games", label: "Gms", render: (value) => formatCompact(value, 0) },
        { key: "minutes", label: "Min", render: (value) => formatCompact(value, 1) },
        { key: "offense_projection_raw", label: "Off Raw" },
        { key: "defense_projection_raw", label: "Def Raw" },
        { key: "advanced_projection_raw", label: "Adv Raw" },
        { key: "offense_projection_z", label: "Off Z" },
        { key: "defense_projection_z", label: "Def Z" },
        { key: "advanced_projection_z", label: "Adv Z" },
        { key: "offense_wins_component", label: "Off Wins" },
        { key: "defense_wins_component", label: "Def Wins" },
        { key: "strict_wins", label: "Strict Wins" },
        { key: "gap_from_baseline", label: "Gap From Base" },
      ]);

      renderList(summary, [
        ["Left", `${left.player_name} (${left.team})`],
        ["Right", `${right.player_name} (${right.team})`],
        ["Strict Wins Gap", formatCompact(gap, 3)],
        ["Left Strict Wins", formatCompact(leftWins, 3)],
        ["Right Strict Wins", formatCompact(rightWins, 3)],
        ["Baseline Wins", formatCompact(summaryBundle?.config?.baseline_wins, 1)],
        ["Wins per Raw", formatCompact(summaryBundle?.calibration?.wins_per_raw, 3)],
        ["Offense Share", `${formatCompact((summaryBundle?.config?.offense_share || 0) * 100, 1)}%`],
        ["Defense Share", `${formatCompact((summaryBundle?.config?.defense_share || 0) * 100, 1)}%`],
      ]);

      const vorpLeft = vorpRows.find((row) => normalizeText(row.player_name) === normalizeText(left.player_name));
      const vorpRight = vorpRows.find((row) => normalizeText(row.player_name) === normalizeText(right.player_name));
      const leftVorp = NUMBER(vorpLeft?.vorp, NaN);
      const rightVorp = NUMBER(vorpRight?.vorp, NaN);
      const vorpGap = Number((leftVorp - rightVorp).toFixed(3));
      const vorpDirection = vorpGap >= 0 ? "better than" : "worse than";
      const vorpMagnitude = Math.abs(vorpGap).toFixed(3);

      if (totalCallout) {
        const strictLabel = `${left.player_name} is ${magnitude} wins ${direction} ${right.player_name} via Strict Wins.`;
        const vorpLabel = Number.isFinite(leftVorp) && Number.isFinite(rightVorp)
          ? `${left.player_name} is ${vorpMagnitude} wins ${vorpDirection} ${right.player_name} via VORP.`
          : `${left.player_name} vs ${right.player_name} VORP is unavailable.`;
        totalCallout.textContent = `${strictLabel} ${vorpLabel}`;
      }
      if (gapSummary) {
        renderList(gapSummary, [
          ["Strict Wins Gap", `${left.player_name} is ${magnitude} wins ${direction} ${right.player_name}.`],
          [
            "VORP Gap",
            Number.isFinite(leftVorp) && Number.isFinite(rightVorp)
              ? `${left.player_name} is ${vorpMagnitude} wins ${vorpDirection} ${right.player_name}.`
              : "VORP benchmark unavailable for this pair.",
          ],
        ]);
      }
      renderList(vorpSummary, [
        ["Left Strict Wins", formatCompact(leftWins, 3)],
        ["Right Strict Wins", formatCompact(rightWins, 3)],
        ["Left VORP", vorpLeft ? formatCompact(vorpLeft.vorp, 3) : "--"],
        ["Right VORP", vorpRight ? formatCompact(vorpRight.vorp, 3) : "--"],
      ]);

      renderList(detailSummary, [
        [
          "Left Inputs",
          `G ${formatCompact(left.projected_games, 0)} | Min ${formatCompact(left.minutes, 1)} | PTS ${formatCompact(left.points, 1)} | REB ${formatCompact(left.rebounds, 1)} | AST ${formatCompact(left.assists, 1)} | STL ${formatCompact(left.steals, 1)} | BLK ${formatCompact(left.blocks, 1)} | TO ${formatCompact(left.turnovers, 1)} | FTA ${formatCompact(left.fta, 1)}`,
        ],
        [
          "Right Inputs",
          `G ${formatCompact(right.projected_games, 0)} | Min ${formatCompact(right.minutes, 1)} | PTS ${formatCompact(right.points, 1)} | REB ${formatCompact(right.rebounds, 1)} | AST ${formatCompact(right.assists, 1)} | STL ${formatCompact(right.steals, 1)} | BLK ${formatCompact(right.blocks, 1)} | TO ${formatCompact(right.turnovers, 1)} | FTA ${formatCompact(right.fta, 1)}`,
        ],
        [
          "Left Advanced",
          `Off ${formatCompact(left.offense_projection_raw, 3)} | Def ${formatCompact(left.defense_projection_raw, 3)} | Adv ${formatCompact(left.advanced_projection_raw, 3)}`,
        ],
        [
          "Right Advanced",
          `Off ${formatCompact(right.offense_projection_raw, 3)} | Def ${formatCompact(right.defense_projection_raw, 3)} | Adv ${formatCompact(right.advanced_projection_raw, 3)}`,
        ],
      ]);

      status.textContent = "Comparison ready.";
    };

    const load = async () => {
      status.textContent = "Loading 26-27 strict-wins pool...";
      rows = await fetchCsv(samplePath);
      summaryBundle = await fetchJson(summaryPath);
      vorpBundle = await fetchJson(vorpSummaryPath);
      vorpRows = await fetchCsv(vorpCsvPath);
      rows = rows
        .map((row) => ({
          ...row,
          projected_games: NUMBER(row.projected_games, 0),
          minutes: NUMBER(row.minutes, 0),
          points: NUMBER(row.points, 0),
          rebounds: NUMBER(row.rebounds, 0),
          assists: NUMBER(row.assists, 0),
          steals: NUMBER(row.steals, 0),
          blocks: NUMBER(row.blocks, 0),
          turnovers: NUMBER(row.turnovers, 0),
          fta: NUMBER(row.fta, 0),
          offense_projection_raw: NUMBER(row.offense_projection_raw, 0),
          defense_projection_raw: NUMBER(row.defense_projection_raw, 0),
          advanced_projection_raw: NUMBER(row.advanced_projection_raw, 0),
          offense_projection_z: NUMBER(row.offense_projection_z, 0),
          defense_projection_z: NUMBER(row.defense_projection_z, 0),
          advanced_projection_z: NUMBER(row.advanced_projection_z, 0),
          offense_wins_component: NUMBER(row.offense_wins_component, 0),
          defense_wins_component: NUMBER(row.defense_wins_component, 0),
          strict_wins: NUMBER(row.strict_wins, 0),
          strict_wins_gap_from_baseline: NUMBER(row.strict_wins_gap_from_baseline, 0),
        }))
        .sort((a, b) => NUMBER(b.strict_wins, 0) - NUMBER(a.strict_wins, 0));

      const sortedNames = rows
        .map((row) => row.player_name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      if (playerAInput) {
        playerAInput.innerHTML = sortedNames
          .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
          .join("");
      }
      if (playerBInput) {
        playerBInput.innerHTML = sortedNames
          .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
          .join("");
      }

      const [defaultA, defaultB] = buildDefaultPair(rows);
      if (playerAInput && defaultA?.player_name) playerAInput.value = defaultA.player_name;
      if (playerBInput && defaultB?.player_name) playerBInput.value = defaultB.player_name;

      if (modelSummary) {
        renderList(modelSummary, [
          ["Source", "26-27 projection bundle"],
          ["Player Rows", formatCompact(summaryBundle?.player_rows, 0)],
          ["Baseline Wins", formatCompact(summaryBundle?.config?.baseline_wins, 1)],
          ["Wins per Raw", formatCompact(summaryBundle?.calibration?.wins_per_raw, 3)],
          ["Offense Share", `${formatCompact((summaryBundle?.config?.offense_share || 0) * 100, 1)}%`],
          ["Defense Share", `${formatCompact((summaryBundle?.config?.defense_share || 0) * 100, 1)}%`],
          ["Calibration r", formatCompact(summaryBundle?.calibration?.team_score_to_wins_correlation, 3)],
          [
            "Formula",
            `Strict Wins = ${formatCompact(summaryBundle?.config?.baseline_wins, 1)} + ${formatCompact(summaryBundle?.calibration?.wins_per_raw, 3)} × advanced projection raw`,
          ],
        ]);
      }

      if (vorpTable) {
        const top = Array.isArray(vorpBundle?.top_disagreements) ? vorpBundle.top_disagreements.slice(0, 10) : [];
        renderTable(vorpTable, top, [
          { key: "player_name", label: "Player" },
          { key: "strict_wins", label: "Strict Wins", render: (value) => formatCompact(value, 3) },
          { key: "vorp", label: "VORP", render: (value) => formatCompact(value, 3) },
          { key: "strict_wins_rank", label: "Strict Rank", render: (value) => formatCompact(value, 0) },
          { key: "vorp_rank", label: "VORP Rank", render: (value) => formatCompact(value, 0) },
          { key: "rank_delta", label: "Rank Delta", render: (value) => formatCompact(value, 0) },
          { key: "z_delta", label: "Z Delta", render: (value) => formatCompact(value, 3) },
          { key: "percentile_delta", label: "Pct Delta", render: (value) => formatCompact(value, 3) },
        ]);
      }

      render();
    };

    compareBtn?.addEventListener("click", render);
    playerAInput?.addEventListener("change", render);
    playerBInput?.addEventListener("change", render);

    await load();
  }

  document.querySelectorAll('[data-app="advanced"]').forEach((root) => {
    mount(root).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      const status = root.querySelector("[data-status]");
      if (status) status.textContent = "Failed to load strict-wins data.";
    });
  });
})();
