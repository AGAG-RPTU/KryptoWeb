---
layout: page
title: Verschlüsseln und knacken
permalink: /themen/caesar-vigenere/ausprobieren/
description: Caesar und Vigenère im Browser, mit drehbarer Caesar-Scheibe und Codeknacker
# card on the topic page, see _includes/themenseite.liquid
themen: [caesar-vigenere]
img: content/img/Werkzeug-Caesar.svg
art: Interaktiv
importance: 1
---

<link rel="stylesheet" href="{{ '/assets/css/werkzeuge.css' | relative_url | bust_file_cache }}">

## Die Caesar-Scheibe

Bei Caesar rutscht jeder Buchstabe um dieselbe Zahl von Plätzen weiter, und nach Z geht
es wieder bei A los. Auf der Caesar-Scheibe steht außen der Klartext und innen der
Geheimtext. Dreh die innere Scheibe, bis unter dem A der Buchstabe für deinen Schlüssel
steht: Bei Schlüssel 3 ist das D, und aus HALLO wird KDOOR.

{% include caesar_scheibe.liquid %}

## Verschlüsseln und entschlüsseln

Hier rechnet der Computer für dich. Beim Vigenère-Verfahren gibt ein Codewort die
Schlüssel vor, für jeden Buchstaben einen: A steht für 0, B für 1, …, Z für 25. Ist der
Text länger als das Codewort, wird das Codewort wiederholt. Mit dem Codewort FEE wird aus
GEHEIM der Geheimtext LILJMQ.

{% include caesar_vigenere.liquid %}

## Knacken

Ein Lauscher hat eine Geheimbotschaft abgefangen. Er kennt das Verfahren, aber nicht den
Schlüssel. Kann er sie trotzdem lesen? Im
[Kinder-Uni-Vortrag]({{ '/Vortraege/kinderuni-2026-11-18/' | relative_url }}) haben
wir zwei Tricks kennengelernt.

{% include codeknacker.liquid %}

## Weiter

Caesar-Scheibe, Vigenère-Tabelle und das Agenten-Blatt zum Ausdrucken stehen bei
[Caesar & Vigenère]({{ '/themen/caesar-vigenere/' | relative_url }}). Warum nach Z
wieder A kommt, zeigt [Rechnen im Kreis]({{ '/themen/rsa-primzahlen/modulo/' | relative_url }}).
