"""Provisional Part II generators for 2020–2023.

The EEC question bank exposes only Part I for these years; the official Part II was not recovered.
These tasks follow the confirmed format (4 tasks × 8 one-point digit answers, 32 points) and the 2021
official blueprint topics (ion/gas identification, equilibrium, periodicity, organic reactions).
Every task is flagged ``provisional``.
"""
import math
import random
from decimal import Decimal, ROUND_HALF_UP
from figures import table_svg, stack, flow

IONS = ['(0) Fe²⁺', '(1) Cu²⁺', '(2) Al³⁺', '(3) Mg²⁺', '(4) Zn²⁺', '(5) BaCl₂(уус) + HCl', '(6) HCl(уус)', '(7) NaOH, Al, халаалт',
        '(8) NH₃(уус) илүүдэл', '(9) NaOH(уус) илүүдэл']
AG = {'Cl': '↓ цагаан', 'Br': '↓ шаргал', 'I': '↓ шар', '-': '–'}
OH = {'Cu': '↓ цэнхэр', 'Fe2': '↓ ногоон', 'Fe3': '↓ улаан хүрэн', 'Mg': '↓ цагаан', 'Zn': '↓ цагаан', 'Al': '↓ цагаан', '-': '–'}
AG_N = {'Cl': 'AgCl цагаан', 'Br': 'AgBr шаргал', 'I': 'AgI шар', '-': 'тунадасгүй'}
OH_N = {'Cu': 'Cu(OH)₂ цэнхэр', 'Fe2': 'Fe(OH)₂ ногоон', 'Fe3': 'Fe(OH)₃ улаан хүрэн', 'Mg': 'Mg(OH)₂ цагаан',
        'Zn': 'Zn(OH)₂ цагаан', 'Al': 'Al(OH)₃ цагаан', '-': 'тунадасгүй'}

TUBE5 = {
    'Al2(SO4)3': ('NaOH-ийн цагаан тунадас илүүдэлд уусдаг ч аммиакийн илүүдэлд уусдаггүй. Уусмалд HCl-тэй BaCl₂ нэмэхэд цагаан тунадас үүссэн.',
                  [('(5) уусмал дахь катион (e)', 2, 'Амфотер, NH₃-д уусдаггүй – Al³⁺.'), ('(5) уусмал дахь анионыг таних урвалж (f)', 5, 'BaSO₄ цагаан тунадас.'),
                   ('Хэрэв анион нь нитрат байсан бол таних урвалж (g)', 7, 'NO₃⁻ + Al + NaOH халаахад NH₃.'),
                   ('(5)-ын катионыг Zn²⁺-оос ялгах урвалж (h)', 8, 'Зөвхөн Zn(OH)₂ илүүдэл NH₃-д уусна.')]),
    'Zn(NO3)2': ('NaOH болон аммиакийн цагаан тунадас хоёулаа илүүдэлд уусдаг. Хатуу давсыг NaOH ба хөнгөнцагааны нунтагтай халаахад аммиак ялгарсан.',
                 [('(5) уусмал дахь катион (e)', 4, 'Хоёр урвалжийн илүүдэлд уусна – Zn²⁺.'), ('(5) уусмал дахь анионыг таних урвалж (f)', 7, 'Нитрат.'),
                  ('(5)-ын катионыг Al³⁺-аас ялгах урвалж (g)', 8, 'Илүүдэл NH₃-д зөвхөн Zn(OH)₂ уусна.'),
                  ('Илүүдэл NaOH-д уусдаг боловч илүүдэл аммиакт уусдаггүй гидроксид үүсгэх катион (h)', 2, 'Al³⁺.')]),
    'MgSO4': ('NaOH ба аммиакийн цагаан тунадас аль ч илүүдэлд уусдаггүй. Уусмалд HCl-тэй BaCl₂ нэмэхэд цагаан тунадас үүссэн.',
              [('(5) уусмал дахь катион (e)', 3, 'Mg²⁺.'), ('(5) уусмал дахь анионыг таних урвалж (f)', 5, 'Сульфат.'),
               ('Хэрэв анион нь нитрат байсан бол таних урвалж (g)', 7, 'Нитратын урвал.'),
               ('(5)-ын катионыг Al³⁺-аас ялгах урвалж (h)', 9, 'Al(OH)₃ илүүдэл NaOH-д уусна, Mg(OH)₂ уусахгүй.')]),
    'ZnSO4': ('NaOH болон аммиакийн цагаан тунадас хоёулаа илүүдэлд уусдаг. Уусмалд HCl-тэй BaCl₂ нэмэхэд цагаан тунадас үүссэн.',
              [('(5) уусмал дахь катион (e)', 4, 'Zn²⁺.'), ('(5) уусмал дахь анионыг таних урвалж (f)', 5, 'Сульфат.'),
               ('Хэрэв анион нь нитрат байсан бол таних урвалж (g)', 7, 'Нитратын урвал.'),
               ('(5)-ын катионыг Al³⁺-аас ялгах урвалж (h)', 8, 'Илүүдэл NH₃-д зөвхөн Zn(OH)₂ уусна.')]),
    'Al(NO3)3': ('NaOH-ийн цагаан тунадас илүүдэлд уусдаг ч аммиакийн илүүдэлд уусдаггүй. Хатуу давсыг NaOH ба хөнгөнцагааны нунтагтай халаахад аммиак ялгарсан.',
                 [('(5) уусмал дахь катион (e)', 2, 'Al³⁺.'), ('(5) уусмал дахь анионыг таних урвалж (f)', 7, 'Нитрат.'),
                  ('(5)-ын катионыг Mg²⁺-оос ялгах урвалж (g)', 9, 'Al(OH)₃ илүүдэл NaOH-д уусна.'),
                  ('(5)-ын катионыг Zn²⁺-оос ялгах урвалж (h)', 8, 'Zn(OH)₂ илүүдэл NH₃-д уусна.')]),
    'Mg(NO3)2': ('NaOH ба аммиакийн цагаан тунадас аль ч илүүдэлд уусдаггүй. Хатуу давсыг NaOH ба хөнгөнцагааны нунтагтай халаахад аммиак ялгарсан.',
                 [('(5) уусмал дахь катион (e)', 3, 'Mg²⁺.'), ('(5) уусмал дахь анионыг таних урвалж (f)', 7, 'Нитрат.'),
                  ('(5)-ын катионыг Al³⁺-аас ялгах урвалж (g)', 9, 'Al(OH)₃ илүүдэл NaOH-д уусна.'),
                  ('Аль ч илүүдэлд уусдаг гидроксид үүсгэх катион (h)', 4, 'Zn²⁺.')]),
}


def ions_task(salts, tube5):
    """salts: list of 4 (formula, cation_key, anion_key) in tube order (1)–(4); letters a–d follow sorted formula order."""
    rows_ag = [AG[a] for _, _, a in salts] + ['–']
    rows_oh = [OH[c] for _, c, _ in salts] + ['↓ цагаан']
    fig = table_svg([['Хуруу шилний дугаар', '(1)', '(2)', '(3)', '(4)', '(5)'], ['AgNO₃ (HNO₃-аар хүчиллэгжүүлсэн)', *rows_ag],
                     ['NaOH(уус)', *rows_oh]], [230, 100, 100, 100, 100, 90], size=11)
    order = sorted(salts, key=lambda s: s[0])
    tube = {s[0]: i + 1 for i, s in enumerate(salts)}
    letters = 'abcd'
    text5, qs = TUBE5[tube5]
    prompt = ('1–5 дугаартай хуруу шилэнд үл мэдэгдэх нэгдлийн уусмал өгөгджээ. Уусмал бүрээс хэсэг авч азотын хүчлээр хүчиллэгжүүлсэн мөнгөний нитрат, '
              'өөр хэсэгт натрийн гидроксидын уусмал нэмэв. Туршилтын үр дүнг хүснэгтэд үзүүлэв ((↓) тунадас, (–) өөрчлөлтгүй).\n'
              'Хариултын хүснэгт: ' + '; '.join(IONS) + '\nДаалгавар:\n1. (1)–(4) дугаартай хуруу шилэнд ямар бодисын уусмал байгааг тодорхойлж, хуруу шилний дугаарыг бичнэ үү: ' +
              ', '.join(f'{f}({letters[i]})' for i, (f, _, _) in enumerate(order)) + f'\n(5) дугаартай хуруу шилэнд нэг давс байв. {text5}\n' +
              '\n'.join(f'{i}. {q} -г сонгоно уу.' for i, (q, _, _) in enumerate(qs, start=2)))
    parts = [(letters[i], f, tube[f], f'{AG_N[a]}; {OH_N[c]} → ({tube[f]}).') for i, (f, c, a) in enumerate(order)]
    parts += [(k, q, a, e) for k, (q, a, e) in zip('efgh', qs)]
    return dict(ref='2.1', topic='Ион ба хийг таних арга', prompt=prompt, fig=fig, parts=parts, provisional=True)


def r1(x):
    """Round half up to an integer (the paper's rule)."""
    return int(Decimal(str(x)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


SUP = str.maketrans('-0123456789', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹')


def sup(n):
    return str(n).translate(SUP)


def sci(x):
    e = math.floor(math.log10(x))
    m = r1(x / 10 ** e)
    if m == 10:
        m, e = 1, e + 1
    return m, -e


def sci_text(x, digits=3):
    """Explanation notation for small values: 8.00 × 10⁻⁵ (never Python's 8.00e-05)."""
    e = math.floor(math.log10(abs(x)))
    mantissa = f'{x / 10 ** e:.{digits - 1}f}'
    if float(mantissa) >= 10:
        e += 1
        mantissa = f'{x / 10 ** e:.{digits - 1}f}'
    return mantissa if e == 0 else f'{mantissa} × 10{sup(e)}'


COND = {
    'salt': ('{salt} нэмэхэд', 2, 'Ижил ион нэмэгдэж тэнцвэр зүүн тийш.'),
    'neutral': ('{neut} нэмэхэд', 1, '{ion} ион саармагжиж тэнцвэр баруун тийш.'),
    'common': ('{common} нэмэхэд', 2, '{ion} ион ихэсч тэнцвэр зүүн тийш.'),
    'cat': ('Катализатор нэмэхэд', 3, 'Катализатор тэнцвэрийг шилжүүлэхгүй.'),
    'heat': ('Урвалын хольцийг халаахад', None, ''),
    'cool': ('Урвалын хольцийг хөргөхөд', None, ''),
    'dilute': ('Уусмалыг усаар шингэрүүлэхэд', 1, 'Шингэрүүлэхэд илүү олон молекул ионждог (баруун тийш).'),
}


def equilibrium_task(sysd, conds):
    """sysd keys: eq, dh, kind('acid'|'base'), salt, neut, common, ion, c, alpha, exp (for e)."""
    lines, parts = [], []
    for k, code in zip('abcd', conds):
        label, ans, ex = COND[code]
        if code in ('heat', 'cool'):
            endo = sysd['dh'] > 0
            ans = 1 if (code == 'heat') == endo else 2
            ex = ('Эндотерм' if endo else 'Экзотерм') + f" урвал; {'халаахад' if code == 'heat' else 'хөргөхөд'} тэнцвэр {'баруун' if ans == 1 else 'зүүн'} тийш."
        label = label.format(**sysd)
        lines.append(f'{label} – ({k})')
        parts.append((k, label, ans, ex.format(**sysd)))
    c, a = sysd['c'], sysd['alpha']
    x = c * a
    e = r1(x / 10 ** sysd['exp'])
    K = x * x / (c - x)
    f, g = sci(K)
    ion = 'H⁺' if sysd['kind'] == 'acid' else 'OH⁻'
    p = -math.log10(x)
    ph = r1(p)  # pH for acids, pOH for bases (keeps a single digit)
    calc = (f"{c:g} моль дм⁻³ концентрацтай {sysd['name']}-ийн {a * 100:g}% нь ионжсон.\n"
            f"2. {ion} ионы концентрац (e × 10{sup(sysd['exp'])} моль дм⁻³)-ыг тооцоолно уу.\n3. Тэнцвэрийн тогтмол Kc (f × 10⁻ᵍ)-г тооцоолно уу"
            + (' (усны концентрацыг тогтмол гэж үзнэ)' if sysd['kind'] == 'base' else '') + '.\n4. Уусмалын '
            + ('pH' if sysd['kind'] == 'acid' else 'pOH') + ' (h)-ийг бүхэл тоогоор тооцоолно уу.')
    parts += [('e', f'[{ion}] = e × 10{sup(sysd["exp"])}', e, f'{c:g} × {a:g} = {sci_text(x)}.'),
              ('f', 'Kc = f × 10⁻ᵍ: f', f, f'Kc = ({sci_text(x)})²/({c:g} − {sci_text(x)}) = {sci_text(K)}.'),
              ('g', 'Kc = f × 10⁻ᵍ: g', g, f'{f} × 10{sup(-g)}.'),
              ('h', 'pH' if sysd['kind'] == 'acid' else 'pOH', ph, f'{"pH" if sysd["kind"] == "acid" else "pOH"} = {p:.2f} → бүхэлчилнэ.')]
    assert g <= 9 and 0 <= e <= 9, (sysd['name'], e, g)
    prompt = (f"Дараах тэнцвэрийг судалжээ.\n{sysd['eq']}   ∆H°урв = {sysd['dh']:+g} кЖ моль⁻¹\n"
              '1 – Тэнцвэр баруун тийш шилжинэ. 2 – Тэнцвэр зүүн тийш шилжинэ. 3 – Тэнцвэр шилжихгүй.\nДаалгавар:\n'
              '1. Дараах 4 нөхцөл тус бүрт тэнцвэр шилжих чиглэлийг сонгоно уу.\n' + '\n'.join(lines) + '\n' + calc)
    return dict(ref='2.2', topic='Химийн тэнцвэр', prompt=prompt, parts=parts, provisional=True)


SYS = {
    'HClO': dict(name='HClO(уус)', eq='HClO(уус) ⇌ H⁺(уус) + ClO⁻(уус)', dh=14, kind='acid', salt='Натрийн гипохлорит', neut='Натрийн гидроксид',
                 common='Азотын хүчил', ion='H⁺', c=0.20, alpha=0.0004, exp=-5),
    'CH3COOH': dict(name='CH₃COOH(уус)', eq='CH₃COOH(уус) ⇌ CH₃COO⁻(уус) + H⁺(уус)', dh=-0.4, kind='acid', salt='Натрийн ацетат', neut='Калийн гидроксид',
                    common='Давсны хүчил', ion='H⁺', c=0.050, alpha=0.02, exp=-3),
    'NH4+': dict(name='NH₄Cl(уус)', eq='NH₄⁺(уус) ⇌ NH₃(уус) + H⁺(уус)', dh=52, kind='acid', salt='Аммиак', neut='Натрийн гидроксид',
                 common='Давсны хүчил', ion='H⁺', c=0.10, alpha=0.0001, exp=-5),
    'HNO2': dict(name='HNO₂(уус)', eq='HNO₂(уус) ⇌ H⁺(уус) + NO₂⁻(уус)', dh=11, kind='acid', salt='Натрийн нитрит', neut='Натрийн гидроксид',
                 common='Азотын хүчил', ion='H⁺', c=0.10, alpha=0.06, exp=-3),
    'NH3': dict(name='NH₃(уус)', eq='NH₃(уус) + H₂O(ш) ⇌ NH₄⁺(уус) + OH⁻(уус)', dh=4, kind='base', salt='Аммонийн хлорид', neut='Давсны хүчил',
                common='Натрийн гидроксид', ion='OH⁻', c=0.10, alpha=0.01, exp=-3),
    'HSO4-': dict(name='NaHSO₄(уус)', eq='HSO₄⁻(уус) ⇌ H⁺(уус) + SO₄²⁻(уус)', dh=-22, kind='acid', salt='Натрийн сульфат', neut='Натрийн гидроксид',
                  common='Давсны хүчил', ion='H⁺', c=0.10, alpha=0.30, exp=-2),
    'H2S': dict(name='H₂S(уус)', eq='H₂S(уус) ⇌ H⁺(уус) + HS⁻(уус)', dh=22, kind='acid', salt='Натрийн гидросульфид', neut='Калийн гидроксид',
                common='Давсны хүчил', ion='H⁺', c=0.10, alpha=0.001, exp=-4),
    'HF': dict(name='HF(уус)', eq='HF(уус) ⇌ H⁺(уус) + F⁻(уус)', dh=-13, kind='acid', salt='Натрийн фторид', neut='Натрийн гидроксид',
               common='Давсны хүчил', ion='H⁺', c=0.20, alpha=0.05, exp=-2),
    'H2CO3': dict(name='H₂CO₃(уус)', eq='H₂CO₃(уус) ⇌ H⁺(уус) + HCO₃⁻(уус)', dh=9, kind='acid', salt='Натрийн гидрокарбонат', neut='Натрийн гидроксид',
                  common='Давсны хүчил', ion='H⁺', c=0.050, alpha=0.002, exp=-4),
    'HCN': dict(name='HCN(уус)', eq='HCN(уус) ⇌ H⁺(уус) + CN⁻(уус)', dh=43, kind='acid', salt='Калийн цианид', neut='Натрийн гидроксид',
                common='Давсны хүчил', ion='H⁺', c=0.40, alpha=0.00005, exp=-5),
    'HCOOH': dict(name='HCOOH(уус)', eq='HCOOH(уус) ⇌ H⁺(уус) + HCOO⁻(уус)', dh=-0.1, kind='acid', salt='Натрийн формиат', neut='Натрийн гидроксид',
                  common='Азотын хүчил', ion='H⁺', c=0.10, alpha=0.04, exp=-3),
}

# ---- 2.3 period 3 property tables ----
DATA = {
    'oxides': (['Na₂O', 'MgO', 'Al₂O₃', 'SiO₂', 'P₄O₁₀'],
               {'Бодисын төлөв': ['хатуу'] * 5,
                'Бүтэц байгуулалт': ['Ионы тот', 'Ионы тот', None, 'Ковалентын тот', 'Молекулын тот'],
                'Хайлмал байдалдаа цахилгаан дамжуулах эсэх': ['тийм', 'тийм', None, 'үгүй', 'үгүй'],
                'Хүчил-суурийн шинж': ['суурь', 'суурь', 'амфотер', 'хүчил', 'хүчил']},
               ['хий', 'шингэн']),
    'chlorides': (['NaCl', 'MgCl₂', 'Al₂Cl₆', 'SiCl₄', 'PCl₃'],
                  {'Бодисын төлөв': ['хатуу', 'хатуу', 'хатуу', 'шингэн', 'шингэн'],
                   'Бүтэц байгуулалт': ['Ионы тот', 'Ионы тот', 'Молекулын тот', 'Молекулын тот', 'Молекулын тот'],
                   'Хайлмал байдалдаа цахилгаан дамжуулах эсэх': ['тийм', 'тийм', 'үгүй', 'үгүй', 'үгүй'],
                   'Нэгдлийн усан уусмалын pH': ['pH = 6–7', 'pH = 6–7', 'pH = 1–3', 'pH = 1–3', 'pH = 1–3']},
                  ['хий', 'Ковалентын тот']),
    'elements': (['Na', 'Al', 'Si', 'S₈', 'Cl₂'],
                 {'Бодисын төлөв': ['хатуу', 'хатуу', 'хатуу', 'хатуу', 'хий'],
                  'Бүтэц байгуулалт': ['металлын тот', 'металлын тот', 'Ковалентын тот', 'Молекулын тот', 'Молекулын тот'],
                  'Хатуу төлөвтөө цахилгаан дамжуулах эсэх': ['тийм', 'тийм', None, 'үгүй', None],
                  'Хайлах цэг (өндөр/бага)': [None, 'өндөр', 'өндөр', 'бага', 'бага']},
                 ['шингэн']),
}
TITLE = {'oxides': 'оксидын', 'chlorides': 'хлоридын', 'elements': 'энгийн бодисын'}


def period3_task(kind, seed):
    rng = random.Random(seed)
    cols, props, extra = DATA[kind]
    cells = [(p, i) for p, vals in props.items() for i, v in enumerate(vals) if v is not None]
    rng.shuffle(cells)
    chosen = []
    used_rows = set()
    from collections import Counter
    vc = Counter()
    for cap in (2, 3, 8):
        for cell in cells:         # spread blanks over rows; at most `cap` blanks share one answer word
            v = props[cell[0]][cell[1]]
            if len(chosen) < 8 and cell not in chosen and vc[v] < cap and (cell[0] not in used_rows or len(used_rows) == len(props) or cap > 2):
                chosen.append(cell)
                used_rows.add(cell[0])
                vc[v] += 1
    chosen.sort(key=lambda c: (list(props).index(c[0]), c[1]))
    values = sorted({props[p][i] for p, i in chosen})
    words = values + [w for w in extra + sorted({v for vals in props.values() for v in vals if v} - set(values)) if w not in values]
    words = words[:10]
    while len(words) < 10:
        words.append(['pH = 13–14', 'pH = 9–10', 'өндөр', 'бага', 'хий'][len(words) % 5])
        words = list(dict.fromkeys(words))
    rng.shuffle(words)
    letter = {c: 'abcdefgh'[k] for k, c in enumerate(chosen)}
    grid = [[''] + cols] + [[p] + [f'({letter[(p, i)]})' if (p, i) in letter else '' for i in range(len(cols))] for p in props]
    wt = table_svg([[str(i) for i in range(5)], words[:5], [str(i) for i in range(5, 10)], words[5:]], [120] * 5, size=12, header=False)
    main = table_svg(grid, [270] + [90] * len(cols), size=11)
    parts = [(letter[c], f'{cols[c[1]]} – {c[0].lower()}', words.index(props[c[0]][c[1]]), f'{cols[c[1]]}: {props[c[0]][c[1]]}.') for c in chosen]
    prompt = ('Хүснэгт дэх үгийн дугаарыг ашиглан даалгаврыг гүйцэтгэнэ үү. (тот – талст оронт тор)\n'
              f'Дараах хүснэгтэд үелэх хүснэгтийн 3-р үеийн элементүүдийн {TITLE[kind]} шинж чанарыг харуулжээ. Хоосон нүд (a)–(h)-д тохирох үгийн дугаарыг сонгоно уу.')
    return dict(ref='2.3', topic='Үелэх хүснэгт, үелэх хандлага', prompt=prompt, fig=stack([wt, main]), parts=parts, provisional=True)


# ---- 2.4 organic schemes ----
SUB = {
    'ethane': dict(S0='CH₃–CH₃', S1='CH₃–CH₂{X}', S2='CH₂=CH₂', S3='CH₃–CH₂OH', G='CH₃COOH', Gd='CH₃CHO', ox='хөргүүр', ketone=False,
                   ester='CH₃COOCH₂CH₃', hcn=None, poly='–(CH₂–CH₂)ₙ–', dibromo='CH₂Br–CH₂Br', hx='CH₃–CH₂{X}'),
    'propane': dict(S0='CH₃–CH₂–CH₃', S1='CH₃–CH{X}–CH₃', S2='CH₂=CH–CH₃', S3='CH₃–CH(OH)–CH₃', G='CH₃–CO–CH₃', Gd='CH₃–CH₂–CHO', ox='халаах', ketone=True,
                    ester=None, hcn='(CH₃)₂C(OH)CN', poly='–(CH₂–CH(CH₃))ₙ–', dibromo='CH₂Br–CHBr–CH₃'),
    'butane': dict(S0='CH₃–CH₂–CH₂–CH₃', S1='CH₃–CH{X}–CH₂–CH₃', S2='CH₃–CH=CH–CH₃', S3='CH₃–CH(OH)–CH₂–CH₃', G='CH₃–CO–CH₂–CH₃', Gd='CH₃–CH₂–CH₂–CHO',
                   ox='халаах', ketone=True, ester=None, hcn='CH₃C(OH)(CN)CH₂CH₃', poly='–(CH(CH₃)–CH(CH₃))ₙ–', dibromo='CH₃–CHBr–CHBr–CH₃'),
    'cyclohexane': dict(S0='C₆H₁₂ (циклогексан)', S1='C₆H₁₁{X}', S2='C₆H₁₀ (циклогексен)', S3='C₆H₁₁OH', G='C₆H₁₀O (циклогексанон)', Gd='C₆H₁₁CHO',
                        ox='халаах', ketone=True, ester=None, hcn='C₆H₁₀(OH)CN', poly=None, dibromo='C₆H₁₀Br₂'),
}
HQ = {'elim': ('ялгаруулах (элиминацийн)', lambda r7, r8: 2), 'add': ('нэгдэх', lambda r7, r8: 1 + (r7 in ('H2', 'Br2', 'poly')) + (r8 == 'hcn')),
      'ox': ('исэлдэх', lambda r7, r8: 1), 'cc': ('шинэ C–C холбоо үүсгэх', lambda r7, r8: (r8 == 'hcn') + (r7 == 'poly')),
      'subst': ('орлох (халалцах)', lambda r7, r8: 2)}


def organic_task(sub, X, r5, r7, hq, seed):
    d = {k: (v.format(X=X) if isinstance(v, str) else v) for k, v in SUB[sub].items()}
    X2 = 'Cl₂' if X == 'Cl' else 'Br₂'
    HX = 'HCl(х)' if X == 'Cl' else 'HBr(х)'
    r8 = 'hcn' if d['ketone'] else 'ester'
    reagents = {1: f'{X2} ба гэрэл', 2: 'KOH(этанол), халаах', 3: 'NaOH(уус), халаах', 4: 'конц H₂SO₄, 170 °C',
                5: 'H₂O(уур), H₃PO₄' if r5 == 'steam' else HX, 6: f"H⁺, K₂Cr₂O₇, {d['ox']}"}
    distract = [f'{X2} ба Fe{X}₃', 'H₂, Ni', 'NaBH₄', d['Gd']]
    if r5 != 'steam':
        distract[2] = 'H₂O(уур), H₃PO₄'
    items = list(reagents.values()) + [d['G']] + distract[:3]
    rng = random.Random(seed)
    rng.shuffle(items)
    num = {v: i for i, v in enumerate(items)}
    product7 = {'H2': d['S0'], 'Br2': d['dibromo'], 'poly': d['poly']}[r7]
    lab7 = 'Урвал 7'
    txt7 = {'H2': 'H₂, Ni катализатор', 'Br2': 'Br₂(уус)', 'poly': 'полимержих'}[r7]
    prod8 = d['ester'] if r8 == 'ester' else d['hcn']
    lab8 = 'Урвал 8'
    txt8 = ('(g) + этанол, конц H₂SO₄' if r8 == 'ester' else '(g) + HCN, KCN')
    target5 = 3 if r5 == 'steam' else 1
    nodes = {0: (10, 10, 170, 34, d['S0']), 1: (260, 10, 170, 34, d['S1']), 2: (520, 10, 170, 34, d['S2']),
             3: (260, 130, 170, 34, d['S3']), 4: (260, 250, 170, 34, '(g)'), 5: (520, 250, 190, 34, prod8), 6: (520, 130, 170, 34, product7)}
    edges = [(0, 1, 'Урвал 1 (a)'), (1, 2, 'Урвал 2 (b)', -8 if target5 == 1 else 0), (1, 3, 'Урвал 3 (c)'), (3, 2, 'Урвал 4 (d)', -8 if target5 == 3 else 0),
             (2, target5, 'Урвал 5 (e)', 8), (3, 4, 'Урвал 6 (f)'), (4, 5, lab8), (2, 6, lab7)]
    if r7 == 'H2':  # draw hydrogenation product separately (node 6 holds the alkane name again)
        pass
    sch = flow(nodes, edges, 760, 300, 12)
    ct = table_svg([[str(i) for i in range(5)], items[:5], [str(i) for i in range(5, 10)], items[5:]], [140] * 5, size=11, header=False)
    hname, hfun = HQ[hq]
    h = hfun(r7, r8)
    prompt = ('Сурагч доорх органик схемийг судалжээ. Уг урвалын схемд харгалзах бодис ба урвалж, нөхцөл бүхий хариултын хүснэгтийг доор харуулав.\n'
              'Даалгавар:\n1. 1–6 дугаартай урвалыг явуулахад шаардлагатай урвалж, нөхцлийн дугаарыг a, b, c, d, e, f үсэгт тааруулан сонгоно уу.\n'
              '2. Схем дэх бодис (g)-ын дугаарыг хариултын хүснэгтээс сонгоорой.\n'
              f'3. Схем дэх нийт 8 урвал дундаас {hname} урвалын тоо (h)-ийг тоолно уу.')
    ex = ['Радикал халалцах (гэрэл).', 'Спиртийн шүлтэд HX салж алкен үүснэ (элиминаци).', 'Усан шүлтэд нуклеофиль орлох – спирт.',
          'Конц H₂SO₄-аар ус салгана (элиминаци).', 'Алкенд ' + ('ус' if r5 == 'steam' else 'HX') + ' нэгдэнэ.',
          ('Анхдагч спирт бүрэн исэлдэж хүчил болно.' if not d['ketone'] else 'Хоёрдогч спирт кетон болно.')]
    parts = [(k, f'Урвал {i}', num[reagents[i]], ex[i - 1]) for i, k in enumerate('abcdef', start=1)]
    parts.append(('g', 'бодис (g)', num[d['G']], f"g = {d['G']}."))
    parts.append(('h', hname + ' урвалын тоо', h, {'elim': 'Урвал 2 ба 4.', 'add': 'Урвал 5' + (', 7' if r7 in ('H2', 'Br2', 'poly') else '') + (', 8 (HCN)' if r8 == 'hcn' else '') + '.',
                                                    'ox': 'Зөвхөн урвал 6.', 'cc': ('Урвал 8 (HCN)' if r8 == 'hcn' else '') + (' ба 7 (полимер)' if r7 == 'poly' else '') + '.',
                                                    'subst': 'Урвал 1 ба 3.'}[hq]))
    return dict(ref='2.4', topic='Органик хими', prompt=prompt, fig=stack([sch, ct]), parts=parts, provisional=True)
