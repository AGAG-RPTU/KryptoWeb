---
layout: page
title: Vorträge
permalink: /Vortraege/
description: Folien und Arbeitsblätter zu unseren Vorträgen
nav: true
nav_order: 1
---

<div class="projects">
  {% assign talks = site.projects | where: "category", "Vorträge" | sort: "date" | reverse %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in talks %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
</div>
