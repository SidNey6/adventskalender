# 🎄 Adventskalender

Ein einfacher Online-Adventskalender für ein Schulprojekt. Jeden Tag im Dezember lässt sich ein Türchen öffnen. Hinter jedem Türchen steht ein Text.

- **Öffentliche Seite:** `index.html` (für alle)
- **Geheime Bearbeitungsseite:** `bearbeiten.html` (funktioniert nur mit geheimem Link oder Token)
- **Inhalte:** `inhalte.json`

Die Website ist rein statisch (HTML, CSS und JavaScript) und läuft kostenlos über **GitHub Pages**.

---

## 1. Website veröffentlichen (GitHub Pages)

1. Das Repository muss **öffentlich** sein (*Settings → General → Danger Zone → Change visibility*).
2. *Settings → Pages* öffnen.
3. Bei **Source** „Deploy from a branch“ wählen, dann den Branch mit den Dateien (z. B. `main`) und den Ordner `/ (root)` auswählen und auf **Save** klicken.
4. Nach 1–2 Minuten ist der Kalender erreichbar unter
   **https://sidney6.github.io/adventskalender/**

## 2. Geheimen Bearbeitungslink erstellen

Die Bearbeitungsseite speichert Änderungen direkt in `inhalte.json` im Repository. Dafür braucht sie einen GitHub-Zugangsschlüssel (**Fine-grained Personal Access Token**), der **nur** dieses eine Repository bearbeiten darf.

1. Auf GitHub: *Profilbild → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
2. Einstellungen:
   - **Token name:** `Adventskalender`
   - **Expiration:** z. B. bis Ende Januar
   - **Repository access:** *Only select repositories* → `adventskalender`
   - **Permissions → Repository permissions → Contents:** *Read and write*
3. Token erzeugen und kopieren (beginnt mit `github_pat_…`).
4. Der geheime Bearbeitungslink sieht so aus:

   ```
   https://sidney6.github.io/adventskalender/bearbeiten.html#token=HIER_DEN_TOKEN_EINFÜGEN
   ```

Wer diesen Link hat, kann den Kalender bearbeiten. Gib ihn nur an Personen weiter, die das dürfen.

> **Warum ist das sicher?** Alles nach dem `#` wird vom Browser **nie an einen Server geschickt** und steht auch nicht im Repository. Die Datei `bearbeiten.html` ist zwar öffentlich, ohne Token kann man damit aber nichts ändern.
>
> ⚠️ Den Token **niemals** in eine Datei im Repository schreiben! GitHub erkennt das und sperrt den Token automatisch.
>
> Falls der Link in falsche Hände gerät: Token auf GitHub löschen und einen neuen erstellen.

## 3. Bearbeiten

1. Den geheimen Link öffnen.
2. Titel, Untertitel, Jahr, Anzahl der Türchen (24 oder 31) und die Texte eintragen.
3. Auf **Speichern** klicken. Nach ca. 1 Minute ist die Änderung auf der Website sichtbar.

Jedes Speichern erzeugt einen Commit. Frühere Versionen lassen sich deshalb jederzeit im Verlauf von `inhalte.json` wiederherstellen.

## Wie funktioniert das Öffnen?

- Ein Türchen lässt sich ab seinem Tag öffnen (z. B. Türchen 6 ab dem 6. Dezember, 0:00 Uhr Ortszeit).
- Bereits geöffnete Türchen merkt sich der Browser.
- Hinweis: Weil die Seite statisch ist, sind alle Texte technisch in `inhalte.json` abrufbar. Wer sich auskennt, kann also „schummeln“. Für einen Schulkalender ist das in Ordnung.

## Lokal testen

```bash
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```
