const socket = io();

// P1
const p1SkinSelect = document.getElementById('p1SkinSelect');
const p1CustomGroup = document.getElementById('p1CustomGroup');
const p1Username = document.getElementById('p1Username');
const btnP1Add = document.getElementById('btnP1Add');
const btnP1Sub = document.getElementById('btnP1Sub');

// P2
const enableP2 = document.getElementById('enableP2');
const p2ConfigGroup = document.getElementById('p2ConfigGroup');
const p2SkinSelect = document.getElementById('p2SkinSelect');
const p2CustomGroup = document.getElementById('p2CustomGroup');
const p2Username = document.getElementById('p2Username');
const btnP2Add = document.getElementById('btnP2Add');
const btnP2Sub = document.getElementById('btnP2Sub');

// Controles Generales
const btnResetAll = document.getElementById('btnResetAll');
const labelTextInput = document.getElementById('labelText');
const textColor = document.getElementById('textColor');
const fontSize = document.getElementById('fontSize');
const animSelect = document.getElementById('animSelect');

// Vista Previa
const p1Block = document.getElementById('p1Block');
const p1Head = document.getElementById('p1Head');
const p1Deaths = document.getElementById('p1Deaths');

const p2Block = document.getElementById('p2Block');
const p2Divider = document.getElementById('p2Divider');
const p2Head = document.getElementById('p2Head');
const p2Deaths = document.getElementById('p2Deaths');

const deathLabel = document.getElementById('deathLabel');

let state = {
  p1: { deaths: 0, username: 'Steve' },
  p2: { enabled: false, deaths: 0, username: 'Alex' },
  labelText: 'MUERTES',
  color: '#ffffff',
  size: 38,
  animation: 'bounce'
};

function getSkinUrl(user) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(user)}/64`;
}

function updateState(triggerAnimP1 = false, triggerAnimP2 = false) {
  // P1
  p1Deaths.textContent = state.p1.deaths;
  p1Head.src = getSkinUrl(state.p1.username);
  
  // P2
  if (state.p2.enabled) {
    p2ConfigGroup.style.display = 'block';
    p2Block.style.display = 'flex';
    p2Divider.style.display = 'block';
    p2Deaths.textContent = state.p2.deaths;
    p2Head.src = getSkinUrl(state.p2.username);
  } else {
    p2ConfigGroup.style.display = 'none';
    p2Block.style.display = 'none';
    p2Divider.style.display = 'none';
  }

  // Estilos Generales
  deathLabel.textContent = state.labelText;
  
  p1Deaths.style.color = state.color;
  p2Deaths.style.color = state.color;
  deathLabel.style.color = state.color;

  // Sincroniza el tamaño de la cara e ícono al valor seleccionado
  p1Deaths.style.fontSize = `${state.size}px`;
  p2Deaths.style.fontSize = `${state.size}px`;
  p1Head.style.width = `${state.size}px`;
  p1Head.style.height = `${state.size}px`;
  p2Head.style.width = `${state.size}px`;
  p2Head.style.height = `${state.size}px`;
  
  const labelCalculatedSize = Math.max(12, Math.round(state.size * 0.38));
  deathLabel.style.fontSize = `${labelCalculatedSize}px`;

  // Animaciones
  if (triggerAnimP1) {
    p1Block.classList.remove('anim-bounce', 'anim-shake', 'anim-pop', 'anim-spin');
    void p1Block.offsetWidth;
    p1Block.classList.add(`anim-${state.animation}`);
  }

  if (triggerAnimP2) {
    p2Block.classList.remove('anim-bounce', 'anim-shake', 'anim-pop', 'anim-spin');
    void p2Block.offsetWidth;
    p2Block.classList.add(`anim-${state.animation}`);
  }

  socket.emit('updateDeathState', { ...state, triggerAnimP1, triggerAnimP2 });
}

// Event Listeners P1
btnP1Add.addEventListener('click', () => { state.p1.deaths++; updateState(true, false); });
btnP1Sub.addEventListener('click', () => { if (state.p1.deaths > 0) state.p1.deaths--; updateState(false, false); });

p1SkinSelect.addEventListener('change', (e) => {
  p1CustomGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
  state.p1.username = e.target.value === 'custom' ? p1Username.value || 'Steve' : e.target.value;
  updateState();
});
p1Username.addEventListener('input', (e) => {
  state.p1.username = e.target.value.trim() || 'Steve';
  updateState();
});

// Event Listeners P2
enableP2.addEventListener('change', (e) => {
  state.p2.enabled = e.target.checked;
  updateState();
});
btnP2Add.addEventListener('click', () => { state.p2.deaths++; updateState(false, true); });
btnP2Sub.addEventListener('click', () => { if (state.p2.deaths > 0) state.p2.deaths--; updateState(false, false); });

p2SkinSelect.addEventListener('change', (e) => {
  p2CustomGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
  state.p2.username = e.target.value === 'custom' ? p2Username.value || 'Alex' : e.target.value;
  updateState();
});
p2Username.addEventListener('input', (e) => {
  state.p2.username = e.target.value.trim() || 'Alex';
  updateState();
});

// Controles Generales
btnResetAll.addEventListener('click', () => {
  state.p1.deaths = 0;
  state.p2.deaths = 0;
  updateState();
});

labelTextInput.addEventListener('input', (e) => { state.labelText = e.target.value; updateState(); });
textColor.addEventListener('input', (e) => { state.color = e.target.value; updateState(); });
fontSize.addEventListener('input', (e) => { state.size = parseInt(e.target.value) || 38; updateState(); });
animSelect.addEventListener('change', (e) => { state.animation = e.target.value; });