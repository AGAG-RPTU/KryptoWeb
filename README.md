# KryptoWeb

Materialien zur Kryptographie für Schülerinnen, Schüler und Lehrkräfte, betrieben
von Claus Fieker, Max Horn und Christian Eder an der RPTU Kaiserslautern-Landau.

Live: <https://crypto.math.rptu.de/>

## Lokal ansehen

Voraussetzung: Ruby 4.0 (wie in der CI) mit Bundler.

```bash
bundle install
bundle exec jekyll serve --livereload
```

Die Seite liegt dann unter <http://localhost:4000/> und lädt bei jeder Änderung neu.

- Bricht der Build mit `invalid byte sequence in US-ASCII` ab, fehlt eine
  UTF-8-Locale: `export LANG=en_US.UTF-8`.
- Beim ersten Build lädt Jekyll Schriften und JavaScript-Bibliotheken nach
  `assets/libs/` (nicht im Repo), damit Besucher keine fremden Server kontaktieren.
  Die Pfade darin enthalten `baseurl`; nach einem Wechsel von `--baseurl` den
  Ordner löschen. Terser lässt den Ordner aus
  ([_plugins/keep_libraries_unminified.rb](_plugins/keep_libraries_unminified.rb)),
  sonst passen die Prüfsummen (`integrity`) nicht mehr und der Browser blockiert
  die Dateien. `bin/check-sri _site` prüft das; der Deploy-Workflow ruft es auf.

## Veröffentlichen

Die Seite liegt auf dem Webserver `crypto.math.rptu.de` des Fachbereichs. Auf `main`,
ohne ungespeicherte Änderungen:

```bash
bin/veroeffentlichen
```

Das Skript baut die Seite und kopiert sie mit `rsync` nach
`/srv/www/crypto/htdocs`. Dafür muss `ssh crypto-www` ohne Passwort gehen; der
Server nimmt nur Schlüssel an, die die IT eingetragen hat, und nur aus dem
Uni-Netz. Eintrag in `~/.ssh/config`:

```
Host crypto-www
    HostName crypto.math.rptu.de
    User crypto-www
    ProxyJump skylla   # nur nötig, wenn der eigene Rechner keinen direkten Zugang hat
```

Ein Push baut die Seite nur zur Probe mit GitHub Actions
([.github/workflows/jekyll.yml](.github/workflows/jekyll.yml)); veröffentlicht wird
sie damit nicht.

Die alte Adresse <https://agag-rptu.github.io/KryptoWeb/> leitet weiter: GitHub Pages
liefert den Branch `gh-pages` aus, der nur eine Seite enthält. Sie schickt jeden alten
Pfad auf denselben Pfad unter `crypto.math.rptu.de`, damit alte Links und QR-Codes auf
gedruckten Blättern funktionieren.

## Aufbau

Das Menü hat vier Punkte: Home, Vorträge, Themen (Untermenü) und Für Lehrkräfte.
Jedes Thema ist eine Seite in `_pages/` mit `thema: <kürzel>` im Kopf, die
[_includes/themenseite.liquid](_includes/themenseite.liquid) einbindet. Die zeigt
eine Sprungleiste und drei Abschnitte mit Karten: „Im Browser ausprobieren“ (Seiten
in `_pages/`, deren `themen` das Kürzel enthalten), „Material“ (Karten aus
`_projects/` mit `category: <kürzel>`) und „Vorträge“ (deren `themen` das Kürzel
enthalten). Leere Abschnitte fallen weg; bleibt nur einer, entfallen auch Leiste
und Überschriften. Die Kürzel: `caesar-vigenere`, `enigma`,
`visuelle-kryptographie`, `rsa-primzahlen`, `lehrkraefte`. Ein neues Thema braucht
eine solche Seite und einen Eintrag unter `children` in
[_pages/themen.md](_pages/themen.md).

Alte Adressen (`/Kopiervorlagen/`, `/RSA/` usw.) leiten über
`_pages/weiterleitungen/` auf die neuen weiter.

Eigenes CSS steht in [_sass/_kryptoweb.scss](_sass/_kryptoweb.scss);
`assets/css/main.scss` ersetzt dafür die gleichnamige Datei des Themes.

## Inhalte ergänzen

**Material:** Datei nach `content/<Ordner>/`, Vorschaubild (etwa 1190 × 750 Pixel)
nach `content/img/`, dazu eine Karte `_projects/<Nummer>_<Name>.md`:

```yaml
---
title: "Caesar-Scheibe"
description: "Caesar-Scheibe zum Ausschneiden und Basteln"
img: content/img/Caesar.jpg
importance: 1 # Reihenfolge auf der Themenseite, 1 zuerst
art: Bastelvorlage # Etikett: Bastelvorlage, Anleitung, Arbeitsblatt, Programm, Folien, Masterarbeit
category: caesar-vigenere # Kürzel des Themas
file: "/content/Kopiervorlagen/Caesar.pdf" # auch eine externe URL
credit: "© 2026 Max Horn, RPTU, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.de)"
---
```

Die Karte verlinkt direkt auf `file`. Fremdes Material nur einstellen, wenn seine
Lizenz die Weitergabe erlaubt; Urheber, Lizenz und Quelle gehören in `credit`.
Sonst als `file` die Seite des Autors verlinken. Links in `credit`, die mit `/`
beginnen, bekommen automatisch `baseurl` vorangestellt.

**Werkzeuge im Browser** haben je eine eigene Seite unter ihrem Thema. Jedes besteht
aus Seite (`_pages/`), Oberfläche (`_includes/`) und Programm (`assets/js/`); das
gemeinsame Aussehen steht in `assets/css/werkzeuge.css`, bei der visuellen
Kryptographie in `assets/css/visuelle-krypto.css`. Die Karte auf der Themenseite kommt
aus dem Kopf der Seite: `themen`, `img`, `art` und `importance` wie bei den Karten in
`_projects/`. Die Vorschaubilder `content/img/Werkzeug-*.svg` sind von Hand gezeichnet.

| Werkzeug | Seite | Oberfläche | Programm |
|---|---|---|---|
| Rechnen im Kreis (Modulo) | `_pages/modulo.md` | `_includes/modulo.liquid` | `assets/js/modulo.js` |
| Verschlüsseln und knacken (Caesar, Vigenère) | `_pages/caesar-vigenere-ausprobieren.md` | `_includes/caesar_scheibe.liquid`, `_includes/caesar_vigenere.liquid`, `_includes/codeknacker.liquid` | `assets/js/caesar-vigenere.js` |
| Diffie-Hellman | `_pages/diffie-hellman.md` | `_includes/diffie_hellman.liquid` | `assets/js/diffie-hellman.js` |
| Zwei Folien, ein Bild (visuelle Kryptographie) | `_pages/visuelle-kryptographie-ausprobieren.md` | `_includes/visuelle_krypto.liquid` | `assets/js/visuelle-krypto.js` |

Die Motive der visuellen Kryptographie sind Pixelbilder in
`assets/js/visuelle-krypto-motive.js`, je eins für „grob“, „mittel“ und „fein“
(`#` = schwarz); ein neues Motiv braucht dort einen Eintrag und einen Knopf im Include.
Die Pixelschrift für Text steht in `FONT` in `assets/js/visuelle-krypto.js`.

**Vorträge:** Dateien nach `content/Vortraege/`, benannt
`Vortrag-JJJJ-MM-TT-Anlass.pdf`, dazu eine Seite `_vortraege/<anlass>-JJJJ-MM-TT.md`
mit `title`, `description` (Vortragende, Anlass und Datum, etwa
„Max Horn · Kinder-Uni der RPTU, 18. November 2026“), `img`, `date` und `themen`
(Liste von Themenkürzeln) im Kopf. Der Text der Seite
beschreibt den Vortrag und verlinkt das Material. Die Übersicht sortiert nach
`date`, neueste zuerst.

**Vorschaubild aus der ersten PDF-Seite** (Poppler):

```bash
pdftoppm -f 1 -l 1 -singlefile -scale-to-x 1190 -scale-to-y -1 -jpeg datei.pdf content/img/Name
```

**Große PDFs** vor dem Einchecken verkleinern; das Skript rechnet Bilder auf
300 dpi herunter und ersetzt die Datei nur, wenn ihr Text gleich bleibt:

```bash
python3 _quellen/pdf_verkleinern.py content/<Ordner>/<Datei>.pdf
```

**LaTeX-Quellen** eigener Vorlagen liegen in `_quellen/`; Jekyll veröffentlicht
den Ordner nicht. [_quellen/bauen.sh](_quellen/bauen.sh) übersetzt alle Quellen
mit `lualatex` und legt `_quellen/<Rubrik>/<Name>.tex` als
`content/<Rubrik>/<Name>.pdf` ab, dazu das ZIP mit der Quelle des
Agenten-Blatts. Die freien Schriften
[Red Hat Text, Display und Mono](https://github.com/RedHatOfficial/RedHatFont)
müssen installiert sein.
Die Fußzeile mit Lizenz, Webadresse und QR-Code kommt aus
[_quellen/fusszeile.tex](_quellen/fusszeile.tex); zieht die Seite um, dort die
Adresse ändern und `bauen.sh` laufen lassen.

## Lizenz

Die Lizenz jedes Materials steht auf seiner Karte oder Vortragsseite. Das Theme
[al-folio](https://github.com/alshedivat/al-folio) steht unter MIT, siehe
[LICENSE](LICENSE).
