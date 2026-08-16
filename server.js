const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static(__dirname));

// Estado inicial del contador
let deathState = {
  p1: { deaths: 0, username: 'Steve' },
  p2: { enabled: false, deaths: 0, username: 'Alex' },
  labelText: 'MUERTES',
  color: '#ffffff',
  size: 38,
  animation: 'bounce'
};

// Conexión por WebSockets
io.on('connection', (socket) => {
  // Enviar estado actual a nuevos overlays que se conecten
  socket.emit('updateDeathState', deathState);

  // Escuchar actualizaciones desde control.js y retransmitir a overlay.html
  socket.on('updateDeathState', (data) => {
    deathState = data;
    io.emit('updateDeathState', deathState);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});