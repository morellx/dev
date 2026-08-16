const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// -------------------------------------------------------------
// ESTADO 1: Contador de Muertes (Tu lógica existente)
// -------------------------------------------------------------
let deathState = {
  p1: { deaths: 0, username: 'Steve' },
  p2: { enabled: false, deaths: 0, username: 'Alex' },
  labelText: 'MUERTES',
  color: '#ffffff',
  size: 38,
  animation: 'bounce'
};

// -------------------------------------------------------------
// ESTADO 2: Ruleta de Subs (Lógica nueva)
// -------------------------------------------------------------
let rouletteParticipants = [];

function addRouletteTickets(username, count = 1) {
  for (let i = 0; i < count; i++) {
    rouletteParticipants.push(username);
  }
  console.log(`[SUBS] Registradas ${count} entradas para: ${username}`);
  io.emit('update_participants', rouletteParticipants);
  io.emit('new_sub_alert', { username, count });
}

// -------------------------------------------------------------
// SOCKET.IO (Manejo de todas las herramientas)
// -------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // --- Muertes ---
  socket.emit('updateDeathState', deathState);
  socket.on('updateDeathState', (data) => {
    deathState = data;
    io.emit('updateDeathState', deathState);
  });

  // --- Temporizador ---
  socket.on('update_timer', (data) => {
    io.emit('sync_timer', data);    
  });

  // --- Ruleta ---
  socket.emit('update_participants', rouletteParticipants);

  socket.on('add_manual', (data) => {
    if (data && data.name) {
      addRouletteTickets(data.name, data.tickets || 1);
    }
  });

  socket.on('clear_roulette', () => {
    rouletteParticipants = [];
    io.emit('update_participants', rouletteParticipants);
  });
});

// -------------------------------------------------------------
// INTEGRACIÓN CON TWITCH EVENTSUB (Nuevo)
// -------------------------------------------------------------
async function initTwitchEventSub() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const accessToken = process.env.TWITCH_USER_TOKEN;
  const broadcasterId = process.env.TWITCH_BROADCASTER_ID;

  if (!clientId || !accessToken || !broadcasterId) {
    console.warn('⚠️ Falta configurar variables de Twitch en .env. La ruleta funcionará en modo manual.');
    return;
  }

  try {
    const { ApiClient } = await import('@twurple/api');
    const { StaticAuthProvider } = await import('@twurple/auth');
    const { EventSubWsListener } = await import('@twurple/eventsub-ws');

    const authProvider = new StaticAuthProvider(clientId, accessToken);
    const apiClient = new ApiClient({ authProvider });
    const listener = new EventSubWsListener({ apiClient });

    // Escuchar Subs Regaladas
    listener.onChannelSubscriptionGift(broadcasterId, (e) => {
      const giver = e.isAnonymous ? 'Anónimo' : e.giverDisplayName;
      const count = e.amount || 1;
      addRouletteTickets(giver, count);
    });

    // Escuchar Subs Directas
    listener.onChannelSubscription(broadcasterId, (e) => {
      addRouletteTickets(e.userDisplayName, 1);
    });

    await listener.start();
    console.log('✅ Twitch EventSub WebSocket conectado con éxito');
  } catch (err) {
    console.error('❌ Error conectando a Twitch EventSub:', err);
  }
}

initTwitchEventSub();

// -------------------------------------------------------------
// PUERTO DEL SERVIDOR
// -------------------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor de Sockets ejecutándose en puerto ${PORT}`);
});