// ════════════════════════════════════════════════════════════
// Script: Importar participantes do players.json para o banco
// Uso: node importar-participantes.js
// ════════════════════════════════════════════════════════════
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "cacapascoa.db");
const JSON_PATH = path.join(__dirname, "players.json");

if (!fs.existsSync(JSON_PATH)) {
  console.error("❌ Arquivo players.json não encontrado!");
  process.exit(1);
}

const players = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const db = new Database(DB_PATH);

// Garante que a tabela existe
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL, sobrenome TEXT NOT NULL,
    team_id INTEGER NOT NULL, team_color TEXT NOT NULL,
    puzzle_piece INTEGER NOT NULL, puzzle_number INTEGER NOT NULL,
    scanned_at TEXT, session_start_at TEXT, current_stage INTEGER DEFAULT 0,
    attempts_stage1 INTEGER DEFAULT 0, attempts_stage2 INTEGER DEFAULT 0, attempts_stage3 INTEGER DEFAULT 0,
    stage1_correct_at TEXT, stage2_correct_at TEXT, stage3_correct_at TEXT,
    team_revealed_at TEXT, bonus_completed_at TEXT, total_time_seconds INTEGER
  )
`);

// Limpa e reimporta
db.prepare("DELETE FROM players").run();

const insert = db.prepare(`
  INSERT INTO players (nome, sobrenome, team_id, team_color, puzzle_piece, puzzle_number)
  VALUES (@nome, @sobrenome, @team_id, @team_color, @puzzle_piece, @puzzle_number)
`);

const insertMany = db.transaction((ps) => { for (const p of ps) insert.run(p); });
insertMany(players);

console.log(`✅ ${players.length} participantes importados com sucesso!`);
console.log("📋 Resumo:");

const byTeam = {};
players.forEach(p => { byTeam[p.team_color] = (byTeam[p.team_color] || 0) + 1; });
Object.entries(byTeam).forEach(([team, count]) => console.log(`   Equipe ${team}: ${count} pessoas`));

db.close();
