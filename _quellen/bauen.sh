#!/bin/sh
# Übersetzt alle LaTeX-Quellen und legt die PDFs nach content/:
#   _quellen/<Rubrik>/<Name>.tex  ->  content/<Rubrik>/<Name>.pdf
# Packt außerdem die LaTeX-Quelle des Kinder-Uni-Agenten-Blatts als ZIP.
# Braucht lualatex, die Red-Hat-Schriften und zip.
set -eu
cd "$(dirname "$0")"

# frischer Ausgabeordner: lualatex sucht Eingabedateien auch dort
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for tex in */*.tex; do
    dir=$(dirname "$tex")
    name=$(basename "$tex" .tex)
    echo "$tex -> content/$dir/$name.pdf"
    if ! (cd "$dir" && lualatex -interaction=nonstopmode -halt-on-error \
            -output-directory="$tmp" "$name.tex" > "$tmp/$name.out"); then
        tail -20 "$tmp/$name.out"
        exit 1
    fi
    cp "$tmp/$name.pdf" "../content/$dir/$name.pdf"
done

# Im ZIP liegen alle Dateien nebeneinander; die .tex findet fusszeile.tex
# dann im selben Ordner.
blatt=Arbeitsblatt-2026-11-18-Kinderuni
echo "content/Vortraege/$blatt-LaTeX.zip"
(cd Vortraege && zip -qj "$tmp/$blatt-LaTeX.zip" \
    "$blatt.tex" rptu-logo.pdf LIESMICH.txt ../fusszeile.tex)
cp "$tmp/$blatt-LaTeX.zip" "../content/Vortraege/$blatt-LaTeX.zip"
