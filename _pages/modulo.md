---
layout: page
title: Rechnen im Kreis
permalink: /themen/rsa-primzahlen/modulo/
description: Modulo-Rechnung zum Anfassen, wie auf der Uhr
# card on the topic page, see _includes/themenseite.liquid
themen: [rsa-primzahlen]
img: content/img/Werkzeug-Modulo.svg
art: Interaktiv
importance: 1
---

<link rel="stylesheet" href="{{ '/assets/css/werkzeuge.css' | relative_url | bust_file_cache }}">

„Es ist jetzt 7 Uhr. In 8 Stunden treffen wir uns. Dann ist es 3 Uhr.“ Auf der Uhr
rechnet man nicht auf einem Zahlenstrahl, sondern im Kreis: Nach der 12 geht es wieder
von vorne los. In der Mathematik schreibt man das so:

**(7 + 8) mod 12 = 15 mod 12 = 3**

Dabei ist *x* mod *N* der **Rest**, der übrig bleibt, wenn man *x* durch *N* teilt:
15 = 1 · 12 + 3. Die Zahl *N* heißt **Modulus**. Auf einem Kreis mit *N* Plätzen, die
von 0 bis *N* − 1 nummeriert sind, landet man immer beim Rest, ganz gleich, wie oft man
vorher herumgelaufen ist. Auf der Uhr steht oben die 12, beim Rechnen modulo 12 heißt
dieser Platz 0.

Bei der Caesar-Verschlüsselung ist es fast dasselbe, nur mit 26 Buchstaben statt 12
Stunden. Zählt man A = 0, B = 1, …, Z = 25, dann macht Caesar mit dem Schlüssel 3 aus
jedem Buchstaben *x* den Buchstaben (*x* + 3) mod 26.

## Selbst ausprobieren

Wähle die Zahl der Plätze und eine Rechnung. Der Punkt läuft im Kreis, und nach jeder
vollen Runde zieht er seine Bahn ein Stück weiter innen. So sieht man, wie oft er ganz
herumgekommen ist. Der Platz, auf dem er landet, ist der Rest.

{% include modulo.liquid %}

## Weiter

Auch Potenzieren geht im Kreis. Darauf beruht der
[Diffie-Hellman-Schlüsseltausch]({{ '/themen/rsa-primzahlen/diffie-hellman/' | relative_url }}).
Arbeitsblätter, Folien und Programme zum Rechnen mit Resten stehen bei
[RSA & Primzahlen]({{ '/themen/rsa-primzahlen/' | relative_url }}).
