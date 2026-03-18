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

// ── WebSocket ────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on("connection", (ws) => {
  console.log("🔌 Cliente conectado via WebSocket");
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
  if (count === 0) {
    console.log("🌱 Populando participantes iniciais...");
    const jsonPath = path.join(__dirname, "players.json");
    if (fs.existsSync(jsonPath)) {
      const players = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const insert = db.prepare(`
        INSERT INTO players (nome, sobrenome, team_id, team_color, puzzle_piece, puzzle_number)
        VALUES (@nome, @sobrenome, @team_id, @team_color, @puzzle_piece, @puzzle_number)
      `);
      db.transaction((ps) => { for (const p of ps) insert.run(p); })(players);
      console.log(`✅ ${players.length} participantes importados!`);
    }
  }

  const qcount = db.prepare("SELECT COUNT(*) as n FROM questions").get().n;
  if (qcount === 0) {
    console.log("🌱 Populando perguntas temáticas de Páscoa...");
    const insertQ = db.prepare(`
      INSERT INTO questions (stage, question, option_a, option_b, option_c, option_d, correct_index)
      VALUES (@stage, @question, @option_a, @option_b, @option_c, @option_d, @correct_index)
    `);

    // ── Etapa 1: Tradições e Símbolos ─────────────────────────
    const questions = [
      {
        stage: 1,
        question: "O ovo de Páscoa simboliza o quê na tradição cristã?",
        option_a: "A riqueza da terra",
        option_b: "O renascimento e a vida nova",
        option_c: "O fim do inverno",
        option_d: "A fartura da colheita",
        correct_index: 1
      },
      {
        stage: 1,
        question: "Em qual domingo a Páscoa sempre cai?",
        option_a: "Primeiro domingo de março",
        option_b: "Domingo após a primeira lua cheia da primavera",
        option_c: "Último domingo de abril",
        option_d: "Domingo mais próximo do dia 25 de março",
        correct_index: 1
      },
      {
        stage: 1,
        question: "Qual país tem a tradição de decorar árvores com ovos de Páscoa coloridos?",
        option_a: "França",
        option_b: "Brasil",
        option_c: "Alemanha",
        option_d: "Portugal",
        correct_index: 2
      },
      {
        stage: 1,
        question: "O coelho é símbolo da Páscoa porque representa o quê?",
        option_a: "Velocidade e agilidade",
        option_b: "Fertilidade e renovação da vida",
        option_c: "Sorte e fortuna",
        option_d: "Amizade e companheirismo",
        correct_index: 1
      },
      {
        stage: 1,
        question: "Em qual país nasceu a tradição de dar ovos de chocolate na Páscoa?",
        option_a: "Suíça",
        option_b: "Bélgica",
        option_c: "França",
        option_d: "Inglaterra",
        correct_index: 2
      },

      // ── Etapa 2: Chocolate e Doces ────────────────────────
      {
        stage: 2,
        question: "De qual fruto é extraído o cacau, ingrediente principal do chocolate?",
        option_a: "Cacaueiro",
        option_b: "Cupuaçuzeiro",
        option_c: "Guaranazeiro",
        option_d: "Açaizeiro",
        correct_index: 0
      },
      {
        stage: 2,
        question: "Quantos kg de cacau são necessários para produzir 1 kg de chocolate?",
        option_a: "1 kg",
        option_b: "3 a 4 kg",
        option_c: "10 kg",
        option_d: "500 gramas",
        correct_index: 1
      },
      {
        stage: 2,
        question: "O chocolate branco é feito com qual parte do cacau?",
        option_a: "Casca torrada do cacau",
        option_b: "Pó de cacau puro",
        option_c: "Manteiga de cacau",
        option_d: "Semente crua de cacau",
        correct_index: 2
      },
      {
        stage: 2,
        question: "Por que o chocolate derrete tão facilmente na boca?",
        option_a: "Porque tem muito açúcar",
        option_b: "Porque a manteiga de cacau derrete exatamente na temperatura do corpo humano",
        option_c: "Porque é produzido com leite integral",
        option_d: "Porque contém emulsificantes especiais",
        correct_index: 1
      },
      {
        stage: 2,
        question: "Qual cidade brasileira é conhecida como a 'Capital do Chocolate'?",
        option_a: "Ilhéus (BA)",
        option_b: "Gramado (RS)",
        option_c: "Campos do Jordão (SP)",
        option_d: "Petrópolis (RJ)",
        correct_index: 0
      },

      // ── Etapa 3: Páscoa no Brasil e no Mundo ─────────────
      {
        stage: 3,
        question: "Qual é o maior ovo de Páscoa já registrado no Brasil?",
        option_a: "3 metros de altura",
        option_b: "7,5 metros de altura",
        option_c: "12 metros de altura",
        option_d: "20 metros de altura",
        correct_index: 1
      },
      {
        stage: 3,
        question: "A palavra 'Páscoa' vem do hebraico 'Pesach'. O que Pesach significa?",
        option_a: "Celebração",
        option_b: "Ressurreição",
        option_c: "Passagem",
        option_d: "Renovação",
        correct_index: 2
      },
      {
        stage: 3,
        question: "No Brasil, qual estado é o maior produtor de cacau do país?",
        option_a: "Pará",
        option_b: "Bahia",
        option_c: "Amazonas",
        option_d: "Minas Gerais",
        correct_index: 1
      },
      {
        stage: 3,
        question: "Qual é a Semana Santa que precede a Páscoa e por que é chamada assim?",
        option_a: "Porque dura exatamente 7 dias sagrados",
        option_b: "Porque comemora os 7 milagres de Jesus",
        option_c: "Porque relembra os últimos dias de Jesus antes da ressurreição",
        option_d: "Porque todas as igrejas ficam fechadas durante essa semana",
        correct_index: 2
      },
      {
        stage: 3,
        question: "Qual animal — além do coelho — também aparece como símbolo da Páscoa em vários países?",
        option_a: "Cordeiro 🐑",
        option_b: "Pomba 🕊️",
        option_c: "Pintinho 🐣",
        option_d: "Todos os anteriores",
        correct_index: 3
      },
    ];

    db.transaction((qs) => { for (const q of qs) insertQ.run(q); })(questions);
    console.log(`✅ ${questions.length} perguntas cadastradas!`);

    // Dicas
    const insertHint = db.prepare("INSERT OR IGNORE INTO hints (stage, hint) VALUES (@stage, @hint)");
    insertHint.run({ stage: 1, hint: "🐣 Pista 1: Procure algo que começa com a letra que inicia a primavera... olhe bem ao redor da entrada principal!" });
    insertHint.run({ stage: 2, hint: "🗺️ Pista 2: O próximo passo está onde as histórias ganham vida... perto da vitrine central!" });
    insertHint.run({ stage: 3, hint: "⭐ Pista 3: A resposta final está escondida onde a luz brilha mais forte! Sigam o brilho dourado..." });
  }

  // Config padrão
  db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('final_password', 'PASCOA2025')").run();
  db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('prize_location', 'A caixa de ovos está no porta-malas do carro 🚗 estacionado próximo à entrada lateral!')").run();
}

seedData();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve o frontend estático
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");
if (fs.existsSync(FRONTEND_PATH)) {
  app.use(express.static(FRONTEND_PATH));
}

// ── Rotas API ────────────────────────────────────────────────

app.get("/api/status", (req, res) => res.json({ ok: true, message: "CaçaPáscoa rodando! 🐰" }));

app.post("/api/scan", (req, res) => {
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: "player_id obrigatório" });
  const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  if (!player) return res.status(404).json({ error: "Não encontrado" });
  if (!player.scanned_at) db.prepare("UPDATE players SET scanned_at = ? WHERE id = ?").run(new Date().toISOString(), player_id);
  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  res.json({ ok: true, player: updated });
});

app.post("/api/login", (req, res) => {
  const { nome, sobrenome } = req.body;
  if (!nome || !sobrenome) return res.status(400).json({ error: "Nome e sobrenome obrigatórios" });
  const player = db.prepare(
    "SELECT * FROM players WHERE LOWER(nome) = LOWER(?) AND LOWER(sobrenome) = LOWER(?)"
  ).get(nome.trim(), sobrenome.trim());
  if (!player) return res.status(401).json({ error: "Não encontrado" });
  const now = new Date().toISOString();
  if (!player.session_start_at) {
    db.prepare("UPDATE players SET session_start_at = ?, scanned_at = COALESCE(scanned_at, ?), current_stage = 1 WHERE id = ?").run(now, now, player.id);
  } else {
    db.prepare("UPDATE players SET current_stage = MAX(current_stage, 1) WHERE id = ?").run(player.id);
  }
  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player.id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  res.json({ ok: true, player: updated });
});

app.get("/api/questions/:stage", (req, res) => {
  const stage = parseInt(req.params.stage);
  if (![1, 2, 3].includes(stage)) return res.status(400).json({ error: "Etapa inválida" });
  const questions = db.prepare("SELECT * FROM questions WHERE stage = ? ORDER BY RANDOM()").all(stage);
  const safe = questions.map(({ correct_index, ...q }) => q);
  res.json({ questions: safe });
});

app.post("/api/answer", (req, res) => {
  const { player_id, stage, question_id, answer_index } = req.body;
  const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  if (!player) return res.status(404).json({ error: "Não encontrado" });
  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(question_id);
  if (!question) return res.status(404).json({ error: "Pergunta não encontrada" });
  const correct = answer_index === question.correct_index;
  const now = new Date().toISOString();
  db.prepare(`UPDATE players SET attempts_stage${stage} = attempts_stage${stage} + 1 WHERE id = ?`).run(player_id);
  if (correct) {
    db.prepare(`UPDATE players SET stage${stage}_correct_at = ?, current_stage = ? WHERE id = ?`).run(now, stage + 1, player_id);
  }
  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  const hint = correct ? db.prepare("SELECT hint FROM hints WHERE stage = ?").get(stage) : null;
  res.json({ correct, hint: hint?.hint || null });
});

app.post("/api/team-revealed", (req, res) => {
  const { player_id } = req.body;
  db.prepare("UPDATE players SET team_revealed_at = COALESCE(team_revealed_at, ?) WHERE id = ?").run(new Date().toISOString(), player_id);
  const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
  broadcast({ type: "PLAYER_UPDATE", player: updated });
  res.json({ ok: true });
});

app.get("/api/team/:team_id", (req, res) => {
  const members = db.prepare("SELECT id, nome, sobrenome, puzzle_piece, puzzle_number FROM players WHERE team_id = ?").all(req.params.team_id);
  res.json({ members });
});

app.post("/api/final-password", (req, res) => {
  const { player_id, password } = req.body;
  const config = db.prepare("SELECT value FROM config WHERE key = 'final_password'").get();
  const prize = db.prepare("SELECT value FROM config WHERE key = 'prize_location'").get();
  const correct = password.trim().toUpperCase() === config.value.toUpperCase();
  if (correct && player_id) {
    const now = new Date().toISOString();
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    const totalSec = player?.session_start_at ? Math.floor((Date.now() - new Date(player.session_start_at).getTime()) / 1000) : null;
    db.prepare("UPDATE players SET bonus_completed_at = ?, total_time_seconds = ? WHERE id = ?").run(now, totalSec, player_id);
    const updated = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    broadcast({ type: "PLAYER_UPDATE", player: updated });
  }
  res.json({ correct, prize: correct ? prize.value : null });
});

app.get("/api/admin/players", (req, res) => {
  const players = db.prepare("SELECT * FROM players ORDER BY team_id, id").all();
  res.json({ players });
});

app.post("/api/admin/reset", (req, res) => {
  if (req.body.confirm !== "RESETAR") return res.status(400).json({ error: "Confirmação inválida" });
  db.prepare(`UPDATE players SET scanned_at=NULL,session_start_at=NULL,current_stage=0,
    attempts_stage1=0,attempts_stage2=0,attempts_stage3=0,
    stage1_correct_at=NULL,stage2_correct_at=NULL,stage3_correct_at=NULL,
    team_revealed_at=NULL,bonus_completed_at=NULL,total_time_seconds=NULL`).run();
  broadcast({ type: "FULL_STATE", players: db.prepare("SELECT * FROM players").all() });
  res.json({ ok: true });
});

// SPA fallback
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Não encontrado" });
  const indexPath = path.join(FRONTEND_PATH, "index.html");
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.send("<h1>🐰 CaçaPáscoa</h1><p>Frontend não encontrado.</p>");
});

// ── Start ────────────────────────────────────────────────────
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
