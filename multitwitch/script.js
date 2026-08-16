const parentDomain = window.location.hostname;
let currentS1 = '';
let currentS2 = '';

function loadStreams() {
    const s1 = document.getElementById('streamer1').value.trim();
    const s2 = document.getElementById('streamer2').value.trim();

    if (s1 && s1 !== currentS1) {
        currentS1 = s1;
        document.getElementById('player1').src =
            `https://player.twitch.tv/?channel=${s1}&parent=${parentDomain}&muted=true`;
    }
    if (s2 && s2 !== currentS2) {
        currentS2 = s2;
        document.getElementById('player2').src =
            `https://player.twitch.tv/?channel=${s2}&parent=${parentDomain}&muted=true`;
    }

    updateSelectLabels();
    applyLayout();
}

function syncStreams() {
    // Recarga ambos reproductores al mismo tiempo, con el mismo timestamp,
    // para que ambos streams queden alineados/sincronizados entre sí.
    const timestamp = Date.now();

    if (currentS1) {
        document.getElementById('player1').src =
            `https://player.twitch.tv/?channel=${currentS1}&parent=${parentDomain}&muted=true&sync=${timestamp}`;
    }
    if (currentS2) {
        document.getElementById('player2').src =
            `https://player.twitch.tv/?channel=${currentS2}&parent=${parentDomain}&muted=true&sync=${timestamp}`;
    }
}

function updateSelectLabels() {
    const opt1 = document.getElementById('optChat1');
    const opt2 = document.getElementById('optChat2');

    opt1.textContent = currentS1 ? `Chat de ${currentS1}` : 'Chat 1';
    opt2.textContent = currentS2 ? `Chat de ${currentS2}` : 'Chat 2';
}

// Devuelve la plantilla de grid (columnas, filas, áreas) según
// el modo de vista ("side" | "stack") y el estado de los chats
// ("none" | "chat1" | "chat2" | "both").
function getGridTemplate(mode, state) {
    const CHAT = '320px';

    if (mode === 'side') {
        switch (state) {
            case 'chat1':
                return { columns: `1fr ${CHAT} 1fr`, rows: '1fr', areas: ['s1 c1 s2'] };
            case 'chat2':
                return { columns: `1fr ${CHAT} 1fr`, rows: '1fr', areas: ['s1 c2 s2'] };
            case 'both':
                // chat1 en el costado izquierdo, ambos streams al centro, chat2 en el costado derecho
                return { columns: `${CHAT} 1fr 1fr ${CHAT}`, rows: '1fr', areas: ['c1 s1 s2 c2'] };
            default:
                return { columns: '1fr 1fr', rows: '1fr', areas: ['s1 s2'] };
        }
    }

    // mode === 'stack': streams uno debajo del otro, chat fijo a la derecha
    switch (state) {
        case 'chat1':
            return { columns: `1fr ${CHAT}`, rows: '1fr 1fr', areas: ['s1 c1', 's2 c1'] };
        case 'chat2':
            return { columns: `1fr ${CHAT}`, rows: '1fr 1fr', areas: ['s1 c2', 's2 c2'] };
        case 'both':
            // chat1 a toda altura en el costado izquierdo, chat2 a toda altura en el derecho
            return { columns: `${CHAT} 1fr ${CHAT}`, rows: '1fr 1fr', areas: ['c1 s1 c2', 'c1 s2 c2'] };
        default:
            return { columns: '1fr', rows: '1fr 1fr', areas: ['s1', 's2'] };
    }
}

function applyLayout() {
    const chatOption = document.getElementById('chatOption').value;
    const layoutMode = document.getElementById('layoutMode').value;
    const container = document.getElementById('layoutContainer');
    const chat1Frame = document.getElementById('chat1');
    const chat2Frame = document.getElementById('chat2');

    const setChatSrc = (frame, streamer) => {
        const targetUrl = `https://www.twitch.tv/embed/${streamer}/chat?parent=${parentDomain}&darkpopout`;
        if (frame.src !== targetUrl) {
            frame.src = targetUrl;
        }
    };

    const wantsChat1 = (chatOption === 'chat1' || chatOption === 'both') && currentS1;
    const wantsChat2 = (chatOption === 'chat2' || chatOption === 'both') && currentS2;

    if (wantsChat1) {
        setChatSrc(chat1Frame, currentS1);
        chat1Frame.style.display = 'block';
    } else {
        chat1Frame.style.display = 'none';
    }

    if (wantsChat2) {
        setChatSrc(chat2Frame, currentS2);
        chat2Frame.style.display = 'block';
    } else {
        chat2Frame.style.display = 'none';
    }

    let state = 'none';
    if (wantsChat1 && wantsChat2) state = 'both';
    else if (wantsChat1) state = 'chat1';
    else if (wantsChat2) state = 'chat2';

    const { columns, rows, areas } = getGridTemplate(layoutMode, state);

    container.style.gridTemplateColumns = columns;
    container.style.gridTemplateRows = rows;
    container.style.gridTemplateAreas = areas.map(row => `"${row}"`).join(' ');

    container.classList.toggle('stacked', layoutMode === 'stack');
    container.dataset.state = state;
}

// Estado inicial
applyLayout();