---
layout: page
title: Visual
permalink: /Visual/
description: Visuelle Kryptographie – ein Bild auf zwei Folien verteilen, die nur übereinander etwas zeigen
nav: true
nav_order: 4
display_categories: [Visual]
horizontal: false
---

<link rel="stylesheet" href="{{ '/assets/css/visuelle-krypto.css' | relative_url | bust_file_cache }}">

## So funktioniert's

Ein Bild aus schwarzen und weißen Pixeln wird auf zwei Folien verteilt, A und B. Dazu
wird jedes Pixel in 2 × 2 kleine Punkte zerlegt, von denen genau zwei schwarz sind:
entweder ▚ oder ▞. Welches der beiden Muster auf Folie A kommt, entscheidet für jedes
Pixel ein Münzwurf. Auf Folie B kommt bei einem weißen Pixel dasselbe Muster, bei einem
schwarzen das andere.

<table class="vk-schema">
<thead><tr><th>Pixel im Bild</th><th>Folie A</th><th>Folie B</th><th>übereinander</th></tr></thead>
<tbody>
<tr>
<td><span class="vk-kachel vk-pixel" role="img" aria-label="weißes Pixel"><i></i></span><small>weiß</small></td>
<td><span class="vk-kachel" role="img" aria-label="Muster ▚"><i class="s"></i><i></i><i></i><i class="s"></i></span></td>
<td><span class="vk-kachel" role="img" aria-label="Muster ▚"><i class="s"></i><i></i><i></i><i class="s"></i></span><small>dasselbe Muster</small></td>
<td><span class="vk-kachel" role="img" aria-label="Muster ▚"><i class="s"></i><i></i><i></i><i class="s"></i></span><small>2 von 4 Punkten schwarz: wirkt grau</small></td>
</tr>
<tr>
<td><span class="vk-kachel vk-pixel" role="img" aria-label="schwarzes Pixel"><i class="s"></i></span><small>schwarz</small></td>
<td><span class="vk-kachel" role="img" aria-label="Muster ▚"><i class="s"></i><i></i><i></i><i class="s"></i></span></td>
<td><span class="vk-kachel" role="img" aria-label="Muster ▞"><i></i><i class="s"></i><i class="s"></i><i></i></span><small>das andere Muster</small></td>
<td><span class="vk-kachel" role="img" aria-label="alle Punkte schwarz"><i class="s"></i><i class="s"></i><i class="s"></i><i class="s"></i></span><small>alle 4 Punkte schwarz</small></td>
</tr>
</tbody>
</table>

Liegen die Folien genau übereinander, sind an schwarzen Pixeln alle vier Punkte schwarz,
an weißen nur zwei. Die weißen Stellen wirken grau, die schwarzen schwarz – und das Bild
erscheint.

Jede Folie für sich zeigt dagegen nur Rauschen: An jeder Stelle steht ▚ oder ▞, so
zufällig wie ein Münzwurf, ganz gleich, ob das Pixel schwarz oder weiß ist. Wer nur eine
Folie hat, erfährt nichts über das Bild, auch nicht mit dem schnellsten Computer. Folie A
ist der Schlüssel, Folie B die verschlüsselte Nachricht, und zum Entschlüsseln braucht
man nur die Augen. Die Idee stammt von Moni Naor und Adi Shamir (1994).

## Selbst ausprobieren

Wähle ein Motiv und zieh dann eine Folie mit der Maus oder dem Finger auf die andere.
Erst wenn sie genau deckungsgleich liegen, erscheint das Bild. Grobe Motive mit großen
Pixeln wirken am besten.

{% include visuelle_krypto.liquid %}

### Zum Ausdrucken

Lade beide Folien herunter und drucke sie mit denselben Einstellungen aus, am besten auf
Overhead-Folie, die zu deinem Drucker passt (Laser oder Tintenstrahl). Eine der beiden
darf auch auf Papier sein. Die Kreuze in den Ecken helfen beim Ausrichten. Eine geringe
Feinheit macht es leichter: Große Punkte bringt man schneller zur Deckung.

## Programme zum Herunterladen

Dasselbe Verfahren als Programm zum Nachvollziehen und Weiterentwickeln:

<div class="projects">
  <div class="row row-cols-1 row-cols-md-3">
  {% for category in page.display_categories %}
    {% assign sorted_projects = site.projects | where: "category", category | sort: "importance" %}
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  {% endfor %}
  </div>
</div>
