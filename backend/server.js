// ============================================================
// CaçaPáscoa — Servidor Backend Local
// Node.js + Express + SQLite + WebSocket
// ============================================================

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// ── WebSocket Server ─────────────────────────────────────────
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("🔌 Cliente conectado via WebSocket");
  // Envia estado atual ao conectar
  const players = db.prepare("SELECT * FROM players").all();
  ws.send(JSON.stringify({ type: "FULL_STATE", players }));
  ws.on("close", () => console.log("🔌 Cliente desconectado"));
});

// ── Banco de Dados SQLite ────────────────────────────────────
const DB_PATH = path.join(__dirname, "cacapascoa.db");
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    sobrenome TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    team_color TEXT NOT NULL,
    puzzle_piece INTEGER NOT NULL,
    puzzle_number INTEGER NOT NULL,
    scanned_at TEXT,
    session_start_at TEXT,
    current_stage INTEGER DEFAULT 0,
    attempts_stage1 INTEGER DEFAULT 0,
    attempts_stage2 INTEGER DEFAULT 0,
    attempts_stage3 INTEGER DEFAULT 0,
    stage1_correct_at TEXT,
    stage2_correct_at TEXT,
    stage3_correct_at TEXT,
    team_revealed_at TEXT,
    bonus_completed_at TEXT,
    total_time_seconds INTEGER
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage INTEGER NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_index INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hints (
    stage INTEGER PRIMARY KEY,
    hint TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ── Seed: Dados iniciais ─────────────────────────────────────
function seedData() {
  const count = db.prepare("SELECT COUNT(*) as n FROM players").get().n;
  if (count > 0) return; // Já tem dados, não sobrescreve

  console.log("🌱 Populando banco de dados inicial...");

  // 11 equipes, 6 pessoas cada = 66 participantes (exemplo com dados de demonstração)
  const teams = [
    { id: 1, color: "AZUL" },
    { id: 2, color: "ROSA" },
    { id: 3, color: "VERDE" },
    { id: 4, color: "AMARELO" },
    { id: 5, color: "ROXO" },
    { id: 6, color: "LARANJA" },
    { id: 7, color: "VERMELHO" },
    { id: 8, color: "TURQUESA" },
    { id: 9, color: "DOURADO" },
    { id: 10, color: "PRATA" },
    { id: 11, color: "BRONZE" },
  ];

  // Participantes de exemplo — EDITE O ARQUIVO players.json para personalizar
  const samplePlayers = [
    // Equipe AZUL
    { nome: "Ana", sobrenome: "Silva", team_id: 1, team_color: "AZUL", puzzle_piece: 1, puzzle_number: 7 },
    { nome: "Bruno", sobrenome: "Costa", team_id: 1, team_color: "AZUL", puzzle_piece: 2, puzzle_number: 3 },
    { nome: "Carla", sobrenome: "Lima", team_id: 1, team_color: "AZUL", puzzle_piece: 3, puzzle_number: 9 },
    { nome: "Diego", sobrenome: "Souza", team_id: 1, team_color: "AZUL", puzzle_piece: 4, puzzle_number: 5 },
    { nome: "Elaine", sobrenome: "Rocha", team_id: 1, team_color: "AZUL", puzzle_piece: 5, puzzle_number: 2 },
    { nome: "Felipe", sobrenome: "Mendes", team_id: 1, team_color: "AZUL", puzzle_piece: 6, puzzle_number: 8 },
    // Equipe ROSA
    { nome: "Gabriela", sobrenome: "Santos", team_id: 2, team_color: "ROSA", puzzle_piece: 1, puzzle_number: 4 },
    { nome: "Henrique", sobrenome: "Alves", team_id: 2, team_color: "ROSA", puzzle_piece: 2, puzzle_number: 6 },
    { nome: "Isabela", sobrenome: "Ferreira", team_id: 2, team_color: "ROSA", puzzle_piece: 3, puzzle_number: 1 },
    { nome: "João", sobrenome: "Oliveira", team_id: 2, team_color: "ROSA", puzzle_piece: 4, puzzle_number: 10 },
    { nome: "Karina", sobrenome: "Pereira", team_id: 2, team_color: "ROSA", puzzle_piece: 5, puzzle_number: 12 },
    { nome: "Lucas", sobrenome: "Martins", team_id: 2, team_color: "ROSA", puzzle_piece: 6, puzzle_number: 11 },
    // Equipe VERDE
    { nome: "Mariana", sobrenome: "Gomes", team_id: 3, team_color: "VERDE", puzzle_piece: 1, puzzle_number: 15 },
    { nome: "Nicolas", sobrenome: "Barbosa", team_id: 3, team_color: "VERDE", puzzle_piece: 2, puzzle_number: 13 },
    { nome: "Olivia", sobrenome: "Carvalho", team_id: 3, team_color: "VERDE", puzzle_piece: 3, puzzle_number: 16 },
    { nome: "Pedro", sobrenome: "Ribeiro", team_id: 3, team_color: "VERDE", puzzle_piece: 4, puzzle_number: 14 },
    { nome: "Quintina", sobrenome: "Nunes", team_id: 3, team_color: "VERDE", puzzle_piece: 5, puzzle_number: 17 },
    { nome: "Rafael", sobrenome: "Pinto", team_id: 3, team_color: "VERDE", puzzle_piece: 6, puzzle_number: 18 },
  ];

  const insert = db.prepare(`
    INSERT INTO players (nome, sobrenome, team_id, team_color, puzzle_piece, puzzle_number)
    VALUES (@nome, @sobrenome, @team_id, @team_color, @puzzle_piece, @puzzle_number)
  `);

  const insertMany = db.transaction((players) => {
    for (const p of players) insert.run(p);
  });

  insertMany(samplePlayers);

  // Perguntas
  const insertQ = db.prepare(`
    INSERT INTO questions (stage, question, option_a, option_b, option_c, option_d, correct_index)
    VALUES (@stage, @question, @option_a, @option_b, @option_c, @option_d, @correct_index)
  `);

  const questions = [
    // Etapa 1
    { stage: 1, question: "Qual animal é o símbolo mais famoso da Páscoa?", option_a: "Coelho 🐰", option_b: "Pintinho 🐣", option_c: "Cordeiro 🐑", option_d: "Borboleta 🦋", correct_index: 0 },
    { stage: 1, question: "De onde vem a tradição dos ovos de Páscoa?", option_a: "Egito Antigo", option_b: "Europa Medieval", option_c: "América do Sul", option_d: "Japão", correct_index: 1 },
    { stage: 1, question: "Qual é o chocolate preferido no Brasil na Páscoa?", option_a: "Amargo", option_b: "Branco", option_c: "Ao leite", option_d: "Ruby", correct_index: 2 },
    // Etapa 2
    { stage: 2, question: "Qual ingrediente principal do chocolate ao leite?", option_a: "Açúcar", option_b: "Cacau", option_c: "Leite em pó", option_d: "Manteiga", correct_index: 1 },
    { stage: 2, question: "Em que época do ano cai a Páscoa no Brasil?", option_a: "Verão", option_b: "Inverno", option_c: "Outono", option_d: "Primavera", correct_index: 2 },
    { stage: 2, question: "Quantas cores tem o arco-íris?", option_a: "5", option_b: "6", option_c: "7", option_d: "8", correct_index: 2 },
    // Etapa 3
    { stage: 3, question: "O que significa a palavra 'Páscoa' em hebraico?", option_a: "Celebração", option_b: "Passagem", option_c: "Renascimento", option_d: "Alegria", correct_index: 1 },
    { stage: 3, question: "Qual país consome mais chocolate por pessoa no mundo?", option_a: "Brasil", option_b: "EUA", option_c: "Suíça", option_d: "Bélgica", correct_index: 2 },
    { stage: 3, question: "Há quantos anos existe a tradição de ovos de chocolate?", option_a: "Mais de 100 anos", option_b: "Mais de 200 anos", option_c: "Mais de 50 anos", option_d: "Mais de 500 anos", correct_index: 1 },
  ];

  const insertQMany = db.transaction((qs) => { for (const q of qs) insertQ.run(q); });
  insertQMany(questions);

  // Dicas
  const insertHint = db.prepare("INSERT INTO hints (stage, hint) VALUES (@stage, @hint)");
  insertHint.run({ stage: 1, hint: "🐣 Pista 1: Procure algo que começa com a letra que inicia a primavera... olhe bem ao redor da entrada principal!" });
  insertHint.run({ stage: 2, hint: "🗺️ Pista 2: O próximo passo está onde as histórias ganham vida... perto da vitrine central!" });
  insertHint.run({ stage: 3, hint: "⭐ Pista 3: A resposta final está escondida onde a luz brilha mais forte! Sigam o brilho dourado..." });

  // Senha final
  db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('final_password', 'PASCOA2025')").run();
  db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('prize_location', 'A caixa de ovos está no porta-malas do carro 🚗 estacionado próximo à entrada lateral!')").run();

  console.log("✅ Banco populado com sucesso!");
}

seedData();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve o frontend (pasta dist após build, ou public)
const FRONTEND_PATH = path.join(__dirname, "..", "frontend", "dist");
const FRONTEND_FALLBACK = path.join(__dirname, "..", "frontend", "public");

if (fs.existsSync(FRONTEND_PATH)) {
  app.use(express.static(FRONTEND_PATH));
} else if (fs.existsSync(FRONTEND_FALLBACK)) {
  app.use(express.static(FRONTEND_FALLBACK));
}

// ── Rotas API ────────────────────────────────────────────────

// GET /api/status — Health check
app.get("/api/status", (req, res) => {
  res.json({ ok: true, message: "CaçaPáscoa rodando! 🐰" });
});

// POST /api/scan — Registra scan do QR
app.post("/api/scan", (req, res) => {
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: "player_id obrigatório" });

  const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  if (!player) return res.status(404).json({ error: "Participante não encontrado" });

  if (!player.scanned_at) {
    db.prepare("UPDATE players SET scanned_at = ? WHERE id = ?")
      .run(new Date().toISOString(), player_id);
  }

  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  res.json({ ok: true, player: updated });
});

// POST /api/login — Autenticação por nome/sobrenome
app.post("/api/login", (req, res) => {
  const { nome, sobrenome } = req.body;
  if (!nome || !sobrenome) return res.status(400).json({ error: "Nome e sobrenome obrigatórios" });

  const player = db.prepare(
    "SELECT * FROM players WHERE LOWER(nome) = LOWER(?) AND LOWER(sobrenome) = LOWER(?)"
  ).get(nome.trim(), sobrenome.trim());

  if (!player) return res.status(401).json({ error: "Participante não encontrado" });

  const now = new Date().toISOString();
  if (!player.session_start_at) {
    db.prepare("UPDATE players SET session_start_at = ?, scanned_at = COALESCE(scanned_at, ?), current_stage = 1 WHERE id = ?")
      .run(now, now, player.id);
  } else {
    db.prepare("UPDATE players SET current_stage = MAX(current_stage, 1) WHERE id = ?").run(player.id);
  }

  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player.id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  res.json({ ok: true, player: updated });
});

// GET /api/questions/:stage — Perguntas de uma etapa
app.get("/api/questions/:stage", (req, res) => {
  const stage = parseInt(req.params.stage);
  if (![1, 2, 3].includes(stage)) return res.status(400).json({ error: "Etapa inválida" });

  const questions = db.prepare("SELECT * FROM questions WHERE stage = ? ORDER BY RANDOM()").all(stage);
  // Não envia o correct_index para o frontend
  const safe = questions.map(({ correct_index, ...q }) => q);
  res.json({ questions: safe });
});

// POST /api/answer — Valida resposta
app.post("/api/answer", (req, res) => {
  const { player_id, stage, question_id, answer_index } = req.body;

  const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  if (!player) return res.status(404).json({ error: "Participante não encontrado" });

  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(question_id);
  if (!question) return res.status(404).json({ error: "Pergunta não encontrada" });

  const correct = answer_index === question.correct_index;
  const now = new Date().toISOString();

  // Incrementa tentativas
  const attemptsCol = `attempts_stage${stage}`;
  db.prepare(`UPDATE players SET ${attemptsCol} = ${attemptsCol} + 1 WHERE id = ?`).run(player_id);

  if (correct) {
    const correctCol = `stage${stage}_correct_at`;
    db.prepare(`UPDATE players SET ${correctCol} = ?, current_stage = ? WHERE id = ?`)
      .run(now, stage + 1, player_id);
  }

  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });

  const hint = correct ? db.prepare("SELECT hint FROM hints WHERE stage = ?").get(stage) : null;
  res.json({ correct, hint: hint?.hint || null });
});

// GET /api/hint/:stage — Pista de uma etapa
app.get("/api/hint/:stage", (req, res) => {
  const hint = db.prepare("SELECT * FROM hints WHERE stage = ?").get(req.params.stage);
  res.json({ hint });
});

// POST /api/team-revealed — Marca que viu a equipe
app.post("/api/team-revealed", (req, res) => {
  const { player_id } = req.body;
  const now = new Date().toISOString();
  db.prepare("UPDATE players SET team_revealed_at = COALESCE(team_revealed_at, ?) WHERE id = ?").run(now, player_id);
  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  res.json({ ok: true });
});

// GET /api/team/:team_id — Membros de uma equipe
app.get("/api/team/:team_id", (req, res) => {
  const members = db.prepare("SELECT id, nome, sobrenome, puzzle_piece, puzzle_number FROM players WHERE team_id = ?").all(req.params.team_id);
  res.json({ members });
});

// POST /api/final-password — Valida senha final
app.post("/api/final-password", (req, res) => {
  const { player_id, password } = req.body;
  const config = db.prepare("SELECT value FROM config WHERE key = 'final_password'").get();
  const prize = db.prepare("SELECT value FROM config WHERE key = 'prize_location'").get();

  const correct = password.trim().toUpperCase() === config.value.toUpperCase();

  if (correct) {
    const now = new Date().toISOString();
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    const startAt = player.session_start_at;
    const totalSec = startAt ? Math.floor((Date.now() - new Date(startAt).getTime()) / 1000) : null;
    db.prepare("UPDATE players SET bonus_completed_at = ?, total_time_seconds = ? WHERE id = ?")
      .run(now, totalSec, player_id);
    const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    broadcast({ type: "PLAYER_UPDATE", player: updated });
  }

  res.json({ correct, prize: correct ? prize.value : null });
});

// GET /api/admin/players — Todos os participantes para o dashboard
app.get("/api/admin/players", (req, res) => {
  const players = db.prepare("SELECT * FROM players ORDER BY team_id, id").all();
  res.json({ players });
});

// POST /api/admin/reset — Reseta todos os dados de progresso (não apaga participantes)
app.post("/api/admin/reset", (req, res) => {
  const { confirm } = req.body;
  if (confirm !== "RESETAR") return res.status(400).json({ error: "Confirmação inválida" });

  db.prepare(`UPDATE players SET
    scanned_at = NULL, session_start_at = NULL, current_stage = 0,
    attempts_stage1 = 0, attempts_stage2 = 0, attempts_stage3 = 0,
    stage1_correct_at = NULL, stage2_correct_at = NULL, stage3_correct_at = NULL,
    team_revealed_at = NULL, bonus_completed_at = NULL, total_time_seconds = NULL
  `).run();

  const players = db.prepare("SELECT * FROM players").all();
  broadcast({ type: "FULL_STATE", players });
  res.json({ ok: true, message: "Dados resetados com sucesso!" });
});

// SPA fallback — serve o index.html para todas as rotas não-API
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Rota não encontrada" });
  const indexPath = fs.existsSync(FRONTEND_PATH)
    ? path.join(FRONTEND_PATH, "index.html")
    : path.join(FRONTEND_FALLBACK, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("<h1>🐰 CaçaPáscoa</h1><p>Frontend não encontrado. Execute: npm run build na pasta frontend</p>");
  }
});

// ── Iniciar servidor ─────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   🐰 CaçaPáscoa — Servidor Iniciado! 🐰  ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\n✅ Acesse em: http://localhost:${PORT}`);
  console.log(`📡 Na rede:   http://SEU_IP:${PORT}`);
  console.log(`📊 Admin:     http://SEU_IP:${PORT}/admin`);
  console.log("\n💡 Para saber seu IP: ipconfig (Windows) ou ifconfig (Mac/Linux)");
  console.log("🛑 Para parar: pressione Ctrl+C\n");
});

