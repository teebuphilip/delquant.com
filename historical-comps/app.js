const API_BASE = window.DELQUANT_API_BASE || "";

const els = {
  searchInput: document.getElementById("search-input"),
  searchButton: document.getElementById("search-button"),
  searchStatus: document.getElementById("search-status"),
  results: document.getElementById("results"),
  detail: document.getElementById("detail"),
  positionFilter: document.getElementById("position-filter"),
  eraFilter: document.getElementById("era-filter"),
  similarityFilter: document.getElementById("similarity-filter"),
  resetFilters: document.getElementById("reset-filters"),
  refreshButton: document.getElementById("refresh-button"),
  accessStatus: document.getElementById("access-status"),
  subscribeButton: document.getElementById("subscribe-button"),
};

let currentSearchMatches = [];
let currentPlayer = null;
let currentEntitled = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function getFilterState() {
  const minSimilarity = Number.parseFloat(els.similarityFilter.value || "0");
  return {
    position: els.positionFilter.value.trim().toUpperCase(),
    era: els.eraFilter.value.trim(),
    minSimilarity: Number.isFinite(minSimilarity) ? minSimilarity : 0,
  };
}

function setFilterState(filters = {}) {
  if (typeof filters.position === "string") {
    els.positionFilter.value = filters.position;
  }
  if (typeof filters.era === "string") {
    els.eraFilter.value = filters.era;
  }
  if (filters.minSimilarity !== undefined && filters.minSimilarity !== null && filters.minSimilarity !== "") {
    els.similarityFilter.value = String(filters.minSimilarity);
  }
}

function buildUrl(state = {}) {
  const url = new URL(window.location.href);
  url.search = "";
  const params = new URLSearchParams();
  const query = (state.q ?? els.searchInput.value ?? "").trim();
  const player = (state.player ?? currentPlayer?.player_id ?? "").trim();
  const { position, era, minSimilarity } = state.filters || getFilterState();
  if (query) params.set("q", query);
  if (player) params.set("player", player);
  if (position) params.set("position", position);
  if (era) params.set("era", era);
  if (minSimilarity !== undefined && minSimilarity !== null && minSimilarity !== "") {
    params.set("min_similarity", String(minSimilarity));
  }
  url.search = params.toString();
  return `${url.pathname}${url.search}${url.hash}`;
}

function syncDeepLink({ replace = true } = {}) {
  const url = buildUrl();
  if (replace) {
    window.history.replaceState({}, "", url);
  } else {
    window.history.pushState({}, "", url);
  }
}

function seasonEraLabel(season) {
  const year = Number.parseInt(String(season || "").slice(0, 4), 10);
  if (!Number.isFinite(year)) return "";
  if (year >= 2020) return "2020s";
  if (year >= 2010) return "2010s";
  if (year >= 2000) return "2000s";
  if (year >= 1990) return "1990s";
  return "";
}

function filterComps(comps) {
  const { position, era, minSimilarity } = getFilterState();
  return (Array.isArray(comps) ? comps : []).filter((comp) => {
    const compPosition = String(comp.position || "").trim().toUpperCase();
    const compEra = seasonEraLabel(comp.season);
    const similarity = Number.parseFloat(comp.similarity || 0);
    if (position && compPosition !== position) return false;
    if (era && compEra !== era) return false;
    if (Number.isFinite(minSimilarity) && similarity < minSimilarity) return false;
    return true;
  });
}

function currentPlayerLink(playerId) {
  return buildUrl({ player: playerId, q: els.searchInput.value.trim() || undefined });
}

function updateBrowserTitle(playerName) {
  const base = "DelQuant | Historical Comps";
  document.title = playerName ? `${base} - ${playerName}` : base;
}

async function requestJson(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      body = { raw: text };
    }
  }
  if (!response.ok) {
    throw new Error(body.detail || body.message || `Request failed (${response.status})`);
  }
  return body;
}

function renderAccessStatus(body) {
  currentEntitled = Boolean(body && body.authenticated && body.entitled);
  if (!body || !body.authenticated) {
    els.accessStatus.textContent = "No active session loaded.";
    return;
  }
  els.accessStatus.textContent = body.entitled
    ? "Access active: subscriber session loaded."
    : "Session loaded, but access is not active.";
}

function renderCompsList(comps, entitled) {
  if (!Array.isArray(comps) || comps.length === 0) {
    return '<div class="empty-state">No comps available for this player.</div>';
  }

  const items = comps
    .map((comp, index) => {
      return `
        <li class="comp-item">
          <span class="comp-rank">#${index + 1}</span>
          <div class="comp-body">
            <strong>${escapeHtml(comp.player_name)}</strong>
            <span>${escapeHtml(comp.season)} | ${escapeHtml(comp.team)} | ${escapeHtml(comp.position)}</span>
          </div>
          <div class="comp-metrics">
            <span>${escapeHtml(comp.similarity)}</span>
            <span>${escapeHtml(comp.age)}</span>
          </div>
        </li>
      `;
    })
    .join("");

  return `
    <div class="comp-list-wrap">
      <div class="comp-list-header">
        <span>${entitled ? "Unlimited comps" : "Preview comps"}</span>
        <span>${comps.length} results</span>
      </div>
      <ol class="comp-list">${items}</ol>
    </div>
  `;
}

function renderPlayerDetail(player) {
  if (!player) {
    els.detail.innerHTML = '<div class="empty-state">Pick a player result to load the full card.</div>';
    currentPlayer = null;
    updateBrowserTitle("");
    return;
  }

  currentPlayer = player;
  const comps = player.historical_comps || [];
  const filteredComps = filterComps(comps);
  const { position, era, minSimilarity } = getFilterState();
  const lockedNotice = player.entitled
    ? ""
    : `
      <div class="lock-banner">
        Preview mode only. Unlock unlimited comps at $${Number(player.monthly_price || 6.99).toFixed(2)}/month.
      </div>
    `;

  els.detail.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${escapeHtml(player.team || "")}</p>
        <h3>${escapeHtml(player.player_name || "")}</h3>
        <p class="detail-subtitle">${escapeHtml(player.position || "")} | ${player.entitled ? "Subscriber view" : "Preview view"}</p>
      </div>
      <div class="detail-actions">
        <a class="detail-link" href="${escapeHtml(currentPlayerLink(player.player_id || ""))}">Share link</a>
        <div class="detail-badge">${player.entitled ? "Unlocked" : "Locked"}</div>
      </div>
    </div>
    <div class="detail-meta">
      <div><span>Monthly price</span><strong>$${Number(player.monthly_price || 6.99).toFixed(2)}</strong></div>
      <div><span>Preview limit</span><strong>${player.preview_limit === null ? "Unlimited" : player.preview_limit}</strong></div>
      <div><span>Comps</span><strong>${player.historical_comp_count || comps.length}</strong></div>
    </div>
    <div class="filter-chip-row">
      <span class="filter-chip${position ? "" : " muted"}">Position: ${position || "Any"}</span>
      <span class="filter-chip${era ? "" : " muted"}">Era: ${era || "Any"}</span>
      <span class="filter-chip">Min sim: ${minSimilarity || 0}</span>
    </div>
    ${lockedNotice}
    ${renderCompsList(filteredComps, player.entitled)}
  `;
  updateBrowserTitle(player.player_name || "");
}

function renderSearchResults(body) {
  currentSearchMatches = body.matches || [];
  currentEntitled = Boolean(body && body.entitled);
  if (currentSearchMatches.length === 0) {
    els.results.innerHTML = '<div class="empty-state">No matches found. Try a different player name or player id.</div>';
    return;
  }

  els.results.innerHTML = currentSearchMatches
    .map((match, index) => {
      const topComp = (match.historical_comps || [])[0];
      const deeplink = currentPlayerLink(match.player_id || "");
      return `
        <div class="match-card" data-player-id="${escapeHtml(match.player_id || "")}">
          <div class="match-head">
            <div>
              <p class="match-index">Match ${index + 1}</p>
              <h3>${escapeHtml(match.player_name || "")}</h3>
              <p class="match-meta">${escapeHtml(match.team || "")} | ${escapeHtml(match.position || "")}</p>
            </div>
            <div class="match-actions">
              <span class="match-lock">${body.entitled ? "Unlocked" : "Preview"}</span>
              <a class="match-link" href="${escapeHtml(deeplink)}">Open</a>
            </div>
          </div>
          <div class="match-preview">
            <span>${body.entitled ? "Full list active" : "Preview only"}</span>
            <span>${topComp ? `${escapeHtml(topComp.player_name)} / ${escapeHtml(topComp.season)}` : "No preview comps"}</span>
          </div>
        </div>
      `;
    })
    .join("");

  els.results.querySelectorAll("[data-player-id]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target && event.target.closest && event.target.closest("a")) {
        return;
      }
      loadPlayer(node.getAttribute("data-player-id"));
    });
  });
}

async function loadPlayer(playerId, { pushHistory = true } = {}) {
  if (!playerId) return;
  els.searchStatus.textContent = `Loading ${playerId}...`;
  try {
    const body = await requestJson(`/api/comps/player/${encodeURIComponent(playerId)}`);
    renderPlayerDetail(body);
    els.searchStatus.textContent = `Loaded ${body.player_name || playerId}.`;
    syncDeepLink({ replace: !pushHistory });
  } catch (error) {
    els.searchStatus.textContent = error.message;
  }
}

async function doSearch() {
  const query = els.searchInput.value.trim();
  if (!query) {
    els.searchStatus.textContent = "Enter a player name to start.";
    return;
  }
  els.searchStatus.textContent = `Searching for ${query}...`;
  try {
    const body = await requestJson(`/api/comps/search?query=${encodeURIComponent(query)}`);
    renderSearchResults(body);
    els.searchStatus.textContent = body.count ? `Found ${body.count} match(es).` : "No matches found.";
    if (body.matches && body.matches.length) {
      loadPlayer(body.matches[0].player_id, { pushHistory: false });
    } else {
      currentPlayer = null;
      updateBrowserTitle("");
      syncDeepLink({ replace: true });
    }
    syncDeepLink({ replace: true });
  } catch (error) {
    els.searchStatus.textContent = error.message;
  }
}

async function goToStripe() {
  try {
    const body = await requestJson("/api/stripe/checkout", {
      method: "POST",
    });
    if (body.checkout_url) {
      window.location.href = body.checkout_url;
    }
  } catch (error) {
    els.accessStatus.textContent = error.message;
  }
}

async function refreshEntitlement() {
  try {
    const body = await requestJson("/api/me/status");
    renderAccessStatus(body);
  } catch (error) {
    els.accessStatus.textContent = error.message;
  }
}

function resetFilters() {
  setFilterState({ position: "", era: "", minSimilarity: 0 });
  if (currentSearchMatches.length) {
    renderSearchResults({ matches: currentSearchMatches, entitled: currentEntitled });
  }
  if (currentPlayer) {
    renderPlayerDetail(currentPlayer);
  }
  syncDeepLink({ replace: true });
}

function applyUrlState() {
  const url = new URL(window.location.href);
  setFilterState({
    position: url.searchParams.get("position") || "",
    era: url.searchParams.get("era") || "",
    minSimilarity: url.searchParams.get("min_similarity") || 0,
  });
  const query = url.searchParams.get("q") || "";
  const player = url.searchParams.get("player") || "";
  if (query) {
    els.searchInput.value = query;
  }
  return { query, player };
}

els.searchButton.addEventListener("click", doSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    doSearch();
  }
});
els.subscribeButton.addEventListener("click", goToStripe);
if (els.refreshButton) {
  els.refreshButton.addEventListener("click", refreshEntitlement);
}
els.positionFilter.addEventListener("change", () => {
  if (currentSearchMatches.length) {
    renderSearchResults({ matches: currentSearchMatches, entitled: currentEntitled });
  }
  if (currentPlayer) {
    renderPlayerDetail(currentPlayer);
  }
  syncDeepLink({ replace: true });
});
els.eraFilter.addEventListener("change", () => {
  if (currentSearchMatches.length) {
    renderSearchResults({ matches: currentSearchMatches, entitled: currentEntitled });
  }
  if (currentPlayer) {
    renderPlayerDetail(currentPlayer);
  }
  syncDeepLink({ replace: true });
});
els.similarityFilter.addEventListener("input", () => {
  if (currentSearchMatches.length) {
    renderSearchResults({ matches: currentSearchMatches, entitled: currentEntitled });
  }
  if (currentPlayer) {
    renderPlayerDetail(currentPlayer);
  }
  syncDeepLink({ replace: true });
});
els.resetFilters.addEventListener("click", resetFilters);

window.addEventListener("popstate", () => {
  const { query, player } = applyUrlState();
  if (query && els.searchInput.value.trim() !== query) {
    els.searchInput.value = query;
    doSearch();
    return;
  }
  if (player) {
    loadPlayer(player);
  }
});

const initialState = applyUrlState();
refreshEntitlement().then(() => {
  if (initialState.query) {
    doSearch().then(() => {
      if (initialState.player) {
        loadPlayer(initialState.player);
      }
    });
    return;
  }
  if (initialState.player) {
    loadPlayer(initialState.player);
  }
});
