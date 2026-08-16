// Manejo seguro de Socket.IO
let socket = null;
if (typeof io !== 'undefined') {
  socket = io();
}

let timerInterval = null;
let isRunning = false;
let remainingSeconds = 600;

document.addEventListener('DOMContentLoaded', () => {
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

  function syncState() {
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

    // 2. Transmisión a WebSocket si está activo
    if (socket && socket.connected) {
      try {
        socket.emit('update_timer', {
          formattedText,
          align: currentAlignment,
          color: textColorInput.value,
          size: fontSizeInput.value,
          bold: isBold,
          shadow: enableShadowInput.checked,
          shadowDist: shadowDistInput.value,
          shadowBlur: shadowBlurInput.value
        });
      } catch (err) {
        console.warn('Error al transmitir evento vía Socket:', err);
      }
    }
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    btnPlayPause.innerHTML = '⏸ Pausar';
    btnPlayPause.style.backgroundColor = 'var(--red-hover)';

    timerInterval = setInterval(() => {
      const mode = timerModeSelect.value;
      if (mode === 'countdown') {
        if (remainingSeconds > 0) {
          remainingSeconds--;
          syncState();
        } else {
          pauseTimer();
          timerDisplay.innerText = "¡TIEMPO!";
          syncState();
        }
      } else {
        remainingSeconds++;
        syncState();
      }
    }, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    btnPlayPause.innerHTML = '▶ Iniciar';
    btnPlayPause.style.backgroundColor = 'var(--red-accent)';
  }

  // --- Asignación de Listeners de Eventos ---
  btnPlayPause.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  btnReset.addEventListener('click', () => {
    pauseTimer();
    const mode = timerModeSelect.value;
    remainingSeconds = mode === 'countdown' ? getSecondsFromInput() : 0;
    syncState();
  });

  [inputHours, inputMinutes, inputSeconds].forEach(inp => {
    inp.addEventListener('input', () => {
      if (!isRunning && timerModeSelect.value === 'countdown') {
        remainingSeconds = getSecondsFromInput();
        syncState();
      }
    });
  });

  timerModeSelect.addEventListener('change', () => {
    pauseTimer();
    remainingSeconds = timerModeSelect.value === 'countdown' ? getSecondsFromInput() : 0;
    syncState();
  });

  showLabelsInput.addEventListener('change', syncState);

  alignButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      alignButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAlignment = btn.dataset.align;
      syncState();
    });
  });

  btnBold.addEventListener('click', () => {
    isBold = !isBold;
    btnBold.classList.toggle('active', isBold);
    syncState();
  });

  [textColorInput, fontSizeInput, enableShadowInput, shadowDistInput, shadowBlurInput].forEach(elem => {
    elem.addEventListener('input', syncState);
    elem.addEventListener('change', syncState);
  });

  // Ejecución inicial al cargar
  remainingSeconds = getSecondsFromInput();
  syncState();
});