"""Small SVG toolkit for original chemistry figures used by the mock exams.

Every figure is drawn from scratch; nothing is traced from the official papers.
"""
import math
from html import escape

FONT = "Arial, Helvetica, sans-serif"


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'font-family="{FONT}">\n<rect width="{w}" height="{h}" fill="#fff"/>\n'
            '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker></defs>\n'
            + body + '\n</svg>\n')


def unwrap(doc):
    """Return (width, height, inner_body) of an svg() document produced by this module."""
    import re
    w, h = (float(v) for v in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', doc).groups())
    inner = doc.split('</defs>\n', 1)[1].rsplit('\n</svg>', 1)[0]
    return w, h, inner


def stack(docs, gap=10, horizontal=False):
    """Combine several svg() documents into one, vertically (default) or horizontally."""
    parts, off, W, H = [], 0, 0, 0
    for d in docs:
        w, h, inner = unwrap(d)
        tr = f'translate({off},0)' if horizontal else f'translate(0,{off})'
        parts.append(f'<g transform="{tr}">{inner}</g>')
        if horizontal:
            off += w + gap; W = off; H = max(H, h)
        else:
            off += h + gap; H = off; W = max(W, w)
    return svg(W, H, '\n'.join(parts))


def text(x, y, s, size=14, anchor="middle", weight="normal", italic=False, fill="#111"):
    style = ' font-style="italic"' if italic else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" '
            f'font-weight="{weight}" fill="{fill}"{style}>{rich(s)}</text>')


def rich(s):
    """Escape text; ``_{..}`` becomes subscript and ``^{..}`` superscript."""
    out, i = [], 0
    s = str(s)
    while i < len(s):
        if s[i] in '_^' and i + 1 < len(s) and s[i + 1] == '{':
            j = s.index('}', i)
            shift = '4' if s[i] == '_' else '-6'
            out.append(f'<tspan dy="{shift}" font-size="75%">{escape(s[i + 2:j])}</tspan>'
                       f'<tspan dy="{-int(shift)}">​</tspan>')
            i = j + 1
        else:
            out.append(escape(s[i]))
            i += 1
    return ''.join(out)


def head(x1, y1, x2, y2, size=8, color="#111"):
    """Filled arrowhead at (x2, y2) pointing along (x1, y1) -> (x2, y2)."""
    d = math.hypot(x2 - x1, y2 - y1) or 1
    ux, uy = (x2 - x1) / d, (y2 - y1) / d
    bx, by = x2 - ux * size, y2 - uy * size
    px, py = -uy * size * 0.45, ux * size * 0.45
    return (f'<polygon points="{x2:.1f},{y2:.1f} {bx + px:.1f},{by + py:.1f} {bx - px:.1f},{by - py:.1f}" '
            f'fill="{color}"/>')


def line(x1, y1, x2, y2, w=1.6, dash=None, arrow=False, color="#111"):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    if arrow:
        L = math.hypot(x2 - x1, y2 - y1) or 1
        ex, ey = x2 - (x2 - x1) / L * 6, y2 - (y2 - y1) / L * 6
        return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{color}" stroke-width="{w}"{d}/>'
                + head(x1, y1, x2, y2, color=color))
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}"{d}/>'


def rect(x, y, w, h, fill="none", stroke="#111", sw=1.5, rx=0):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" rx="{rx}"/>'


def poly(points, w=2, color="#111", dash=None, fill="none"):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    pts = ' '.join(f'{x:.1f},{y:.1f}' for x, y in points)
    return f'<polyline points="{pts}" fill="{fill}" stroke="{color}" stroke-width="{w}"{d}/>'


def box(x, y, w, h, label, size=13):
    lines = label.split('\n')
    body = [rect(x, y, w, h)]
    top = y + h / 2 - (len(lines) - 1) * size * 0.6 + size * 0.35
    for k, ln in enumerate(lines):
        body.append(text(x + w / 2, top + k * size * 1.2, ln, size))
    return '\n'.join(body)


def table(rows, colw, x=10, y=10, rowh=28, size=13, header=True):
    """rows: list of lists of strings. Returns (svg_body, height)."""
    body = []
    total = sum(colw)
    for r, row in enumerate(rows):
        cx = x
        yy = y + r * rowh
        for c, cell in enumerate(row):
            fill = "#f1f1f1" if header and r == 0 else "none"
            body.append(rect(cx, yy, colw[c], rowh, fill=fill, sw=1))
            body.append(text(cx + colw[c] / 2, yy + rowh / 2 + size * 0.35, cell, size,
                             weight='bold' if header and r == 0 else 'normal'))
            cx += colw[c]
    return '\n'.join(body), len(rows) * rowh + 2 * y, total + 2 * x


def table_svg(rows, colw, rowh=28, size=13, header=True):
    body, h, w = table(rows, colw, rowh=rowh, size=size, header=header)
    return svg(w, h, body)


def axes(x0, y0, w, h, xlabel, ylabel, size=12):
    body = [line(x0, y0, x0, y0 - h, arrow=True), line(x0, y0, x0 + w, y0, arrow=True),
            text(x0 + w - 4, y0 + 18, xlabel, size, anchor='end')]
    lines = ylabel.split('\n')
    for k, ln in enumerate(lines):
        body.append(text(x0 - 8, y0 - h + 6 + k * (size + 2), ln, size, anchor='end'))
    return body


def mb_points(x0, y0, sx, sy, peak=1.0, height=1.0, xmax=4.0, n=120):
    """Maxwell-Boltzmann-like curve with most-probable energy at ``peak``."""
    pts = []
    for i in range(n + 1):
        e = xmax * i / n
        f = (e / peak) ** 2 * math.exp(1 - (e / peak) ** 2) if e > 0 else 0
        # flatten tail like a real distribution: use e*exp(-e) shape scaled to peak
        f = (e / peak) * math.exp(1 - e / peak) if e > 0 else 0
        pts.append((x0 + e * sx, y0 - f * height * sy))
    return pts


def mb_figure(curves, marks=(), w=360, h=220, xlabel="энерги", ylabel="жижиг\nхэсгийн\nтоо", title=None):
    """curves: list of dicts {peak,height,dash,label,label_at}; marks: list of (energy,label,dash)."""
    x0, y0 = 95, h - 35
    sx, sy = (w - 120) / 4.0, (h - 70)
    body = axes(x0, y0, w - 110, h - 50, xlabel, ylabel)
    body.append(text(x0 - 6, y0 + 14, '0', 12))
    for c in curves:
        pts = mb_points(x0, y0, sx, sy, c.get('peak', 1.0), c.get('height', 1.0))
        body.append(poly(pts, dash=c.get('dash')))
        if c.get('label'):
            e = c.get('label_at', 1.6)
            k = min(range(len(pts)), key=lambda i: abs(pts[i][0] - (x0 + e * sx)))
            px, py = pts[k]
            body.append(line(px, py, px + 22, py - 22, w=1))
            body.append(text(px + 26, py - 24, c['label'], 12, anchor='start'))
    for e, label, dash in marks:
        xx = x0 + e * sx
        body.append(line(xx, y0, xx, y0 - sy * 0.55, w=1.2, dash='4 3' if dash else None))
        body.append(text(xx, y0 + 16, label, 12))
    if title:
        body.append(text(20, 22, title, 15, anchor='start', weight='bold'))
    return svg(w, h, '\n'.join(body))


def energy_profile(levels, w=300, h=220, ylabel="энерги", xlabel="урвалын явц", labels=True, title=None,
                   extra=()):
    """levels = (reactant, peak, product) in 0..1 units of height. extra: (y,label) dashed guides."""
    r, p, q = levels
    x0, y0 = 60, h - 30
    H = h - 60
    body = axes(x0, y0, w - 75, h - 45, xlabel, ylabel)
    yr, yp, yq = y0 - r * H, y0 - p * H, y0 - q * H
    pts = [(x0 + 10, yr), (x0 + 50, yr)]
    for i in range(1, 41):
        t = i / 40
        xx = x0 + 50 + t * (w - 160)
        # smooth hump via cosine blend
        base = yr + (yq - yr) * (1 - math.cos(math.pi * t)) / 2
        bump = (yp - min(yr, yq)) * math.sin(math.pi * t) ** 2
        pts.append((xx, base + bump if yp < min(yr, yq) else base))
    pts.append((w - 30, yq))
    body.append(poly(pts))
    if labels:
        body.append(text(x0 + 30, yr - 8, labels if isinstance(labels, str) else 'эх бодис', 11))
    for yy, lab in extra:
        body.append(line(x0, y0 - yy * H, w - 25, y0 - yy * H, w=1, dash='4 3'))
        body.append(text(w - 22, y0 - yy * H + 4, lab, 11, anchor='start'))
    if title:
        body.append(text(10, 18, title, 14, anchor='start', weight='bold'))
    return '\n'.join(body)


def chromatogram(lanes, front=0.92, w=None, h=240, labels_below=True):
    """lanes: list of (label, [rf, ...]); draws baseline, solvent front and spots."""
    n = len(lanes)
    w = w or 70 + 60 * n
    x0, base, top = 30, h - 40, 20
    L = base - top
    body = [rect(x0 - 10, top - 10, w - 2 * (x0 - 10), h - 20, sw=1.6),
            line(x0 - 10, base, w - x0 + 10, base, w=1.2),
            line(x0 - 10, base - front * L, w - x0 + 10, base - front * L, w=1, dash='5 4'),
            text(w - x0 + 6, base - front * L - 4, 'уусгагчийн зах', 10, anchor='end')]
    for i, (lab, spots) in enumerate(lanes):
        cx = x0 + 30 + i * 60
        body.append(f'<circle cx="{cx}" cy="{base}" r="3" fill="#111"/>')
        body.append(text(cx, base + 22, lab, 14))
        for rf in spots:
            body.append(f'<ellipse cx="{cx}" cy="{base - rf * L:.1f}" rx="7" ry="9" fill="#666"/>')
    return svg(w, h, '\n'.join(body))


def beakers(items, w=None, h=170):
    """items: list of (label, state) where state in {'clear','solid','cloudy'}."""
    n = len(items)
    w = w or 40 + 110 * n
    body = []
    for i, (lab, state) in enumerate(items):
        x = 30 + i * 110
        body.append(poly([(x, 20), (x + 6, 26), (x + 6, 120), (x + 74, 120), (x + 74, 26), (x + 80, 20)]))
        body.append(line(x + 6, 55, x + 74, 55, w=1.2))
        if state == 'solid':
            body.append(f'<path d="M{x + 18},119 Q{x + 40},100 {x + 62},119 z" fill="#999"/>')
        elif state == 'cloudy':
            body.append(rect(x + 7, 56, 66, 63, fill="#d9d9d9", stroke="none"))
        body.append(text(x + 40, 145, lab, 14))
    return svg(w, h, '\n'.join(body))


def flow(nodes, edges, w, h, size=13):
    """nodes: {id: (x, y, w, h, label)}; edges: list of (from_id, to_id, label, side)."""
    body = []
    for x, y, bw, bh, lab in nodes.values():
        body.append(box(x, y, bw, bh, lab, size) if lab is not None else '')
    for a, b, lab, *rest in edges:
        off = rest[0] if rest else 0
        ax, ay, aw, ah, _ = nodes[a]
        bx, by, bw, bh, _ = nodes[b]
        ay, by = ay + off, by + off
        if off and abs((ax + aw / 2) - (bx + bw / 2)) < 5:
            ax, bx, ay, by = ax + off, bx + off, ay - off, by - off
        if abs((ay + ah / 2) - (by + bh / 2)) < 5:  # horizontal
            if bx > ax:
                x1, x2 = ax + aw, bx
            else:
                x1, x2 = ax, bx + bw
            yy = ay + ah / 2
            body.append(line(x1, yy, x2, yy, arrow=True))
            if lab:
                body.append(text((x1 + x2) / 2, yy + 15 if off > 0 else yy - 7, lab, 12))
        elif abs((ax + aw / 2) - (bx + bw / 2)) > 5:  # diagonal
            x1 = ax + aw if bx > ax else ax
            x2 = bx if bx > ax else bx + bw
            y1, y2 = ay + ah / 2, by + bh / 2
            body.append(line(x1, y1, x2, y2, arrow=True))
            if lab:
                body.append(text((x1 + x2) / 2 + (6 if off <= 0 else -6), (y1 + y2) / 2 + (-6 if off <= 0 else 16), lab, 12,
                                 anchor='start' if off <= 0 else 'end'))
        else:  # vertical
            xx = ax + aw / 2 if abs((ax + aw / 2) - (bx + bw / 2)) < 5 else bx + bw / 2
            if by > ay:
                y1, y2 = ay + ah, by
            else:
                y1, y2 = ay, by + bh
            body.append(line(xx, y1, xx, y2, arrow=True))
            if lab:
                body.append(text(xx + 8, (y1 + y2) / 2 + 4, lab, 12, anchor='start'))
    return svg(w, h, '\n'.join(body))


def skeletal(atoms, bonds, w, h, size=14):
    """atoms: {id: (x, y, label)}; bonds: list of (a, b, order). Label '' = carbon vertex."""
    body = []
    for a, b, order in bonds:
        x1, y1, l1 = atoms[a]
        x2, y2, l2 = atoms[b]
        dx, dy = x2 - x1, y2 - y1
        d = math.hypot(dx, dy) or 1
        ux, uy = dx / d, dy / d
        t1 = 9 if l1 else 0
        t2 = 9 if l2 else 0
        sx1, sy1, sx2, sy2 = x1 + ux * t1, y1 + uy * t1, x2 - ux * t2, y2 - uy * t2
        if order == 1:
            body.append(line(sx1, sy1, sx2, sy2, w=1.6))
        elif order == 2:
            nx, ny = -uy * 3, ux * 3
            body.append(line(sx1 + nx, sy1 + ny, sx2 + nx, sy2 + ny, w=1.5))
            body.append(line(sx1 - nx, sy1 - ny, sx2 - nx, sy2 - ny, w=1.5))
        elif order == 3:
            nx, ny = -uy * 4, ux * 4
            for k in (-1, 0, 1):
                body.append(line(sx1 + k * nx, sy1 + k * ny, sx2 + k * nx, sy2 + k * ny, w=1.3))
        elif order == 'arrow':
            body.append(line(sx1, sy1, sx2, sy2, w=1.4, arrow=True))
    for x, y, lab in atoms.values():
        if lab:
            body.append(text(x, y + size * 0.36, lab, size))
    return '\n'.join(body)


def zigzag(n, x0, y0, dx=26, dy=15, start_up=True):
    """Return list of points of a zig-zag carbon chain of n atoms."""
    pts = []
    for i in range(n):
        up = (i % 2 == 0) == start_up
        pts.append((x0 + i * dx, y0 - dy if up else y0))
    return pts


def panel_grid(panels, cols, cw, ch, size=13):
    """panels: list of (label, body_svg_fragment_drawn_in_0..cw,0..ch). Returns svg."""
    rows = math.ceil(len(panels) / cols)
    body = []
    for i, (lab, frag) in enumerate(panels):
        r, c = divmod(i, cols)
        x, y = 10 + c * cw, 10 + r * ch
        body.append(rect(x, y, cw, ch, sw=1))
        body.append(text(x + 8, y + 18, lab, size, anchor='start', weight='bold'))
        body.append(f'<g transform="translate({x},{y})">{frag}</g>')
    return svg(20 + cols * cw, 20 + rows * ch, '\n'.join(body))


def bar_chart(values, labels, w=420, h=230, ylabel="", log=False, xlabel=""):
    x0, y0 = 70, h - 40
    H = h - 70
    vmax = max(values)
    f = (lambda v: math.log10(v)) if log else (lambda v: v)
    fmin = f(min(values)) * 0.9 if log else 0
    body = axes(x0, y0, w - 85, h - 50, xlabel, ylabel)
    bw = (w - 110) / len(values)
    for i, v in enumerate(values):
        hh = (f(v) - fmin) / (f(vmax) - fmin) * H
        bx = x0 + 10 + i * bw
        body.append(rect(bx, y0 - hh, bw * 0.6, hh, fill="#9a9a9a", sw=1))
        body.append(text(bx + bw * 0.3, y0 + 15, labels[i], 11))
    return svg(w, h, '\n'.join(body))


def line_graph(series, xr, yr, w=420, h=260, xlabel="", ylabel="", xticks=(), yticks=(), grid=True):
    """series: list of (points[(x,y)], label, dash)."""
    x0, y0 = 70, h - 40
    W, H = (w - 130, h - 80) if w > 300 else (w - 90, h - 70)
    X = lambda v: x0 + (v - xr[0]) / (xr[1] - xr[0]) * W
    Y = lambda v: y0 - (v - yr[0]) / (yr[1] - yr[0]) * H
    body = axes(x0, y0, W + 15, H + 15, '', '')
    body.append(text(x0 + W + 18, y0 + 30, xlabel, 12, anchor='end'))
    ylines = ylabel.split(chr(10))
    for k, ln in enumerate(ylines):
        body.append(text(x0 + 8, y0 - H - 12 + (k - len(ylines) + 1) * 13, ln, 12, anchor="start"))
    for t in xticks:
        body.append(line(X(t), y0, X(t), y0 + 4, w=1))
        body.append(text(X(t), y0 + 16, f'{t:g}', 11))
        if grid:
            body.append(line(X(t), y0, X(t), y0 - H, w=0.5, color="#bbb"))
    for t in yticks:
        body.append(line(x0 - 4, Y(t), x0, Y(t), w=1))
        body.append(text(x0 - 7, Y(t) + 4, f'{t:g}', 11, anchor='end'))
        if grid:
            body.append(line(x0, Y(t), x0 + W, Y(t), w=0.5, color="#bbb"))
    for pts, lab, dash in series:
        body.append(poly([(X(a), Y(b)) for a, b in pts], dash=dash))
        if lab:
            a, b = pts[-1]
            body.append(text(X(a) + 4, Y(b) + 4, lab, 11, anchor='start'))
    return svg(w, h, '\n'.join(body))
