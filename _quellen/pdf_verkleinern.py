"""Verkleinert PDFs, ohne ihren Text zu verändern.

    python3 _quellen/pdf_verkleinern.py DATEI.pdf ...

Rechnet Bilder auf 300 dpi herunter und speichert sie als JPEG. Versucht erst
Ghostscript, dann MuPDF (mutool), und ersetzt die Datei nur, wenn der Text
gleich bleibt, poppler keine zusätzlichen Fehler meldet und sie um mindestens
ein Viertel kleiner wird. Ghostscript zuerst, weil MuPDF bei Fotos mit
Farbprofil die Farben verschiebt; MuPDF als Ausweg, weil Ghostscript bei
Keynote-PDFs die Umlaute im Text verfälscht.

Braucht gs, mutool und pdftotext (Homebrew: ghostscript, mupdf-tools, poppler).
"""

import collections
import os
import shutil
import subprocess
import sys
import tempfile

DPI = 300
JPEG_QUALITY = 85
MIN_SAVING = 0.25

GHOSTSCRIPT = ["gs", "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER", "-sDEVICE=pdfwrite",
               "-dCompatibilityLevel=1.6", "-dDetectDuplicateImages=true",
               "-dDownsampleColorImages=true", "-dColorImageDownsampleType=/Bicubic",
               f"-dColorImageResolution={DPI}", "-dColorImageDownsampleThreshold=1.0",
               "-dAutoFilterColorImages=false", "-dColorImageFilter=/DCTEncode",
               "-dDownsampleGrayImages=true", "-dGrayImageDownsampleType=/Bicubic",
               f"-dGrayImageResolution={DPI}", "-dGrayImageDownsampleThreshold=1.0",
               f"-dJPEGQ={JPEG_QUALITY}"]

MUTOOL = ["mutool", "clean", "-gggg", "-z", "-i", "-f", "-Z"] + [
    opt
    for kind in ("color", "gray")
    for opt in (f"--{kind}-image-subsample-method", "bicubic",
                f"--{kind}-image-subsample-dpi", f"{DPI},{DPI}",
                f"--{kind}-image-recompress-method", f"jpeg:{JPEG_QUALITY}")]


def ghostscript(src, dst):
    return GHOSTSCRIPT + [f"-sOutputFile={dst}", src]


def mutool(src, dst):
    return MUTOOL + [src, dst]


def text_and_errors(path):
    """Characters of the extractable text (without whitespace) and poppler's error count."""
    r = subprocess.run(["pdftotext", path, "-"], capture_output=True, text=True)
    chars = collections.Counter(c for c in r.stdout if not c.isspace())
    return chars, r.stderr.count("Error")


def shrink(path):
    size = os.path.getsize(path)
    chars, errors = text_and_errors(path)

    with tempfile.TemporaryDirectory() as tmp:
        for name, command in (("Ghostscript", ghostscript), ("MuPDF", mutool)):
            out = os.path.join(tmp, name + ".pdf")
            if subprocess.run(command(path, out), capture_output=True).returncode != 0:
                print(f"  {name}: fehlgeschlagen")
                continue

            new_chars, new_errors = text_and_errors(out)
            new_size = os.path.getsize(out)
            if new_chars != chars:
                print(f"  {name}: Text verändert")
                continue
            if new_errors > errors:
                print(f"  {name}: {new_errors - errors} neue Fehler")
                continue
            if new_size > (1 - MIN_SAVING) * size:
                print(f"  {name}: nur {new_size / size:.0%} der Größe, lohnt nicht")
                continue

            shutil.copyfile(out, path)
            print(f"  {name}: {size / 2**20:.1f} MB -> {new_size / 2**20:.1f} MB")
            return

    print("  unverändert")


for pdf in sys.argv[1:]:
    print(pdf)
    shrink(pdf)
