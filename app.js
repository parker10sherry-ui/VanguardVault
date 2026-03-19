// === DOM REFS ===
const grid = document.getElementById("cardGrid");
const toggleH = document.getElementById("toggleH");
const searchInput = document.getElementById("searchInput");
const filterBar = document.querySelector(".filter-bar");

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

// === FORMAT PURCHASE INFO ===
function formatPurchase(raw) {
    if (!raw) return "";
    // Highlight tags: A, BN, BO, FP, BD
    let html = raw
        .replace(/\bA\b/g, '<span class="purchase-tag tag-A">A</span>')
        .replace(/\bBN\b/g, '<span class="purchase-tag tag-BN">BN</span>')
        .replace(/\bBO\b/g, '<span class="purchase-tag tag-BO">BO</span>')
        .replace(/\bFP\b/g, '<span class="purchase-tag tag-FP">FP</span>')
        .replace(/\bBD\b/g, '<span class="purchase-tag tag-BD">BD</span>');
    return html;
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

        // Calculate total value for this player
        const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);

        html += `<section class="player-section" data-player="${playerKey}">`;
        html += `<div class="player-header">`;
        html += `<img class="player-photo" src="${imgUrl}" alt="${info.full}" loading="lazy">`;
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
            <th class="col-h">Purchase Info</th>
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
            html += `<td class="col-h">${formatPurchase(c.purchase) || "—"}</td>`;
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

// === EVENT LISTENERS ===
toggleH.addEventListener("change", () => {
    document.body.classList.toggle("show-h", toggleH.checked);
});

filterBar.addEventListener("click", e => {
    if (!e.target.classList.contains("filter-btn")) return;
    filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    const filter = e.target.dataset.filter;
    render(filter, searchInput.value);
});

searchInput.addEventListener("input", () => {
    // Reset filter to "all" when searching
    filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    filterBar.querySelector('[data-filter="all"]').classList.add("active");
    render("all", searchInput.value);
});

// === INIT ===
buildFilters();
render();
