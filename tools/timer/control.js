// Manejo seguro de Socket.IO
let socket = null;
if (typeof io !== 'undefined') {
  socket = io();
}

// Obtener el ID del temporizador desde la URL (Ej: control.html?id=timer2)
const urlParams = new URLSearchParams(window.location.search);
const timerId = urlParams.get('id') || 'timer1';

let timerInterval = null;
let isRunning = false;
let remainingSeconds = 600;

document.addEventListener('DOMContentLoaded', () => {
  // Mostrar visualmente el ID actual en el título si existe el elemento
  const idLabel = document.getElementById('timerIdLabel');
  if (idLabel) idLabel.textContent = `[${timerId}]`;

  // Inicialización de elementos del DOM tras la carga del HTML
  const timerModeSelect = document.getElementById('timerMode');
  const inputHours = document.getElementById('inputHours');
  const inputMinutes = document.getElementById('inputMinutes');
  const inputSeconds = document.getElementById('inputSeconds');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnReset = document.getElementById('btnReset');
  const showLabelsInput = document.getElementById('showLabels');

  const textColorInput = document.getElementById('textColor');
  const fontSizeInput = document.getElementById('fontSize');
  const btnBold = document.getElementById('btnBold');
  const enableShadowInput = document.getElementById('enableShadow');
  const shadowDistInput = document.getElementById('shadowDist');
  const shadowBlurInput = document.getElementById('shadowBlur');
  const alignButtons = document.querySelectorAll('.btn-align');

  const overlayContainer = document.getElementById('overlayContainer');
  const timerDisplay = document.getElementById('timerDisplay');

  let currentAlignment = 'left';
  let isBold = true;

  // Solicitar estado inicial al servidor para este ID
  if (socket) {
    socket.emit('get_status', timerId);
  }

  function getSecondsFromInput() {
    const h = parseInt(inputHours.value, 10) || 0;
    const m = parseInt(inputMinutes.value, 10) || 0;
    const s = parseInt(inputSeconds.value, 10) || 0;
    return (h * 3600) + (m * 60) + s;
  }

  function getFormattedTime() {
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (showLabelsInput.checked) {
      return h > 0 ? `${pad(h)}h ${pad(m)}m ${pad(s)}s` : `${pad(m)}m ${pad(s)}s`;
    } else {
      return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    }
  }

  function syncState(action = 'sync') {
    const formattedText = getFormattedTime();

    // 1. Actualización en la interfaz local
    if (timerDisplay && overlayContainer) {
      timerDisplay.innerText = formattedText;
      overlayContainer.style.textAlign = currentAlignment;
      timerDisplay.style.color = textColorInput.value;
      timerDisplay.style.fontSize = `${fontSizeInput.value}px`;
      timerDisplay.style.fontWeight = isBold ? 'bold' : 'normal';

      if (enableShadowInput.checked) {
        const dist = shadowDistInput.value;
        const blur = shadowBlurInput.value;
        timerDisplay.style.textShadow = `-${dist}px ${dist}px ${blur}px rgba(0, 0, 0, 0.8)`;
      } else {
        timerDisplay.style.textShadow = 'none';
      }
    }

    // 2. Transmisión a WebSocket incluyendo el timerId y la acción
    if (socket && socket.connected) {
      try {
        socket.emit('update_timer', {
          timerId: timerId,
          action: action,
          config: {
            seconds: remainingSeconds,
            mode: timerModeSelect.value,
            formattedText,
            align: currentAlignment,
            color: textColorInput.value,
            size: fontSizeInput.value,
            bold: isBold,
            shadow: enableShadowInput.checked,
            shadowDist: shadowDistInput.value,
            shadowBlur: shadowBlurInput.value
          }
        });
      } catch (err) {
        console.warn('Error al transmitir evento vía Socket:', err);
      }
    }
  }

  // --- Asignación de Listeners de Eventos ---
  btnPlayPause.addEventListener('click', () => {
    // Alternamos el estado local y enviamos la acción de toggle al servidor
    syncState('toggle');
  });

  btnReset.addEventListener('click', () => {  
    remainingSeconds = getSecondsFromInput(); 
    syncState('reset');
  });

  [inputHours, inputMinutes, inputSeconds].forEach(inp => {
    inp.addEventListener('input', () => {
      if (!isRunning) {
        remainingSeconds = getSecondsFromInput();
        syncState('config');
      }
    });
  });

  timerModeSelect.addEventListener('change', () => {
    remainingSeconds = getSecondsFromInput(); 
    syncState('config');
  });

  showLabelsInput.addEventListener('change', () => syncState('config'));

  alignButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      alignButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAlignment = btn.dataset.align;
      syncState('config');
    });
  });

  btnBold.addEventListener('click', () => {
    isBold = !isBold;
    btnBold.classList.toggle('active', isBold);
    syncState('config');
  });

  [textColorInput, fontSizeInput, enableShadowInput, shadowDistInput, shadowBlurInput].forEach(elem => {
    elem.addEventListener('input', () => syncState('config'));
    elem.addEventListener('change', () => syncState('config'));
  });

  // Escuchar la sincronización exclusiva para este timerId desde el servidor
  if (socket) {
    socket.on(`sync_timer_${timerId}`, (data) => {
      if (data.seconds !== undefined) remainingSeconds = data.seconds;
      if (data.formattedText && timerDisplay) timerDisplay.innerText = data.formattedText;
      
      if (data.running !== undefined) {
        isRunning = data.running;
        if (isRunning) {
          btnPlayPause.innerHTML = '⏸ Pausar';
          btnPlayPause.style.backgroundColor = 'var(--red-hover)';
        } else {
          btnPlayPause.innerHTML = '▶ Iniciar';
          btnPlayPause.style.backgroundColor = 'var(--red-accent)';
        }
      }

      if (data.color && textColorInput) textColorInput.value = data.color;
      if (data.size && fontSizeInput) fontSizeInput.value = data.size;
      if (data.mode && timerModeSelect) timerModeSelect.value = data.mode;
    });
  }

  // Ejecución inicial al cargar
  remainingSeconds = getSecondsFromInput();
  syncState('config');
});