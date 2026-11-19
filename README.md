# KryptoWeb

Materialien zur Kryptographie für Schülerinnen, Schüler und Lehrkräfte, betrieben
von Claus Fieker und Max Horn an der RPTU Kaiserslautern-Landau.

Live: <https://agag-rptu.github.io/KryptoWeb/>

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
  Ordner löschen.

## Veröffentlichen

Jeder Push auf `main` baut die Seite mit GitHub Actions
([.github/workflows/jekyll.yml](.github/workflows/jekyll.yml)) und stellt sie auf
GitHub Pages.

## Inhalte ergänzen

**Kopiervorlagen, Masterarbeiten, Visual, RSA:** Datei nach `content/<Rubrik>/`,
Vorschaubild (etwa 1190 × 750 Pixel) nach `content/img/`, dazu eine Karte
`_projects/<Nummer>_<Name>.md`:

```yaml
---
title: "Caesar-Scheibe"
description: "Caesar-Scheibe zum Ausschneiden und Basteln"
img: content/img/Caesar.jpg
importance: 1
category: Kryptographie # Kryptographie, Arbeiten, Visual oder RSA
file: "/content/Kopiervorlagen/Caesar.pdf" # auch eine externe URL
credit: "© 2026 Max Horn, RPTU, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.de)"
---
```

Die Karte verlinkt direkt auf `file`. Fremdes Material nur einstellen, wenn seine
Lizenz die Weitergabe erlaubt; Urheber, Lizenz und Quelle gehören in `credit`.
Sonst als `file` die Seite des Autors verlinken.

**Vorträge:** Dateien nach `content/Vortraege/`, benannt
`Vortrag-JJJJ-MM-TT-Anlass.pdf`, dazu eine Seite `_vortraege/<anlass>-JJJJ-MM-TT.md`
mit `title`, `description` (Vortragende, Anlass und Datum, etwa
„Max Horn · Kinder-Uni der RPTU, 18. November 2026“), `img` und `date` im Kopf. Der Text der Seite
beschreibt den Vortrag und verlinkt das Material. Die Übersicht sortiert nach
`date`, neueste zuerst.

**Vorschaubild aus der ersten PDF-Seite** (Poppler):

```bash
pdftoppm -f 1 -l 1 -singlefile -scale-to-x 1190 -scale-to-y -1 -jpeg datei.pdf content/img/Name
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

**Reihenfolge der Karten:** Feld `importance` (1 zuerst).

## Lizenz

Die Lizenz jedes Materials steht auf seiner Karte oder Vortragsseite. Das Theme
[al-folio](https://github.com/alshedivat/al-folio) steht unter MIT, siehe
[LICENSE](LICENSE).
