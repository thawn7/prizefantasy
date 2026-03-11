/* ================================================
   PrizePicks Tennis Fantasy Calculator - Logic
   ================================================ */

const PTS = {
    MATCH: 10,
    GAME_W: 1,
    GAME_L: -1,
    SET_W: 3,
    SET_L: -3,
    ACE: 0.5,
    DF: -0.5
};

let has3 = false;

// ===== Theme Toggle =====
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('toggle-icon');
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        icon.textContent = '☀️';
        localStorage.setItem('ppTheme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        icon.textContent = '🌙';
        localStorage.setItem('ppTheme', 'dark');
    }
}

// Load saved theme
(function loadTheme() {
    const saved = localStorage.getItem('ppTheme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        const icon = document.getElementById('toggle-icon');
        if (icon) icon.textContent = saved === 'dark' ? '🌙' : '☀️';
    }
})();

// ===== Adjust score via +/- buttons =====
function adj(id, d) {
    const el = document.getElementById(id);
    let v = parseInt(el.value) || 0;
    v = Math.max(0, v + d);
    if (id.match(/s[123]$/)) v = Math.min(13, v);
    el.value = v;
    calc();
}

// ===== Add / Remove 3rd set =====
function addSet3() {
    if (has3) return;
    has3 = true;

    const headers = document.getElementById('sb-set-headers');
    const s3h = document.createElement('span');
    s3h.textContent = 'Set 3';
    s3h.id = 's3-header';
    headers.appendChild(s3h);

    addSetCell('p1-sets', 'p1s3');
    addSetCell('p2-sets', 'p2s3');

    document.getElementById('sb-add-set').innerHTML =
        '<button class="remove-set-btn" onclick="removeSet3()">✕ Remove Set 3</button>' +
        '<button class="reset-btn" onclick="resetAll()">↺ Reset</button>';

    calc();
}

function removeSet3() {
    if (!has3) return;
    has3 = false;

    const h = document.getElementById('s3-header');
    if (h) h.remove();

    ['p1s3', 'p2s3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.closest('.sb-set-cell').remove();
    });

    document.getElementById('sb-add-set').innerHTML =
        '<button class="add-set-btn" onclick="addSet3()"><span class="add-icon">+</span>Add Set 3</button>' +
        '<button class="reset-btn" onclick="resetAll()">↺ Reset</button>';

    calc();
}

function addSetCell(containerId, inputId) {
    const cell = document.createElement('div');
    cell.className = 'sb-set-cell new';
    cell.innerHTML = `
        <button class="sb-btn minus" onclick="adj('${inputId}',-1)">−</button>
        <input type="number" class="sb-input" id="${inputId}" min="0" max="13" value="0" oninput="calc()">
        <button class="sb-btn plus" onclick="adj('${inputId}',1)">+</button>`;
    document.getElementById(containerId).appendChild(cell);
}

// ===== Breakdown Tab Switching (removed — now side by side) =====


// ===== Calculate =====
function calc() {
    const p1 = getPlayer('p1');
    const p2 = getPlayer('p2');

    document.getElementById('p1-pts').textContent = p1.total.toFixed(1);
    document.getElementById('p2-pts').textContent = p2.total.toFixed(1);

    const n1 = document.getElementById('player1-name').value || 'Player 1';
    const n2 = document.getElementById('player2-name').value || 'Player 2';

    // Update breakdown names
    document.getElementById('bd-name-p1').textContent = n1;
    document.getElementById('bd-name-p2').textContent = n2;

    renderBD('p1', p1);
    renderBD('p2', p2);

    pulse('p1-pts');
    pulse('p2-pts');
}

function val(id) { const e = document.getElementById(id); return e ? (parseInt(e.value) || 0) : 0; }

function getPlayer(p) {
    const o = p === 'p1' ? 'p2' : 'p1';

    const s = [val(`${p}s1`), val(`${p}s2`)];
    const os = [val(`${o}s1`), val(`${o}s2`)];
    if (has3) { s.push(val(`${p}s3`)); os.push(val(`${o}s3`)); }

    const gamesWon = s.reduce((a, b) => a + b, 0);
    const gamesLost = os.reduce((a, b) => a + b, 0);

    let setsWon = 0, setsLost = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] > 0 || os[i] > 0) {
            if (s[i] > os[i]) setsWon++;
            else if (os[i] > s[i]) setsLost++;
        }
    }

    const aces = val(`${p}ace`);
    const df = val(`${p}df`);

    const matchPts = PTS.MATCH;
    const gwPts = gamesWon * PTS.GAME_W;
    const glPts = gamesLost * PTS.GAME_L;
    const swPts = setsWon * PTS.SET_W;
    const slPts = setsLost * PTS.SET_L;
    const acePts = aces * PTS.ACE;
    const dfPts = df * PTS.DF;

    return {
        matchPts, gamesWon, gwPts, gamesLost, glPts,
        setsWon, swPts, setsLost, slPts,
        aces, acePts, df, dfPts,
        total: matchPts + gwPts + glPts + swPts + slPts + acePts + dfPts
    };
}

// ===== Render breakdown =====
function renderBD(p, d) {
    document.getElementById(`${p}-bd-rows`).innerHTML = [
        bdRow('Match Played', `+${d.matchPts}`, 'positive'),
        bdRow(`Games Won (${d.gamesWon})`, fmt(d.gwPts), d.gwPts > 0 ? 'positive' : 'neutral'),
        bdRow(`Games Lost (${d.gamesLost})`, fmt(d.glPts), d.glPts < 0 ? 'negative' : 'neutral'),
        bdRow(`Sets Won (${d.setsWon})`, fmt(d.swPts), d.swPts > 0 ? 'positive' : 'neutral'),
        bdRow(`Sets Lost (${d.setsLost})`, fmt(d.slPts), d.slPts < 0 ? 'negative' : 'neutral'),
        bdRow(`Aces (${d.aces})`, fmt(d.acePts), d.acePts > 0 ? 'positive' : 'neutral'),
        bdRow(`Double Faults (${d.df})`, fmt(d.dfPts), d.dfPts < 0 ? 'negative' : 'neutral'),
    ].join('');
    document.getElementById(`${p}-bd-total`).textContent = d.total.toFixed(1);
}

function bdRow(label, value, cls) {
    return `<div class="breakdown-row"><span class="br-label">${label}</span><span class="br-value ${cls}">${value}</span></div>`;
}

function fmt(v) {
    if (v > 0) return `+${v % 1 === 0 ? v : v.toFixed(1)}`;
    if (v < 0) return `${v % 1 === 0 ? v : v.toFixed(1)}`;
    return '0';
}

function pulse(id) {
    const el = document.getElementById(id);
    el.style.transform = 'scale(1.1)';
    setTimeout(() => el.style.transform = 'scale(1)', 150);
}

// ===== Reset =====
function resetAll() {
    if (has3) removeSet3();
    document.querySelectorAll('.sb-input').forEach(e => e.value = 0);
    document.getElementById('player1-name').value = 'Player 1';
    document.getElementById('player2-name').value = 'Player 2';
    calc();
}

// ===== Name change listeners =====
document.getElementById('player1-name').addEventListener('input', calc);
document.getElementById('player2-name').addEventListener('input', calc);

// ===== Init =====
calc();
