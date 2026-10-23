"""Genera el localizador editorial de Conoce Madre de Dios.

Combina el mapa nacional documentado de Natural Earth con las provincias
derivadas de la capa DISTRITOS_MDD entregada al proyecto.
"""
from __future__ import annotations

import html
import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PERU_SOURCE = ROOT / "images" / "conoce-peru.svg"
PROVINCES_SOURCE = ROOT / "datos" / "territorio" / "provincias.geojson"
OUTPUT = ROOT / "images" / "mapas" / "conoce-madre-de-dios-atlas.svg"


def distance_to_segment(point, start, end):
    px, py = point
    ax, ay = start
    bx, by = end
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    ratio = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + ratio * dx), py - (ay + ratio * dy))


def simplify(points, tolerance=0.005):
    if len(points) <= 3:
        return points
    closed = points[0] == points[-1]
    work = points[:-1] if closed else points
    if len(work) <= 3:
        return points
    start, end = work[0], work[-1]
    index, furthest = 0, 0
    for current, point in enumerate(work[1:-1], 1):
        distance = distance_to_segment(point, start, end)
        if distance > furthest:
            index, furthest = current, distance
    if furthest > tolerance:
        result = simplify(work[: index + 1], tolerance)[:-1] + simplify(work[index:], tolerance)
    else:
        result = [start, end]
    if closed and result[0] != result[-1]:
        result.append(result[0])
    return result


def rings(geometry):
    if geometry["type"] == "Polygon":
        yield from geometry["coordinates"]
    elif geometry["type"] == "MultiPolygon":
        for polygon in geometry["coordinates"]:
            yield from polygon
    else:
        raise ValueError(f"Geometría no compatible: {geometry['type']}")


def all_points(features):
    for feature in features:
        for ring in rings(feature["geometry"]):
            yield from ring


def polygon_centroid(points):
    ring = points[:-1] if points and points[0] == points[-1] else points
    if len(ring) < 3:
        return ring[0]
    area_twice = 0
    x_sum = 0
    y_sum = 0
    for index, (x1, y1) in enumerate(ring):
        x2, y2 = ring[(index + 1) % len(ring)]
        cross = x1 * y2 - x2 * y1
        area_twice += cross
        x_sum += (x1 + x2) * cross
        y_sum += (y1 + y2) * cross
    if abs(area_twice) < 1e-12:
        return sum(x for x, _ in ring) / len(ring), sum(y for _, y in ring) / len(ring)
    return x_sum / (3 * area_twice), y_sum / (3 * area_twice)


def largest_outer_ring(feature):
    candidates = []
    coordinates = feature["geometry"]["coordinates"]
    if feature["geometry"]["type"] == "Polygon":
        candidates.append(coordinates[0])
    else:
        candidates.extend(polygon[0] for polygon in coordinates)

    def ring_area(ring):
        return abs(sum(
            ring[index][0] * ring[(index + 1) % len(ring)][1]
            - ring[(index + 1) % len(ring)][0] * ring[index][1]
            for index in range(len(ring))
        ))

    return max(candidates, key=ring_area)


def extract_peru_paths():
    root = ET.parse(PERU_SOURCE).getroot()
    found = {}
    for element in root.iter():
        identifier = element.attrib.get("id")
        if identifier in {"peru", "madre-de-dios"}:
            found[identifier] = element.attrib["d"]
    if set(found) != {"peru", "madre-de-dios"}:
        raise ValueError("No se encontraron las geometrías nacionales en conoce-peru.svg")
    return found


def render_province_paths(features, project):
    fills = {"Tahuamanu": "#5d8b62", "Tambopata": "#17643f", "Manu": "#a7bea0"}
    text_fills = {"Tahuamanu": "#fffdf7", "Tambopata": "#fffdf7", "Manu": "#173c2d"}
    shapes = []
    labels = []
    for feature in features:
        name = feature["properties"]["provincia"]
        chunks = []
        for ring in rings(feature["geometry"]):
            points = simplify(ring)
            projected = [project(*point) for point in points]
            if len(projected) >= 3:
                chunks.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in projected) + "Z")
        shapes.append(
            f'<path class="provincia" fill="{fills[name]}" d="{"".join(chunks)}"><title>{html.escape(name)}</title></path>'
        )
        center = polygon_centroid(largest_outer_ring(feature))
        label_x, label_y = project(*center)
        adjustments = {"Tahuamanu": (3, -5), "Tambopata": (5, 8), "Manu": (-5, 8)}
        dx, dy = adjustments[name]
        labels.append(
            f'<text class="provincia-nombre" x="{label_x + dx:.1f}" y="{label_y + dy:.1f}" '
            f'fill="{text_fills[name]}">{html.escape(name)}</text>'
        )
    return "".join(shapes), "".join(labels)


def render():
    national = extract_peru_paths()
    data = json.loads(PROVINCES_SOURCE.read_text(encoding="utf-8"))
    features = data["features"]
    names = {feature["properties"]["provincia"] for feature in features}
    if names != {"Tambopata", "Manu", "Tahuamanu"}:
        raise ValueError(f"Provincias inesperadas: {sorted(names)}")

    points = list(all_points(features))
    min_x = min(point[0] for point in points)
    max_x = max(point[0] for point in points)
    min_y = min(point[1] for point in points)
    max_y = max(point[1] for point in points)
    box_x, box_y, box_width, box_height = 310, 113, 286, 226
    scale = min(box_width / (max_x - min_x), box_height / (max_y - min_y))
    offset_x = box_x + (box_width - (max_x - min_x) * scale) / 2
    offset_y = box_y + (box_height - (max_y - min_y) * scale) / 2

    def project(x, y):
        return offset_x + (x - min_x) * scale, offset_y + (max_y - y) * scale

    province_paths, province_labels = render_province_paths(features, project)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-labelledby="titulo descripcion">
  <title id="titulo">Madre de Dios en el Perú y sus tres provincias</title>
  <desc id="descripcion">A la izquierda, el Perú con Madre de Dios resaltado en el suroriente. A la derecha, las provincias de Tahuamanu, Manu y Tambopata, junto a Ucayali, Cusco, Puno, Brasil y Bolivia.</desc>
  <defs>
    <filter id="sombra" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#173c2d" flood-opacity=".10"/></filter>
  </defs>
  <style>
    text {{ font-family:Inter,Arial,sans-serif }}
    .kicker {{ fill:#587063; font-size:11px; font-weight:700; letter-spacing:1.35px }}
    .titulo {{ fill:#173c2d; font-size:17px; font-weight:700 }}
    .referencia {{ fill:#4f665a; font-size:11px; font-weight:650 }}
    .provincia {{ stroke:#fffdf7; stroke-width:2.4; stroke-linejoin:round; vector-effect:non-scaling-stroke }}
    .provincia-nombre {{ font-size:12px; font-weight:750; text-anchor:middle; paint-order:stroke; stroke:rgb(23 60 45 / 18%); stroke-width:1px }}
  </style>
  <rect width="640" height="420" rx="20" fill="#f8f7f0"/>
  <rect x="14" y="14" width="232" height="392" rx="16" fill="#e7f0ed" stroke="#c9d7cf"/>
  <rect x="258" y="14" width="368" height="392" rx="16" fill="#fffdf8" stroke="#ced9cf"/>

  <g aria-label="Ubicación nacional">
    <text class="kicker" x="30" y="42">UBICACIÓN NACIONAL</text>
    <text class="titulo" x="30" y="65">En el suroriente del Perú</text>
    <g transform="translate(23 66) scale(.78)" filter="url(#sombra)">
      <path d="{national['peru']}" fill="#ccd8c6" stroke="#fffdf7" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="{national['madre-de-dios']}" fill="#17643f" stroke="#123f2b" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <text x="72" y="177" fill="#173c2d" font-size="20" font-weight="750" letter-spacing="1.5">PERÚ</text>
    <g fill="#337582" aria-hidden="true">
      <path d="M30 279q11-7 22 0t22 0M27 289q11-7 22 0t22 0M34 299q11-7 22 0t22 0" fill="none" stroke="#337582" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <text class="kicker" x="30" y="321" fill="#337582">OCÉANO PACÍFICO</text>
    </g>
    <path d="M204 258C216 250 222 239 232 228" fill="none" stroke="#173c2d" stroke-width="1.7" stroke-dasharray="3 3"/>
    <circle cx="204" cy="258" r="4.5" fill="#f2c94c" stroke="#fff" stroke-width="2"/>
    <g transform="translate(119 215)"><rect width="112" height="35" rx="8" fill="#fff" stroke="#b9c9be"/><text x="10" y="14" fill="#607267" font-size="8" font-weight="700" letter-spacing=".8">DEPARTAMENTO</text><text x="10" y="28" fill="#173c2d" font-size="12" font-weight="750">Madre de Dios</text></g>
    <g transform="translate(31 361)" aria-hidden="true"><path d="M0 18V0m-5 8 5-8 5 8" fill="none" stroke="#173c2d" stroke-width="1.5"/><text x="0" y="-6" fill="#173c2d" font-size="11" font-weight="750" text-anchor="middle">N</text></g>
  </g>

  <g aria-label="División provincial y colindancias">
    <text class="kicker" x="278" y="42">VISTA DEPARTAMENTAL</text>
    <text class="titulo" x="278" y="65">Tres provincias conectadas</text>
    <text class="referencia" x="278" y="84">Límites simplificados para lectura educativa</text>
    <g aria-hidden="true">
      <text class="referencia" x="288" y="112">Ucayali</text>
      <text class="referencia" x="569" y="112" text-anchor="end">Brasil</text>
      <text class="referencia" x="605" y="260" text-anchor="end">Bolivia</text>
      <text class="referencia" x="529" y="366">Puno</text>
      <text class="referencia" x="285" y="366">Cusco</text>
      <path d="M326 116l12 12M558 116l-12 12M579 255l-14-2M520 350l-10-13M320 350l14-13" fill="none" stroke="#86a092" stroke-width="1.2" stroke-dasharray="3 3"/>
    </g>
    <g fill-rule="evenodd" filter="url(#sombra)">{province_paths}</g>
    <g aria-hidden="true">{province_labels}</g>
    <g transform="translate(594 84)" aria-hidden="true"><text x="0" y="0" fill="#526a58" font-size="11" font-weight="750" text-anchor="middle">N</text><path d="M0 6-6 21 0 17 6 21Z" fill="#526a58"/></g>
    <g transform="translate(278 382)"><rect width="181" height="15" rx="7.5" fill="#edf3e9"/><circle cx="11" cy="7.5" r="4" fill="#17643f"/><text x="21" y="11" fill="#405a4c" font-size="10" font-weight="700">3 provincias · 11 distritos</text></g>
  </g>
</svg>'''


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render(), encoding="utf-8")
    print(OUTPUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
