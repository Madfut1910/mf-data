/**
 * Converts default.realm to Firestore-style JSON for use in Database26Dev.html.
 * Run: node realmToJson.js
 * Output: 26assets/Txt/realmExport.json
 */

const Realm = require("realm");
const fs = require("fs");
const path = require("path");

const realmPath = path.join(__dirname, "default.realm");
const outputPath = path.join(__dirname, "26assets", "Txt", "realmExport.json");

// Firestore-style document: one doc with all players in fields.players.arrayValue.values
function toFirestoreValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") return { integerValue: String(Math.floor(val)) };
  if (typeof val === "boolean") return { booleanValue: val };
  return { stringValue: String(val) };
}

function playerToMapValueFields(obj) {
  const fields = {};
  const keys = [
    "name", "position", "altPositions", "rating", "PAC", "SHO", "PAS", "DRI", "DEF", "PHY",
    "attack", "control", "defense", "nationId", "leagueId", "clubId", "color", "specialChem",
    "id", "baseId", "itemId", "totwNumber", "man", "tradable", "packable", "inPicks", "inTokens",
    "url", "date"
  ];
  for (const key of keys) {
    if (!(key in obj)) continue;
    const val = obj[key];
    if (val === null || val === undefined) continue;
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

// Schema must match the existing default.realm file exactly (from migration error)
const PlayerSchema = {
  name: "Player",
  primaryKey: "id",
  properties: {
    id: "string",
    name: "string",
    baseId: "int",
    rating: "int",
    position: "string",
    altPositions: "string",
    color: "string",
    clubId: "int",
    leagueId: "int",
    nationId: "int",
    url: "bool",
    PAC: "int",
    SHO: "int",
    PAS: "int",
    DRI: "int",
    DEF: "int",
    PHY: "int",
    attack: "int",
    control: "int",
    defense: "int",
    specialChem: "string",
    totwNumber: "int",
    man: "bool",
    tradable: "bool",
    packable: "int",
    inPicks: "bool",
    inTokens: "bool",
    itemId: "int",
    date: "int",
  },
};

async function run() {
  if (!fs.existsSync(realmPath)) {
    console.error("default.realm not found at:", realmPath);
    process.exit(1);
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const realm = await Realm.open({
    path: realmPath,
    schema: [PlayerSchema],
    schemaVersion: 0,
  });

  const players = realm.objects("Player");
  const values = [];

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const plain = {};
    for (const key of Object.keys(PlayerSchema.properties)) {
      if (key === "id" && p.id !== undefined) plain.id = p.id;
      else if (p[key] !== undefined) plain[key] = p[key];
    }
    const fields = playerToMapValueFields(plain);
    if (Object.keys(fields).length === 0) continue;
    values.push({ mapValue: { fields } });
  }

  const doc = {
    name: "realmExport",
    createTime: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    updateTime: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    fields: {
      players: {
        arrayValue: { values },
      },
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2), "utf8");
  console.log("Exported", values.length, "players to", outputPath);
  realm.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
