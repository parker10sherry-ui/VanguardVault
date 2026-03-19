// ============================================================
// providers.js — Data providers for Vanguard Vault
// Each provider implements: { name, canSave, fetchCards(), fetchPlayers(), saveCard() }
// ============================================================

// === LOCAL PROVIDER ===
// Merges hardcoded seed data (SEED_CARDS/SEED_PLAYERS) with localStorage additions.
// This is the current behavior, preserved exactly.
const LocalProvider = {
    name: "Local",
    canSave: true,

    async fetchPlayers() {
        const players = Object.assign({}, SEED_PLAYERS);
        try {
            const saved = localStorage.getItem("vanguardVault_userPlayers");
            if (saved) Object.assign(players, JSON.parse(saved));
        } catch (e) { /* ignore */ }
        return players;
    },

    async fetchCards() {
        const cards = [...SEED_CARDS];
        try {
            const saved = localStorage.getItem("vanguardVault_userCards");
            if (saved) cards.push(...JSON.parse(saved));
        } catch (e) { /* ignore */ }
        return cards;
    },

    async saveCard(card, playerKey, playerData) {
        try {
            const saved = localStorage.getItem("vanguardVault_userCards");
            const userCards = saved ? JSON.parse(saved) : [];
            userCards.push(card);
            localStorage.setItem("vanguardVault_userCards", JSON.stringify(userCards));

            if (playerData) {
                const savedP = localStorage.getItem("vanguardVault_userPlayers");
                const userPlayers = savedP ? JSON.parse(savedP) : {};
                userPlayers[playerKey] = playerData;
                localStorage.setItem("vanguardVault_userPlayers", JSON.stringify(userPlayers));
            }
        } catch (e) {
            throw new Error("Failed to save to localStorage");
        }
    }
};

// === MOCK PROVIDER ===
// Simulates an external API (like Alt) returning pricing updates.
// Use this to test the full data pipeline without real credentials.
// Swap to AltProvider later with one line change in cardDataService.
const MockProvider = {
    name: "Mock (Alt Simulation)",
    canSave: false,

    async fetchPlayers() {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));
        // Return seed players with a few simulated updates
        return Object.assign({}, SEED_PLAYERS);
    },

    async fetchCards() {
        await new Promise(r => setTimeout(r, 800));

        // Simulate Alt-like price updates with realistic variance
        return SEED_CARDS.map(card => {
            // Higher-value cards get smaller swings, low-value cards swing more
            const volatility = card.value > 500 ? 0.04 : card.value > 100 ? 0.08 : 0.15;
            const fluctuation = 1 + (Math.random() * 2 - 1) * volatility;
            const newValue = Math.max(1, Math.round(card.value * fluctuation));
            const delta = ((newValue - card.value) / card.value * 100).toFixed(1);
            const dir = newValue >= card.value ? "U" : "D";

            // Simulate a 6-month range based on the value
            const lo = Math.round(newValue * (0.7 + Math.random() * 0.15));
            const hi = Math.round(newValue * (1.1 + Math.random() * 0.2));

            return {
                ...card,
                value: newValue,
                pct: `${Math.abs(delta)}% ${dir}`,
                range: `${lo}-${hi}`,
                _source: "mock",
                _updatedAt: new Date().toISOString()
            };
        });
    },

    async saveCard() {
        throw new Error("MockProvider is read-only. Cards are saved via LocalProvider.");
    }
};

// === ALT PROVIDER (STUB) ===
// This provider will connect to Alt's API for live card pricing.
// It is intentionally incomplete — fill in the TODOs when you have Alt credentials.
const AltProvider = {
    name: "Alt",
    canSave: false,

    // -------------------------------------------------------
    // TODO: Replace with your real Alt API credentials
    // -------------------------------------------------------
    _config: {
        // baseUrl: "https://api.alt.xyz/v1",      // TODO: Confirm Alt's base URL
        // apiKey: "",                               // TODO: Your Alt API key
        // portfolioId: "",                          // TODO: Your Alt portfolio ID (if applicable)
    },

    async fetchPlayers() {
        // Alt doesn't manage players — always merge from local seed data
        return Object.assign({}, SEED_PLAYERS);
    },

    async fetchCards() {
        // -------------------------------------------------------
        // TODO: Implement Alt API call
        // -------------------------------------------------------
        // Example structure (adjust to match Alt's actual response):
        //
        // const res = await fetch(`${this._config.baseUrl}/portfolio/${this._config.portfolioId}/cards`, {
        //     headers: {
        //         "Authorization": `Bearer ${this._config.apiKey}`,
        //         "Content-Type": "application/json"
        //     }
        // });
        //
        // if (!res.ok) throw new Error(`Alt API error: ${res.status}`);
        // const altData = await res.json();
        //
        // return altData.cards.map(altCard => this._mapAltCard(altCard));
        // -------------------------------------------------------

        throw new Error(
            "AltProvider is not configured. " +
            "Add your Alt API key and endpoint in providers.js, then update _mapAltCard()."
        );
    },

    // -------------------------------------------------------
    // TODO: Map Alt's response format → Vanguard Vault card format
    // -------------------------------------------------------
    // Alt's API will return cards in their own schema.
    // This function converts each Alt card to our internal format:
    //   { year, player, product, psa, value, pct, range }
    //
    // _mapAltCard(altCard) {
    //     return {
    //         year:    altCard.year         || 2025,
    //         player:  altCard.player_key   || "",       // must match a key in SEED_PLAYERS
    //         product: altCard.card_name    || "",
    //         psa:     altCard.grade        || 10,
    //         value:   altCard.market_value || 0,
    //         pct:     altCard.pct_change   || "",       // format: "15% U" or "10% D"
    //         range:   altCard.six_mo_range || "",       // format: "45-108"
    //         _source: "alt",
    //         _updatedAt: altCard.updated_at || new Date().toISOString()
    //     };
    // },

    async saveCard() {
        throw new Error("AltProvider is read-only. Use LocalProvider for manual entries.");
    }
};
