"""Genera minimapas provinciales ligeros desde la capa territorial documentada."""
from __future__ import annotations

import html
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "datos" / "territorio" / "provincias.geojson"
OUTPUT = ROOT / "images" / "mapas"
PROVINCES = ("Tambopata", "Manu", "Tahuamanu")


def distance_to_segment(point, start, end):
    px, py = point
    ax, ay = start
    bx, by = end
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(points, tolerance=0.006):
    """Ramer-Douglas-Peucker; suficiente para un minimapa de menos de 400 px."""
    if len(points) <= 3:
        return points
    closed = points[0] == points[-1]
    work = points[:-1] if closed else points
    if len(work) <= 3:
        return points
    start, end = work[0], work[-1]
    index, furthest = 0, 0
    for i, point in enumerate(work[1:-1], 1):
        distance = distance_to_segment(point, start, end)
        if distance > furthest:
            index, furthest = i, distance
    if furthest > tolerance:
        result = simplify(work[: index + 1], tolerance)[:-1] + simplify(work[index:], tolerance)
    else:
        result = [start, end]
    if closed and result[0] != result[-1]:
        result.append(result[0])
    return result


def rings(geometry):
    coordinates = geometry["coordinates"]
    if geometry["type"] == "Polygon":
        yield from coordinates
    elif geometry["type"] == "MultiPolygon":
        for polygon in coordinates:
            yield from polygon
    else:
        raise ValueError(f"Geometría no compatible: {geometry['type']}")


def all_points(features):
    for feature in features:
        for ring in rings(feature["geometry"]):
            yield from ring


def make_path(feature, project):
    chunks = []
    for ring in rings(feature["geometry"]):
        points = simplify(ring)
        if len(points) < 3:
            continue
        projected = [project(*point) for point in points]
        chunks.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in projected) + "Z")
    return "".join(chunks)


def render(features, active):
    points = list(all_points(features))
    min_x = min(point[0] for point in points)
    max_x = max(point[0] for point in points)
    min_y = min(point[1] for point in points)
    max_y = max(point[1] for point in points)
    width, height, padding = 420, 285, 22
    scale = min((width - padding * 2) / (max_x - min_x), (height - padding * 2) / (max_y - min_y))
    offset_x = (width - (max_x - min_x) * scale) / 2
    offset_y = (height - (max_y - min_y) * scale) / 2

    def project(x, y):
        return offset_x + (x - min_x) * scale, offset_y + (max_y - y) * scale

    shapes = []
    for feature in features:
        name = feature["properties"]["provincia"]
        state = " provincia-activa" if name == active else ""
        path = make_path(feature, project)
        shapes.append(
            f'<path class="provincia{state}" d="{path}"><title>{html.escape(name)}</title></path>'
        )
    title = f"Ubicación de la provincia de {active} en Madre de Dios"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="titulo descripcion">
  <title id="titulo">{html.escape(title)}</title>
  <desc id="descripcion">Las tres provincias del departamento; {html.escape(active)} aparece resaltada.</desc>
  <style>
    .provincia {{ fill:#cbdcca; stroke:#fffdf7; stroke-width:2.4; stroke-linejoin:round; vector-effect:non-scaling-stroke }}
    .provincia-activa {{ fill:#17643f }}
    .norte {{ fill:#526a58; font:700 14px system-ui,sans-serif; letter-spacing:.08em }}
  </style>
  <g fill-rule="evenodd">{''.join(shapes)}</g>
  <g class="norte" aria-hidden="true" transform="translate(384 22)">
    <text x="0" y="0" text-anchor="middle">N</text>
    <path d="M0 7-7 24 0 20 7 24Z" fill="#526a58"/>
  </g>
</svg>'''


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    features = data["features"]
    names = {feature["properties"]["provincia"] for feature in features}
    if names != set(PROVINCES):
        raise ValueError(f"Provincias inesperadas: {sorted(names)}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for province in PROVINCES:
        target = OUTPUT / f"minimapa-{province.lower()}.svg"
        target.write_text(render(features, province), encoding="utf-8")
        print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
