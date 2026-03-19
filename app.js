// ============================================================
// app.js — UI layer for Vanguard Vault
// Reads all data through CardDataService, never from globals.
// ============================================================

// === DOM REFS ===
const grid = document.getElementById("cardGrid");
const searchInput = document.getElementById("searchInput");
const filterBar = document.querySelector(".filter-bar");
const addCardBtn = document.getElementById("addCardBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const addCardForm = document.getElementById("addCardForm");
const refreshBtn = document.getElementById("refreshBtn");
const statusSource = document.getElementById("statusSource");
const statusUpdated = document.getElementById("statusUpdated");
const statusError = document.getElementById("statusError");
const providerSelect = document.getElementById("providerSelect");

// === HELPERS ===

function generatePlayerKey(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

function findPlayerByFullName(fullName) {
    const lower = fullName.trim().toLowerCase();
    const players = CardDataService.getPlayers();
    for (const [key, info] of Object.entries(players)) {
        if (info.full.toLowerCase() === lower) return key;
    }
    return null;
}

async function fetchEspnId(fullName) {
    // Try v2 search (includes retired players)
    try {
        const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(fullName)}&limit=1&page=1&type=player&sport=football&league=nfl`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            for (const group of (data.results || [])) {
                for (const item of (group.contents || [])) {
                    if (item.uid) {
                        const match = item.uid.match(/~a:(\d+)/);
                        if (match) return parseInt(match[1]);
                    }
                    if (item.id && /^\d+$/.test(item.id)) return parseInt(item.id);
                }
            }
        }
    } catch (e) { /* try fallback */ }

    // Fallback to v3 (active players only)
    try {
        const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(fullName)}&limit=1&type=player&sport=football`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) return parseInt(data.items[0].id);
        }
    } catch (e) { /* no photo */ }

    return null;
}

function parsePct(pct) {
    if (!pct) return { dir: "", num: 0, display: "—" };
    const clean = pct.replace(/\s/g, "");
    const up = clean.includes("U");
    const down = clean.includes("D");
    const dir = up ? "up" : down ? "down" : "";
    const arrow = up ? "▲" : down ? "▼" : "";
    return { dir, display: `${arrow} ${clean.replace("U","").replace("D","").trim()}` };
}

function groupByPlayer(cards) {
    const groups = {};
    const order = [];
    cards.forEach(c => {
        if (!groups[c.player]) {
            groups[c.player] = [];
            order.push(c.player);
        }
        groups[c.player].push(c);
    });
    return { groups, order };
}

// === STATUS BAR ===

function updateStatusBar(status) {
    statusSource.textContent = status.source;

    if (status.lastUpdated) {
        statusUpdated.textContent = `Updated ${status.lastUpdated.toLocaleTimeString()}`;
    }

    if (status.error) {
        statusError.textContent = status.error;
        statusError.style.display = "";
    } else {
        statusError.textContent = "";
        statusError.style.display = "none";
    }

    if (status.loading) {
        refreshBtn.classList.add("spinning");
    } else {
        refreshBtn.classList.remove("spinning");
    }
}

// === RENDER ===

function render(filter = "all", search = "") {
    const status = CardDataService.getStatus();

    // Loading state
    if (status.loading) {
        grid.innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Loading cards...</div>';
        return;
    }

    let filtered = CardDataService.getCards();

    if (filter !== "all") {
        filtered = filtered.filter(c => c.player === filter);
    }

    if (search) {
        const s = search.toLowerCase();
        const players = CardDataService.getPlayers();
        filtered = filtered.filter(c => {
            const p = players[c.player];
            const full = p ? p.full.toLowerCase() : "";
            const team = p ? p.team.toLowerCase() : "";
            return c.player.toLowerCase().includes(s) ||
                   full.includes(s) ||
                   team.includes(s) ||
                   c.product.toLowerCase().includes(s) ||
                   String(c.year).includes(s);
        });
    }

    const { groups, order } = groupByPlayer(filtered);

    // Empty state
    if (order.length === 0) {
        grid.innerHTML = '<div class="no-results">No cards found.</div>';
        return;
    }

    let html = "";

    order.forEach(playerKey => {
        const cards = groups[playerKey];
        const info = CardDataService.getPlayerInfo(playerKey) || { full: playerKey, team: "" };
        const imgUrl = CardDataService.getPlayerImage(playerKey);
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(info.full)}&background=1e293b&color=d4a843&size=120&bold=true&font-size=0.4`;

        const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);

        html += `<section class="player-section" data-player="${playerKey}">`;
        html += `<div class="player-header">`;
        if (imgUrl) {
            html += `<img class="player-photo" src="${imgUrl}" alt="${info.full}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackUrl}'">`;
        } else {
            html += `<img class="player-photo" src="${fallbackUrl}" alt="${info.full}" loading="lazy">`;
        }
        html += `<div class="player-info">`;
        html += `<h2>${info.full}</h2>`;
        html += `<span class="team">${info.team}</span>`;
        html += `</div>`;
        html += `<div style="margin-left:auto; text-align:right;">`;
        html += `<div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Portfolio Value</div>`;
        html += `<div style="font-size:1.2rem;font-weight:700;color:var(--accent-gold);">$${totalValue.toLocaleString()}</div>`;
        html += `</div>`;
        html += `</div>`;

        html += `<table class="card-table">`;
        html += `<thead><tr>
            <th>Year</th>
            <th>Product</th>
            <th>PSA</th>
            <th>Alt Value</th>
            <th>Alt %</th>
            <th>6-Mo Range</th>
        </tr></thead>`;
        html += `<tbody>`;

        cards.forEach(c => {
            const pct = parsePct(c.pct);
            const psaClass = `psa-${c.psa}`;
            html += `<tr>`;
            html += `<td class="year">${c.year}</td>`;
            html += `<td class="product">${c.product || "—"}</td>`;
            html += `<td class="psa ${psaClass}">${c.psa}</td>`;
            html += `<td class="value">$${c.value}</td>`;
            html += `<td class="pct ${pct.dir === 'up' ? 'pct-up' : pct.dir === 'down' ? 'pct-down' : ''}">${pct.display}</td>`;
            html += `<td class="range">${c.range ? "$" + c.range : "—"}</td>`;
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        html += `</section>`;
    });

    grid.innerHTML = html;
}

// === FILTER BUTTONS ===

function buildFilters() {
    filterBar.innerHTML = '<button class="filter-btn active" data-filter="all">All Players</button>';

    const seen = new Set();
    const players = CardDataService.getPlayers();
    CardDataService.getCards().forEach(c => {
        if (!seen.has(c.player)) {
            seen.add(c.player);
            const info = players[c.player] || { full: c.player };
            const btn = document.createElement("button");
            btn.className = "filter-btn";
            btn.dataset.filter = c.player;
            btn.textContent = info.full;
            filterBar.appendChild(btn);
        }
    });
}

// === PLAYER DATALIST ===

function populatePlayerList() {
    const datalist = document.getElementById("playerList");
    datalist.innerHTML = "";
    const seen = new Set();
    for (const info of Object.values(CardDataService.getPlayers())) {
        if (!seen.has(info.full)) {
            seen.add(info.full);
            const opt = document.createElement("option");
            opt.value = info.full;
            datalist.appendChild(opt);
        }
    }
}

// === MODAL ===

addCardBtn.addEventListener("click", () => {
    populatePlayerList();
    document.getElementById("formFullName").value = "";
    document.getElementById("formTeam").value = "";
    document.getElementById("formProduct").value = "";
    document.getElementById("formValue").value = "";
    document.getElementById("formPct").value = "";
    document.getElementById("formPctDir").value = "";
    document.getElementById("formRange").value = "";
    document.getElementById("formYear").value = "2025";
    modalOverlay.classList.add("active");
});

modalClose.addEventListener("click", () => modalOverlay.classList.remove("active"));
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("active");
});

document.getElementById("formFullName").addEventListener("input", function() {
    const existingKey = findPlayerByFullName(this.value);
    if (existingKey) {
        document.getElementById("formTeam").value = CardDataService.getPlayerInfo(existingKey).team;
    }
});

// === FORM SUBMISSION ===

addCardForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("formFullName").value.trim();
    const team = document.getElementById("formTeam").value.trim();
    const year = parseInt(document.getElementById("formYear").value);
    const product = document.getElementById("formProduct").value.trim();
    const psa = parseInt(document.getElementById("formPSA").value);
    const value = parseInt(document.getElementById("formValue").value);
    const pctVal = document.getElementById("formPct").value.trim();
    const pctDir = document.getElementById("formPctDir").value;
    const range = document.getElementById("formRange").value.trim();

    if (!fullName) return;

    const pct = pctVal ? `${pctVal} ${pctDir}`.trim() : "";

    let playerKey = findPlayerByFullName(fullName);
    let newPlayerData = null;

    if (!playerKey) {
        playerKey = generatePlayerKey(fullName);
        let baseKey = playerKey;
        let counter = 2;
        const players = CardDataService.getPlayers();
        while (players[playerKey]) {
            playerKey = `${baseKey} ${counter}`;
            counter++;
        }

        const submitBtn = addCardForm.querySelector(".form-submit");
        const origText = submitBtn.textContent;
        submitBtn.textContent = "Looking up player...";
        submitBtn.disabled = true;

        const espnId = await fetchEspnId(fullName);

        submitBtn.textContent = origText;
        submitBtn.disabled = false;

        newPlayerData = { full: fullName, team: team || "Unknown", espnId };
    }

    const card = { year, player: playerKey, product, psa, value, pct, range };

    await CardDataService.addCard(card, playerKey, newPlayerData);

    modalOverlay.classList.remove("active");
    buildFilters();
    render("all", searchInput.value);
});

// === EVENT LISTENERS ===

filterBar.addEventListener("click", e => {
    if (!e.target.classList.contains("filter-btn")) return;
    filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    render(e.target.dataset.filter, searchInput.value);
});

searchInput.addEventListener("input", () => {
    filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    filterBar.querySelector('[data-filter="all"]').classList.add("active");
    render("all", searchInput.value);
});

refreshBtn.addEventListener("click", async () => {
    await CardDataService.refresh();
    buildFilters();
    render("all", searchInput.value);
});

// === PROVIDER SELECTOR ===
const PROVIDERS = { local: LocalProvider, mock: MockProvider, alt: AltProvider };

providerSelect.addEventListener("change", async () => {
    const key = providerSelect.value;
    const provider = PROVIDERS[key];
    CardDataService.setProvider(provider);
    await CardDataService.load();
    buildFilters();
    render("all", searchInput.value);
});

// === SUBSCRIBE TO DATA CHANGES ===
CardDataService.onChange(updateStatusBar);

// === INIT ===
(async () => {
    await CardDataService.load();
    buildFilters();
    render();
})();
