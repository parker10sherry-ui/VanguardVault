// ============================================================
// cardDataService.js — Central data layer for Vanguard Vault
//
// The UI reads all data through this service.
// Swap providers here to change where data comes from.
// ============================================================

const CardDataService = (() => {
    // --- State ---
    let _cards = [];
    let _players = {};
    let _status = {
        source: "Local",
        lastUpdated: null,
        loading: false,
        error: null
    };
    let _listeners = [];

    // --- Active providers ---
    // Primary: where card/pricing data comes from
    // LocalProvider is always used for manual saves
    //
    // To switch to mock data:  _primaryProvider = MockProvider;
    // To switch to live Alt:   _primaryProvider = AltProvider;
    let _primaryProvider = LocalProvider;

    // --- Event system (UI subscribes to data changes) ---
    function onChange(fn) {
        _listeners.push(fn);
        return () => { _listeners = _listeners.filter(f => f !== fn); };
    }

    function _notify() {
        _listeners.forEach(fn => fn(_status));
    }

    // --- Core API ---

    async function load() {
        _status.loading = true;
        _status.error = null;
        _notify();

        try {
            const [cards, players] = await Promise.all([
                _primaryProvider.fetchCards(),
                _primaryProvider.fetchPlayers()
            ]);

            _cards = cards;
            _players = players;

            // If primary is remote (Alt/Mock), also merge localStorage manual entries
            if (_primaryProvider !== LocalProvider) {
                try {
                    const saved = localStorage.getItem("vanguardVault_userCards");
                    if (saved) _cards.push(...JSON.parse(saved));
                    const savedP = localStorage.getItem("vanguardVault_userPlayers");
                    if (savedP) Object.assign(_players, JSON.parse(savedP));
                } catch (e) { /* ignore */ }
            }

            _status.source = _primaryProvider.name;
            _status.lastUpdated = new Date();
            _status.loading = false;
            _status.error = null;
        } catch (err) {
            // On error, fall back to local data so the site isn't blank
            console.warn(`Provider "${_primaryProvider.name}" failed:`, err.message);

            try {
                const [cards, players] = await Promise.all([
                    LocalProvider.fetchCards(),
                    LocalProvider.fetchPlayers()
                ]);
                _cards = cards;
                _players = players;
                _status.source = "Local (fallback)";
                _status.lastUpdated = new Date();
            } catch (fallbackErr) {
                _cards = [];
                _players = {};
            }

            _status.loading = false;
            _status.error = `${_primaryProvider.name}: ${err.message}`;
        }

        _notify();
    }

    async function refresh() {
        return load();
    }

    function getCards() {
        return _cards;
    }

    function getPlayers() {
        return _players;
    }

    function getPlayerInfo(key) {
        return _players[key] || null;
    }

    function getStatus() {
        return { ..._status };
    }

    async function addCard(card, playerKey, playerData) {
        // Always save manual entries to localStorage
        await LocalProvider.saveCard(card, playerKey, playerData);

        // Update in-memory state
        _cards.push(card);
        if (playerData) {
            _players[playerKey] = playerData;
        }

        _notify();
    }

    function setProvider(provider) {
        _primaryProvider = provider;
    }

    function getPlayerImage(shortName) {
        const p = _players[shortName];
        if (!p) return "";
        if (p.espnId) {
            return `https://a.espncdn.com/i/headshots/nfl/players/full/${p.espnId}.png`;
        }
        return "";
    }

    // --- Public API ---
    return {
        load,
        refresh,
        getCards,
        getPlayers,
        getPlayerInfo,
        getPlayerImage,
        getStatus,
        addCard,
        setProvider,
        onChange
    };
})();
