// === DOM REFS ===
const grid = document.getElementById("cardGrid");
const searchInput = document.getElementById("searchInput");
const filterBar = document.querySelector(".filter-bar");
const addCardBtn = document.getElementById("addCardBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const addCardForm = document.getElementById("addCardForm");

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

// === GET PLAYER INITIALS FOR FALLBACK ===
function getInitials(fullName) {
    return fullName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
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

        // Calculate total value for this player
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

// === POPULATE PLAYER DATALIST ===
function populatePlayerList() {
    const datalist = document.getElementById("playerList");
    datalist.innerHTML = "";
    const seen = new Set();
    CARDS.forEach(c => {
        if (!seen.has(c.player)) {
            seen.add(c.player);
            const opt = document.createElement("option");
            opt.value = c.player;
            const info = PLAYERS[c.player];
            if (info) opt.label = info.full;
            datalist.appendChild(opt);
        }
    });
}

// === MODAL LOGIC ===
addCardBtn.addEventListener("click", () => {
    populatePlayerList();
    // Auto-fill full name and team when selecting existing player
    const playerInput = document.getElementById("formPlayer");
    playerInput.value = "";
    document.getElementById("formFullName").value = "";
    document.getElementById("formTeam").value = "";
    document.getElementById("formProduct").value = "";
    document.getElementById("formValue").value = "";
    document.getElementById("formPct").value = "";
    document.getElementById("formPctDir").value = "";
    document.getElementById("formRange").value = "";
    modalOverlay.classList.add("active");
});

modalClose.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
});

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("active");
});

// Auto-fill player details when selecting from datalist
document.getElementById("formPlayer").addEventListener("input", function() {
    const info = PLAYERS[this.value];
    if (info) {
        document.getElementById("formFullName").value = info.full;
        document.getElementById("formTeam").value = info.team;
    }
});

// === FORM SUBMISSION ===
addCardForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const playerKey = document.getElementById("formPlayer").value.trim();
    const fullName = document.getElementById("formFullName").value.trim();
    const team = document.getElementById("formTeam").value.trim();
    const year = parseInt(document.getElementById("formYear").value);
    const product = document.getElementById("formProduct").value.trim();
    const psa = parseInt(document.getElementById("formPSA").value);
    const value = parseInt(document.getElementById("formValue").value);
    const pctVal = document.getElementById("formPct").value.trim();
    const pctDir = document.getElementById("formPctDir").value;
    const range = document.getElementById("formRange").value.trim();

    const pct = pctVal ? `${pctVal} ${pctDir}`.trim() : "";

    const card = { year, player: playerKey, product, psa, value, pct, range };

    // If this is a new player, add to PLAYERS
    let newPlayerData = null;
    if (!PLAYERS[playerKey] && fullName) {
        newPlayerData = { full: fullName, team: team || "Unknown" };
        PLAYERS[playerKey] = newPlayerData;
    }

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
