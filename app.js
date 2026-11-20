// Adventskalender – öffentliche Ansicht
// Die Inhalte stehen in inhalte.json und werden über bearbeiten.html gepflegt.

const GEOEFFNET_KEY = 'adventskalender-geoeffnet';

// Feste, „zufällig“ wirkende Reihenfolge der Türchen (wie bei einem echten Kalender)
const REIHENFOLGE = [17, 5, 22, 11, 1, 29, 14, 8, 24, 3, 19, 27, 10, 31, 6, 21, 13, 2, 26, 16,
  9, 30, 4, 23, 12, 18, 28, 7, 15, 25, 20];

function geoeffneteLaden() {
  try { return new Set(JSON.parse(localStorage.getItem(GEOEFFNET_KEY)) || []); }
  catch { return new Set(); }
}

function geoeffneteSpeichern(set) {
  try { localStorage.setItem(GEOEFFNET_KEY, JSON.stringify([...set])); } catch { /* egal */ }
}

// Ein Türchen darf ab dem jeweiligen Dezembertag (00:00 Uhr Ortszeit) geöffnet werden.
function istFreigeschaltet(tag, jahr) {
  return new Date() >= new Date(jahr, 11, tag);
}

function zeigeDialog(titel, text) {
  document.getElementById('dialog-titel').textContent = titel;
  document.getElementById('dialog-text').textContent = text;
  const dialog = document.getElementById('dialog');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

async function start() {
  const status = document.getElementById('status');
  let daten;
  try {
    const antwort = await fetch('inhalte.json', { cache: 'no-store' });
    if (!antwort.ok) throw new Error(antwort.status);
    daten = await antwort.json();
  } catch (e) {
    status.textContent = 'Der Kalender konnte nicht geladen werden. Bitte später erneut versuchen.';
    return;
  }

  const jahr = Number(daten.jahr) || new Date().getFullYear();
  const tage = Math.min(Math.max(Number(daten.tage) || 24, 1), 31);
  const texte = daten.tuerchen || {};

  if (daten.titel) {
    document.getElementById('titel').textContent = daten.titel;
    document.title = daten.titel;
  }
  document.getElementById('untertitel').textContent = daten.untertitel || '';

  const heute = new Date();
  if (heute < new Date(jahr, 11, 1)) {
    status.textContent = `Noch etwas Geduld – am 1. Dezember ${jahr} geht es los!`;
  } else {
    status.textContent = '';
  }

  const geoeffnet = geoeffneteLaden();
  const kalender = document.getElementById('kalender');
  kalender.innerHTML = '';

  REIHENFOLGE.filter((t) => t <= tage).forEach((tag) => {
    const tuer = document.createElement('button');
    tuer.type = 'button';
    tuer.className = 'tuer';
    tuer.dataset.tag = tag;
    tuer.innerHTML = `<span class="zahl">${tag}</span>`;

    const frei = istFreigeschaltet(tag, jahr);
    if (!frei) tuer.classList.add('gesperrt');
    if (frei && geoeffnet.has(tag)) tuer.classList.add('offen');

    if (heute.getFullYear() === jahr && heute.getMonth() === 11 && heute.getDate() === tag) {
      tuer.classList.add('heute');
    }

    tuer.setAttribute('aria-label', frei ? `Türchen ${tag} öffnen` : `Türchen ${tag} (noch verschlossen)`);

    tuer.addEventListener('click', () => {
      if (!istFreigeschaltet(tag, jahr)) {
        tuer.classList.remove('wackeln');
        void tuer.offsetWidth; // Animation neu starten
        tuer.classList.add('wackeln');
        zeigeDialog(`Türchen ${tag}`, `Nicht schummeln! 😉\nDieses Türchen öffnet sich erst am ${tag}. Dezember.`);
        return;
      }
      tuer.classList.add('offen');
      geoeffnet.add(tag);
      geoeffneteSpeichern(geoeffnet);
      const text = (texte[tag] || texte[String(tag)] || '').trim();
      zeigeDialog(`${tag}. Dezember`, text || 'Hinter diesem Türchen ist noch nichts versteckt.');
    });

    kalender.appendChild(tuer);
  });
}

document.getElementById('dialog-schliessen').addEventListener('click', () => {
  const dialog = document.getElementById('dialog');
  if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
});

document.getElementById('dialog').addEventListener('click', (e) => {
  if (e.target.id === 'dialog' && typeof e.target.close === 'function') e.target.close();
});

start();
