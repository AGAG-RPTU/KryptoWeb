"""Hilfsfunktionen fuer den Primzahl-Praktikumstag.

Die Funktionen sind bewusst einfach benannt und kommen ohne externe Pakete aus.
Sie sind fuer Experimente gedacht, nicht fuer echte Kryptographie.
"""

from random import randrange


KLEINE_PRIMZAHLEN = [
    2,
    3,
    5,
    7,
    11,
    13,
    17,
    19,
    23,
    29,
    31,
    37,
]


def fermat_test(n, a=2):
    """Gibt True zurueck, wenn n den Fermat-Test zur Basis a besteht."""
    if n <= 1:
        return False
    if n % a == 0:
        return n == a
    return pow(a, n - 1, n) == 1


def ist_wahrscheinlich_prim(n, runden=12):
    """Miller-Rabin-Test fuer positive ganze Zahlen."""
    if n < 2:
        return False

    for p in KLEINE_PRIMZAHLEN:
        if n == p:
            return True
        if n % p == 0:
            return False

    d = n - 1
    s = 0
    while d % 2 == 0:
        s += 1
        d //= 2

    for _ in range(runden):
        a = randrange(2, n - 2)
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(s - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False

    return True


def naechste_wahrscheinliche_primzahl(start):
    """Findet die erste wahrscheinliche Primzahl >= start."""
    n = int(start)
    if n <= 2:
        return 2
    if n % 2 == 0:
        n += 1
    while not ist_wahrscheinlich_prim(n):
        n += 2
    return n


def primzahl_mit_versuchen(start):
    """Wie naechste_wahrscheinliche_primzahl, aber mit Versuchsanzeige."""
    n = int(start)
    if n <= 2:
        return 2, 1
    if n % 2 == 0:
        n += 1

    versuche = 0
    while True:
        versuche += 1
        if ist_wahrscheinlich_prim(n):
            return n, versuche
        n += 2
