// === DOM REFS ===
const grid = document.getElementById("cardGrid");
const searchInput = document.getElementById("searchInput");
const filterBar = document.querySelector(".filter-bar");
const addCardBtn = document.getElementById("addCardBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const addCardForm = document.getElementById("addCardForm");

// === GENERATE SHORT KEY FROM FULL NAME ===
// "Peyton Manning" → "P. Manning", "Jaxon Smith-Njigba" → "J. Smith-Njigba"
function generatePlayerKey(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const first = parts[0][0] + ".";
    const rest = parts.slice(1).join(" ");
    return `${first} ${rest}`;
}

// === FIND EXISTING PLAYER BY FULL NAME ===
function findPlayerByFullName(fullName) {
    const lower = fullName.trim().toLowerCase();
    for (const [key, info] of Object.entries(PLAYERS)) {
        if (info.full.toLowerCase() === lower) return key;
    }
    return null;
}

// === FETCH ESPN ID FOR A NEW PLAYER ===
async function fetchEspnId(fullName) {
    // Try v2 search first (includes retired players)
    try {
        const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(fullName)}&limit=1&page=1&type=player&sport=football&league=nfl`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            // v2 returns results nested under data.results or similar
            const results = data.results || [];
            for (const group of results) {
                const items = group.contents || group.items || [];
                for (const item of items) {
                    // Extract numeric ID from uid like "s:20~l:28~a:1428"
                    if (item.uid) {
                        const match = item.uid.match(/~a:(\d+)/);
                        if (match) return parseInt(match[1]);
                    }
                    // Fallback: use id if it's purely numeric
                    if (item.id && /^\d+$/.test(item.id)) return parseInt(item.id);
                }
            }
        }
    } catch (e) { /* try fallback */ }

    // Fallback to v3 search (active players only)
    try {
        const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(fullName)}&limit=1&type=player&sport=football`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                return parseInt(data.items[0].id);
            }
        }
    } catch (e) { /* silently fall back to no photo */ }

    return null;
}

// === LOAD USER-ADDED CARDS FROM LOCALSTORAGE ===
function loadUserCards() {
    try {
        const saved = localStorage.getItem("vanguardVault_userCards");
        if (saved) {
            const userCards = JSON.parse(saved);
            userCards.forEach(c => CARDS.push(c));
        }
        const savedPlayers = localStorage.getItem("vanguardVault_userPlayers");
        if (savedPlayers) {
            const userPlayers = JSON.parse(savedPlayers);
            Object.assign(PLAYERS, userPlayers);
        }
    } catch (e) { /* ignore parse errors */ }
}

function saveUserCard(card, playerKey, playerData) {
    try {
        const saved = localStorage.getItem("vanguardVault_userCards");
        const userCards = saved ? JSON.parse(saved) : [];
        userCards.push(card);
        localStorage.setItem("vanguardVault_userCards", JSON.stringify(userCards));

        if (playerData) {
            const savedPlayers = localStorage.getItem("vanguardVault_userPlayers");
            const userPlayers = savedPlayers ? JSON.parse(savedPlayers) : {};
            userPlayers[playerKey] = playerData;
            localStorage.setItem("vanguardVault_userPlayers", JSON.stringify(userPlayers));
        }
    } catch (e) { /* ignore storage errors */ }
}

// === GROUP CARDS BY PLAYER ===
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

// === PARSE PERCENTAGE ===
function parsePct(pct) {
    if (!pct) return { dir: "", num: 0, display: "—" };
    const clean = pct.replace(/\s/g, "");
    const up = clean.includes("U");
    const down = clean.includes("D");
    const num = parseFloat(clean) || 0;
    const dir = up ? "up" : down ? "down" : "";
    const arrow = up ? "▲" : down ? "▼" : "";
    return { dir, num, display: `${arrow} ${clean.replace("U","").replace("D","").trim()}` };
}

// === RENDER ===
function render(filter = "all", search = "") {
    let filtered = CARDS;

    if (filter !== "all") {
        filtered = filtered.filter(c => c.player === filter);
    }

    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(c => {
            const p = PLAYERS[c.player];
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

    if (order.length === 0) {
        grid.innerHTML = '<div class="no-results">No cards found.</div>';
        return;
    }

    let html = "";

    order.forEach(playerKey => {
        const cards = groups[playerKey];
        const info = PLAYERS[playerKey] || { full: playerKey, team: "" };
        const imgUrl = getPlayerImage(playerKey);
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

// === BUILD FILTER BUTTONS ===
function buildFilters() {
    const seen = new Set();
    const players = [];
    CARDS.forEach(c => {
        if (!seen.has(c.player)) {
            seen.add(c.player);
            const info = PLAYERS[c.player] || { full: c.player };
            players.push({ key: c.player, name: info.full });
        }
    });

    players.forEach(p => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.dataset.filter = p.key;
        btn.textContent = p.name;
        filterBar.appendChild(btn);
    });
}

// === POPULATE PLAYER DATALIST (by full name) ===
function populatePlayerList() {
    const datalist = document.getElementById("playerList");
    datalist.innerHTML = "";
    const seen = new Set();
    for (const info of Object.values(PLAYERS)) {
        if (!seen.has(info.full)) {
            seen.add(info.full);
            const opt = document.createElement("option");
            opt.value = info.full;
            datalist.appendChild(opt);
        }
    }
}

// === MODAL LOGIC ===
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

modalClose.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
});

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("active");
});

// Auto-fill team when selecting an existing player by full name
document.getElementById("formFullName").addEventListener("input", function() {
    const existingKey = findPlayerByFullName(this.value);
    if (existingKey) {
        document.getElementById("formTeam").value = PLAYERS[existingKey].team;
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

    // Check if this player already exists (by full name)
    let playerKey = findPlayerByFullName(fullName);
    let newPlayerData = null;

    if (!playerKey) {
        // New player — generate key and look up ESPN headshot
        playerKey = generatePlayerKey(fullName);

        // Avoid key collisions
        let baseKey = playerKey;
        let counter = 2;
        while (PLAYERS[playerKey]) {
            playerKey = `${baseKey} ${counter}`;
            counter++;
        }

        // Show loading state on button
        const submitBtn = addCardForm.querySelector(".form-submit");
        const origText = submitBtn.textContent;
        submitBtn.textContent = "Looking up player...";
        submitBtn.disabled = true;

        // Fetch ESPN ID for headshot
        const espnId = await fetchEspnId(fullName);

        submitBtn.textContent = origText;
        submitBtn.disabled = false;

        newPlayerData = {
            full: fullName,
            team: team || "Unknown",
            espnId: espnId
        };
        PLAYERS[playerKey] = newPlayerData;
    }

    const card = { year, player: playerKey, product, psa, value, pct, range };

    CARDS.push(card);
    saveUserCard(card, playerKey, newPlayerData);

    // Close modal and re-render
    modalOverlay.classList.remove("active");

    // Rebuild filters in case new player was added
    filterBar.innerHTML = '<button class="filter-btn active" data-filter="all">All Players</button>';
    buildFilters();

    render("all", searchInput.value);
});

// === EVENT LISTENERS ===
filterBar.addEventListener("click", e => {
    if (!e.target.classList.contains("filter-btn")) return;
    filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    const filter = e.target.dataset.filter;
    render(filter, searchInput.value);
});

searchInput.addEventListener("input", () => {
    filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    filterBar.querySelector('[data-filter="all"]').classList.add("active");
    render("all", searchInput.value);
});

// === INIT ===
loadUserCards();
buildFilters();
render();
