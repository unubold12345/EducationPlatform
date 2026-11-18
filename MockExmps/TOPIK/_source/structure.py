"""Official TOPIK PBT question structure, used by the authors, validate.py and scripts/build-topik-mocks.mjs.

Sources (see ../SOURCES.md): NIIED TOPIK operating rules (test composition and level cut scores), the released
52nd TOPIK I and II booklets (task order, instructions, paired sets) and the 52nd and 60th TOPIK I answer keys
(per-question points; identical in both papers). TOPIK II items are 2 points each; writing 10/10/30/50.

Run `python structure.py` to write structure.json next to this file (read by the site builder).
"""
from __future__ import annotations

import json
from pathlib import Path

ME = '(남자|여자)'  # a prompt that names one speaker; the author picks the one that matches the script

# One entry per printed instruction block ([1～4], [25～26] ...). `set`: True when the block's questions share one
# recording or one text. Per question: points, task code and the printed question line (`prompt`, exact text, or
# `pattern`, a regex) when the paper prints one.
TOPIK_I = {
    'listening': [
        {'from': 1, 'to': 4, 'task': 'answer', 'instruction': '다음을 듣고 <보기>와 같이 물음에 맞는 대답을 고르십시오.',
         'example': {'script': [{'speaker': '남자', 'text': '물이에요?'}], 'options': ['네, 물이에요.', '네, 물이 없어요.', '아니요, 물이 차가워요.', '아니요, 물을 마셔요.'], 'answer': 1},
         'questions': {1: {'points': 4, 'task': 'yes-no'}, 2: {'points': 4, 'task': 'yes-no'}, 3: {'points': 3, 'task': 'wh'}, 4: {'points': 3, 'task': 'wh'}}},
        {'from': 5, 'to': 6, 'task': 'continue', 'instruction': '다음을 듣고 <보기>와 같이 이어지는 말을 고르십시오.',
         'example': {'script': [{'speaker': '여자', 'text': '생일 축하해요.'}], 'options': ['괜찮아요.', '고마워요.', '실례합니다.', '처음 뵙겠습니다.'], 'answer': 2},
         'questions': {5: {'points': 4}, 6: {'points': 3}}},
        {'from': 7, 'to': 10, 'task': 'place', 'instruction': '여기는 어디입니까? <보기>와 같이 알맞은 것을 고르십시오.',
         'example': {'script': [{'speaker': '남자', 'text': '이 우유 얼마예요?'}, {'speaker': '여자', 'text': '천오백 원이에요.'}], 'options': ['서점', '가게', '극장', '은행'], 'answer': 2},
         'questions': {7: {'points': 3}, 8: {'points': 3}, 9: {'points': 3}, 10: {'points': 4}}},
        {'from': 11, 'to': 14, 'task': 'topic', 'instruction': '다음은 무엇에 대해 말하고 있습니까? <보기>와 같이 알맞은 것을 고르십시오.',
         'example': {'script': [{'speaker': '여자', 'text': '동생이 있어요?'}, {'speaker': '남자', 'text': '네, 남동생이 한 명 있어요.'}], 'options': ['가족', '친구', '학교', '운동'], 'answer': 1},
         'questions': {11: {'points': 3}, 12: {'points': 3}, 13: {'points': 4}, 14: {'points': 3}}},
        {'from': 15, 'to': 16, 'task': 'picture', 'instruction': '다음 대화를 듣고 알맞은 그림을 고르십시오.',
         'questions': {15: {'points': 4}, 16: {'points': 4}}},
        {'from': 17, 'to': 21, 'task': 'match', 'instruction': '다음을 듣고 <보기>와 같이 대화 내용과 같은 것을 고르십시오.',
         'example': {'script': [{'speaker': '남자', 'text': '주말에 뭐 했어요?'}, {'speaker': '여자', 'text': '언니하고 같이 산에 갔어요.'}], 'options': ['남자는 산에 갔습니다.', '여자는 언니가 있습니다.', '남자는 언니와 등산을 했습니다.', '여자는 주말에 집에 있었습니다.'], 'answer': 2},
         'questions': {n: {'points': 3} for n in range(17, 22)}},
        {'from': 22, 'to': 24, 'task': 'woman-idea', 'instruction': '다음을 듣고 여자의 중심 생각을 고르십시오.',
         'questions': {n: {'points': 3} for n in range(22, 25)}},
        {'from': 25, 'to': 26, 'set': True, 'task': 'announcement', 'instruction': '다음을 듣고 물음에 답하십시오.',
         'questions': {25: {'points': 3, 'task': 'purpose', 'pattern': ME + '가 왜 이 이야기를 하고 있는지 고르십시오\\.'},
                       26: {'points': 4, 'task': 'match', 'prompt': '들은 내용과 같은 것을 고르십시오.'}}},
        {'from': 27, 'to': 28, 'set': True, 'task': 'dialogue', 'instruction': '다음을 듣고 물음에 답하십시오.',
         'questions': {27: {'points': 3, 'task': 'topic-phrase', 'prompt': '두 사람이 무엇에 대해 이야기를 하고 있는지 고르십시오.'},
                       28: {'points': 4, 'task': 'match', 'prompt': '들은 내용과 같은 것을 고르십시오.'}}},
        {'from': 29, 'to': 30, 'set': True, 'task': 'interview', 'instruction': '다음을 듣고 물음에 답하십시오.',
         'questions': {29: {'points': 3, 'task': 'reason', 'pattern': ME + '가? .+(이유|까닭)를 고르십시오\\.'},
                       30: {'points': 4, 'task': 'match', 'prompt': '들은 내용과 같은 것을 고르십시오.'}}},
    ],
    'reading': [
        {'from': 31, 'to': 33, 'task': 'topic', 'instruction': '무엇에 대한 이야기입니까? <보기>와 같이 알맞은 것을 고르십시오.',
         'example': {'passage': '저는 의사입니다. 언니는 간호사입니다.', 'options': ['직업', '나이', '날씨', '취미'], 'answer': 1},
         'questions': {n: {'points': 2} for n in range(31, 34)}},
        {'from': 34, 'to': 39, 'task': 'blank', 'instruction': '<보기>와 같이 (    )에 들어갈 가장 알맞은 것을 고르십시오.',
         'example': {'passage': '날씨가 덥습니다. (    )을 엽니다.', 'options': ['창문', '가방', '냉장고', '책'], 'answer': 1},
         'questions': {34: {'points': 2, 'task': 'particle'}, 35: {'points': 2, 'task': 'noun'}, 36: {'points': 2, 'task': 'adverb'},
                       37: {'points': 3, 'task': 'adjective'}, 38: {'points': 3, 'task': 'verb'}, 39: {'points': 2, 'task': 'verb'}}},
        {'from': 40, 'to': 42, 'task': 'doc-not', 'instruction': '다음을 읽고 맞지 않는 것을 고르십시오.',
         'questions': {n: {'points': 3} for n in range(40, 43)}},
        {'from': 43, 'to': 45, 'task': 'match', 'instruction': '다음의 내용과 같은 것을 고르십시오.',
         'questions': {43: {'points': 3}, 44: {'points': 2}, 45: {'points': 3}}},
        {'from': 46, 'to': 48, 'task': 'main-idea', 'instruction': '다음을 읽고 중심 생각을 고르십시오.',
         'questions': {46: {'points': 3}, 47: {'points': 3}, 48: {'points': 2}}},
        {'from': 49, 'to': 50, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {49: {'points': 2, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       50: {'points': 2, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 51, 'to': 52, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {51: {'points': 3, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       52: {'points': 2, 'task': 'topic-phrase', 'prompt': '무엇에 대한 이야기인지 맞는 것을 고르십시오.'}}},
        {'from': 53, 'to': 54, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {53: {'points': 2, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       54: {'points': 3, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 55, 'to': 56, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {55: {'points': 2, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       56: {'points': 3, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 57, 'to': 58, 'task': 'order', 'instruction': '다음을 순서대로 맞게 나열한 것을 고르십시오.',
         'questions': {57: {'points': 3}, 58: {'points': 2}}},
        {'from': 59, 'to': 60, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {59: {'points': 2, 'task': 'insert', 'prompt': '다음 문장이 들어갈 곳을 고르십시오.'},
                       60: {'points': 3, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 61, 'to': 62, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {61: {'points': 2, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       62: {'points': 2, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 63, 'to': 64, 'set': True, 'task': 'doc', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {63: {'points': 2, 'task': 'purpose', 'prompt': '왜 이 글을 썼는지 맞는 것을 고르십시오.'},
                       64: {'points': 3, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 65, 'to': 66, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {65: {'points': 2, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       66: {'points': 3, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 67, 'to': 68, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {67: {'points': 3, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       68: {'points': 3, 'task': 'match', 'prompt': '이 글의 내용과 같은 것을 고르십시오.'}}},
        {'from': 69, 'to': 70, 'set': True, 'task': 'passage', 'instruction': '다음을 읽고 물음에 답하십시오.',
         'questions': {69: {'points': 3, 'task': 'blank', 'prompt': '㉠에 들어갈 알맞은 말을 고르십시오.'},
                       70: {'points': 3, 'task': 'infer', 'prompt': '이 글의 내용으로 알 수 있는 것을 고르십시오.'}}},
    ],
}

L_MATCH = '들은 내용과 같은 것을 고르십시오.'
L_MATCH2 = '들은 내용으로 맞는 것을 고르십시오.'
R_MATCH = '위 글의 내용과 같은 것을 고르십시오.'
TWO = 2


def pair(a, task, instruction, first, second, kind='dialogue'):
    return {'from': a, 'to': a + 1, 'set': True, 'task': task, 'kind': kind, 'instruction': instruction,
            'questions': {a: {'points': TWO, **first}, a + 1: {'points': TWO, **second}}}


ANSWER = '다음을 듣고 물음에 답하십시오.'
READ = '다음을 읽고 물음에 답하십시오.'
TOPIK_II = {
    'listening': [
        {'from': 1, 'to': 3, 'task': 'picture', 'instruction': '다음을 듣고 알맞은 그림 또는 그래프를 고르십시오.',
         'questions': {1: {'points': TWO, 'task': 'picture'}, 2: {'points': TWO, 'task': 'picture'}, 3: {'points': TWO, 'task': 'graph'}}},
        {'from': 4, 'to': 8, 'task': 'next-line', 'instruction': '다음 대화를 잘 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
         'questions': {n: {'points': TWO} for n in range(4, 9)}},
        {'from': 9, 'to': 12, 'task': 'next-action', 'instruction': '다음 대화를 잘 듣고 여자가 이어서 할 행동으로 알맞은 것을 고르십시오.',
         'questions': {n: {'points': TWO} for n in range(9, 13)}},
        {'from': 13, 'to': 16, 'task': 'match', 'instruction': '다음을 듣고 들은 내용과 같은 것을 고르십시오.',
         'questions': {13: {'points': TWO, 'task': 'dialogue'}, 14: {'points': TWO, 'task': 'announcement'}, 15: {'points': TWO, 'task': 'news'}, 16: {'points': TWO, 'task': 'interview'}}},
        {'from': 17, 'to': 20, 'task': 'man-idea', 'instruction': '다음을 듣고 남자의 중심 생각을 고르십시오.',
         'questions': {n: {'points': TWO} for n in range(17, 21)}},
        pair(21, 'dialogue', ANSWER, {'task': 'idea', 'prompt': '남자의 중심 생각으로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH2}),
        pair(23, 'dialogue', ANSWER, {'task': 'doing', 'prompt': '남자가 무엇을 하고 있는지 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH2}),
        pair(25, 'interview', ANSWER, {'task': 'idea', 'prompt': '남자의 중심 생각으로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH2}),
        pair(27, 'dialogue', ANSWER, {'task': 'intention', 'pattern': '남자가 여자에게 말하는 의도로 (가장 )?알맞은 것을 고르십시오\\.'}, {'task': 'match', 'prompt': L_MATCH2}),
        pair(29, 'interview', ANSWER, {'task': 'who', 'prompt': '남자가 누구인지 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH2}),
        pair(31, 'debate', ANSWER, {'task': 'idea', 'prompt': '남자의 중심 생각으로 가장 알맞은 것을 고르십시오.'}, {'task': 'attitude', 'prompt': '남자의 태도로 가장 알맞은 것을 고르십시오.'}),
        pair(33, 'lecture', ANSWER, {'task': 'topic', 'prompt': '무엇에 대한 내용인지 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH2}, 'monologue'),
        pair(35, 'speech', ANSWER, {'task': 'doing', 'prompt': '남자가 무엇을 하고 있는지 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH2}, 'monologue'),
        pair(37, 'program', '다음은 교양 프로그램입니다. 잘 듣고 물음에 답하십시오.', {'task': 'idea', 'prompt': '여자의 중심 생각으로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH}),
        pair(39, 'talk', '다음은 대담입니다. 잘 듣고 물음에 답하십시오.', {'task': 'before', 'prompt': '이 담화 앞의 내용으로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH}),
        pair(41, 'lecture', '다음은 강연입니다. 잘 듣고 물음에 답하십시오.', {'task': 'central', 'prompt': '이 강연의 중심 내용으로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': L_MATCH}, 'monologue'),
        pair(43, 'documentary', '다음은 다큐멘터리입니다. 잘 듣고 물음에 답하십시오.', {'task': 'central', 'prompt': '이 이야기의 중심 내용으로 가장 알맞은 것을 고르십시오.'}, {'task': 'detail', 'pattern': '.+(에 대한 설명으로 맞는 것을|(이유|까닭)로 (가장 )?(맞는|알맞은) 것을) 고르십시오\\.'}, 'monologue'),
        pair(45, 'lecture', '다음은 강연입니다. 잘 듣고 물음에 답하십시오.', {'task': 'match', 'prompt': L_MATCH}, {'task': 'manner', 'pattern': ME + '가 말하는 방식으로 가장 알맞은 것을 고르십시오\\.'}, 'monologue'),
        pair(47, 'talk', '다음은 대담입니다. 잘 듣고 물음에 답하십시오.', {'task': 'match', 'prompt': L_MATCH}, {'task': 'attitude', 'prompt': '남자의 태도로 가장 알맞은 것을 고르십시오.'}),
        pair(49, 'lecture', '다음은 강연입니다. 잘 듣고 물음에 답하십시오.', {'task': 'match', 'prompt': L_MATCH}, {'task': 'attitude', 'pattern': ME + '의 태도로 가장 알맞은 것을 고르십시오\\.'}, 'monologue'),
    ],
    'writing': [
        {'from': 51, 'to': 52, 'task': 'sentence-gaps', 'instruction': '다음 글의 ㉠과 ㉡에 알맞은 말을 각각 쓰십시오.',
         'questions': {51: {'points': 10, 'task': 'practical'}, 52: {'points': 10, 'task': 'explanatory'}}},
        {'from': 53, 'to': 53, 'task': 'graph-essay', 'instruction': '다음을 참고하여 ‘{topic}’에 대한 글을 200～300자로 쓰십시오. 단, 글의 제목을 쓰지 마십시오.',
         'questions': {53: {'points': 30}}},
        {'from': 54, 'to': 54, 'task': 'essay', 'instruction': '다음을 주제로 하여 자신의 생각을 600～700자로 글을 쓰십시오. 단, 문제를 그대로 옮겨 쓰지 마십시오.',
         'questions': {54: {'points': 50}}},
    ],
    'reading': [
        {'from': 1, 'to': 2, 'task': 'blank-grammar', 'instruction': '(    )에 들어갈 가장 알맞은 것을 고르십시오.', 'questions': {1: {'points': TWO}, 2: {'points': TWO}}},
        {'from': 3, 'to': 4, 'task': 'similar', 'instruction': '밑줄 친 부분과 의미가 비슷한 것을 고르십시오.', 'questions': {3: {'points': TWO}, 4: {'points': TWO}}},
        {'from': 5, 'to': 8, 'task': 'what-about', 'instruction': '다음은 무엇에 대한 글인지 고르십시오.', 'questions': {n: {'points': TWO} for n in range(5, 9)}},
        {'from': 9, 'to': 12, 'task': 'match', 'instruction': '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.',
         'questions': {9: {'points': TWO, 'task': 'notice'}, 10: {'points': TWO, 'task': 'graph'}, 11: {'points': TWO, 'task': 'article'}, 12: {'points': TWO, 'task': 'article'}}},
        {'from': 13, 'to': 15, 'task': 'order', 'instruction': '다음을 순서대로 맞게 배열한 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(13, 16)}},
        {'from': 16, 'to': 18, 'task': 'blank-content', 'instruction': '다음을 읽고 (    )에 들어갈 내용으로 가장 알맞은 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(16, 19)}},
        pair(19, 'passage', READ, {'task': 'blank', 'prompt': '(    )에 들어갈 알맞은 것을 고르십시오.'}, {'task': 'theme', 'prompt': '위 글의 주제로 가장 알맞은 것을 고르십시오.'}),
        pair(21, 'passage', READ, {'task': 'idiom', 'prompt': '(    )에 들어갈 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': R_MATCH}),
        pair(23, 'essay', READ, {'task': 'feeling', 'prompt': '밑줄 친 부분에 나타난 ‘나’의 심정으로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': R_MATCH}),
        {'from': 25, 'to': 27, 'task': 'headline', 'instruction': '다음은 신문 기사의 제목입니다. 가장 잘 설명한 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(25, 28)}},
        {'from': 28, 'to': 31, 'task': 'blank-content', 'instruction': '다음을 읽고 (    )에 들어갈 내용으로 가장 알맞은 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(28, 32)}},
        {'from': 32, 'to': 34, 'task': 'match', 'instruction': '다음을 읽고 내용이 같은 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(32, 35)}},
        {'from': 35, 'to': 38, 'task': 'theme', 'instruction': '다음 글의 주제로 가장 알맞은 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(35, 39)}},
        {'from': 39, 'to': 41, 'task': 'insert', 'instruction': '주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.', 'questions': {n: {'points': TWO} for n in range(39, 42)}},
        pair(42, 'story', READ, {'task': 'feeling', 'pattern': '밑줄 친 부분에 나타난 ‘[^’]+’의 심정으로 가장 알맞은 것을 고르십시오\\.'}, {'task': 'match', 'pattern': '위 글의 내용(과 같은 것을|으로 알 수 있는 것을) 고르십시오\\.'}),
        pair(44, 'passage', READ, {'task': 'blank', 'prompt': '(    )에 들어갈 내용으로 가장 알맞은 것을 고르십시오.'}, {'task': 'theme', 'prompt': '위 글의 주제로 가장 알맞은 것을 고르십시오.'}),
        pair(46, 'passage', READ, {'task': 'attitude', 'prompt': '위 글에 나타난 필자의 태도로 가장 알맞은 것을 고르십시오.'}, {'task': 'match', 'prompt': R_MATCH}),
        {'from': 48, 'to': 50, 'set': True, 'task': 'passage', 'instruction': READ,
         'questions': {48: {'points': TWO, 'task': 'purpose', 'prompt': '필자가 이 글을 쓴 목적으로 가장 알맞은 것을 고르십시오.'},
                       49: {'points': TWO, 'task': 'blank', 'prompt': '(    )에 들어갈 내용으로 가장 알맞은 것을 고르십시오.'},
                       50: {'points': TWO, 'task': 'attitude', 'prompt': '밑줄 친 부분에 나타난 필자의 태도로 가장 알맞은 것을 고르십시오.'}}},
    ],
}

LEVELS = {
    'I': {'title': 'TOPIK Ⅰ', 'sections': TOPIK_I,
          'minutes': {'listening': 40, 'reading': 60}, 'counts': {'listening': 30, 'reading': 40},
          'numbering': {'listening': (1, 30), 'reading': (31, 70)},
          'levels': [{'level': 1, 'min': 80}, {'level': 2, 'min': 140}], 'total': 200},
    'II': {'title': 'TOPIK Ⅱ', 'sections': TOPIK_II,
           'minutes': {'listening': 60, 'writing': 50, 'reading': 70}, 'counts': {'listening': 50, 'writing': 4, 'reading': 50},
           'numbering': {'listening': (1, 50), 'writing': (51, 54), 'reading': (1, 50)},
           'levels': [{'level': 3, 'min': 120}, {'level': 4, 'min': 150}, {'level': 5, 'min': 190}, {'level': 6, 'min': 230}], 'total': 300},
}
# TOPIK I plays every recording twice; TOPIK II plays items 1-20 once and 21-50 twice.
REPEATS = {'I': lambda n: 2, 'II': lambda n: 1 if n <= 20 else 2}


def blocks(level: str, section: str) -> list[dict]:
    return LEVELS[level]['sections'][section]


def question_spec(level: str, section: str, number: int) -> tuple[dict, dict]:
    for block in blocks(level, section):
        if block['from'] <= number <= block['to']:
            return block, block['questions'][number]
    raise KeyError((level, section, number))


def as_json() -> dict:
    out = {}
    for level, data in LEVELS.items():
        out[level] = {k: v for k, v in data.items() if k != 'sections'}
        out[level]['sections'] = {s: [{**b, 'questions': {str(n): q for n, q in b['questions'].items()}} for b in bl] for s, bl in data['sections'].items()}
        out[level]['repeats'] = {str(n): REPEATS[level](n) for n in range(1, 51)}
    return out


def check_points() -> None:
    for level, data in LEVELS.items():
        for section, bl in data['sections'].items():
            total = sum(q['points'] for b in bl for q in b['questions'].values())
            assert total == 100, (level, section, total)
            numbers = [n for b in bl for n in b['questions']]
            lo, hi = data['numbering'][section]
            assert numbers == list(range(lo, hi + 1)), (level, section)


if __name__ == '__main__':
    check_points()
    path = Path(__file__).with_name('structure.json')
    path.write_text(json.dumps(as_json(), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('wrote', path)
