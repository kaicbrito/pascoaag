# 🐰 CaçaPáscoa — Guia Completo de Instalação e Uso

> Sistema local para evento de Páscoa — sem internet, sem nuvem, 100% na sua rede.

---

## 📁 Estrutura de Pastas

```
cacapascoa/
├── backend/
│   ├── server.js                  ← Servidor principal
│   ├── package.json               ← Lista de dependências Node
│   ├── players.json               ← ✏️ EDITE AQUI: lista de participantes
│   ├── importar-participantes.js  ← Script para importar o players.json
│   └── cacapascoa.db              ← Banco de dados (criado automaticamente)
│
├── frontend/
│   └── public/
│       └── index.html             ← App completo (frontend)
│
├── INICIAR-WINDOWS.bat            ← Clique 2x para iniciar no Windows
├── iniciar-mac-linux.sh           ← Execute no Terminal (Mac/Linux)
├── GERAR-QR-CODE.html             ← Abre no browser para gerar QR Code
└── LEIA-ME.md                     ← Este arquivo
```

---

## ✅ PASSO A PASSO — PRIMEIRA VEZ

### ETAPA 1 — Instalar o Node.js

1. Acesse: **https://nodejs.org**
2. Clique no botão verde **"LTS"** (versão recomendada — mínimo v18)
3. Baixe e instale normalmente (clique em "Next" em tudo)
4. Após instalar, **reinicie o computador**

> ✅ Para confirmar que funcionou: abra o CMD (Windows) ou Terminal (Mac) e digite:
> ```
> node --version
> ```
> Deve aparecer algo como `v20.x.x`

---

### ETAPA 2 — Personalizar os participantes

Abra o arquivo **`backend/players.json`** no Bloco de Notas (ou qualquer editor).

O formato é uma lista de participantes assim:

```json
[
  {
    "nome": "Ana",
    "sobrenome": "Silva",
    "team_id": 1,
    "team_color": "AZUL",
    "puzzle_piece": 1,
    "puzzle_number": 7
  },
  ...
]
```

**Campos importantes:**
| Campo | O que é | Exemplo |
|---|---|---|
| `nome` | Primeiro nome (= login) | `"João"` |
| `sobrenome` | Sobrenome (= senha) | `"Pereira"` |
| `team_id` | Número da equipe (1 a 11) | `3` |
| `team_color` | Cor da equipe | `"VERDE"` |
| `puzzle_piece` | Número da peça (1 a 6) | `4` |
| `puzzle_number` | Número impresso na peça física | `12` |

**Cores disponíveis:**
`AZUL` · `ROSA` · `VERDE` · `AMARELO` · `ROXO` · `LARANJA` · `VERMELHO` · `TURQUESA` · `DOURADO` · `PRATA` · `BRONZE`

---

### ETAPA 3 — Personalizar perguntas, dicas e senha final

Essas configurações estão no arquivo **`backend/server.js`**.

Abra o arquivo e procure a seção `// Perguntas` — você vai ver os blocos com as perguntas de cada etapa. Edite o texto livremente.

**Para mudar a senha final**, procure a linha:
```javascript
db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('final_password', 'PASCOA2025')").run();
```
Troque `'PASCOA2025'` pela senha que sua equipe vai montar.

**Para mudar o local do prêmio**, procure:
```javascript
db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('prize_location', 'A caixa de ovos está...')").run();
```
Troque pelo texto correto.

> ⚠️ Depois de editar o server.js, apague o arquivo `cacapascoa.db` (se já existir) para que as novas configurações sejam salvas.

---

### ETAPA 4 — Iniciar o servidor

**No Windows:**
- Clique duas vezes em **`INICIAR-WINDOWS.bat`**
- Uma janela preta vai abrir com mensagens de carregamento
- Aguarde aparecer: `✅ Acesse em: http://localhost:3000`

**No Mac ou Linux:**
- Abra o Terminal
- Arraste o arquivo `iniciar-mac-linux.sh` para a janela do terminal
- Pressione Enter

---

### ETAPA 5 — Descobrir o IP do computador

Você precisa do IP para que os celulares dos participantes acessem o sistema.

**Windows:**
1. Pressione `Windows + R`, digite `cmd`, Enter
2. Digite: `ipconfig`
3. Procure a linha **"Endereço IPv4"** — será algo como `192.168.1.10`

**Mac:**
1. Abra o Terminal
2. Digite: `ifconfig | grep "inet "`
3. Procure um número no formato `192.168.x.x`

---

### ETAPA 6 — Gerar o QR Code para os participantes

1. Abra o arquivo **`GERAR-QR-CODE.html`** no navegador
2. Digite o IP encontrado no passo anterior (ex: `192.168.1.10`)
3. Clique em "Gerar QR Code"
4. Imprima ou projete o QR Code no telão
5. Os participantes escaneiam com o celular e acessam o jogo!

---

### ETAPA 7 — Importar participantes (se editou o players.json)

Se você personalizou o `players.json`, precisa importar os dados:

**Windows:**
1. Abra o CMD na pasta `backend`
2. Digite: `node importar-participantes.js`

**Mac/Linux:**
1. Abra o Terminal na pasta `backend`
2. Digite: `node importar-participantes.js`

---

## 🎮 DURANTE O EVENTO

### Como os participantes jogam:
1. Escaneiam o QR Code com o celular
2. Clicam em "Começar a Caça"
3. Fazem login: **Primeiro nome** + **Sobrenome** como senha
4. Respondem 3 etapas de quiz
5. Recebem a cor da equipe e o número da peça
6. Encontram a equipe, montam o quebra-cabeça
7. Digitam a senha formada pelos números → revelação do prêmio!

### Dashboard Admin (Telão):
- Acesse: `http://SEU_IP:3000` → clique em **Admin**
- Ou direto: `http://SEU_IP:3000/admin` (se usar rota dedicada)
- Atualizações em **tempo real** sem precisar dar F5
- Toggle para mostrar/ocultar equipes

---

## 🔄 RESETAR PARA UM NOVO EVENTO

No painel Admin, role até o final e clique em **"Resetar Progresso"**.
Isso apaga somente o progresso — os participantes permanecem cadastrados.

---

## 🍓 INICIAR AUTOMATICAMENTE NO RASPBERRY PI

Para o servidor ligar sozinho quando o Raspberry Pi iniciar:

```bash
# Instala o PM2 (gerenciador de processos)
npm install -g pm2

# Entra na pasta do backend
cd /caminho/para/cacapascoa/backend
npm install

# Registra o servidor para iniciar automaticamente
pm2 start server.js --name cacapascoa
pm2 startup
pm2 save
```

Depois disso, o servidor liga sempre que o Raspberry ligar, mesmo sem fazer login.

---

## ❓ PROBLEMAS COMUNS

| Problema | Solução |
|---|---|
| "npm não encontrado" | Reinstale o Node.js e reinicie o computador |
| Celular não acessa | Confirme que celular e computador estão na **mesma rede Wi-Fi** |
| "Porta 3000 em uso" | Feche outros programas ou reinicie o computador |
| Login não funciona | Verifique se o `players.json` foi importado; confira nome/sobrenome exatos |
| Dados sumindo | O banco `cacapascoa.db` foi apagado — não apague esse arquivo durante o evento |
| Atualização não aparece no telão | O WebSocket desconectou — aguarde 3s, reconecta automaticamente |

---

## 📞 SUPORTE RÁPIDO

Se algo der errado durante o evento:
1. Feche a janela preta do servidor
2. Clique duas vezes em `INICIAR-WINDOWS.bat` novamente
3. O banco de dados é preservado — nada se perde

---

*CaçaPáscoa 🐰 — Desenvolvido para rodar 100% local, sem internet.*
