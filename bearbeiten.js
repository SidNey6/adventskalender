// Bearbeitungsseite: liest und speichert inhalte.json direkt im GitHub-Repository.
// Der Zugangsschlüssel (Token) steht im #-Teil des geheimen Links:
//   https://<name>.github.io/adventskalender/bearbeiten.html#token=github_pat_...
// Der #-Teil wird vom Browser nie an einen Server geschickt.

const REPO_STANDARD = { owner: 'sidney6', repo: 'adventskalender' };
const DATEI = 'inhalte.json';
const API = 'https://api.github.com';

// Owner/Repo aus der GitHub-Pages-Adresse ableiten (z. B. name.github.io/adventskalender/)
function repoErmitteln() {
  const host = location.hostname;
  if (host.endsWith('.github.io')) {
    const owner = host.replace('.github.io', '');
    const teil = location.pathname.split('/').filter(Boolean)[0];
    const repo = teil && !teil.endsWith('.html') ? teil : `${owner}.github.io`;
    return { owner, repo };
  }
  return REPO_STANDARD;
}

const { owner, repo } = repoErmitteln();
let token = '';
let branch = '';
let sha = '';
let maxTage = 31;

const $ = (id) => document.getElementById(id);

function meldung(text, art = '') {
  const el = $('meldung');
  el.textContent = text;
  el.className = 'meldung ' + art;
}

function tokenAusLink() {
  const params = new URLSearchParams(location.hash.slice(1));
  return params.get('token') || '';
}

async function api(pfad, optionen = {}) {
  const antwort = await fetch(API + pfad, {
    ...optionen,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(optionen.headers || {}),
    },
    cache: 'no-store',
  });
  if (!antwort.ok) {
    let info = '';
    try { info = (await antwort.json()).message || ''; } catch { /* egal */ }
    const fehler = new Error(`${antwort.status} ${info}`);
    fehler.status = antwort.status;
    throw fehler;
  }
  return antwort.json();
}

// UTF-8-sicheres Base64 (für Umlaute und Emojis)
function zuBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function vonBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function felderAufbauen(texte) {
  const felder = $('felder');
  felder.innerHTML = '';
  for (let tag = 1; tag <= maxTage; tag++) {
    const wrap = document.createElement('div');
    wrap.className = 'tag-feld';
    wrap.dataset.tag = tag;
    const label = document.createElement('label');
    label.htmlFor = `t-${tag}`;
    label.textContent = `${tag}. Dezember`;
    const ta = document.createElement('textarea');
    ta.id = `t-${tag}`;
    ta.value = texte[tag] || texte[String(tag)] || '';
    wrap.append(label, ta);
    felder.appendChild(wrap);
  }
  sichtbareTageAktualisieren();
}

function sichtbareTageAktualisieren() {
  const tage = Number($('f-tage').value);
  document.querySelectorAll('.tag-feld').forEach((el) => {
    el.classList.toggle('versteckt', Number(el.dataset.tag) > tage);
  });
}

async function laden() {
  meldung('Lade Inhalte …');
  const repoInfo = await api(`/repos/${owner}/${repo}`);
  branch = repoInfo.default_branch;
  if (!repoInfo.permissions || !repoInfo.permissions.push) {
    throw Object.assign(new Error('Der Token hat keine Schreibrechte für dieses Repository.'), { status: 403 });
  }
  const datei = await api(`/repos/${owner}/${repo}/contents/${DATEI}?ref=${encodeURIComponent(branch)}`);
  sha = datei.sha;
  const daten = JSON.parse(vonBase64(datei.content));

  $('f-titel').value = daten.titel || '';
  $('f-untertitel').value = daten.untertitel || '';
  $('f-jahr').value = daten.jahr || new Date().getFullYear();
  $('f-tage').value = Number(daten.tage) === 31 ? '31' : '24';
  felderAufbauen(daten.tuerchen || {});

  $('anmeldung').classList.add('versteckt');
  $('formular').classList.remove('versteckt');
  meldung('');
}

function datenSammeln() {
  const tuerchen = {};
  for (let tag = 1; tag <= maxTage; tag++) tuerchen[tag] = $(`t-${tag}`).value;
  return {
    titel: $('f-titel').value.trim(),
    untertitel: $('f-untertitel').value.trim(),
    jahr: Number($('f-jahr').value) || new Date().getFullYear(),
    tage: Number($('f-tage').value),
    tuerchen,
  };
}

async function speichern(e) {
  e.preventDefault();
  const knopf = $('speichern');
  knopf.disabled = true;
  meldung('Speichere …');
  try {
    const inhalt = JSON.stringify(datenSammeln(), null, 2) + '\n';
    const ergebnis = await api(`/repos/${owner}/${repo}/contents/${DATEI}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Adventskalender-Inhalte aktualisiert',
        content: zuBase64(inhalt),
        sha,
        branch,
      }),
    });
    sha = ergebnis.content.sha;
    meldung(`Gespeichert um ${new Date().toLocaleTimeString('de-DE')}. In ca. 1 Minute online sichtbar.`, 'ok');
  } catch (err) {
    if (err.status === 409) {
      meldung('Jemand anderes hat inzwischen gespeichert. Bitte Seite neu laden (deine Änderungen vorher kopieren).', 'fehler');
    } else {
      meldung('Speichern fehlgeschlagen: ' + err.message, 'fehler');
    }
  } finally {
    knopf.disabled = false;
  }
}

async function anmelden(neuerToken) {
  token = neuerToken.trim();
  if (!token) { $('anmeldung').classList.remove('versteckt'); return; }
  try {
    await laden();
    // Token im #-Teil behalten, damit Neuladen funktioniert und der Link kopierbar ist
    if (tokenAusLink() !== token) history.replaceState(null, '', '#token=' + encodeURIComponent(token));
  } catch (err) {
    $('formular').classList.add('versteckt');
    $('anmeldung').classList.remove('versteckt');
    const text = err.status === 401
      ? 'Der Zugangsschlüssel ist ungültig oder abgelaufen.'
      : err.status === 404
        ? 'Repository oder Datei nicht gefunden – hat der Token Zugriff auf dieses Repository?'
        : 'Fehler: ' + err.message;
    alert(text);
  }
}

$('token-ok').addEventListener('click', () => anmelden($('token-eingabe').value));
$('token-eingabe').addEventListener('keydown', (e) => { if (e.key === 'Enter') anmelden(e.target.value); });
$('formular').addEventListener('submit', speichern);
$('f-tage').addEventListener('change', sichtbareTageAktualisieren);
$('link-kopieren').addEventListener('click', async () => {
  const link = location.origin + location.pathname + '#token=' + encodeURIComponent(token);
  try {
    await navigator.clipboard.writeText(link);
    meldung('Link kopiert – nur an Personen weitergeben, die bearbeiten dürfen!', 'ok');
  } catch {
    prompt('Geheimer Bearbeitungslink:', link);
  }
});

window.addEventListener('beforeunload', (e) => {
  if ($('speichern').disabled) { e.preventDefault(); }
});

anmelden(tokenAusLink());
