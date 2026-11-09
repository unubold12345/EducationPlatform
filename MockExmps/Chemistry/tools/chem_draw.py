"""Chemistry-specific SVG fragments: skeletal chains, displayed molecules, carbonyl mechanisms,
energy cycles, apparatus. All original drawings."""
import math
from figures import svg, text, line, rect, poly, box, skeletal, panel_grid, mb_points, axes, head

DX, DY = 26, 15


def chain(main, x0=20, y0=60, bonds=None, branches=(), start_up=False, size=13):
    """Skeletal chain.
    main: list of labels ('' = carbon vertex), drawn as a zig-zag left to right.
    bonds: list of bond orders between consecutive main atoms (default 1).
    branches: (main_index, label, order, side) with side 'up'/'down' or a tuple (dx, dy) offset,
              or (main_index, label, order, side, parent_branch_id) – not needed here.
    Returns (fragment, width, height)."""
    atoms, bl = {}, []
    for i, lab in enumerate(main):
        up = (i % 2 == 0) == start_up
        atoms[i] = (x0 + i * DX, y0 - DY if up else y0, lab)
    bonds = bonds or [1] * (len(main) - 1)
    for i, o in enumerate(bonds):
        bl.append((i, i + 1, o))
    k = len(main)
    for spec in branches:
        idx, lab, order, side = spec[:4]
        ax, ay, _ = atoms[idx]
        if isinstance(side, tuple):
            ox, oy = side
        elif side in ('out', 'in'):
            up = ay < y0
            if side == 'in':
                up = not up
            ox, oy = (0, -26) if up else (0, 26)
        else:
            ox, oy = (0, -26) if side == 'up' else (0, 26)
        atoms[k] = (ax + ox, ay + oy, lab)
        bl.append((idx, k, order))
        k += 1
    xs = [a[0] for a in atoms.values()]
    ys = [a[1] for a in atoms.values()]
    frag = skeletal(atoms, bl, 0, 0, size)
    return frag, max(xs) + 25, max(ys) + 25


def chain_svg(main, **kw):
    frag, w, h = chain(main, **kw)
    return svg(max(w, 120), max(h, 90), frag)


def molecule_grid(items, cols=3, cw=200, ch=110, size=13):
    """items: list of (title, fragment_fn) where fragment_fn(cx, cy) -> svg fragment."""
    panels = []
    for title, fn in items:
        panels.append((title, fn(cw / 2, ch / 2 + 10)))
    return panel_grid(panels, cols, cw, ch, size)


def displayed(center, ligands, cx, cy, kind):
    """Displayed formula around one central atom.
    kind: 'linear' (2 ligands), 'bent' (2), 'trigonal' (3), 'pyramid' (3), 'tetra' (4).
    ligands: list of (label, order)."""
    pos = {
        'linear': [(-45, 0), (45, 0)],
        'bent': [(-40, 18), (40, 18)],
        'trigonal': [(-42, 0), (42, 0), (0, 36)],
        'pyramid': [(-42, 0), (42, 0), (0, 36)],
        'tetra': [(-42, 0), (42, 0), (0, -32), (0, 32)],
    }[kind]
    atoms = {0: (cx, cy, center)}
    bonds = []
    for i, ((lab, order), (dx, dy)) in enumerate(zip(ligands, pos), start=1):
        atoms[i] = (cx + dx, cy + dy, lab)
        bonds.append((0, i, order))
    frag = skeletal(atoms, bonds, 0, 0, 14)
    if kind in ('bent', 'pyramid'):
        frag += f'<circle cx="{cx - 4}" cy="{cy - 14}" r="1.8" fill="#111"/><circle cx="{cx + 4}" cy="{cy - 14}" r="1.8" fill="#111"/>'
    return frag


def dimer(metal, hal, cx, cy):
    """Al2X6-type dimer with dative bonds as arrows."""
    a = {0: (cx - 25, cy, metal), 1: (cx + 25, cy, metal), 2: (cx, cy - 28, hal), 3: (cx, cy + 28, hal),
         4: (cx - 60, cy - 28, hal), 5: (cx - 60, cy + 28, hal), 6: (cx + 60, cy - 28, hal), 7: (cx + 60, cy + 28, hal)}
    b = [(0, 2, 1), (2, 1, 'arrow'), (1, 3, 1), (3, 0, 'arrow'), (0, 4, 1), (0, 5, 1), (1, 6, 1), (1, 7, 1)]
    return skeletal(a, b, 0, 0, 12)


def curved(x1, y1, x2, y2, bend=30):
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy) or 1
    cx, cy = mx - dy / d * bend, my + dx / d * bend
    return (f'<path d="M{x1:.1f},{y1:.1f} Q{cx:.1f},{cy:.1f} {x2:.1f},{y2:.1f}" fill="none" '
            f'stroke="#111" stroke-width="1.4"/>' + head(cx, cy, x2, y2, 7))


def carbonyl_panel(left, right, kind, nu='CN'):
    """Carbonyl with partial charges; kind chooses arrow pattern (frag in a 170x120 box)."""
    cx, cy = 85, 62
    a = {0: (cx, cy, 'C'), 1: (cx, cy - 38, 'O'), 2: (cx - 40, cy + 22, left), 3: (cx + 40, cy + 22, right)}
    frag = skeletal(a, [(0, 1, 2), (0, 2, 1), (0, 3, 1)], 0, 0, 13)
    frag += text(cx - 12, cy - 4, 'δ+', 10) + text(cx - 12, cy - 42, 'δ−', 10)
    if kind == 'correct':      # Nu: attacks C, pi electrons to O
        frag += text(cx - 40, cy + 52, f':{nu}⁻', 13) + curved(cx - 32, cy + 42, cx - 6, cy + 8, 18)
        frag += curved(cx + 4, cy - 20, cx + 8, cy - 40, -14)
    elif kind == 'to_O':       # Nu attacks O
        frag += text(cx + 45, cy - 40, f'{nu}⁻', 13) + curved(cx + 32, cy - 42, cx + 10, cy - 40, 12)
    elif kind == 'reverse':    # arrow from C=O toward nucleophile / wrong direction
        frag += text(cx + 50, cy - 8, f'{nu}⁻', 13) + curved(cx + 6, cy - 4, cx + 38, cy - 10, -14)
    elif kind == 'proton':     # protonation of O first
        frag += text(cx + 40, cy - 46, 'H⁺', 13) + curved(cx + 8, cy - 44, cx + 30, cy - 50, -12)
    elif kind == 'pi_wrong':   # Nu attacks C but pi arrow goes from O to C
        frag += text(cx - 40, cy + 52, f':{nu}⁻', 13) + curved(cx - 32, cy + 42, cx - 6, cy + 8, 18)
        frag += curved(cx + 8, cy - 40, cx + 4, cy - 20, 14)
    return frag


def cycle(levels, arrows, w=620, h=290):
    """Energy cycle.
    levels: list of (x1, x2, y, label) horizontal lines with label above.
    arrows: list of (x, y_from, y_to, number)."""
    body = []
    for x1, x2, y, lab in levels:
        body.append(line(x1, y, x2, y, w=1.4))
        body.append(text(x1 + 8, y - 6, lab, 13, anchor='start'))
    for x, y1, y2, num in arrows:
        body.append(line(x, y1, x, y2 - 2, w=1.4, arrow=True))
        body.append(text(x - 10, (y1 + y2) / 2 + 4, num, 13, anchor='end'))
    return svg(w, h, '\n'.join(body))


def electrolysis_cell(electrolyte):
    body = [box(150, 10, 100, 40, 'гүйдэл\nүүсгэгч', 12),
            poly([(150, 30), (120, 30), (120, 95)]), poly([(250, 30), (280, 30), (280, 95)]),
            text(108, 92, '+', 16), text(292, 92, '−', 16),
            rect(112, 90, 16, 110, fill='#888'), rect(272, 90, 16, 110, fill='#888'),
            poly([(80, 80), (85, 85), (85, 215), (315, 215), (315, 85), (320, 80)]),
            rect(86, 130, 228, 84, fill='#e4e4e4', stroke='none'),
            rect(112, 90, 16, 110, fill='#888'), rect(272, 90, 16, 110, fill='#888'),
            text(120, 232, 'анод', 12), text(280, 232, 'катод', 12),
            line(300, 170, 340, 160, w=1), text(345, 160, electrolyte, 12, anchor='start')]
    return svg(470, 245, '\n'.join(body))


def vessels(left, right, w=520, h=110):
    body = [rect(110, 30, 110, 55), rect(300, 30, 110, 55), line(220, 52, 300, 52), line(220, 63, 300, 63),
            f'<circle cx="260" cy="57.5" r="11" fill="#fff" stroke="#111" stroke-width="1.5"/>',
            line(252, 50, 268, 65, w=1.2), line(268, 50, 252, 65, w=1.2), text(260, 20, 'хаалт', 12),
            text(165, 62, left, 13), text(355, 62, right, 13)]
    return svg(w, h, '\n'.join(body))


def column(labels, feed='газрын тос', bottom='битум'):
    """Fractionating column with 5 side outlets labelled top to bottom by ``labels``."""
    body = [poly([(150, 40), (150, 330)]), poly([(230, 40), (230, 330)]),
            f'<path d="M150,40 Q190,0 230,40" fill="none" stroke="#111" stroke-width="1.6"/>',
            f'<path d="M150,330 Q190,370 230,330" fill="none" stroke="#111" stroke-width="1.6"/>',
            line(80, 300, 148, 300, arrow=True), text(75, 304, feed, 12, anchor='end'),
            line(190, 360, 300, 360, arrow=True), text(306, 364, bottom, 12, anchor='start'),
            poly([(190, 19), (190, 8), (230, 8)]), line(230, 8, 300, 8, arrow=True), text(306, 12, labels[0], 13, anchor='start', weight='bold')]
    for i, lab in enumerate(labels[1:], start=1):
        y = 40 + i * 52
        body += [line(150, y + 14, 230, y + 14, w=1), line(230, y, 300, y, arrow=True),
                 text(306, y + 4, lab, 13, anchor='start', weight='bold')]
    return svg(380, 380, '\n'.join(body))


def mb_panel(kind, w=200, h=125):
    """Six Maxwell-Boltzmann panel types used by rate-factor tasks."""
    x0, y0, sx, sy = 40, h - 22, 32, 70
    body = [line(x0, y0, x0, 20, arrow=True), line(x0, y0, w - 10, y0, arrow=True),
            text(w - 14, y0 + 14, 'энерги', 9, anchor='end'), text(x0 - 4, 30, 'тоо', 9, anchor='end')]
    solid = mb_points(x0, y0, sx, sy, 1.0, 1.0)
    if kind in ('Ea_cat', 'Ea_inh'):
        body.append(poly(solid))
        e1, e2 = (2.4, 1.8) if kind == 'Ea_cat' else (1.8, 2.4)
        for e, lab in ((e1, 'Ea₁'), (e2, 'Ea₂')):
            body.append(line(x0 + e * sx, y0, x0 + e * sx, y0 - 34, w=1, dash='3 3'))
            body.append(text(x0 + e * sx, y0 + 12, lab, 9))
    elif kind in ('T_up', 'T_down'):
        low = mb_points(x0, y0, sx, sy, 0.8, 1.15)
        high = mb_points(x0, y0, sx, sy, 1.35, 0.78)
        # label 1 = initial (solid), 2 = new (dashed)
        first, second = (low, high) if kind == 'T_up' else (high, low)
        body += [poly(first), poly(second, dash='4 3'),
                 text(x0 + 70, 30, 'T₁ —', 9, anchor='start'), text(x0 + 70, 42, 'T₂ - -', 9, anchor='start')]
    elif kind in ('C_up', 'C_down'):
        small = mb_points(x0, y0, sx, sy, 1.0, 0.65)
        big = mb_points(x0, y0, sx, sy, 1.0, 1.05)
        first, second = (small, big) if kind == 'C_up' else (big, small)
        body += [poly(first), poly(second, dash='4 3'),
                 text(x0 + 70, 30, 'C₁ —', 9, anchor='start'), text(x0 + 70, 42, 'C₂ - -', 9, anchor='start')]
    return '\n'.join(body)


def mb_panels(kinds, cols=3):
    return panel_grid([(f'{i}.', mb_panel(k)) for i, k in enumerate(kinds, start=1)], cols, 200, 125)


def mb_letters(xmarks, ymarks, point=None):
    """MB curve with lettered guides. xmarks: {letter: energy}, ymarks: {letter: fraction of peak}."""
    w, h = 420, 230
    x0, y0, sx, sy = 110, 190, 70, 125
    pts = mb_points(x0, y0, sx, sy, 1.0, 1.0)
    body = axes(x0, y0, 290, 175, 'энерги', 'жижиг\nхэсгийн\nтоо', 11) + [poly(pts), text(x0, y0 + 16, '0', 11)]
    for lab, e in xmarks.items():
        f = e * math.exp(1 - e)
        body += [line(x0 + e * sx, y0, x0 + e * sx, y0 - f * sy - 10, w=1, dash='4 3'),
                 text(x0 + e * sx, y0 + 18, lab, 13, weight='bold')]
    for lab, fr in ymarks.items():
        body += [line(x0, y0 - fr * sy, x0 + 260, y0 - fr * sy, w=1, dash='4 3'),
                 text(x0 - 10, y0 - fr * sy + 5, lab, 13, anchor='end', weight='bold')]
    if point:
        lab, e = point
        f = e * math.exp(1 - e)
        body += [f'<circle cx="{x0 + e * sx:.1f}" cy="{y0 - f * sy:.1f}" r="3.5" fill="#111"/>',
                 text(x0 + e * sx + 8, y0 - f * sy - 8, lab, 13, anchor='start', weight='bold')]
    return svg(w, h, '\n'.join(body))


def polymer_strip(units, w=560, h=110):
    """units: list of strings ('O', 'C=O', 'N-H', box fills 'w','b','g'). Simple horizontal strip."""
    x, y = 15, 55
    body = [line(x, y, x + 20, y)]
    x += 20
    for u in units:
        if u in ('w', 'b', 'g'):
            fill = {'w': '#fff', 'b': '#111', 'g': '#999'}[u]
            body += [rect(x, y - 10, 30, 20, fill=fill), line(x + 30, y, x + 44, y)]
            x += 44
        elif u == 'C=O':
            body += [text(x + 6, y + 5, 'C', 14), line(x + 6, y - 9, x + 6, y - 30), line(x + 10, y - 9, x + 10, y - 30),
                     text(x + 8, y - 34, 'O', 14), line(x + 14, y, x + 30, y)]
            x += 30
        elif u == 'C=O_down':
            body += [text(x + 6, y + 5, 'C', 14), line(x + 6, y + 9, x + 6, y + 30), line(x + 10, y + 9, x + 10, y + 30),
                     text(x + 8, y + 44, 'O', 14), line(x + 14, y, x + 30, y)]
            x += 30
        elif u == 'NH':
            body += [text(x + 8, y + 5, 'N', 14), line(x + 8, y + 9, x + 8, y + 26), text(x + 8, y + 40, 'H', 13),
                     line(x + 16, y, x + 30, y)]
            x += 30
        else:
            body += [text(x + 8, y + 5, u, 14), line(x + 18, y, x + 32, y)]
            x += 32
    return svg(max(w, x + 20), h, '\n'.join(body))


def ring(n, labels, exo=(), cx=80, cy=70, r=30, start=-90):
    """Ring of n atoms. labels: dict vertex->label ('' carbon). exo: (vertex, label, order).
    Returns (fragment, width, height)."""
    atoms, bonds = {}, []
    for i in range(n):
        ang = math.radians(start + 360 * i / n)
        atoms[i] = (cx + r * math.cos(ang), cy + r * math.sin(ang), labels.get(i, ''))
    for i in range(n):
        bonds.append((i, (i + 1) % n, 1))
    k = n
    for v, lab, order in exo:
        ang = math.radians(start + 360 * v / n)
        atoms[k] = (cx + (r + 28) * math.cos(ang), cy + (r + 28) * math.sin(ang), lab)
        bonds.append((v, k, order))
        k += 1
    return skeletal(atoms, bonds, 0, 0, 13), cx + r + 50, cy + r + 45


def structure_grid(frags, cols=5, cw=150, ch=110, titles=None):
    """frags: list of (fragment, w, h) tuples from chain()/ring(); numbered 1..n."""
    panels = []
    for i, (frag, w, h) in enumerate(frags, start=1):
        sc = min(1.0, (cw - 14) / max(w, 1), (ch - 24) / max(h, 1))
        dx = (cw - w * sc) / 2
        panels.append(((titles[i - 1] if titles else f'{i}.'),
                       f'<g transform="translate({dx:.1f},18) scale({sc:.3f})">{frag}</g>'))
    return panel_grid(panels, cols, cw, ch, 12)
