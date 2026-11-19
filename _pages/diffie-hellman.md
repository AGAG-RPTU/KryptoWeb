---
layout: page
title: Diffie-Hellman
permalink: /themen/rsa-primzahlen/diffie-hellman/
description: Wie sich Alia und Ben vor der ganzen Klasse auf einen geheimen Schlüssel einigen
---

<link rel="stylesheet" href="{{ '/assets/css/werkzeuge.css' | relative_url | bust_file_cache }}">

Alia und Ben wollen sich geheime Botschaften schicken, etwa mit einem Codewort. Dafür
brauchen beide denselben Schlüssel. Aber wie einigen sie sich darauf, wenn die ganze
Klasse mithört? Whitfield Diffie und Martin Hellman haben 1976 einen Weg gefunden: Beide
rechnen mit Potenzen im Kreis, also [modulo]({{ '/themen/rsa-primzahlen/modulo/' | relative_url }})
einer Primzahl *p*. Dabei hilft eine besondere Eigenschaft: gᵃ mod *p* auszurechnen geht
schnell, aber aus dem Ergebnis *a* zurückzugewinnen ist schwer.

## Schritt für Schritt

Die Zahlen am Anfang sind die aus dem
[Vortrag in Frankenthal]({{ '/Vortraege/frankenthal-2026-05-22/' | relative_url }}).
Du kannst alle ändern: Wähle eine andere Primzahl oder würfle neue Geheimzahlen.

{% include diffie_hellman.liquid %}

## Weiter

Arbeitsblätter zu Diffie-Hellman und RSA stehen bei
[RSA & Primzahlen]({{ '/themen/rsa-primzahlen/' | relative_url }}).
