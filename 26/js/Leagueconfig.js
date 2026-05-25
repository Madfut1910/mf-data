// ── WC 2026 ──────────────────────────────────────────
window.worldCup2026 = {
  type: "worldcup",
  id: "4",
  name: "World Cup 2026",
  groups: [
    { id: "A", nations: ["12", "83", "140", "167"] }, 
    { id: "B", nations: ["8", "70", "300", "47"] },     
    { id: "C", nations: ["54", "80", "129", "42"] },   
    { id: "D", nations: ["195", "58", "48", "95"] },    
    { id: "E", nations: ["86", "57", "21", "108"] }, 
    { id: "F", nations: ["163", "34", "46", "145"] },    
    { id: "G", nations: ["7", "111", "161", "198"] },    
    { id: "H", nations: ["104", "183", "45", "60"] }, 
    { id: "I", nations: ["18", "162", "36", "136"] },     
    { id: "J", nations: ["97", "52", "4", "164"] }, 
    { id: "K", nations: ["56", "110", "38", "191"] },     
    { id: "L", nations: ["10", "14", "117", "87"] },   
  ],
};

// ── Club leagues ──────────────────────────────────────────
window.leagues = [
  {
    leagueId: "13",
    name: "Premier League",
    positions: 20,
    clubIds: [
      "1", "2", "1943", "1925", "1808", "5", "7", "144", "8", "9",
      "10", "11", "13", "14", "106", "1799", "1800", "94", "1952", "18",
    ],
    rivalries: [
      {
        label: "Play-off winner — promoted to PL",
        chosenLabel: "Promoted",
        a: { clubId: "1952", label: "Hull City",   note: "Play-off finalist" },
        b: { clubId: "17",   label: "Southampton", note: "Play-off finalist" },
      },
      {
        label: "Who is relegated?",
        chosenLabel: "Relegated",
        invertResult: true,
        a: { clubId: "18", label: "Spurs",    note: "Relegation battle" },
        b: { clubId: "19", label: "West Ham", note: "Relegation battle" },
      },
    ],
    zones: [
      { label: "UCL",        cls: "champions",  slots: [1, 2, 3, 4, 5] },
      { label: "UEL",        cls: "europa",     slots: [6, 7] },
      { label: "ECL",        cls: "conference", slots: [8] },
      { label: "Relegation", cls: "relegation", slots: [18, 19, 20] },
    ],
    confirmed: [],
  },

  {
    leagueId: "53",
    name: "LaLiga",
    positions: 20,
    clubIds: [
      "241", "243", "240", "483", "449", "448", "457", "461", "481",
      "450", "479", "480", "1860", "463", "110062", "468", "453", "1853",
      "110827", "472",
    ],
    rivalries: [
      {
        label: "Who stays up?",
        chosenLabel: "Safe",
        a: { clubId: "453",  label: "Mallorca",   note: "Relegation battle" },
        b: { clubId: "1853", label: "Levante UD", note: "Relegation battle" },
      },
      {
        label: "Final automatic promotion spot",
        chosenLabel: "Promoted",
        a: { clubId: "242",  label: "RC Deportivo", note: "Promotion race" },
        b: { clubId: "1861", label: "UD Almería",   note: "Promotion race" },
      },
    ],
    zones: [
      { label: "UCL",        cls: "champions",  slots: [1, 2, 3, 4, 5] },
      { label: "UEL",        cls: "europa",     slots: [6, 7] },
      { label: "ECL",        cls: "conference", slots: [8] },
      { label: "Relegation", cls: "relegation", slots: [18, 19, 20] },
    ],
    confirmed: [
      { pos: 1, clubId: "241" },
      { pos: 2, clubId: "243" },
      { pos: 3, clubId: "240" },
      { pos: 4, clubId: "483" },
    ],
  },

  {
    leagueId: "14",
    name: "Championship",
    positions: 24,
    clubIds: [
      "88", "3", "1919", "1796", "1961", "89", "149", "1792", "1790", "1801",
      "15", "1794", "1806", "1960", "1795", "109", "110", "1947", "91", "12", "97",
    ],
    rivalries: [
      {
        label: "Relegated from Premier League",
        chosenLabel: "Relegated",
        a: { clubId: "18", label: "Spurs",    note: "PL relegation battle" },
        b: { clubId: "19", label: "West Ham", note: "PL relegation battle" },
      },
      {
        label: "League One play-off winner",
        chosenLabel: "Promoted",
        a: { clubId: "1931", label: "Stockport County", note: "Play-off finalist" },
        b: { clubId: "4",    label: "Bolton",           note: "Play-off finalist" },
      },
      {
        label: "Play-off promoted to PL",
        chosenLabel: "Promoted",
        invertResult: true,
        a: { clubId: "1952", label: "Hull City",   note: "PL play-off finalist" },
        b: { clubId: "17",   label: "Southampton", note: "PL play-off finalist" },
      },
    ],
    zones: [
      { label: "Auto Promotion", cls: "promo",      slots: [1, 2] },
      { label: "Play-offs",      cls: "playoff",    slots: [3, 4, 5, 6] },
      { label: "Relegation",     cls: "relegation", slots: [22, 23, 24] },
    ],
    confirmed: [],
  },
];