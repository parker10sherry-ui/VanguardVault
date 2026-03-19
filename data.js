const PLAYERS = {
    "S. Sanders":    { full: "Shedeur Sanders",      team: "Cleveland Browns",              espnId: 4432682 },
    "J. Dart":       { full: "Jaxson Dart",           team: "New York Giants",               espnId: 4432762 },
    "C. Ward":       { full: "Cam Ward",              team: "Tennessee Titans",              espnId: 4686474 },
    "T. Shough":     { full: "Tyler Shough",          team: "New Orleans Saints",            espnId: 4361411 },
    "D. Gabriel":    { full: "Dillon Gabriel",        team: "Cleveland Browns",              espnId: 4431611 },
    "W. Howard":     { full: "Will Howard",           team: "Pittsburgh Steelers",           espnId: 4432080 },
    "T. Warren":     { full: "Tyler Warren",          team: "Indianapolis Colts",            espnId: 4567400 },
    "C. Loveland":   { full: "Colston Loveland",      team: "Chicago Bears",                 espnId: 4567564 },
    "T. McMillan":   { full: "Tetairoa McMillan",     team: "Carolina Panthers",             espnId: 4567048 },
    "E. Ayomanor":   { full: "Elic Ayomanor",         team: "Tennessee Titans",              espnId: 4687668 },
    "E. Egbuka":     { full: "Emeka Egbuka",          team: "Tampa Bay Buccaneers",          espnId: 4431441 },
    "J. Higgens":    { full: "Jayden Higgins",        team: "Houston Texans",                espnId: 4432087 },
    "C. Skattebo":   { full: "Cameron Skattebo",      team: "New York Giants",               espnId: 4569597 },
    "T. Henderson":  { full: "TreVeyon Henderson",    team: "New England Patriots",          espnId: 4567178 },
    "A. Jeanty":     { full: "Ashton Jeanty",         team: "Las Vegas Raiders",             espnId: 4692590 },
    "Q. Judkins":    { full: "Quinshon Judkins",      team: "Cleveland Browns",              espnId: 4567229 },
    "O. Hampton":    { full: "Omarion Hampton",       team: "Los Angeles Chargers",          espnId: 4567505 },
    "K. Johnson":    { full: "Kaleb Johnson",         team: "Pittsburgh Steelers",           espnId: 4567679 },
    "O. Gordon II":  { full: "Ollie Gordon II",       team: "Miami Dolphins",                espnId: 4567246 },
    "JSN":           { full: "Jaxon Smith-Njigba",    team: "Seattle Seahawks",              espnId: 4426354 },
    "G. Wilson":     { full: "Garrett Wilson",        team: "New York Jets",                 espnId: 4360238 },
    "J. Andreeson":  { full: "J. Andreeson",          team: "Unknown",                       espnId: null },
    "J. Chase":      { full: "Ja'Marr Chase",         team: "Cincinnati Bengals",            espnId: 4362628 },
    "T. Kelce":      { full: "Travis Kelce",          team: "Kansas City Chiefs",            espnId: 15847 },
    "M. Brown":      { full: "Marquise Brown",        team: "Kansas City Chiefs",            espnId: 3916387 },
    "J. Reed":       { full: "Jayden Reed",           team: "Green Bay Packers",             espnId: 4361579 },
    "JJ Watt":       { full: "J.J. Watt",             team: "Arizona Cardinals (Retired)",   espnId: 13982 },
    "P. Mahones":    { full: "Patrick Mahomes",       team: "Kansas City Chiefs",            espnId: 3139477 },
    "A. Highsmith":  { full: "Alex Highsmith",        team: "Pittsburgh Steelers",           espnId: 3929843 },
    "J. Hurts":      { full: "Jalen Hurts",           team: "Philadelphia Eagles",           espnId: 4040715 },
    "J. Allen":      { full: "Josh Allen",            team: "Buffalo Bills",                 espnId: 3918298 },
    "D. Maye":       { full: "Drake Maye",            team: "New England Patriots",          espnId: 4567258 },
    "JJ McCarthy":   { full: "J.J. McCarthy",         team: "Minnesota Vikings",             espnId: 4567164 },
    "M. Penix Jr.":  { full: "Michael Penix Jr.",     team: "Atlanta Falcons",               espnId: 4360797 },
    "Bo Nix":        { full: "Bo Nix",                team: "Denver Broncos",                espnId: 4361741 },
    "C. Williams":   { full: "Caleb Williams",        team: "Chicago Bears",                 espnId: 4432577 },
    "J. Burrow":     { full: "Joe Burrow",            team: "Cincinnati Bengals",            espnId: 3915511 },
    "J. Herbert":    { full: "Justin Herbert",        team: "Los Angeles Chargers",          espnId: 4038941 },
    "J. Love":       { full: "Jordan Love",           team: "Green Bay Packers",             espnId: 3916148 },
    "B. Robinson":   { full: "Bijan Robinson",        team: "Atlanta Falcons",               espnId: 4426348 },
    "M. Harrison Jr.": { full: "Marvin Harrison Jr.", team: "Arizona Cardinals",             espnId: 4567199 },
    "M. Nabors":     { full: "Malik Nabers",          team: "New York Giants",               espnId: 4569618 },
    "B. Bowers":     { full: "Brock Bowers",          team: "Las Vegas Raiders",             espnId: 4567537 },
    "R. Odunze":     { full: "Rome Odunze",           team: "Chicago Bears",                 espnId: 4567386 },
    "R. Pearsall":   { full: "Ricky Pearsall",        team: "San Francisco 49ers",           espnId: 4361414 },
    "T. Franklin":   { full: "Troy Franklin",         team: "Denver Broncos",                espnId: 4567063 },
    "X. Worthy":     { full: "Xavier Worthy",         team: "Kansas City Chiefs",            espnId: 4567232 },
};

// Player photo URLs (ESPN NFL headshots)
function getPlayerImage(shortName) {
    const p = PLAYERS[shortName];
    if (!p) return "";
    if (p.espnId) {
        return `https://a.espncdn.com/i/headshots/nfl/players/full/${p.espnId}.png`;
    }
    return "";
}

const CARDS = [
    // === S. Sanders ===
    { year: 2025, player: "S. Sanders", product: "Rev-New Wave", psa: 6, value: 11, pct: "", range: "", purchase: "" },
    { year: 2025, player: "S. Sanders", product: "Rev-New Wave", psa: 7, value: 13, pct: "40% D", range: "", purchase: "" },
    { year: 2025, player: "S. Sanders", product: "Red & Green", psa: 8, value: 9, pct: "47% D", range: "", purchase: "" },
    { year: 2025, player: "S. Sanders", product: "Mosaic Cookies", psa: 8, value: 46, pct: "47% D", range: "", purchase: "200 BN" },
    { year: 2025, player: "S. Sanders", product: "Don. Red Hot", psa: 9, value: 36, pct: "43% D", range: "", purchase: "" },
    { year: 2025, player: "S. Sanders", product: "Mos. RV Green", psa: 10, value: 58, pct: "4% D", range: "", purchase: "104 A 2/1" },
    { year: 2025, player: "S. Sanders", product: "Mos. Green", psa: 10, value: 65, pct: "42% D", range: "", purchase: "70 BO 2/10" },
    { year: 2025, player: "S. Sanders", product: "Don. Elite Ser.", psa: 9, value: 14, pct: "51% D", range: "", purchase: "14/15 A 3/10-2/7" },

    // === J. Dart ===
    { year: 2025, player: "J. Dart", product: "Don. Press Purple", psa: 7, value: 15, pct: "122% U", range: "", purchase: "" },
    { year: 2025, player: "J. Dart", product: "Don. Grid King", psa: 8, value: 15, pct: "116% U", range: "", purchase: "17 & 19" },
    { year: 2025, player: "J. Dart", product: "Mo. Red/WH", psa: 8, value: 52, pct: "169% U", range: "", purchase: "75/60 BO" },
    { year: 2025, player: "J. Dart", product: "Don. RR Retro", psa: 9, value: 40, pct: "162% U", range: "", purchase: "46 A 3/6" },
    { year: 2025, player: "J. Dart", product: "Don. Wh Hot", psa: 9, value: 31, pct: "127% U", range: "", purchase: "78A 40BN 30A 1/28, 3/1" },
    { year: 2025, player: "J. Dart", product: "Don. Elite Ser.", psa: 9, value: 28, pct: "103% U", range: "", purchase: "33A 20BO 40 BO 3/13, 3/16, 3/13" },
    { year: 2025, player: "J. Dart", product: "Ab. Red/GR", psa: 9, value: 20, pct: "116% U", range: "", purchase: "" },
    { year: 2025, player: "J. Dart", product: "Don. Rookies", psa: 9, value: 32, pct: "158% U", range: "", purchase: "30A 40BO 3/8, 3/10" },
    { year: 2025, player: "J. Dart", product: "Don. Throwback", psa: 9, value: 22, pct: "148% U", range: "", purchase: "42A" },
    { year: 2025, player: "J. Dart", product: "Don. Elite Ser.", psa: 9, value: 22, pct: "148% U", range: "", purchase: "" },
    { year: 2025, player: "J. Dart", product: "Don. RR Retro", psa: 9, value: 22, pct: "148% U", range: "", purchase: "" },
    { year: 2025, player: "J. Dart", product: "Bombsquad", psa: 9, value: 44, pct: "142% U", range: "", purchase: "59 Ebay 3/15" },
    { year: 2025, player: "J. Dart", product: "Mos. Green", psa: 9, value: 58, pct: "148% U", range: "", purchase: "95BO 2/22" },
    { year: 2025, player: "J. Dart", product: "Don. Rookies", psa: 10, value: 112, pct: "143% U", range: "", purchase: "106A 143A 3/2, 2/25" },
    { year: 2025, player: "J. Dart", product: "Bombsquad", psa: 10, value: 152, pct: "102% U", range: "", purchase: "" },
    { year: 2025, player: "J. Dart", product: "Don. Throwback", psa: 10, value: 105, pct: "180% U", range: "", purchase: "115A 94A 3/13, 3/12" },

    // === C. Ward ===
    { year: 2025, player: "C. Ward", product: "Ab. Rookie Wave", psa: 8, value: 12, pct: "17% U", range: "", purchase: "" },
    { year: 2025, player: "C. Ward", product: "Ab. R & GR", psa: 9, value: 12, pct: "23% U", range: "", purchase: "" },
    { year: 2025, player: "C. Ward", product: "Rev. New Wave", psa: 9, value: 28, pct: "21% U", range: "", purchase: "" },
    { year: 2025, player: "C. Ward", product: "Rev. Red Cosmo", psa: 9, value: 31, pct: "17.4% U", range: "28-42", purchase: "" },

    // === T. Shough ===
    { year: 2025, player: "T. Shough", product: "Bombsquad", psa: 10, value: 64, pct: "170% U", range: "", purchase: "78A 80BN 2/28" },

    // === D. Gabriel ===
    { year: 2025, player: "D. Gabriel", product: "Mos. Silver", psa: 10, value: 25, pct: "13% D", range: "17-36", purchase: "" },
    { year: 2025, player: "D. Gabriel", product: "Grid Kings", psa: 9, value: 11, pct: "3% D", range: "8-16", purchase: "10 3/14" },

    // === W. Howard ===
    { year: 2025, player: "W. Howard", product: "Rev. New Wave", psa: 8, value: 14, pct: "21% U", range: "8-25", purchase: "" },
    { year: 2025, player: "W. Howard", product: "Don. Elite Explo.", psa: 8, value: 14, pct: "16% U", range: "9-23", purchase: "" },
    { year: 2025, player: "W. Howard", product: "Don. Rookies", psa: 9, value: 19, pct: "23% U", range: "13-29", purchase: "" },
    { year: 2025, player: "W. Howard", product: "Don. Throwback", psa: 9, value: 20, pct: "23% U", range: "13-33", purchase: "" },
    { year: 2025, player: "W. Howard", product: "Don. Retro Auto", psa: 9, value: 86, pct: "22% U", range: "54-137", purchase: "28/99" },
    { year: 2025, player: "W. Howard", product: "Bombsquad Auto", psa: 9, value: 177, pct: "7% U", range: "130-241", purchase: "145BO 38/75" },

    // === T. Warren ===
    { year: 2025, player: "T. Warren", product: "Mos. (S)", psa: 10, value: 43, pct: "9% U", range: "31-61", purchase: "100FP Ebay" },
    { year: 2025, player: "T. Warren", product: "Mos. Red/Wh", psa: 10, value: 70, pct: "14% U", range: "57-85", purchase: "75A 71A 3/5, 2/19" },
    { year: 2025, player: "T. Warren", product: "Don. Wh. Hot", psa: 9, value: 18, pct: "17% U", range: "11-30", purchase: "" },
    { year: 2025, player: "T. Warren", product: "Don. Elite Ser.", psa: 9, value: 14, pct: "18% U", range: "9-22", purchase: "11A 1/25" },

    // === C. Loveland ===
    { year: 2025, player: "C. Loveland", product: "Don. Rookies", psa: 9, value: 31, pct: "14% U", range: "24-40", purchase: "40BN 29A 3/6, 2/17" },

    // === T. McMillan ===
    { year: 2025, player: "T. McMillan", product: "Bombsquad", psa: 8, value: 14, pct: "6% U", range: "10-19", purchase: "19A 11A 2/5, 2/5" },
    { year: 2025, player: "T. McMillan", product: "Red/Green", psa: 8, value: 9, pct: "4% U", range: "5-15", purchase: "" },

    // === E. Ayomanor ===
    { year: 2025, player: "E. Ayomanor", product: "Rev. Blue Cosmo", psa: 9, value: 18, pct: "13% U", range: "10-30", purchase: "" },
    { year: 2025, player: "E. Ayomanor", product: "Mosaic Silver", psa: 8, value: 8, pct: "18% U", range: "5-14", purchase: "" },

    // === E. Egbuka ===
    { year: 2025, player: "E. Egbuka", product: "Don. Rookies", psa: 10, value: 42, pct: "85% U", range: "32-55", purchase: "31A 37A 2/15, 2/11" },
    { year: 2025, player: "E. Egbuka", product: "Bombsquad", psa: 10, value: 56, pct: "84% U", range: "45-69", purchase: "46A 3/14" },
    { year: 2025, player: "E. Egbuka", product: "Rev. Futures", psa: 9, value: 13, pct: "130% U", range: "7-27", purchase: "" },
    { year: 2025, player: "E. Egbuka", product: "Don. Throwback", psa: 7, value: 9, pct: "87% U", range: "6-14", purchase: "" },
    { year: 2025, player: "E. Egbuka", product: "Don. Rookies", psa: 9, value: 19, pct: "99% U", range: "14-27", purchase: "24A 20A 2/10 1/25" },

    // === J. Higgens ===
    { year: 2025, player: "J. Higgens", product: "RR Retro", psa: 8, value: 11, pct: "", range: "7-19", purchase: "" },

    // === C. Skattebo ===
    { year: 2025, player: "C. Skattebo", product: "RR Throwback", psa: 10, value: 87, pct: "31% U", range: "72-105", purchase: "86A 80A 3/14 3/15" },

    // === T. Henderson ===
    { year: 2025, player: "T. Henderson", product: "Mosiac GR", psa: 10, value: 50, pct: "17% U", range: "36-69", purchase: "70BN" },
    { year: 2025, player: "T. Henderson", product: "Don. Rookies", psa: 9, value: 18, pct: "18% U", range: "12-26", purchase: "16A 2/21" },
    { year: 2025, player: "T. Henderson", product: "Mosaic (S)", psa: 8, value: 14, pct: "14% U", range: "9-21", purchase: "" },

    // === A. Jeanty ===
    { year: 2025, player: "A. Jeanty", product: "Don. Rookie Rev.", psa: 9, value: 18, pct: "19% U", range: "12-26", purchase: "16A 2/21" },
    { year: 2025, player: "A. Jeanty", product: "Don. Wh Hot", psa: 8, value: 10, pct: "19% U", range: "10-16", purchase: "17FP" },

    // === Q. Judkins ===
    { year: 2025, player: "Q. Judkins", product: "Ab. Rookie Wave", psa: 8, value: 10, pct: "19% U", range: "10-16", purchase: "17FP" },

    // === O. Hampton ===
    { year: 2025, player: "O. Hampton", product: "Red Cosmo", psa: 8, value: 12, pct: "4% U", range: "7-18", purchase: "" },
    { year: 2025, player: "O. Hampton", product: "Mosaic Gr", psa: 10, value: 38, pct: "6% U", range: "26-55", purchase: "85FP" },

    // === K. Johnson ===
    { year: 2025, player: "K. Johnson", product: "Mos. Genesis", psa: 10, value: 70, pct: "13% U", range: "45-108", purchase: "Pop. 1" },

    // === O. Gordon II ===
    { year: 2025, player: "O. Gordon II", product: "Mos. Cookies", psa: 9, value: 26, pct: "20% U", range: "16-42", purchase: "" },

    // === JSN ===
    { year: 2025, player: "JSN", product: "Honeycomb", psa: 9, value: 97, pct: "130% U", range: "71-132", purchase: "89A 2/21" },

    // === G. Wilson ===
    { year: 2025, player: "G. Wilson", product: "Honeycomb", psa: 10, value: 73, pct: "16.5% D", range: "48-110", purchase: "Pop 1" },
    { year: 2025, player: "G. Wilson", product: "Mosaic (S)", psa: 10, value: 22, pct: "7% D", range: "13-36", purchase: "Pop 1" },

    // === J. Andreeson ===
    { year: 2025, player: "J. Andreeson", product: "Mosaic Scripts", psa: 6, value: 10, pct: "15% U", range: "4-23", purchase: "" },

    // === J. Chase ===
    { year: 2025, player: "J. Chase", product: "Mos. Genesis", psa: 10, value: 155, pct: "15% U", range: "108-223", purchase: "" },

    // === T. Kelce ===
    { year: 2020, player: "T. Kelce", product: "Dominators", psa: 10, value: 27, pct: "5% U", range: "19-38", purchase: "Pop 13" },

    // === M. Brown ===
    { year: 2023, player: "M. Brown", product: "Die Cut Wh", psa: 10, value: 19, pct: "12% U", range: "13-28", purchase: "88/199" },

    // === J. Reed ===
    { year: 2023, player: "J. Reed", product: "Select R. Swatch", psa: 9, value: 13, pct: "31% D", range: "8-21", purchase: "" },

    // === JJ Watt ===
    { year: 2024, player: "JJ Watt", product: "Don. Optic", psa: 10, value: 72, pct: "10% U", range: "50-102", purchase: "50A 9/13" },

    // === P. Mahones ===
    { year: 2024, player: "P. Mahones", product: "WC7 Purple", psa: 10, value: 48, pct: "10% U", range: "3-77", purchase: "10A" },
    { year: 2024, player: "P. Mahones", product: "Select Black Red", psa: 10, value: 61, pct: "6% U", range: "47-79", purchase: "75BO 57A 3/16, 1/9" },

    // === A. Highsmith ===
    { year: 2024, player: "A. Highsmith", product: "", psa: 10, value: 22, pct: "27% U", range: "13-38", purchase: "Pop 1" },

    // === J. Hurts ===
    { year: 2024, player: "J. Hurts", product: "Select Die Cut", psa: 10, value: 28, pct: "16% D", range: "21-37", purchase: "34BO 3/5" },

    // === J. Allen ===
    { year: 2024, player: "J. Allen", product: "Don. Kings", psa: 10, value: 71, pct: "53% U", range: "50-101", purchase: "100BN 3/3" },
    { year: 2024, player: "J. Allen", product: "Select Red/Yel", psa: 10, value: 56, pct: "50% U", range: "41-77", purchase: "" },

    // === D. Maye ===
    { year: 2024, player: "D. Maye", product: "Prizm RV Silver", psa: 10, value: 369, pct: "73% U", range: "313-436", purchase: "305A 700BO 3/2" },
    { year: 2024, player: "D. Maye", product: "Zeith Marq OJ", psa: 10, value: 136, pct: "123% U", range: "105-175", purchase: "168A 2/9" },
    { year: 2024, player: "D. Maye", product: "Prizm OJ Ice", psa: 10, value: 486, pct: "73% U", range: "421-561", purchase: "489A 483A 2/22 2/19" },
    { year: 2024, player: "D. Maye", product: "Prizm Neo GR Pulsar", psa: 10, value: 192, pct: "3% U", range: "166-222", purchase: "212A 100A 3/8 3/6" },
    { year: 2024, player: "D. Maye", product: "Zeith State of Art", psa: 9, value: 32, pct: "69% U", range: "26-40", purchase: "50A 33A 3/9 2/21" },
    { year: 2024, player: "D. Maye", product: "Abs. Stargazing", psa: 8, value: 13, pct: "99% U", range: "9-18", purchase: "10A 8A 3/7 2/1" },
    { year: 2024, player: "D. Maye", product: "Phoenix Contours", psa: 8, value: 17, pct: "109% U", range: "13-22", purchase: "18A 25A 3/14 3/2" },

    // === JJ McCarthy ===
    { year: 2024, player: "JJ McCarthy", product: "Prizm Draft Picks", psa: 10, value: 16, pct: "46% D", range: "11-24", purchase: "14A 9/19" },
    { year: 2025, player: "JJ McCarthy", product: "Prizm Draft Picks", psa: 10, value: 16, pct: "46% D", range: "11-24", purchase: "25A 5/20" },
    { year: 2024, player: "JJ McCarthy", product: "Don. Optic My Ho", psa: 10, value: 21, pct: "55% D", range: "16-28", purchase: "23A 2/15" },
    { year: 2024, player: "JJ McCarthy", product: "Illusions Shin. Stars", psa: 10, value: 20, pct: "55% D", range: "14-27", purchase: "17A" },
    { year: 2024, player: "JJ McCarthy", product: "Don. Elite Rookie", psa: 10, value: 24, pct: "54% D", range: "19-31", purchase: "25A 40A 3/7 2/10" },
    { year: 2024, player: "JJ McCarthy", product: "Prizm RV Silver", psa: 9, value: 20, pct: "71% D", range: "15-25", purchase: "20A 19A 3/17 3/8" },
    { year: 2024, player: "JJ McCarthy", product: "Illusions Emerald", psa: 9, value: 11, pct: "54% D", range: "7-16", purchase: "13A" },
    { year: 2024, player: "JJ McCarthy", product: "Select Die Cut Silver", psa: 7, value: 6, pct: "52% D", range: "4-10", purchase: "5A 8A" },
    { year: 2024, player: "JJ McCarthy", product: "Zenith Z-Jersey", psa: 7, value: 8, pct: "54% D", range: "5-13", purchase: "" },

    // === M. Penix Jr. ===
    { year: 2024, player: "M. Penix Jr.", product: "Prizm Prizmatic", psa: 10, value: 18, pct: "41% D", range: "14-24", purchase: "41BO 20BO" },
    { year: 2024, player: "M. Penix Jr.", product: "Prizm Red", psa: 10, value: 648, pct: "58% D", range: "576-814", purchase: "349A 1007A" },

    // === Bo Nix ===
    { year: 2024, player: "Bo Nix", product: "Prizm Disco OJ", psa: 10, value: 159, pct: "45% D", range: "143-176", purchase: "155A 158A 3/15 3/4" },
    { year: 2024, player: "Bo Nix", product: "Mosaic Green", psa: 10, value: 55, pct: "40% D", range: "46-66", purchase: "61A 2/8" },
    { year: 2024, player: "Bo Nix", product: "Prizm Draft Red Ice", psa: 10, value: 43, pct: "10% U", range: "33-57", purchase: "46A 74A 2/11" },
    { year: 2024, player: "Bo Nix", product: "Zenith Color Guard", psa: 9, value: 19, pct: "18% D", range: "13-27", purchase: "21A" },
    { year: 2024, player: "Bo Nix", product: "Select Die-Cut Silver", psa: 9, value: 26, pct: "8% D", range: "20-33", purchase: "29A 25A 2/9 2/22" },
    { year: 2024, player: "Bo Nix", product: "Illusion Illusionists", psa: 9, value: 18, pct: "9% D", range: "13-25", purchase: "20A 15A 2/4" },
    { year: 2024, player: "Bo Nix", product: "Cont. Draft Bronze", psa: 9, value: 16, pct: "12% D", range: "11-23", purchase: "" },
    { year: 2024, player: "Bo Nix", product: "Don. Rookies", psa: 9, value: 22, pct: "2.5% U", range: "17-29", purchase: "23A 2/22" },

    // === C. Williams ===
    { year: 2024, player: "C. Williams", product: "Select Blk/Red Shock", psa: 10, value: 113, pct: "9.5% U", range: "87-148", purchase: "127A Low Pop of 5" },
    { year: 2024, player: "C. Williams", product: "Phoenix Purple", psa: 10, value: 67, pct: "14% U", range: "54-85", purchase: "87A" },
    { year: 2024, player: "C. Williams", product: "Select Club Base", psa: 10, value: 68, pct: "46% U", range: "57-81", purchase: "71A" },

    // === J. Burrow ===
    { year: 2020, player: "J. Burrow", product: "Prizm Lt. Blue", psa: 10, value: 613, pct: "", range: "503-748", purchase: "536A 810A" },

    // === J. Herbert ===
    { year: 2020, player: "J. Herbert", product: "Don. Auto RR", psa: 10, value: 175, pct: "", range: "118-259", purchase: "200A 360A" },

    // === J. Love ===
    { year: 2020, player: "J. Love", product: "Don. Optic Gren Vel", psa: 10, value: 196, pct: "6% U", range: "175-219", purchase: "198A 203A 3/14 2/18" },

    // === B. Robinson ===
    { year: 2023, player: "B. Robinson", product: "RV Green Wave", psa: 10, value: 86, pct: "25% U", range: "63-117", purchase: "66A 76A" },

    // === M. Harrison Jr. ===
    { year: 2024, player: "M. Harrison Jr.", product: "Select Phen. Green", psa: 10, value: 184, pct: "40% D", range: "140-244", purchase: "154A Ebay $173.88" },
    { year: 2024, player: "M. Harrison Jr.", product: "Don. Optic Holo", psa: 10, value: 46, pct: "39% D", range: "38-55", purchase: "203A 3/5 Ebay $61.12" },
    { year: 2024, player: "M. Harrison Jr.", product: "Don. Optic Diam.", psa: 10, value: 20, pct: "42% D", range: "14-27", purchase: "15A 134A" },
    { year: 2024, player: "M. Harrison Jr.", product: "Select Red/Yellow", psa: 10, value: 29, pct: "37% D", range: "22-39", purchase: "23A 27A" },
    { year: 2024, player: "M. Harrison Jr.", product: "Phoenix ColorBlast", psa: 9, value: 268, pct: "46% D", range: "231-311", purchase: "280A 280A 338A" },

    // === M. Nabors ===
    { year: 2024, player: "M. Nabors", product: "Prizm Gr. Ice Emerg.", psa: 10, value: 32, pct: "26% D", range: "25-42", purchase: "" },
    { year: 2024, player: "M. Nabors", product: "Select Red/Yellow", psa: 10, value: 51, pct: "20% D", range: "40-64", purchase: "51BN 96A 2/4 1/11" },

    // === B. Bowers ===
    { year: 2024, player: "B. Bowers", product: "Zenith Marq. OJ", psa: 10, value: 36, pct: "36% D", range: "25-52", purchase: "" },
    { year: 2024, player: "B. Bowers", product: "Select Blk/Red", psa: 10, value: 41, pct: "36% D", range: "34-49", purchase: "50BN 3/11" },

    // === R. Odunze ===
    { year: 2024, player: "R. Odunze", product: "Phoenix Con. Lazer", psa: 10, value: 37, pct: "4% U", range: "28-50", purchase: "34A" },
    { year: 2024, player: "R. Odunze", product: "Select Blk/Red", psa: 10, value: 44, pct: "32% U", range: "35-56", purchase: "43A 49A" },

    // === R. Pearsall ===
    { year: 2024, player: "R. Pearsall", product: "Don. Optic Stars", psa: 10, value: 36, pct: "28% D", range: "25-56", purchase: "60BD 41A" },

    // === T. Franklin ===
    { year: 2024, player: "T. Franklin", product: "Tot. Certified Port.", psa: 10, value: 21, pct: "23% U", range: "13-34", purchase: "" },

    // === X. Worthy ===
    { year: 2024, player: "X. Worthy", product: "Select Red/Yellow", psa: 10, value: 31, pct: "32% D", range: "22-40", purchase: "52BD 40BD" },
    { year: 2024, player: "X. Worthy", product: "Don. Optic Holo", psa: 8, value: 6, pct: "37% D", range: "4-9", purchase: "" },
];
