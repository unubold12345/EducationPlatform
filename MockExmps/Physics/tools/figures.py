"""Render self-contained SVG diagrams for physics mock figures.

The generator stores each figure twice: the numeric data used to build the
question, and an SVG drawing generated from that data.  The SVG is an original
schematic, not a copy of an official examination figure.
"""

from __future__ import annotations

import html
import math
from typing import Any

WIDTH = 640
HEIGHT = 360

STYLE = """
.s{stroke:#111827;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
.sb{stroke:#111827;stroke-width:2;fill:#e5e7eb}
.sg{stroke:#111827;stroke-width:2;fill:#d1fae5}
.sr{stroke:#b91c1c;stroke-width:2;fill:none}
.sblue{stroke:#1d4ed8;stroke-width:2;fill:none}
.dash{stroke:#6b7280;stroke-width:1.4;fill:none;stroke-dasharray:6 5}
.grid{stroke:#e5e7eb;stroke-width:1;fill:none}
.t{fill:#111827;stroke:none;font-family:Arial,Helvetica,sans-serif}
"""


def _num(value: float, digits: int = 2) -> str:
    if abs(value - round(value)) < 1e-9:
        return str(int(round(value)))
    return f"{value:.{digits}f}".rstrip("0").rstrip(".")


def _esc(value: Any) -> str:
    return html.escape(str(value), quote=True)


def text(
    x: float,
    y: float,
    value: Any,
    size: float = 14,
    anchor: str = "middle",
    weight: str = "normal",
    fill: str = "#111827",
    rotate: float | None = None,
) -> str:
    transform = f' transform="rotate({rotate} {x:.1f} {y:.1f})"' if rotate is not None else ""
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" '
        f'font-size="{size:g}" font-weight="{weight}" fill="{fill}"{transform}>'
        f"{_esc(value)}</text>"
    )


def line(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    cls: str = "s",
    dash: str | None = None,
) -> str:
    extra = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'class="{cls}"{extra}/>'
    )


def rect(
    x: float,
    y: float,
    w: float,
    h: float,
    cls: str = "s",
    rx: float = 0,
) -> str:
    return (
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
        f'rx="{rx:.1f}" class="{cls}"/>'
    )


def circle(cx: float, cy: float, r: float, cls: str = "s") -> str:
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" class="{cls}"/>'


def poly(points: list[tuple[float, float]], cls: str = "s") -> str:
    packed = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    return f'<polygon points="{packed}" class="{cls}"/>'


def polyline(points: list[tuple[float, float]], cls: str = "s") -> str:
    packed = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    return f'<polyline points="{packed}" class="{cls}"/>'


def arrow(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: str = "#111827",
    width: float = 2,
    head: float = 8,
    dash: str | None = None,
) -> str:
    angle = math.atan2(y2 - y1, x2 - x1)
    bx = x2 - head * math.cos(angle)
    by = y2 - head * math.sin(angle)
    extra = f' stroke-dasharray="{dash}"' if dash else ""
    tip1 = (x2, y2)
    tip2 = (x2 - head * math.cos(angle - 0.45), y2 - head * math.sin(angle - 0.45))
    tip3 = (x2 - head * math.cos(angle + 0.45), y2 - head * math.sin(angle + 0.45))
    return (
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{bx:.1f}" y2="{by:.1f}" '
        f'stroke="{color}" stroke-width="{width:g}"{extra} stroke-linecap="round"/>'
        f'<polygon points="{tip1[0]:.1f},{tip1[1]:.1f} {tip2[0]:.1f},{tip2[1]:.1f} '
        f'{tip3[0]:.1f},{tip3[1]:.1f}" fill="{color}"/>'
    )


def graph_frame(
    xlabel: str,
    ylabel: str,
    xmin: float,
    xmax: float,
    ymin: float,
    ymax: float,
    x0: float = 80,
    y0: float = 300,
    x1: float = 580,
    y1: float = 40,
    ticks: bool = True,
):
    """Axes, grid and (unless ticks=False) four evenly spaced value labels per axis."""
    if xmax == xmin:
        xmax = xmin + 1
    if ymax == ymin:
        ymax = ymin + 1
    body = []
    for i in range(1, 5):
        gx = x0 + (x1 - x0) * i / 5
        gy = y0 - (y0 - y1) * i / 5
        body.append(line(gx, y0, gx, y1, "grid"))
        body.append(line(x0, gy, x1, gy, "grid"))
    body.append(arrow(x0, y0, x1 + 8, y0))
    body.append(arrow(x0, y0, x0, y1 - 8))
    body.append(text((x0 + x1) / 2, y0 + 42, xlabel, 13))
    body.append(text(x0 - 52, (y0 + y1) / 2, ylabel, 13, rotate=-90))
    for i in range(5 if ticks else 0):
        value = xmin + (xmax - xmin) * i / 4
        px = x0 + (x1 - x0) * i / 4
        body.append(line(px, y0, px, y0 + 5, "s"))
        body.append(text(px, y0 + 18, _num(value), 11))
        value = ymin + (ymax - ymin) * i / 4
        py = y0 - (y0 - y1) * i / 4
        body.append(line(x0 - 5, py, x0, py, "s"))
        body.append(text(x0 - 9, py + 4, _num(value), 11, "end"))

    def mapper(x: float, y: float) -> tuple[float, float]:
        px = x0 + (x - xmin) / (xmax - xmin) * (x1 - x0)
        py = y0 - (y - ymin) / (ymax - ymin) * (y0 - y1)
        return px, py

    return "".join(body), mapper


def _series(points: list[list[float]], mapper) -> str:
    plotted = [mapper(float(p[0]), float(p[1])) for p in points]
    return polyline(plotted)


def _point_labels(points: list[list[float]], mapper, color: str = "#111827") -> str:
    body = []
    for p in points:
        px, py = mapper(float(p[0]), float(p[1]))
        body.append(circle(px, py, 4, "s"))
        anchor = "start" if px < 500 else "end"
        dx = 7 if anchor == "start" else -7
        dy = -7 if py > 35 else 16
        body.append(
            text(px + dx, py + dy, f"({_num(float(p[0]))}, {_num(float(p[1]))})", 10, anchor, fill=color)
        )
    return "".join(body)


def _table(columns: list[str], rows: list[list[str]], header_fill: str = "#e5e7eb") -> str:
    ncols = max(1, len(columns))
    nrows = len(rows) + 1
    left, top, total_w = 30, 28, 580
    base = total_w / ncols
    widths = []
    for i, column in enumerate(columns):
        longest = max([len(str(column))] + [len(str(row[i])) for row in rows if i < len(row)])
        widths.append(max(base, min(170, longest * 7.2 + 22)))
    scale = total_w / sum(widths)
    widths = [w * scale for w in widths]
    row_h = 34 if nrows <= 6 else 28
    height = nrows * row_h
    top = (HEIGHT - height) / 2
    body = [rect(left, top, total_w, height, "s")]
    y = top
    for r in range(nrows):
        if r == 0:
            body.append(rect(left, y, total_w, row_h, "s"))
            body.append(f'<rect x="{left}" y="{y}" width="{total_w}" height="{row_h}" fill="{header_fill}" stroke="none"/>')
        body.append(line(left, y, left + total_w, y, "s"))
        x = left
        for c in range(ncols):
            value = columns[c] if r == 0 else (rows[r - 1][c] if c < len(rows[r - 1]) else "")
            weight = "bold" if r == 0 else "normal"
            body.append(text(x + 8, y + row_h * 0.66, value, 12, "start", weight))
            if c:
                body.append(line(x, y, x, y + row_h, "s"))
            x += widths[c]
        y += row_h
    body.append(line(left, top + height, left + total_w, top + height, "s"))
    return "".join(body)


def _beaker(x: float, y: float, w: float, h: float, fill: float, label: str, temp: str) -> str:
    body = [rect(x, y, w, h, "s"), line(x + 8, y + h * (1 - fill), x + w - 8, y + h * (1 - fill), "sblue")]
    body.append(text(x + w / 2, y + h + 22, label, 13))
    # Below the water line, so the line never crosses the mass and temperature.
    body.append(text(x + w / 2, y + h * 0.78, temp, 13))
    return "".join(body)


def _spring(x1: float, y: float, x2: float, amplitude: float = 12, coils: int = 8) -> str:
    pts = [(x1, y)]
    step = (x2 - x1) / (coils * 2)
    for i in range(coils * 2):
        pts.append((x1 + step * (i + 0.5), y - amplitude if i % 2 == 0 else y + amplitude))
    pts.append((x2, y))
    return polyline(pts)


def _resistor(x: float, y: float, w: float = 70) -> str:
    pts = [(x, y)]
    for i in range(6):
        pts.append((x + w * (i + 0.5) / 6, y - 10 if i % 2 == 0 else y + 10))
    pts.append((x + w, y))
    return polyline(pts)


def _capacitor(x: float, y: float, gap: float = 10) -> str:
    return line(x - gap, y - 22, x - gap, y + 22, "s") + line(x + gap, y - 22, x + gap, y + 22, "s")


def _battery(x: float, y: float) -> str:
    return (
        line(x - 10, y - 16, x - 10, y + 16, "s")
        + line(x + 10, y - 9, x + 10, y + 9, "s")
        + line(x - 10, y - 24, x + 10, y - 24, "s")
        + line(x - 10, y + 24, x + 10, y + 24, "s")
    )


def _coil(x: float, y: float, w: float = 70) -> str:
    body = []
    for i in range(3):
        cx = x + w * (i + 0.5) / 3
        body.append(f'<path d="M {cx - w / 6:.1f} {y:.1f} A {w / 6:.1f} {w / 6:.1f} 0 0 1 {cx + w / 6:.1f} {y:.1f}" class="s"/>')
    return "".join(body)


def _symbol(kind: str, x: float, y: float) -> str:
    """Circuit-diagram symbols as the answer options describe them (a resistor is a rectangle, a cell two unequal lines)."""
    leads = line(x - 38, y, x - 22, y, "s") + line(x + 22, y, x + 38, y, "s")
    if kind == "эсэргүүцэл":
        return leads + rect(x - 22, y - 9, 44, 18, "s")
    if kind == "конденсатор":
        return line(x - 38, y, x - 8, y, "s") + line(x + 8, y, x + 38, y, "s") + _capacitor(x, y, 8)
    if kind == "ороомог":
        return line(x - 38, y, x - 30, y, "s") + _coil(x - 30, y, 60) + line(x + 30, y, x + 38, y, "s")
    if kind == "гүйдлийн эх үүсвэр":
        return (line(x - 38, y, x - 6, y, "s") + line(x - 6, y - 20, x - 6, y + 20, "s")
                + line(x + 6, y - 10, x + 6, y + 10, "s") + line(x + 6, y, x + 38, y, "s"))
    if kind in ("амперметр", "вольтметр", "гальванометр"):
        letter = {"амперметр": "A", "вольтметр": "V", "гальванометр": "G"}[kind]
        return leads + circle(x, y, 22, "s") + text(x, y + 6, letter, 16, weight="bold")
    if kind == "гэрлийн чийдэн":
        return leads + circle(x, y, 22, "s") + line(x - 15, y - 15, x + 15, y + 15, "s") + line(x - 15, y + 15, x + 15, y - 15, "s")
    if kind == "хувьсах гүйдлийн үүсвэр":
        wave = polyline([(x - 13 + i * 26 / 12, y - 7 * math.sin(i / 12 * 2 * math.pi)) for i in range(13)])
        return leads + circle(x, y, 22, "s") + wave
    if kind == "түлхүүр":
        return (line(x - 38, y, x - 14, y, "s") + circle(x - 14, y, 3, "s") + line(x - 14, y, x + 14, y - 16, "s")
                + circle(x + 14, y, 3, "s") + line(x + 14, y, x + 38, y, "s"))
    if kind == "диод":
        return (line(x - 38, y, x - 12, y, "s") + poly([(x - 12, y - 14), (x - 12, y + 14), (x + 10, y)], "s")
                + line(x + 10, y - 14, x + 10, y + 14, "s") + line(x + 10, y, x + 38, y, "s"))
    if kind == "газардуулга":
        return (line(x, y - 30, x, y, "s") + line(x - 22, y, x + 22, y, "s")
                + line(x - 14, y + 8, x + 14, y + 8, "s") + line(x - 6, y + 16, x + 6, y + 16, "s"))
    if kind == "реостат":
        return leads + rect(x - 22, y - 9, 44, 18, "s") + arrow(x - 22, y + 20, x + 24, y - 22, head=6)
    if kind == "хайлуур хамгаалагч":
        return line(x - 38, y, x + 38, y, "s") + rect(x - 22, y - 9, 44, 18, "s")
    return rect(x - 30, y - 18, 60, 36, "s")


def _gear(x: float, y: float) -> str:
    return circle(x, y, 18, "s") + circle(x, y, 5, "s")


def _nucleus(cx: float, cy: float, mass_number: int, atomic_number: int) -> str:
    body = [circle(cx, cy, 64, "s")]
    body.append(text(cx, cy - 10, f"A = {mass_number}", 13))
    body.append(text(cx, cy + 12, f"Z = {atomic_number}", 13))
    body.append(text(cx, cy + 34, "цөм", 11, fill="#4b5563"))
    return "".join(body)


def _energy_levels(fig: dict) -> str:
    levels = [int(x) for x in fig.get("levels", [1, 2, 3, 4])]
    energies = fig.get("energies_ev")
    if energies is None:
        energies = [-13.6 / (n * n) for n in levels]
    y_top, y_bottom = 55, 300
    # Not to scale: the upper levels crowd within 1 эВ, so they are spread evenly above a wide first gap.
    order = sorted(zip(levels, energies), key=lambda item: item[1])
    upper = max(1, len(order) - 1)
    ypos = {n: y_bottom if rank == 0 else 185 - (rank - 1) * (185 - y_top) / max(1, upper - 1)
            for rank, (n, _) in enumerate(order)}
    body = [arrow(92, y_bottom + 10, 92, y_top - 10, head=7)]
    body.append(text(80, y_top, "E", 13, "end"))
    for n in levels:
        y = ypos[n]
        body.append(line(150, y, 540, y, "s"))
        body.append(text(136, y + 4, f"n={n}", 12, "end"))
        body.append(text(548, y + 4, f"{energies[levels.index(n)]:g} эВ", 11, "start"))
    for index, pair in enumerate(fig.get("transitions", [])):
        if len(pair) != 2:
            continue
        a, b = int(pair[0]), int(pair[1])
        if a not in ypos or b not in ypos:
            continue
        y1, y2 = ypos[a], ypos[b]
        lane = 270 + (index % 6) * 34
        body.append(arrow(lane, y1, lane, y2, head=7))
        # Numbered like the transitions listed in the question, clear of the level lines it crosses.
        mid = (y1 + y2) / 2
        for _ in range(3):
            if all(abs(mid - level) >= 10 for level in ypos.values()):
                break
            mid += 14 if y2 > y1 else -14
        body.append(text(lane + 9, mid + 4, index + 1, 12, "start", "bold", "#1d4ed8"))
    return "".join(body)


def _decay_chain(fig: dict) -> str:
    parent = fig.get("parent", [0, 0])
    daughter = fig.get("daughter", [0, 0])
    pa, pz = int(parent[0]), int(parent[1])
    da, dz = int(daughter[0]), int(daughter[1])
    body = [rect(70, 120, 150, 100, "s"), rect(420, 120, 150, 100, "s")]
    body.append(text(145, 158, "Эх цөм", 14, weight="bold"))
    body.append(text(145, 182, f"A={pa}, Z={pz}", 13))
    body.append(text(145, 204, "цацраг идэвхт", 11, fill="#4b5563"))
    body.append(text(495, 158, "Үр цөм", 14, weight="bold"))
    body.append(text(495, 182, f"A={da}, Z={dz}", 13))
    body.append(text(495, 204, "тогтвортой", 11, fill="#4b5563"))
    body.append(arrow(230, 170, 410, 170, head=10))
    body.append(text(320, 150, "α, β задрал", 13))
    return "".join(body)


def _connected_masses(fig: dict) -> str:
    m2 = fig.get("m2_kg", 0)
    m1a = fig.get("m1_initial_kg", 0)
    m1b = fig.get("m1_test_kg", 0)
    mus = fig.get("mu_s", 0)
    muk = fig.get("mu_k", 0)
    body = [line(80, 190, 470, 190, "s"), rect(110, 140, 120, 50, "sb")]
    body.append(text(170, 170, f"m2 = {m2:g} кг", 13))
    body.append(line(230, 165, 450, 165, "s"))
    body.append(circle(470, 165, 22, "s"))
    body.append(circle(470, 165, 4, "s"))
    body.append(line(470, 187, 470, 270, "s"))
    body.append(rect(430, 270, 80, 55, "sg"))
    body.append(text(470, 300, f"m1 = {m1a:g} кг", 12))
    # m2 is pulled toward the pulley, so friction on it points the other way.
    body.append(arrow(190, 215, 120, 215, color="#b91c1c", head=7))
    body.append(text(155, 235, "үрэлт", 11, fill="#b91c1c"))
    body.append(text(300, 250, f"μс = {mus:.2f}", 12))
    body.append(text(300, 270, f"μ = {muk:.2f}", 12))
    body.append(text(300, 310, f"Туршилтын m1 = {m1b:g} кг", 12, fill="#4b5563"))
    return "".join(body)


def _charged_particle(fig: dict) -> str:
    body = [rect(80, 40, 480, 260, "s")]
    for x in range(110, 550, 40):
        for y in range(70, 290, 40):
            body.append(line(x - 5, y - 5, x + 5, y + 5, "s"))
            body.append(line(x - 5, y + 5, x + 5, y - 5, "s"))
    cx, cy, r = 320, 170, 70
    body.append(circle(cx, cy, r, "sblue"))
    body.append(circle(cx + r, cy, 7, "sr"))
    body.append(text(cx + r + 18, cy + 4, "q", 14, fill="#b91c1c"))
    body.append(arrow(cx + r, cy - 12, cx + r, cy - 60, color="#1d4ed8", head=7))
    body.append(text(cx + r + 12, cy - 62, "v", 13, fill="#1d4ed8"))
    body.append(line(cx, cy, cx + r, cy, "dash"))
    body.append(text(cx + r / 2, cy - 8, "R", 13))
    body.append(text(100, 60, "B ⊗", 14))
    body.append(text(430, 330, "соронзон орон", 12, fill="#4b5563"))
    return "".join(body)


def render_svg(fig: dict) -> str:
    kind = fig.get("kind", "unknown")
    body = ""
    if kind == "ruler":
        length = float(fig.get("length_cm", 8.5))
        x0, x1, y = 70, 570, 220
        scale = (x1 - x0) / max(length, 0.1)
        body += rect(x0, y, x1 - x0, 60, "sb")
        for mm in range(int(round(length * 10)) + 1):
            x = x0 + mm * scale / 10
            h = 14 if mm % 10 == 0 else 7
            body += line(x, y, x, y + h, "s")
            if mm % 10 == 0:
                body += text(x, y + 82, mm // 10, 11)
        body += rect(x0, 150, length * scale, 22, "sg", 8)
        body += text(x0 + length * scale / 2, 140, f"{length:g} см", 13)
    elif kind == "v_t_graph":
        points = [[float(p[0]), float(p[1])] for p in fig.get("points", [])]
        xs, ys = [p[0] for p in points], [p[1] for p in points]
        xmax = max(xs) * 1.15 if xs else 1
        if ys and min(ys) < 0:
            # Negative velocity (turning back) used to fall below the canvas: draw the time axis at v = 0 instead.
            top, bottom = max(max(ys), 0), min(ys)
            margin = 0.15 * (top - bottom)
            body = ""
            for i in range(1, 5):
                gx = 80 + 500 * i / 5
                body += line(gx, 300, gx, 40, "grid")
            def mapper(x: float, y: float) -> tuple[float, float]:
                return 80 + x / xmax * 500, 300 - (y - (bottom - margin)) / (top - bottom + 2 * margin) * 260
            zero = mapper(0, 0)[1]
            body += arrow(80, 300, 80, 32) + arrow(80, zero, 588, zero)
            body += text(28, 170, "v, м/с", 13, rotate=-90) + text(596, zero + 4, "t, с", 13, "start")
            body += text(72, zero + 4, "0", 11, "end")
            body += _series(points, mapper) + _point_labels(points, mapper)
        else:
            ymax = max(ys) * 1.15 if ys and max(ys) > 0 else 1
            frame, mapper = graph_frame("t, с", "v, м/с", 0, xmax, 0, ymax)
            body = frame + _series(points, mapper) + _point_labels(points, mapper)
    elif kind == "f_t_graph":
        points = [[float(p[0]), float(p[1])] for p in fig.get("points", [])]
        xs, ys = [p[0] for p in points], [p[1] for p in points]
        xmax, ymax = max(xs) * 1.1 if xs else 1, max(ys) * 1.15 if ys else 1
        frame, mapper = graph_frame("t, с", "F, Н", 0, xmax, 0, ymax)
        plotted = [mapper(*p) for p in points]
        area = [(plotted[0][0], mapper(0, 0)[1])] + plotted + [(plotted[-1][0], mapper(0, 0)[1])]
        body = frame + poly(area, "sg") + _series(points, mapper) + _point_labels(points, mapper)
    elif kind == "p_v_diagram":
        points = [[float(p[0]), float(p[1])] for p in fig.get("points", [])]
        xs, ys = [p[0] for p in points], [p[1] for p in points]
        xmax, ymax = max(xs) * 1.15 if xs else 1, max(ys) * 1.15 if ys else 1
        # No generic ticks (7.17, 115 …): each state's V and p is marked on the axes, so V2 and p3 can be read.
        frame, mapper = graph_frame("V, л", "p, кПа", 0, xmax, 0, ymax, ticks=False)
        body = frame + text(80, 318, "0", 11)
        for value in sorted(set(xs)):
            px, top = mapper(value, max(p[1] for p in points if p[0] == value))
            body += line(px, 300, px, top, "dash") + line(px, 300, px, 305, "s") + text(px, 318, _num(value), 11)
        for value in sorted(set(ys)):
            right, py = mapper(max(p[0] for p in points if p[1] == value), value)
            body += line(80, py, right, py, "dash") + line(75, py, 80, py, "s") + text(71, py + 4, _num(value), 11, "end")
        # Segment i is straight, or an isotherm (pV = const) when listed in "curves".
        curves = set(fig.get("curves", []))
        labels = fig.get("labels", [])
        for i in range(1, len(points)):
            (va, pa), (vb, pb) = points[i - 1], points[i]
            if i - 1 in curves:
                track = [mapper(va + (vb - va) * j / 40, pa * va / (va + (vb - va) * j / 40)) for j in range(41)]
                body += polyline(track)
                body += arrow(*track[-6], *track[-1], color="#1d4ed8", head=6)
            else:
                body += line(*mapper(va, pa), *mapper(vb, pb), "s")
                body += arrow(*mapper(va, pa), *mapper(vb, pb), color="#1d4ed8", head=6)
        for i, p in enumerate(points):
            px, py = mapper(*p)
            body += circle(px, py, 4, "s")
            body += text(px + 7, py - 7, labels[i] if i < len(labels) else str(i + 1), 12, "start")
    elif kind == "rod_with_masses":
        length = float(fig.get("length_m", 1))
        masses = fig.get("masses_kg", [])
        positions = fig.get("positions_m", [])
        x0, x1, y = 110, 530, 210
        body = line(x0, y, x1, y, "s")
        body += poly([(320, y + 10), (300, y + 40), (340, y + 40)], "sb")
        for mass, pos in zip(masses, positions):
            px = x0 + float(pos) / max(length, 0.01) * (x1 - x0)
            r = 12 + 5 * math.sqrt(max(float(mass), 0))
            body += circle(px, y - r - 2, r, "sb")
            body += text(px, y - r - 8, f"{float(mass):g} кг", 11)
        body += text((x0 + x1) / 2, y - 80, f"L = {length:g} м", 13)
        body += text(320, y + 62, "дэмжлэг", 11, fill="#4b5563")
    elif kind == "lever":
        arm = float(fig.get("arm_m", 0.5))
        other = float(fig.get("other_arm_m", 0.5))
        force = float(fig.get("force_n", 0))
        cx, y = 320, 190
        body = line(100, y, 540, y, "s")
        body += poly([(cx, y + 8), (cx - 22, y + 48), (cx + 22, y + 48)], "sb")
        left = cx - arm / max(arm, other, 0.1) * 180
        right = cx + other / max(arm, other, 0.1) * 180
        # The load hangs on the first arm; the unknown force acts on the other.
        body += arrow(left, y - 70, left, y, color="#b91c1c", head=8)
        body += text(left, y - 82, f"ачаа {force:g} Н", 12, fill="#b91c1c")
        body += arrow(right, y - 70, right, y, color="#1d4ed8", head=8)
        body += text(right, y - 82, "F = ?", 12, fill="#1d4ed8")
        body += text(cx - 28, y + 68, f"{arm:g} м", 11)
        body += text(cx + 28, y + 68, f"{other:g} м", 11)
    elif kind == "elevator":
        mass = float(fig.get("mass_kg", 0))
        accel = float(fig.get("acceleration", 0))
        body = rect(220, 80, 200, 200, "sb")
        body += circle(320, 145, 18, "s")
        body += line(320, 163, 320, 235, "s")
        body += line(320, 190, 285, 215, "s")
        body += line(320, 190, 355, 215, "s")
        body += line(320, 235, 295, 275, "s")
        body += line(320, 235, 345, 275, "s")
        if "moving_up" in fig:
            # The arrow shows the direction of motion; whether the lift speeds up or slows down is in the text.
            body += arrow(500, 250, 500, 120, color="#1d4ed8", head=9) if fig["moving_up"] else arrow(500, 120, 500, 250, color="#1d4ed8", head=9)
            body += text(516, 190, "v", 13, "start", fill="#1d4ed8")
            body += text(320, 345, f"|a| = {accel:g} м/с²", 12, fill="#1d4ed8")
        else:
            body += arrow(500, 120, 500, 250, color="#1d4ed8", head=9)
            body += text(516, 190, f"a = {accel:g} м/с²", 12, fill="#1d4ed8")
        body += text(320, 320, f"m = {mass:g} кг", 13)
    elif kind == "spring_launcher":
        k = fig.get("stiffness_n_m", 0)
        comp = fig.get("compression_cm", 0)
        mass = fig.get("mass_g", 0)
        body = rect(60, 100, 22, 160, "sb")
        body += _spring(82, 180, 270, amplitude=16, coils=9)
        body += rect(275, 168, 28, 24, "sr")
        body += text(290, 150, fig.get("label", "сум"), 11, fill="#b91c1c")
        body += line(270, 130, 270, 230, "dash")
        body += text(170, 120, f"k = {k:g} Н/м", 12)
        body += text(190, 250, f"x = {comp:g} см", 12)
        body += text(340, 250, f"m = {mass:g} г", 12)
    elif kind == "inclined_track":
        h = float(fig.get("height_m", 0))
        v0 = float(fig.get("initial_speed", 0))
        body = poly([(80, 300), (560, 300), (400, 100)], "sb")
        body += rect(330, 170, 45, 30, "sg")
        body += arrow(350, 200, 300, 250, color="#1d4ed8", head=7)
        body += text(300, 270, f"v0 = {v0:g} м/с", 12, fill="#1d4ed8")
        body += line(400, 100, 400, 300, "dash")
        body += text(416, 200, f"h = {h:g} м", 12, "start")
        body += text(250, 320, "гөлгөр налуу", 11, fill="#4b5563")
    elif kind == "crane":
        mass = float(fig.get("mass_t", 0))
        speed = float(fig.get("speed_m_s", 0))
        eff = float(fig.get("efficiency", 0))
        body = rect(100, 70, 20, 250, "sb")
        body += line(120, 80, 520, 80, "s")
        body += line(470, 80, 470, 230, "s")
        body += rect(430, 230, 80, 55, "sg")
        body += text(470, 262, f"{mass:g} т", 12)
        body += arrow(540, 250, 540, 120, color="#1d4ed8", head=8)
        body += text(552, 190, f"v = {speed:g} м/с", 11, fill="#1d4ed8")
        body += text(240, 55, f"η = {eff * 100:g}%", 12)
    elif kind == "thermal_expansion":
        length = float(fig.get("length_m", 0))
        dt = float(fig.get("delta_t", 0))
        body = rect(100, 140, 400, 16, "sb")
        body += line(100, 190, 440, 190, "dash")
        body += text(300, 120, f"L = {length:g} м", 12)
        body += text(300, 220, f"ΔT = {dt:g} °C", 12)
        body += arrow(510, 170, 550, 170, color="#b91c1c", head=7)
        body += text(560, 158, "ΔL", 11, fill="#b91c1c")
    elif kind == "thermometer":
        celsius = float(fig.get("celsius", 0))
        top, bottom = 60, 280
        body = rect(300, top, 40, bottom - top, "sb", 18)
        body += circle(320, 300, 30, "sb")
        frac = max(0.0, min(1.0, (celsius + 20) / 120))
        level = bottom - frac * (bottom - top - 20)
        body += f'<rect x="306" y="{level:.1f}" width="28" height="{300 - level:.1f}" fill="#ef4444" stroke="none" rx="10"/>'
        for t in range(-20, 101, 20):
            y = bottom - (t + 20) / 120 * (bottom - top - 20)
            body += line(345, y, 360, y, "s")
            body += text(368, y + 4, f"{t}", 10, "start")
        body += text(250, 300, f"{celsius:g} °C", 14)
    elif kind == "calorimeter":
        ht = float(fig.get("hot_temp_c", 0))
        ct = float(fig.get("cold_temp_c", 0))
        ft = float(fig.get("final_temp_c", 0))
        # Only the given mass is printed; the unknown one is left as "?".
        hot = f"{float(fig['hot_mass_kg']):g} кг" if fig.get("hot_mass_kg") is not None else "? кг"
        cold = f"{float(fig['cold_mass_kg']):g} кг" if fig.get("cold_mass_kg") is not None else "? кг"
        body = _beaker(50, 150, 130, 120, 0.75, "халуун ус", f"{hot}, {ht:g} °C")
        body = body + _beaker(460, 150, 130, 120, 0.55, "хүйтэн ус", f"{cold}, {ct:g} °C")
        body = body + _beaker(255, 145, 130, 130, 0.65, "холимог", f"{ft:g} °C")
        body += arrow(185, 210, 245, 210, head=7)
        body += arrow(445, 210, 395, 210, head=7)
    elif kind == "heating_curve":
        power = float(fig.get("power_w", 0))
        mass = float(fig.get("mass_kg", 0))
        dt = float(fig.get("delta_t", 0))
        total = float(fig.get("time_s", 0))
        # The liquid warms steadily by ΔT in the stated time (seconds); there is no change of state.
        y0, y1 = 20, 20 + dt
        frame, mapper = graph_frame("t, с", "T, °C", 0, total * 1.1, 0, max(y1 * 1.2, 60), ticks=False)
        pts = [[0, y0], [total, y1]]
        body = frame + _series(pts, mapper) + _point_labels(pts, mapper)
        body += text(320, 355, f"P = {power:g} Вт, m = {mass:g} кг", 11, fill="#4b5563")
    elif kind == "table":
        body = _table(fig.get("columns", []), fig.get("rows", []))
    elif kind == "truth_table":
        body = _table(fig.get("columns", []), fig.get("rows", []))
    elif kind == "circuit_symbols":
        target = fig.get("target", "")
        ordered = fig.get("symbols")
        if not ordered:
            all_symbols = ["эсэргүүцэл", "конденсатор", "ороомог", "гүйдлийн эх үүсвэр", "амперметр", "вольтметр"]
            ordered = [target] + [s for s in all_symbols if s != target][:4]
            shift = all_symbols.index(target) % 5 if target in all_symbols else 0
            ordered = ordered[shift:] + ordered[:shift]
        # Numbered 1–5 so the panels are not confused with the answer letters A–E.
        for i, symbol in enumerate(ordered):
            x = 110 + i * 105
            body += rect(x - 46, 90, 92, 120, "s")
            body += _symbol(symbol, x, 140)
            body += text(x, 235, str(i + 1), 14, weight="bold")
        body += text(320, 285, "Цахилгаан хэлхээний тэмдэглэгээ", 12, fill="#4b5563")
    elif kind == "parallel_wires":
        # The wires are perpendicular to the page: drawn as cross-sections, ⊙ out of the page and ⊗ into it.
        left = fig.get("left_current", "out")
        right = fig.get("right_current", "in")
        labels = fig.get("labels", ["I", "I"])
        point = fig.get("point", "M")
        y = 180
        body = line(60, y, 580, y, "dash")
        for x, direction, label in ((250, left, labels[0]), (390, right, labels[1])):
            body += circle(x, y, 16, "s")
            if direction == "out":
                body += f'<circle cx="{x}" cy="{y}" r="4" fill="#111827"/>'
            else:
                body += line(x - 10, y - 10, x + 10, y + 10, "s") + line(x - 10, y + 10, x + 10, y - 10, "s")
            body += text(x, y - 28, label, 14, weight="bold")
        px = {"M": 320, "K": 110, "N": 530}.get(point, 320)
        body += f'<circle cx="{px}" cy="{y}" r="5" fill="#b91c1c"/>' + text(px, y + 26, point, 14, fill="#b91c1c")
        body += arrow(610, 250, 610, 120, head=7) + text(600, 112, "дээш", 11, "end")
        body += text(320, 300, "⊙ — хуудаснаас гарах, ⊗ — хуудас руу орох гүйдэл", 12, fill="#4b5563")
    elif kind == "capacitor_ac":
        cap = fig.get("capacitance_text") or f"{float(fig.get('capacitance_uf', 0)):g}"
        freq = fig.get("frequency_text") or f"{float(fig.get('frequency_hz', 0)):g}"
        body = rect(150, 70, 340, 200, "s")
        body += _capacitor(320, 70)
        body += circle(320, 270, 24, "s")
        body += text(320, 275, "~", 22)
        body += text(320, 320, f"C = {cap} мкФ, f = {freq} Гц", 12)
    elif kind == "capacitor_circuit":
        caps = fig.get("capacitances_uf", [])
        volts = float(fig.get("voltage_v", 0))
        body = line(120, 90, 520, 90, "s") + line(120, 270, 520, 270, "s")
        body += _battery(120, 180)
        for i, cap in enumerate(caps[:2]):
            x = 270 + i * 120
            body += line(x, 90, x, 135, "s") + _capacitor(x, 180) + line(x, 225, x, 270, "s")
            body += text(x + 18, 185, f"{float(cap):g} мкФ", 11, "start")
        body += text(320, 320, f"U = {volts:g} В", 12)
    elif kind == "resistor_network":
        r1 = fig.get("r1", 0)
        r2 = fig.get("r2", 0)
        r3 = fig.get("r3", 0)
        body = rect(100, 70, 440, 210, "s")
        body += _battery(100, 175)
        body += _resistor(210, 70, 100)
        body += text(260, 55, f"R1 = {float(r1):g} Ом", 11)
        body += line(310, 70, 400, 70, "s") + line(400, 70, 400, 120, "s")
        body += _resistor(400, 130, 70) + line(400, 190, 400, 230, "s")
        body += _resistor(400, 240, 70)
        body += line(470, 130, 520, 130, "s") + line(520, 130, 520, 240, "s")
        body += line(470, 240, 520, 240, "s")
        body += text(450, 115, f"R2 = {float(r2):g} Ом", 10)
        body += text(450, 275, f"R3 = {float(r3):g} Ом", 10)
    elif kind == "wave_reflection":
        end = fig.get("end", "бэхэлсэн")
        pulse = fig.get("pulse")
        body = line(70, 190, 520, 190, "s")
        if pulse:
            # Only the incoming pulse is drawn; how it returns is what the question asks.
            peak = 145 if pulse == "up" else 235
            body += poly([(160, 190), (200, peak), (240, 190)], "sblue")
            body += arrow(260, 120 if pulse == "up" else 260, 360, 120 if pulse == "up" else 260, color="#1d4ed8", head=7)
            body += text(310, 105 if pulse == "up" else 285, "илгээсэн импульс", 11, fill="#1d4ed8")
            if end == "бэхэлсэн":
                body += rect(520, 120, 14, 140, "sb") + text(527, 108, "бэхэлсэн үзүүр", 11)
            else:
                body += line(545, 100, 545, 280, "s") + circle(545, 190, 10, "s") + text(545, 88, "чөлөөтэй цагираг", 11)
        else:
            if end == "бэхэлсэн":
                body += rect(520, 130, 12, 120, "sb")
                body += poly([(430, 190), (455, 145), (480, 190)], "sr")
                body += text(455, 125, "бэхэлсэн үзүүр", 11, fill="#b91c1c")
            else:
                body += circle(530, 190, 14, "s")
                body += poly([(430, 190), (455, 150), (480, 190)], "sblue")
                body += text(455, 125, "сул үзүүр", 11, fill="#1d4ed8")
            body += arrow(150, 140, 260, 140, color="#1d4ed8", head=7)
            body += arrow(300, 240, 190, 240, color="#b91c1c", head=7)
            body += text(205, 125, "тусгагдсан", 10, fill="#1d4ed8")
            body += text(245, 260, "ойсон", 10, fill="#b91c1c")
    elif kind == "wave_profile":
        speed = float(fig.get("speed_m_s", 0))
        half = float(fig.get("half_wavelength_m", 0))
        body = line(60, 200, 580, 200, "s")
        pts = []
        for i in range(121):
            x = 60 + i * 520 / 120
            y = 200 - 45 * math.sin(i / 120 * 4 * math.pi)
            pts.append((x, y))
        body += polyline(pts, "sblue")
        # One period of the drawn wave is 260 px: mark the distance named in the question (half or full period).
        if "span" in fig:
            start, stop = (125, 255) if fig["span"] == "half" else (125, 385)
            body += line(start, 140, start, 260, "dash") + line(stop, 140, stop, 260, "dash")
            body += arrow(start, 265, stop, 265, head=7) + arrow(stop, 265, start, 265, head=7)
            body += text((start + stop) / 2, 285, fig.get("label", ""), 12)
        else:
            body += line(190, 200, 450, 200, "dash")
            body += arrow(190, 225, 450, 225, head=7)
            body += text(320, 245, f"λ/2 = {half:g} м", 12)
        # The wave travels along the rope, so its velocity arrow is horizontal.
        body += arrow(470, 110, 570, 110, color="#1d4ed8", head=7)
        body += text(520, 98, f"v = {speed:g} м/с", 11, fill="#1d4ed8")
    elif kind == "sound_speed_temperature":
        intercept = float(fig.get("intercept", 331))
        slope = float(fig.get("slope", 0.6))
        if fig.get("ask") == "T":
            temp = (float(fig["speed"]) - intercept) / slope
        else:
            temp = float(fig.get("temperature_c", 20))
        # Cold days need negative temperatures on the axis. Marked points (with 0 °C) give the line's equation.
        tmin = -40 if temp < 0 else 0
        tmax = 40 if temp < 0 else 45
        frame, mapper = graph_frame("T, °C", "v, м/с", tmin, tmax * 1.08, intercept + slope * tmin - 8, intercept + slope * tmax + 8, ticks=False)
        pts = [[tmin, intercept + slope * tmin], [tmax, intercept + slope * tmax]]
        marks = [[tmin, intercept + slope * tmin], [0, intercept], [tmax, intercept + slope * tmax]] if tmin < 0 else pts
        body = frame + _series(pts, mapper) + _point_labels(marks, mapper)
        px, py = mapper(temp, intercept + slope * temp)
        body += line(px, 300, px, py, "dash") + line(80, py, px, py, "dash")
        body += circle(px, py, 4, "s")
        if fig.get("ask") == "T":
            body += text(84, py - 6, f"{float(fig['speed']):g} м/с", 11, "start") + text(px, 318, "?", 13, weight="bold")
        else:
            body += text(px + 10, py - 10, "?", 12, "start")
    elif kind == "shm_displacement_time" and "amplitude_m" in fig:
        # Task 2.4 passes x = A·sin(ωt + φ) in SI units (it was drawn as a flat line under the mm/Hz keys below).
        # No numeric ticks: the period is one of the answers, so only A and T are marked.
        amp = float(fig["amplitude_m"])
        omega = float(fig.get("angular_frequency", 2 * math.pi))
        phase = float(fig.get("initial_phase", 0))
        period = 2 * math.pi / omega
        frame, mapper = graph_frame("t, с", "x, м", 0, 2 * period, -amp * 1.25, amp * 1.25, ticks=False)
        pts = [[2 * period * i / 200, amp * math.sin(omega * 2 * period * i / 200 + phase)] for i in range(201)]
        body = frame + line(80, mapper(0, 0)[1], 580, mapper(0, 0)[1], "grid") + _series(pts, mapper)
        peak = ((math.pi / 2 - phase) % (2 * math.pi)) / omega
        top_x, top_y = mapper(peak, amp)
        body += line(80, top_y, top_x, top_y, "dash") + text(71, top_y + 4, "A", 12, "end")
        body += text(71, mapper(0, -amp)[1] + 4, "−A", 12, "end") + line(80, mapper(0, -amp)[1], mapper(peak + period / 2, -amp)[0], mapper(0, -amp)[1], "dash")
        left, right = mapper(peak, amp)[0], mapper(peak + period, amp)[0]
        body += arrow(left, top_y - 18, right, top_y - 18, head=6) + arrow(right, top_y - 18, left, top_y - 18, head=6)
        body += text((left + right) / 2, top_y - 24, "T", 12)
        body += text(80, mapper(0, 0)[1] + 16, "0", 11, "end")
    elif kind == "shm_displacement_time":
        amp = float(fig.get("amplitude_mm", 0))
        freq = float(fig.get("frequency_hz", 1))
        unit = fig.get("unit", "мм")
        period = 1 / max(freq, 0.01)
        # Ticks at ±A, ±A/2 and every half period, so both the amplitude and the period can be read.
        frame, mapper = graph_frame("t, с", f"x, {unit}", 0, 2 * period * 1.06, -amp * 1.25, amp * 1.25, ticks=False)
        pts = [[2 * period * i / 160, amp * math.sin(2 * math.pi * freq * 2 * period * i / 160)] for i in range(161)]
        body = frame + line(80, mapper(0, 0)[1], 580, mapper(0, 0)[1], "grid") + _series(pts, mapper)
        for value in (-amp, -amp / 2, 0, amp / 2, amp):
            py = mapper(0, value)[1]
            body += line(75, py, 80, py, "s") + text(71, py + 4, _num(value, 3), 11, "end")
        for i in range(1, 5):
            px = mapper(i * period / 2, 0)[0]
            body += line(px, 300, px, 305, "s") + text(px, 318, _num(i * period / 2, 3), 11)
    elif kind == "water_waves":
        n = fig.get("oscillations", 0)
        t = fig.get("time_s", 0)
        wl = fig.get("wavelength_m", 0)
        body = line(50, 210, 590, 210, "sblue")
        pts = [(x, 210 - 30 * math.sin((x - 50) / 540 * 6 * math.pi)) for x in range(50, 591, 4)]
        body += polyline(pts, "sblue")
        body += circle(320, 185, 14, "sb")
        body += text(320, 240, "хөвөгч", 11)
        body += arrow(120, 270, 300, 270, head=7)
        body += text(210, 288, f"λ = {wl:g} м", 11)
        body += text(320, 325, f"{n:g} хэлбэлзэл / {t:g} с", 12)
    elif kind == "refraction":
        n1_less = bool(fig.get("n1_less", True))
        body = line(50, 200, 590, 200, "s")
        body += line(320, 70, 320, 320, "dash")
        body += line(150, 70, 320, 200, "sblue")
        body += arrow(180, 92, 300, 188, color="#1d4ed8", head=7)
        if n1_less:
            body += line(320, 200, 420, 320, "sblue")
            body += text(450, 320, "n2 > n1", 11, "start")
        else:
            body += line(320, 200, 500, 320, "sblue")
            body += text(510, 320, "n2 < n1", 11, "start")
        body += text(120, 185, f"n1 · {fig['from']}" if fig.get("from") else "n1", 12, "start")
        body += text(520, 225, f"n2 · {fig['to']}" if fig.get("to") else "n2", 12, "end")
        body += text(320, 60, "хэвийн", 10)
    elif kind == "illuminance":
        i = float(fig.get("intensity_cd", 0))
        dist = float(fig.get("distance_m", 0))
        body = line(80, 300, 560, 300, "s")
        body += line(180, 300, 180, 80, "s")
        body += circle(180, 70, 18, "sg")
        body += line(180, 88, 180, 300, "dash")
        for x in (360, 420, 480):
            body += arrow(180, 88, x, 300, color="#f59e0b", head=6)
        body += text(100, 90, f"I = {i:g} кд", 12)
        body += arrow(180, 320, 480, 320, head=7)
        body += text(330, 338, f"r = {dist:g} м", 12)
    elif kind == "energy_levels":
        body = _energy_levels(fig)
    elif kind == "nuclide":
        a = int(fig.get("mass_number", 0))
        z = int(fig.get("atomic_number", 0))
        body = _nucleus(320, 170, a, z)
        body += text(320, 260, f"{fig.get('element', '')}-{a}", 15, weight="bold")
        body += text(320, 285, f"A = {a}, Z = {z}", 12)
    elif kind == "decay_chain":
        body = _decay_chain(fig)
    elif kind == "connected_masses":
        body = _connected_masses(fig)
    elif kind == "charged_particle_in_b":
        body = _charged_particle(fig)
    elif kind == "gas_state":
        pressure = float(fig.get("pressure_kpa", 0))
        volume = float(fig.get("volume_l", 0))
        body = rect(190, 90, 260, 190, "s")
        body += line(190, 120, 450, 120, "s")
        body += rect(220, 125, 200, 10, "sb")
        for x, y in ((230, 160), (280, 190), (340, 160), (390, 200), (300, 230), (370, 240)):
            body += circle(x, y, 4, "s")
        body += text(320, 315, f"p = {pressure:g} кПа, V = {volume:g} л", 12)
    else:
        body = rect(60, 60, 520, 240, "s")
        body += text(320, 180, f"Зураг: {kind}", 16, weight="bold")
        body += text(320, 210, str(fig), 10)

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label="physics diagram">'
        f"<style>{STYLE}</style>"
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#ffffff"/>'
        f"{body}</svg>"
    )
