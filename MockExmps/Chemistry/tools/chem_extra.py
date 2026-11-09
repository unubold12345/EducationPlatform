"""Additional original figure helpers (2025 and question-bank years)."""
import math
from figures import svg, text, line, rect, poly, panel_grid, mb_points, axes


def bohr(shells, w=230, h=230):
    cx, cy = w / 2, h / 2
    body = [f'<circle cx="{cx}" cy="{cy}" r="18" fill="#ddd" stroke="#111"/>', text(cx, cy + 5, '+', 16)]
    for k, n in enumerate(shells, start=1):
        r = 18 + 22 * k
        body.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#111" stroke-width="1.2"/>')
        for i in range(n):
            a = 2 * math.pi * i / n - math.pi / 2
            ex, ey = cx + r * math.cos(a), cy + r * math.sin(a)
            body.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="5" fill="#fff" stroke="#111"/>')
            body.append(line(ex - 2.5, ey, ex + 2.5, ey, w=1))
    return svg(w, h, '\n'.join(body))


def shell_arcs(options):
    """options: list of (letter, [n1, n2, ...]) – nucleus with arcs and electron counts."""
    body = []
    for i, (lab, shells) in enumerate(options):
        x = 20 + i * 130
        body += [text(x + 50, 18, lab, 14, weight='bold'), f'<circle cx="{x + 12}" cy="60" r="10" fill="none" stroke="#111"/>',
                 text(x + 12, 65, '+', 13)]
        for k, n in enumerate(shells):
            ax = x + 30 + k * 16
            body.append(f'<path d="M{ax},28 Q{ax + 14},60 {ax},92" fill="none" stroke="#111" stroke-width="1.4"/>')
            body.append(text(ax + 4, 112, str(n), 12))
    return svg(20 + 130 * len(options), 125, '\n'.join(body))


def ballstick(atoms, bonds, key=True, w=420, h=150):
    """atoms: list of (x, y, kind) kind in C/H/O; bonds: (i, j, order)."""
    fill = {'C': '#111', 'H': '#aaa', 'O': '#fff'}
    rad = {'C': 11, 'H': 8, 'O': 11}
    body = []
    for i, j, o in bonds:
        (x1, y1, _), (x2, y2, _) = atoms[i], atoms[j]
        if o == 2:
            dx, dy = y2 - y1, x1 - x2
            d = math.hypot(dx, dy) or 1
            dx, dy = dx / d * 3, dy / d * 3
            body += [line(x1 + dx, y1 + dy, x2 + dx, y2 + dy, w=2), line(x1 - dx, y1 - dy, x2 - dx, y2 - dy, w=2)]
        else:
            body.append(line(x1, y1, x2, y2, w=2.5))
    for x, y, k in atoms:
        body.append(f'<circle cx="{x}" cy="{y}" r="{rad[k]}" fill="{fill[k]}" stroke="#111" stroke-width="1.2"/>')
    if key:
        body.append(text(w - 128, 14, 'түлхүүр', 11, anchor='start'))
        for n, (k, lab) in enumerate((('O', 'хүчилтөрөгч'), ('H', 'устөрөгч'), ('C', 'нүүрстөрөгч'))):
            yy = 32 + n * 24
            body += [f'<circle cx="{w - 120}" cy="{yy}" r="7" fill="{fill[k]}" stroke="#111"/>',
                     text(w - 108, yy + 4, lab, 11, anchor='start')]
    return svg(w, h, '\n'.join(body))


def chain_model(spec, oxygen=None, w=420, h=150):
    """Ball-and-stick for simple carbonyl/alcohol molecules.
    spec: list of carbons, each a dict {'H': n_h, 'O': 'double'|'single'|None, 'OH_H': bool}."""
    atoms, bonds = [], []
    x0, y0 = 60, 80
    for i, c in enumerate(spec):
        cx = x0 + i * 60
        atoms.append((cx, y0, 'C'))
        ci = len(atoms) - 1
        if i:
            bonds.append((prev, ci, 1))
        prev = ci
        hs = c.get('H', 0)
        spots = []
        if c.get('O'):
            atoms.append((cx, y0 - 45, 'O'))
            bonds.append((ci, len(atoms) - 1, 2 if c['O'] == 'double' else 1))
            if c['O'] == 'single':
                atoms.append((cx + 28, y0 - 62, 'H'))
                bonds.append((len(atoms) - 2, len(atoms) - 1, 1))
            spots = [(cx, y0 + 40)]
        else:
            spots = [(cx, y0 - 40), (cx, y0 + 40)]
        if i == 0:
            spots.append((cx - 40, y0))
        if i == len(spec) - 1:
            spots.append((cx + 40, y0))
        for k in range(hs):
            hx, hy = spots[k]
            atoms.append((hx, hy, 'H'))
            bonds.append((ci, len(atoms) - 1, 1))
    return ballstick(atoms, bonds, w=w, h=h)


def apparatus(kind):
    """Small schematic lab set-ups (fragment in a 170x150 box)."""
    b = []
    if kind == 'distil':
        b += ['<circle cx="40" cy="105" r="22" fill="#e8eef3" stroke="#111"/>', line(40, 83, 40, 55),
              line(42, 60, 120, 88, w=7, color='#bbb'), line(42, 60, 120, 88),
              poly([(112, 92), (112, 132), (140, 132), (140, 92)]), text(40, 145, 'халаах', 10)]
    elif kind == 'filter':
        b += [poly([(55, 40), (115, 40), (88, 80), (88, 100), (82, 100), (82, 80), (55, 40)]),
              poly([(60, 105), (60, 140), (110, 140), (110, 105)]), rect(61, 125, 48, 14, fill='#e8eef3', stroke='none'),
              line(85, 100, 85, 120, dash='2 3')]
    elif kind == 'evap':
        b += ['<path d="M45,70 Q85,105 125,70 z" fill="#e8eef3" stroke="#111"/>', line(55, 105, 115, 105), line(60, 105, 55, 140),
              line(110, 105, 115, 140), poly([(80, 140), (75, 120), (85, 120), (80, 140)]),
              '<path d="M80,118 Q72,104 80,90 Q88,104 80,118" fill="#f2a33a"/>',
              '<path d="M70,62 Q65,45 75,35 M90,62 Q85,45 95,35" fill="none" stroke="#999"/>']
    elif kind == 'gas_water':
        b += [poly([(20, 70), (20, 135), (60, 135), (60, 70)]), line(40, 70, 40, 50), line(40, 50, 120, 50), line(120, 50, 120, 95),
              poly([(90, 100), (90, 140), (160, 140), (160, 100)]), rect(91, 112, 68, 27, fill='#e8eef3', stroke='none'),
              rect(108, 60, 24, 70), text(40, 148, 'урвалын сав', 9)]
    elif kind == 'titr':
        b += [rect(78, 10, 12, 90), line(84, 100, 84, 112), poly([(60, 145), (72, 118), (96, 118), (108, 145), (60, 145)]),
              line(40, 10, 40, 145), line(40, 60, 78, 60), text(100, 40, 'бюретк', 10, anchor='start')]
    elif kind == 'crystal':
        b += [poly([(50, 60), (50, 130), (120, 130), (120, 60)]), rect(51, 95, 68, 34, fill='#e8eef3', stroke='none'),
              poly([(70, 128), (75, 118), (80, 128)], fill='#999'), poly([(90, 128), (96, 115), (102, 128)], fill='#999'),
              text(85, 145, 'хөргөх', 10)]
    return '\n'.join(b)


def apparatus_grid(order):
    return panel_grid([(L, apparatus(k)) for L, k in order], 5, 170, 155, 13)


def step_diagram(r, p, lo=100, hi=350):
    """Reactant level r → product level p on a lo–hi kJ/mol grid (fragment 210x170)."""
    x0, y0, W, H = 45, 145, 150, 115
    Y = lambda v: y0 - (v - lo) / (hi - lo) * H
    b = [line(x0, y0, x0, y0 - H - 5), line(x0, y0, x0 + W, y0)]
    for v in range(lo, hi + 1, 50):
        b += [line(x0 - 3, Y(v), x0 + W, Y(v), w=0.5, color='#bbb'), text(x0 - 6, Y(v) + 4, str(v), 9, anchor='end')]
    b += [line(x0 + 5, Y(r), x0 + 70, Y(r), w=2), line(x0 + 70, Y(r), x0 + 70, Y(p), w=1.5, arrow=True),
          line(x0 + 70, Y(p), x0 + W, Y(p), w=2), text(x0 + 32, Y(r) - 5, 'эх бодис', 9), text(x0 + 112, Y(p) - 5, 'бүтээгдэхүүн', 9),
          text(x0 + W / 2, y0 + 14, 'урвалын координат', 9), text(16, 25, 'кЖ/моль', 9, anchor='start')]
    return '\n'.join(b)


def step_grid(order):
    return panel_grid([(L, step_diagram(r, p)) for L, (r, p) in order], 5, 210, 170, 13)


def vt_panel(curves, ylabel='эзлэхүүн'):
    """curves: list of (label, k, Vf, label_dy)."""
    x0, y0, W, H = 30, 125, 140, 100
    b = [line(x0, y0, x0, y0 - H), line(x0, y0, x0 + W, y0), text(x0 + W / 2, y0 + 14, 'хугацаа', 9),
         text(6, 20, ylabel, 9, anchor='start')]
    for lab, k, vf, dy in curves:
        pts = [(x0 + t * W / 40, y0 - vf * H * (1 - math.exp(-k * t / 10))) for t in range(41)]
        b.append(poly(pts, w=1.6))
        lx, ly = pts[14]
        b.append(text(lx + 4, ly + dy, lab, 9, anchor='start'))
    return '\n'.join(b)


def vt_grid(order, ylabel='эзлэхүүн'):
    return panel_grid([(L, vt_panel(c, ylabel)) for L, c in order], 5, 180, 140, 13)


def chrom_scale(lanes, front, ymax, step=0.5, h=260):
    """Chromatogram with a cm scale; lanes: (label, [heights in cm or (h, name)]); front height in cm."""
    x0, base, top = 60, h - 40, 20
    L = base - top
    Y = lambda v: base - v / ymax * L
    right = x0 + 30 + 60 * len(lanes)
    b = [line(x0, base + 5, x0, top), rect(x0 + 10, top, right - x0 - 10, base - top + 22, sw=1.2),
         line(x0 + 10, Y(front), right, Y(front), w=1.2), line(x0 + 10, base, right, base, w=1.2)]
    v = 0.0
    while v <= ymax + 1e-9:
        b += [line(x0 - 4, Y(v), x0, Y(v), w=1), text(x0 - 7, Y(v) + 4, f'{v:g}', 10, anchor='end')]
        v += step
    b.append(text(x0 - 30, top - 6, 'см', 10))
    for i, (lab, spots) in enumerate(lanes):
        cx = x0 + 40 + i * 60
        b += [f'<circle cx="{cx}" cy="{base}" r="3" fill="#111"/>', text(cx, base + 18, lab, 12)]
        for s in spots:
            name = None
            if isinstance(s, tuple):
                s, name = s
            b.append(f'<circle cx="{cx}" cy="{Y(s):.1f}" r="6" fill="#111"/>')
            if name:
                b.append(text(cx + 10, Y(s) + 4, '← ' + name, 11, anchor='start'))
    return svg(right + 60, h, '\n'.join(b))


def ie_line(values, w=440, h=240):
    n = len(values)
    x0, y0, W, H = 70, h - 40, w - 100, h - 70
    lo, hi = math.log10(min(values)) - 0.1, math.log10(max(values)) + 0.05
    X = lambda i: x0 + (i - 1) / (n - 1) * W
    Y = lambda v: y0 - (math.log10(v) - lo) / (hi - lo) * H
    b = [line(x0, y0, x0, y0 - H - 10), line(x0, y0, x0 + W + 10, y0), text(x0 + W / 2, y0 + 30, 'салгасан электроны дугаар', 11),
         text(8, 24, 'lg(иончлолын энерги)', 10, anchor='start')]
    pts = [(X(i), Y(v)) for i, v in enumerate(values, start=1)]
    b.append(poly(pts, w=1.2))
    for i, (x, y) in enumerate(pts, start=1):
        b += [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.8" fill="#111"/>', text(x, y0 + 14, str(i), 9)]
    return svg(w, h, '\n'.join(b))


def galvanic(cells):
    """cells: list of (anode, cathode, volts, anode_ion, cathode_ion)."""
    b = []
    for k, (an, ca, v, ai, ci) in enumerate(cells):
        x = 20 + k * 300
        b += [rect(x + 110, 10, 60, 24, rx=4), text(x + 140, 27, f'{v} В', 12, weight='bold'),
              poly([(x + 50, 70), (x + 50, 22), (x + 110, 22)]), poly([(x + 170, 22), (x + 230, 22), (x + 230, 70)]),
              text(x + 44, 46, f'(−) {an}', 12, anchor='end'), text(x + 236, 46, f'{ca} (+)', 12, anchor='start'),
              text(x + 40, 62, 'анод', 10, anchor='end'), text(x + 240, 62, 'катод', 10, anchor='start'),
              poly([(x + 10, 80), (x + 10, 170), (x + 120, 170), (x + 120, 80)]),
              poly([(x + 160, 80), (x + 160, 170), (x + 270, 170), (x + 270, 80)]),
              rect(x + 11, 110, 108, 59, fill='#e8eef3', stroke='none'), rect(x + 161, 110, 108, 59, fill='#e8eef3', stroke='none'),
              rect(x + 42, 70, 16, 85, fill='#aaa'), rect(x + 222, 70, 16, 85, fill='#666'),
              poly([(x + 95, 150), (x + 95, 90), (x + 185, 90), (x + 185, 150)], w=8, color='#555'),
              text(x + 75, 162, ai, 11), text(x + 205, 162, ci, 11)]
    return svg(20 + 300 * len(cells), 185, '\n'.join(b))


def mb_T_Ea(t1_low, ea1_left, w=380, h=230):
    x0, y0, sx, sy = 80, h - 35, 65, 140
    b = axes(x0, y0, w - 100, h - 50, 'молекулын энерги', 'жижиг\nхэсгийн\nтоо', 11)
    low = mb_points(x0, y0, sx, sy, 0.8, 1.1)
    high = mb_points(x0, y0, sx, sy, 1.3, 0.8)
    t1, t2 = (low, high) if t1_low else (high, low)
    b += [poly(t1), poly(t2, dash='6 4')]
    b += [text(t1[25][0] + 6, t1[25][1] - 10, 'T₁ (—)', 12, anchor='start'), text(t2[60][0] + 6, t2[60][1] - 8, 'T₂ (- -)', 12, anchor='start')]
    e1, e2 = (2.4, 3.1) if ea1_left else (3.1, 2.4)
    for e, lab in ((e1, 'Ea₁'), (e2, 'Ea₂')):
        b += [line(x0 + e * sx, y0, x0 + e * sx, y0 - 70, w=1, dash='3 3'), text(x0 + e * sx, y0 - 74, lab, 12)]
    return svg(w, h, '\n'.join(b))


def formula_grid(items, cols=5, cw=190, ch=70, size=13):
    """Text formula panels, e.g. [('A', 'CH₃–CH=CH₂'), ...]."""
    return panel_grid([(L, text(cw / 2, ch / 2 + 12, f, size)) for L, f in items], cols, cw, ch, 13)


def gas_train(left, mid, right):
    """Generic preparation → drying tube ("X бодис") → collection apparatus."""
    b = [rect(20, 100, 60, 30, fill='#ddd'), poly([(35, 100), (45, 70), (55, 100)], fill='#f2a33a'),
         rect(10, 55, 110, 18, rx=8), text(65, 50, left, 11), line(120, 64, 170, 64), line(170, 64, 170, 90),
         '<circle cx="190" cy="115" r="25" fill="#eee" stroke="#111"/>', text(190, 150, '“X” бодис', 11), line(212, 104, 260, 70),
         line(260, 70, 330, 70), line(330, 70, 330, 110), poly([(318, 110), (318, 150), (342, 150), (342, 110)]),
         text(335, 60, right, 11), text(190, 90, mid, 10)]
    return svg(380, 165, '\n'.join(b))
