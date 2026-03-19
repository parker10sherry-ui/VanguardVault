// ============================================================
// data.ts — Seed data for Vanguard Vault
// Imported by providers; never accessed directly by UI.
// ============================================================

import type { PlayerInfo, Card } from "./types";

export const SEED_PLAYERS: Record<string, PlayerInfo> = {
  "S. Sanders":      { full: "Shedeur Sanders",      team: "Cleveland Browns",              espnId: 4432762 },
  "J. Dart":         { full: "Jaxson Dart",           team: "New York Giants",               espnId: 4689114 },
  "C. Ward":         { full: "Cam Ward",              team: "Tennessee Titans",              espnId: 4688380 },
  "T. Shough":       { full: "Tyler Shough",          team: "New Orleans Saints",            espnId: 4360689 },
  "D. Gabriel":      { full: "Dillon Gabriel",        team: "Cleveland Browns",              espnId: 4427238 },
  "W. Howard":       { full: "Will Howard",           team: "Pittsburgh Steelers",           espnId: 4429955 },
  "T. Warren":       { full: "Tyler Warren",          team: "Indianapolis Colts",            espnId: 4431459 },
  "C. Loveland":     { full: "Colston Loveland",      team: "Chicago Bears",                 espnId: 4723086 },
  "T. McMillan":     { full: "Tetairoa McMillan",     team: "Carolina Panthers",             espnId: 4685472 },
  "E. Ayomanor":     { full: "Elic Ayomanor",         team: "Tennessee Titans",              espnId: 4883647 },
  "E. Egbuka":       { full: "Emeka Egbuka",          team: "Tampa Bay Buccaneers",          espnId: 4567750 },
  "J. Higgens":      { full: "Jayden Higgins",        team: "Houston Texans",                espnId: 4877706 },
  "C. Skattebo":     { full: "Cameron Skattebo",      team: "New York Giants",               espnId: 4696981 },
  "T. Henderson":    { full: "TreVeyon Henderson",    team: "New England Patriots",          espnId: 4432710 },
  "A. Jeanty":       { full: "Ashton Jeanty",         team: "Las Vegas Raiders",             espnId: 4890973 },
  "Q. Judkins":      { full: "Quinshon Judkins",      team: "Cleveland Browns",              espnId: 4685702 },
  "O. Hampton":      { full: "Omarion Hampton",       team: "Los Angeles Chargers",          espnId: 4685382 },
  "K. Johnson":      { full: "Kaleb Johnson",         team: "Pittsburgh Steelers",           espnId: 4819231 },
  "O. Gordon II":    { full: "Ollie Gordon II",       team: "Miami Dolphins",                espnId: 4711533 },
  "JSN":             { full: "Jaxon Smith-Njigba",    team: "Seattle Seahawks",              espnId: 4430878 },
  "G. Wilson":       { full: "Garrett Wilson",        team: "New York Jets",                 espnId: 4569618 },
  "J. Andreeson":    { full: "J. Andreeson",          team: "Unknown",                       espnId: null },
  "J. Chase":        { full: "Ja'Marr Chase",         team: "Cincinnati Bengals",            espnId: 4362628 },
  "T. Kelce":        { full: "Travis Kelce",          team: "Kansas City Chiefs",            espnId: 15847 },
  "M. Brown":        { full: "Marquise Brown",        team: "Kansas City Chiefs",            espnId: 4241372 },
  "J. Reed":         { full: "Jayden Reed",           team: "Green Bay Packers",             espnId: 4362249 },
  "JJ Watt":         { full: "J.J. Watt",             team: "Arizona Cardinals (Retired)",   espnId: 13979 },
  "P. Mahones":      { full: "Patrick Mahomes",       team: "Kansas City Chiefs",            espnId: 3139477 },
  "A. Highsmith":    { full: "Alex Highsmith",        team: "Pittsburgh Steelers",           espnId: 4037333 },
  "J. Hurts":        { full: "Jalen Hurts",           team: "Philadelphia Eagles",           espnId: 4040715 },
  "J. Allen":        { full: "Josh Allen",            team: "Buffalo Bills",                 espnId: 3918298 },
  "D. Maye":         { full: "Drake Maye",            team: "New England Patriots",          espnId: 4431452 },
  "JJ McCarthy":     { full: "J.J. McCarthy",         team: "Minnesota Vikings",             espnId: 4433970 },
  "M. Penix Jr.":    { full: "Michael Penix Jr.",     team: "Atlanta Falcons",               espnId: 4360423 },
  "Bo Nix":          { full: "Bo Nix",                team: "Denver Broncos",                espnId: 4426338 },
  "C. Williams":     { full: "Caleb Williams",        team: "Chicago Bears",                 espnId: 4431611 },
  "J. Burrow":       { full: "Joe Burrow",            team: "Cincinnati Bengals",            espnId: 3915511 },
  "J. Herbert":      { full: "Justin Herbert",        team: "Los Angeles Chargers",          espnId: 4038941 },
  "J. Love":         { full: "Jordan Love",           team: "Green Bay Packers",             espnId: 4036378 },
  "B. Robinson":     { full: "Bijan Robinson",        team: "Atlanta Falcons",               espnId: 4430807 },
  "M. Harrison Jr.": { full: "Marvin Harrison Jr.",   team: "Arizona Cardinals",             espnId: 4432708 },
  "M. Nabors":       { full: "Malik Nabers",          team: "New York Giants",               espnId: 4595348 },
  "B. Bowers":       { full: "Brock Bowers",          team: "Las Vegas Raiders",             espnId: 4432665 },
  "R. Odunze":       { full: "Rome Odunze",           team: "Chicago Bears",                 espnId: 4431299 },
  "R. Pearsall":     { full: "Ricky Pearsall",        team: "San Francisco 49ers",           espnId: 4428209 },
  "T. Franklin":     { full: "Troy Franklin",         team: "Denver Broncos",                espnId: 4431280 },
  "X. Worthy":       { full: "Xavier Worthy",         team: "Kansas City Chiefs",            espnId: 4683062 },
};

export const SEED_CARDS: Card[] = [
  // === S. Sanders ===
  { year: 2025, player: "S. Sanders", product: "Rev-New Wave", psa: 6, value: 11, pct: "", range: "" },
  { year: 2025, player: "S. Sanders", product: "Rev-New Wave", psa: 7, value: 13, pct: "40% D", range: "" },
  { year: 2025, player: "S. Sanders", product: "Red & Green", psa: 8, value: 9, pct: "47% D", range: "" },
  { year: 2025, player: "S. Sanders", product: "Mosaic Cookies", psa: 8, value: 46, pct: "47% D", range: "" },
  { year: 2025, player: "S. Sanders", product: "Don. Red Hot", psa: 9, value: 36, pct: "43% D", range: "" },
  { year: 2025, player: "S. Sanders", product: "Mos. RV Green", psa: 10, value: 58, pct: "4% D", range: "" },
  { year: 2025, player: "S. Sanders", product: "Mos. Green", psa: 10, value: 65, pct: "42% D", range: "" },
  { year: 2025, player: "S. Sanders", product: "Don. Elite Ser.", psa: 9, value: 14, pct: "51% D", range: "" },

  // === J. Dart ===
  { year: 2025, player: "J. Dart", product: "Don. Press Purple", psa: 7, value: 15, pct: "122% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Grid King", psa: 8, value: 15, pct: "116% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Mo. Red/WH", psa: 8, value: 52, pct: "169% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. RR Retro", psa: 9, value: 40, pct: "162% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Wh Hot", psa: 9, value: 31, pct: "127% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Elite Ser.", psa: 9, value: 28, pct: "103% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Ab. Red/GR", psa: 9, value: 20, pct: "116% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Rookies", psa: 9, value: 32, pct: "158% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Throwback", psa: 9, value: 22, pct: "148% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Elite Ser.", psa: 9, value: 22, pct: "148% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. RR Retro", psa: 9, value: 22, pct: "148% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Bombsquad", psa: 9, value: 44, pct: "142% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Mos. Green", psa: 9, value: 58, pct: "148% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Rookies", psa: 10, value: 112, pct: "143% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Bombsquad", psa: 10, value: 152, pct: "102% U", range: "" },
  { year: 2025, player: "J. Dart", product: "Don. Throwback", psa: 10, value: 105, pct: "180% U", range: "" },

  // === C. Ward ===
  { year: 2025, player: "C. Ward", product: "Ab. Rookie Wave", psa: 8, value: 12, pct: "17% U", range: "" },
  { year: 2025, player: "C. Ward", product: "Ab. R & GR", psa: 9, value: 12, pct: "23% U", range: "" },
  { year: 2025, player: "C. Ward", product: "Rev. New Wave", psa: 9, value: 28, pct: "21% U", range: "" },
  { year: 2025, player: "C. Ward", product: "Rev. Red Cosmo", psa: 9, value: 31, pct: "17.4% U", range: "28-42" },

  // === T. Shough ===
  { year: 2025, player: "T. Shough", product: "Bombsquad", psa: 10, value: 64, pct: "170% U", range: "" },

  // === D. Gabriel ===
  { year: 2025, player: "D. Gabriel", product: "Mos. Silver", psa: 10, value: 25, pct: "13% D", range: "17-36" },
  { year: 2025, player: "D. Gabriel", product: "Grid Kings", psa: 9, value: 11, pct: "3% D", range: "8-16" },

  // === W. Howard ===
  { year: 2025, player: "W. Howard", product: "Rev. New Wave", psa: 8, value: 14, pct: "21% U", range: "8-25" },
  { year: 2025, player: "W. Howard", product: "Don. Elite Explo.", psa: 8, value: 14, pct: "16% U", range: "9-23" },
  { year: 2025, player: "W. Howard", product: "Don. Rookies", psa: 9, value: 19, pct: "23% U", range: "13-29" },
  { year: 2025, player: "W. Howard", product: "Don. Throwback", psa: 9, value: 20, pct: "23% U", range: "13-33" },
  { year: 2025, player: "W. Howard", product: "Don. Retro Auto", psa: 9, value: 86, pct: "22% U", range: "54-137" },
  { year: 2025, player: "W. Howard", product: "Bombsquad Auto", psa: 9, value: 177, pct: "7% U", range: "130-241" },

  // === T. Warren ===
  { year: 2025, player: "T. Warren", product: "Mos. (S)", psa: 10, value: 43, pct: "9% U", range: "31-61" },
  { year: 2025, player: "T. Warren", product: "Mos. Red/Wh", psa: 10, value: 70, pct: "14% U", range: "57-85" },
  { year: 2025, player: "T. Warren", product: "Don. Wh. Hot", psa: 9, value: 18, pct: "17% U", range: "11-30" },
  { year: 2025, player: "T. Warren", product: "Don. Elite Ser.", psa: 9, value: 14, pct: "18% U", range: "9-22" },

  // === C. Loveland ===
  { year: 2025, player: "C. Loveland", product: "Don. Rookies", psa: 9, value: 31, pct: "14% U", range: "24-40" },

  // === T. McMillan ===
  { year: 2025, player: "T. McMillan", product: "Bombsquad", psa: 8, value: 14, pct: "6% U", range: "10-19" },
  { year: 2025, player: "T. McMillan", product: "Red/Green", psa: 8, value: 9, pct: "4% U", range: "5-15" },

  // === E. Ayomanor ===
  { year: 2025, player: "E. Ayomanor", product: "Rev. Blue Cosmo", psa: 9, value: 18, pct: "13% U", range: "10-30" },
  { year: 2025, player: "E. Ayomanor", product: "Mosaic Silver", psa: 8, value: 8, pct: "18% U", range: "5-14" },

  // === E. Egbuka ===
  { year: 2025, player: "E. Egbuka", product: "Don. Rookies", psa: 10, value: 42, pct: "85% U", range: "32-55" },
  { year: 2025, player: "E. Egbuka", product: "Bombsquad", psa: 10, value: 56, pct: "84% U", range: "45-69" },
  { year: 2025, player: "E. Egbuka", product: "Rev. Futures", psa: 9, value: 13, pct: "130% U", range: "7-27" },
  { year: 2025, player: "E. Egbuka", product: "Don. Throwback", psa: 7, value: 9, pct: "87% U", range: "6-14" },
  { year: 2025, player: "E. Egbuka", product: "Don. Rookies", psa: 9, value: 19, pct: "99% U", range: "14-27" },

  // === J. Higgens ===
  { year: 2025, player: "J. Higgens", product: "RR Retro", psa: 8, value: 11, pct: "", range: "7-19" },

  // === C. Skattebo ===
  { year: 2025, player: "C. Skattebo", product: "RR Throwback", psa: 10, value: 87, pct: "31% U", range: "72-105" },

  // === T. Henderson ===
  { year: 2025, player: "T. Henderson", product: "Mosiac GR", psa: 10, value: 50, pct: "17% U", range: "36-69" },
  { year: 2025, player: "T. Henderson", product: "Don. Rookies", psa: 9, value: 18, pct: "18% U", range: "12-26" },
  { year: 2025, player: "T. Henderson", product: "Mosaic (S)", psa: 8, value: 14, pct: "14% U", range: "9-21" },

  // === A. Jeanty ===
  { year: 2025, player: "A. Jeanty", product: "Don. Rookie Rev.", psa: 9, value: 18, pct: "19% U", range: "12-26" },
  { year: 2025, player: "A. Jeanty", product: "Don. Wh Hot", psa: 8, value: 10, pct: "19% U", range: "10-16" },

  // === Q. Judkins ===
  { year: 2025, player: "Q. Judkins", product: "Ab. Rookie Wave", psa: 8, value: 10, pct: "19% U", range: "10-16" },

  // === O. Hampton ===
  { year: 2025, player: "O. Hampton", product: "Red Cosmo", psa: 8, value: 12, pct: "4% U", range: "7-18" },
  { year: 2025, player: "O. Hampton", product: "Mosaic Gr", psa: 10, value: 38, pct: "6% U", range: "26-55" },

  // === K. Johnson ===
  { year: 2025, player: "K. Johnson", product: "Mos. Genesis", psa: 10, value: 70, pct: "13% U", range: "45-108" },

  // === O. Gordon II ===
  { year: 2025, player: "O. Gordon II", product: "Mos. Cookies", psa: 9, value: 26, pct: "20% U", range: "16-42" },

  // === JSN ===
  { year: 2025, player: "JSN", product: "Honeycomb", psa: 9, value: 97, pct: "130% U", range: "71-132" },

  // === G. Wilson ===
  { year: 2025, player: "G. Wilson", product: "Honeycomb", psa: 10, value: 73, pct: "16.5% D", range: "48-110" },
  { year: 2025, player: "G. Wilson", product: "Mosaic (S)", psa: 10, value: 22, pct: "7% D", range: "13-36" },

  // === J. Andreeson ===
  { year: 2025, player: "J. Andreeson", product: "Mosaic Scripts", psa: 6, value: 10, pct: "15% U", range: "4-23" },

  // === J. Chase ===
  { year: 2025, player: "J. Chase", product: "Mos. Genesis", psa: 10, value: 155, pct: "15% U", range: "108-223" },

  // === T. Kelce ===
  { year: 2020, player: "T. Kelce", product: "Dominators", psa: 10, value: 27, pct: "5% U", range: "19-38" },

  // === M. Brown ===
  { year: 2023, player: "M. Brown", product: "Die Cut Wh", psa: 10, value: 19, pct: "12% U", range: "13-28" },

  // === J. Reed ===
  { year: 2023, player: "J. Reed", product: "Select R. Swatch", psa: 9, value: 13, pct: "31% D", range: "8-21" },

  // === JJ Watt ===
  { year: 2024, player: "JJ Watt", product: "Don. Optic", psa: 10, value: 72, pct: "10% U", range: "50-102" },

  // === P. Mahones ===
  { year: 2024, player: "P. Mahones", product: "WC7 Purple", psa: 10, value: 48, pct: "10% U", range: "3-77" },
  { year: 2024, player: "P. Mahones", product: "Select Black Red", psa: 10, value: 61, pct: "6% U", range: "47-79" },

  // === A. Highsmith ===
  { year: 2024, player: "A. Highsmith", product: "", psa: 10, value: 22, pct: "27% U", range: "13-38" },

  // === J. Hurts ===
  { year: 2024, player: "J. Hurts", product: "Select Die Cut", psa: 10, value: 28, pct: "16% D", range: "21-37" },

  // === J. Allen ===
  { year: 2024, player: "J. Allen", product: "Don. Kings", psa: 10, value: 71, pct: "53% U", range: "50-101" },
  { year: 2024, player: "J. Allen", product: "Select Red/Yel", psa: 10, value: 56, pct: "50% U", range: "41-77" },

  // === D. Maye ===
  { year: 2024, player: "D. Maye", product: "Prizm RV Silver", psa: 10, value: 369, pct: "73% U", range: "313-436" },
  { year: 2024, player: "D. Maye", product: "Zeith Marq OJ", psa: 10, value: 136, pct: "123% U", range: "105-175" },
  { year: 2024, player: "D. Maye", product: "Prizm OJ Ice", psa: 10, value: 486, pct: "73% U", range: "421-561" },
  { year: 2024, player: "D. Maye", product: "Prizm Neo GR Pulsar", psa: 10, value: 192, pct: "3% U", range: "166-222" },
  { year: 2024, player: "D. Maye", product: "Zeith State of Art", psa: 9, value: 32, pct: "69% U", range: "26-40" },
  { year: 2024, player: "D. Maye", product: "Abs. Stargazing", psa: 8, value: 13, pct: "99% U", range: "9-18" },
  { year: 2024, player: "D. Maye", product: "Phoenix Contours", psa: 8, value: 17, pct: "109% U", range: "13-22" },

  // === JJ McCarthy ===
  { year: 2024, player: "JJ McCarthy", product: "Prizm Draft Picks", psa: 10, value: 16, pct: "46% D", range: "11-24" },
  { year: 2025, player: "JJ McCarthy", product: "Prizm Draft Picks", psa: 10, value: 16, pct: "46% D", range: "11-24" },
  { year: 2024, player: "JJ McCarthy", product: "Don. Optic My Ho", psa: 10, value: 21, pct: "55% D", range: "16-28" },
  { year: 2024, player: "JJ McCarthy", product: "Illusions Shin. Stars", psa: 10, value: 20, pct: "55% D", range: "14-27" },
  { year: 2024, player: "JJ McCarthy", product: "Don. Elite Rookie", psa: 10, value: 24, pct: "54% D", range: "19-31" },
  { year: 2024, player: "JJ McCarthy", product: "Prizm RV Silver", psa: 9, value: 20, pct: "71% D", range: "15-25" },
  { year: 2024, player: "JJ McCarthy", product: "Illusions Emerald", psa: 9, value: 11, pct: "54% D", range: "7-16" },
  { year: 2024, player: "JJ McCarthy", product: "Select Die Cut Silver", psa: 7, value: 6, pct: "52% D", range: "4-10" },
  { year: 2024, player: "JJ McCarthy", product: "Zenith Z-Jersey", psa: 7, value: 8, pct: "54% D", range: "5-13" },

  // === M. Penix Jr. ===
  { year: 2024, player: "M. Penix Jr.", product: "Prizm Prizmatic", psa: 10, value: 18, pct: "41% D", range: "14-24" },
  { year: 2024, player: "M. Penix Jr.", product: "Prizm Red", psa: 10, value: 648, pct: "58% D", range: "576-814" },

  // === Bo Nix ===
  { year: 2024, player: "Bo Nix", product: "Prizm Disco OJ", psa: 10, value: 159, pct: "45% D", range: "143-176" },
  { year: 2024, player: "Bo Nix", product: "Mosaic Green", psa: 10, value: 55, pct: "40% D", range: "46-66" },
  { year: 2024, player: "Bo Nix", product: "Prizm Draft Red Ice", psa: 10, value: 43, pct: "10% U", range: "33-57" },
  { year: 2024, player: "Bo Nix", product: "Zenith Color Guard", psa: 9, value: 19, pct: "18% D", range: "13-27" },
  { year: 2024, player: "Bo Nix", product: "Select Die-Cut Silver", psa: 9, value: 26, pct: "8% D", range: "20-33" },
  { year: 2024, player: "Bo Nix", product: "Illusion Illusionists", psa: 9, value: 18, pct: "9% D", range: "13-25" },
  { year: 2024, player: "Bo Nix", product: "Cont. Draft Bronze", psa: 9, value: 16, pct: "12% D", range: "11-23" },
  { year: 2024, player: "Bo Nix", product: "Don. Rookies", psa: 9, value: 22, pct: "2.5% U", range: "17-29" },

  // === C. Williams ===
  { year: 2024, player: "C. Williams", product: "Select Blk/Red Shock", psa: 10, value: 113, pct: "9.5% U", range: "87-148" },
  { year: 2024, player: "C. Williams", product: "Phoenix Purple", psa: 10, value: 67, pct: "14% U", range: "54-85" },
  { year: 2024, player: "C. Williams", product: "Select Club Base", psa: 10, value: 68, pct: "46% U", range: "57-81" },

  // === J. Burrow ===
  { year: 2020, player: "J. Burrow", product: "Prizm Lt. Blue", psa: 10, value: 613, pct: "", range: "503-748" },

  // === J. Herbert ===
  { year: 2020, player: "J. Herbert", product: "Don. Auto RR", psa: 10, value: 175, pct: "", range: "118-259" },

  // === J. Love ===
  { year: 2020, player: "J. Love", product: "Don. Optic Gren Vel", psa: 10, value: 196, pct: "6% U", range: "175-219" },

  // === B. Robinson ===
  { year: 2023, player: "B. Robinson", product: "RV Green Wave", psa: 10, value: 86, pct: "25% U", range: "63-117" },

  // === M. Harrison Jr. ===
  { year: 2024, player: "M. Harrison Jr.", product: "Select Phen. Green", psa: 10, value: 184, pct: "40% D", range: "140-244" },
  { year: 2024, player: "M. Harrison Jr.", product: "Don. Optic Holo", psa: 10, value: 46, pct: "39% D", range: "38-55" },
  { year: 2024, player: "M. Harrison Jr.", product: "Don. Optic Diam.", psa: 10, value: 20, pct: "42% D", range: "14-27" },
  { year: 2024, player: "M. Harrison Jr.", product: "Select Red/Yellow", psa: 10, value: 29, pct: "37% D", range: "22-39" },
  { year: 2024, player: "M. Harrison Jr.", product: "Phoenix ColorBlast", psa: 9, value: 268, pct: "46% D", range: "231-311" },

  // === M. Nabors ===
  { year: 2024, player: "M. Nabors", product: "Prizm Gr. Ice Emerg.", psa: 10, value: 32, pct: "26% D", range: "25-42" },
  { year: 2024, player: "M. Nabors", product: "Select Red/Yellow", psa: 10, value: 51, pct: "20% D", range: "40-64" },

  // === B. Bowers ===
  { year: 2024, player: "B. Bowers", product: "Zenith Marq. OJ", psa: 10, value: 36, pct: "36% D", range: "25-52" },
  { year: 2024, player: "B. Bowers", product: "Select Blk/Red", psa: 10, value: 41, pct: "36% D", range: "34-49" },

  // === R. Odunze ===
  { year: 2024, player: "R. Odunze", product: "Phoenix Con. Lazer", psa: 10, value: 37, pct: "4% U", range: "28-50" },
  { year: 2024, player: "R. Odunze", product: "Select Blk/Red", psa: 10, value: 44, pct: "32% U", range: "35-56" },

  // === R. Pearsall ===
  { year: 2024, player: "R. Pearsall", product: "Don. Optic Stars", psa: 10, value: 36, pct: "28% D", range: "25-56" },

  // === T. Franklin ===
  { year: 2024, player: "T. Franklin", product: "Tot. Certified Port.", psa: 10, value: 21, pct: "23% U", range: "13-34" },

  // === X. Worthy ===
  { year: 2024, player: "X. Worthy", product: "Select Red/Yellow", psa: 10, value: 31, pct: "32% D", range: "22-40" },
  { year: 2024, player: "X. Worthy", product: "Don. Optic Holo", psa: 8, value: 6, pct: "37% D", range: "4-9" },
];
