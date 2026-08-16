const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO con CORS activado por si se requiere
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname))); // o path.join(__dirname, 'public') si usas carpeta public

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

  // 1. Enviar el estado actual al cliente que recién se conecta (overlay)
  socket.emit('updateDeathState', deathState);

  // 2. Escuchar cambios desde control.html
  socket.on('updateDeathState', (data) => {
    deathState = data;
    // 3. Retransmitir a TODOS los overlays y controles abiertos
    io.emit('updateDeathState', deathState);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});