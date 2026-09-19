const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos desde la carpeta actual (ajusta si tus archivos están en otra ruta)
app.use(express.static(path.join(__dirname)));

// Objeto en memoria para almacenar múltiples temporizadores de forma independiente
const activeTimers = {};

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // 1. Cuando un cliente (control u overlay) solicita el estado inicial
  socket.on('get_status', (timerId) => {
    if (!timerId) return;

    if (!activeTimers[timerId]) {
      activeTimers[timerId] = {
        seconds: 600, // Por defecto 10 minutos (600 segundos)
        running: false,
        mode: 'countdown',
        interval: null,
        color: '#ffffff',
        size: 48,
        bold: true,
        shadow: true,
        shadowDist: 4,
        shadowBlur: 4,
        showLabels: true
      };
    }

    // Enviar el estado actual únicamente a este cliente
    socket.emit(`sync_timer_${timerId}`, getPublicState(activeTimers[timerId]));
  });

  // 2. Manejar acciones (Iniciar/Pausar, Reiniciar, Cambiar configuración)
  socket.on('update_timer', (data) => {
    const { timerId, action, config } = data;
    if (!timerId) return;

    if (!activeTimers[timerId]) {
      activeTimers[timerId] = {
        seconds: 600,
        running: false,
        mode: 'countdown',
        interval: null,
        color: '#ffffff',
        size: 48,
        bold: true,
        shadow: true,
        shadowDist: 4,
        shadowBlur: 4,
        showLabels: true
      };
    }

    const timer = activeTimers[timerId];

    // Actualizar configuración visual o de tiempo si viene en el paquete
    if (config) {
      if (config.seconds !== undefined && !timer.running) timer.seconds = config.seconds;
      if (config.mode !== undefined) timer.mode = config.mode;
      if (config.color !== undefined) timer.color = config.color;
      if (config.size !== undefined) timer.size = config.size;
      if (config.bold !== undefined) timer.bold = config.bold;
      if (config.shadow !== undefined) timer.shadow = config.shadow;
      if (config.shadowDist !== undefined) timer.shadowDist = config.shadowDist;
      if (config.shadowBlur !== undefined) timer.shadowBlur = config.shadowBlur;
      if (config.showLabels !== undefined) timer.showLabels = config.showLabels;
    }

    // Lógica para Iniciar / Pausar (Toggle)
    if (action === 'toggle') {
      timer.running = !timer.running;

      if (timer.running) {
        if (timer.interval) clearInterval(timer.interval);

        timer.interval = setInterval(() => {
          if (timer.mode === 'countdown') {
            if (timer.seconds > 0) {
              timer.seconds--;
            } else {
              timer.running = false;
              clearInterval(timer.interval);
            }
          } else {
            timer.seconds++;
          }
          // Transmitir a todos los conectados a este timerId específico
          io.emit(`sync_timer_${timerId}`, getPublicState(timer));
        }, 1000);
      } else {
        clearInterval(timer.interval);
      }
    } 
    // Lógica para Reiniciar
    else if (action === 'reset') {
      timer.running = false;
      clearInterval(timer.interval);
      if (config && config.seconds !== undefined) {
        timer.seconds = config.seconds;
      }
    }

    // Transmitir el estado actualizado a todos los clientes de este timerId (paneles y overlays)
    io.emit(`sync_timer_${timerId}`, getPublicState(timer));
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Funciones auxiliares de formato
function formatTime(totalSeconds, showLabels = true) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (showLabels) {
    return h > 0 ? `${pad(h)}h ${pad(m)}m ${pad(s)}s` : `${pad(m)}m ${pad(s)}s`;
  } else {
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }
}

function getPublicState(timer) {
  return {
    seconds: timer.seconds,
    formattedText: formatTime(timer.seconds, timer.showLabels),
    running: timer.running,
    mode: timer.mode,
    color: timer.color,
    size: timer.size,
    bold: timer.bold,
    shadow: timer.shadow,
    shadowDist: timer.shadowDist,
    shadowBlur: timer.shadowBlur,
    showLabels: timer.showLabels
  };
}

// Configuración de puerto compatible con Railway y entorno local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor de temporizadores corriendo en el puerto ${PORT}`);
});