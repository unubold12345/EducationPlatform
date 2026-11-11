"""Original offline IELTS authoring helpers; no website imports or writes."""
import re

def q(prompt, answer, evidence, explanation="", options=None):
    return dict(prompt=prompt, answers=answer if isinstance(answer, list) else [answer],
                evidence=evidence, explanation=explanation or evidence, options=options)

def group(kind, instruction, items, bank=None, max_words=None, numbers=False):
    return dict(kind=kind, instruction=instruction, items=items, bank=bank,
                maxWords=max_words, numbersAllowed=numbers)

def completion(items, words=1, numbers=False, label="Complete the notes."):
    limit={1:"ONE WORD ONLY",2:"NO MORE THAN TWO WORDS",3:"NO MORE THAN THREE WORDS"}[words]
    if numbers:
        limit="NO MORE THAN TWO WORDS AND/OR A NUMBER" if words==2 else "ONE WORD AND/OR A NUMBER"
    return group("completion",f"{label} Write {limit} for each answer.",items,max_words=words,numbers=numbers)

def mc(items):
    return group("multiple-choice","Choose the correct letter, A, B or C." if len(items[0]['options'])==3 else "Choose the correct letter, A, B, C or D.",items)

def tf(items):
    return group("true-false-not-given","Do these statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.",items)

def yn(items):
    return group("yes-no-not-given","Do these statements agree with the views of the writer? Write YES, NO or NOT GIVEN.",items)

def match(items, bank, label="Which paragraph contains the following information?"):
    return group("matching",label+" Write the correct letter. You may use any letter more than once.",items,bank=bank)

def headings(items, bank):
    return group("headings","Choose the correct heading for each paragraph from the list below. Write the Roman numeral. Use each heading at most once.",items,bank=bank)

def passage(title, text, groups):
    paragraphs=[s.strip() for s in text.strip().split('\n\n') if s.strip()]
    return dict(title=title,paragraphs={chr(65+i):s for i,s in enumerate(paragraphs)},groups=groups)

def part(title, script, groups):
    return dict(title=title,script=script.strip(),groups=groups)

def speaking(topics, cue, bullets, why, followups, discussion):
    return dict(part1=topics,part2=dict(cue=cue,points=bullets,explain=why,followups=followups),part3=discussion)

def words(text):
    return re.findall(r"\b[\w]+(?:[-’'][\w]+)*\b",text)
