"""Save the public EEC chemistry A question-bank entries, with their images.

The bank is a reference, not a reliable answer key (its correctRow classes are wrong).
"""
from pathlib import Path
import json
import re
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://eyeshitems.eec.mn'

def acquire(year):
    out = ROOT / str(year) / 'reference'
    out.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.get(f'{BASE}/resource/setYear/{year}', timeout=25).raise_for_status()
    entries = []
    images = {}
    html = []
    for offset in (1, 2):
        url = f'{BASE}/?itemLid=9&itemVariant=A&offset={offset}'
        response = session.get(url, timeout=25)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for checkbox in soup.select('input.items_data'):
            box = checkbox.find_parent('div', class_='box')
            number = int(re.search(r'(\d+)-р', box.select_one('.label-primary').get_text())[1])
            body = box.select_one('.items-box')
            for image in body.select('img[src]'):
                source = urljoin(BASE, image['src'])
                if source not in images:
                    name = f'images/{len(images)+1:03d}' + (Path(source.split('?')[0]).suffix or '.png')
                    target = out / name
                    target.parent.mkdir(exist_ok=True)
                    if source.startswith(('http://', 'https://')):
                        data = session.get(source, timeout=25)
                        if data.ok:
                            target.write_bytes(data.content)
                    images[source] = name
                image['src'] = images[source]
            entries.append({'number': number, 'bankId': checkbox['data-id'],
                            'points': int(box.select_one('.label-success').get_text().split('-')[-1]),
                            'text': body.get_text(' ', strip=True), 'html': str(body)})
            html.append(f'<h2>{number}</h2>{body}')
    (out / 'bank-A.json').write_text(json.dumps({'year': year, 'variant': 'A',
        'source': BASE, 'answerKey': None, 'entries': entries, 'imageSources': images}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (out / 'bank-A.html').write_text('<!doctype html><meta charset="utf-8"><title>EEC chemistry reference</title>'
        '<style>body{max-width:1000px;margin:auto;font:18px Arial}img{max-width:100%}li{margin:8px}</style>'
        + ''.join(html), encoding='utf-8')
    print(year, len(entries), 'entries;', len(images), 'images')

if __name__ == '__main__':
    for year in range(2020, 2026):
        acquire(year)
