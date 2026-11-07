"""Offline authoring helpers; these files are never imported by the website."""

def rows(text):
    return [line.strip().split('|') for line in text.strip().splitlines() if line.strip()]

def choices(text):
    result = []
    for fields in rows(text):
        stem, answer, *rest = fields
        result.append(dict(prompt=stem, choices=[answer, *rest[:-1]], explanation=rest[-1]))
    return result

def listening(text):
    result = []
    for fields in rows(text):
        question, script, answer, *rest = fields
        result.append(dict(prompt=question, script=script, choices=[answer, *rest[:-1]], explanation=rest[-1]))
    return result

def order(text):
    return [dict(prefix=p, orderedChunks=c.split('/'), suffix=s, explanation=e)
            for p, c, s, e in rows(text)]

def reading(passage, text):
    return [dict(item, passage=passage) for item in choices(text)]
