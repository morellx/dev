const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir archivos estáticos (ajusta la carpeta si usas 'public' o la raíz)
app.use(express.static(path.join(__dirname)));

let deathState = {
  p1: { deaths: 0, username: 'Steve' },
  p2: { enabled: false, deaths: 0, username: 'Alex' },
  labelText: 'MUERTES',
  color: '#ffffff',
  size: 38,
  animation: 'bounce'
};

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.emit('updateDeathState', deathState);

  socket.on('updateDeathState', (data) => {
    deathState = data;
    io.emit('updateDeathState', deathState);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor de Sockets ejecutándose en puerto ${PORT}`);
});