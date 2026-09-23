#!/usr/bin/env python3
"""assemble readable per-agent transcripts: transcripts/Cn.md from each
session's ATIF export (full record) + journal.md (their own notes).
The .atif.json stays on disk as the authoritative machine record."""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
CAST = ['C1','C2','C3','C4','C5','C6','C7','C8']
NAMES = {'C1':'Marisol','C2':'Jules','C3':'Dani','C4':'Priya',
         'C5':'Marcus','C6':'Carmen','C7':'Victor','C8':'Tomás'}

for cid in CAST:
    atif = HERE / 'transcripts' / f'{cid}.atif.json'
    out = HERE / 'transcripts' / f'{cid}.md'
    jrnl = HERE / 'agents' / cid / 'journal.md'
    if not atif.exists():
        continue
    d = json.loads(atif.read_text())
    lines = [f'# Playtest transcript — {NAMES[cid]} ({cid})',
             f'session: {d.get("session_id","?")} · '
             f'model: {(d.get("agent") or {}).get("model","?")}',
             f'authoritative record: {atif.name} (ATIF)', '']
    for s in d.get('steps', []):
        src, msg = s.get('source'), (s.get('message') or '').strip()
        if src == 'system' or not msg: continue
        if src == 'user':
            lines.append(f'\n## — turn prompt\n> {msg[:400]}')
        elif src in ('agent','assistant'):
            lines.append(f'\n**{NAMES[cid]}:** {msg[:1200]}')
        elif src == 'tool':
            short = msg.replace('\n',' ')[:200]
            lines.append(f'`tool:` {short}')
    if jrnl.exists():
        lines += ['\n## journal.md (written by the agent)\n',
                  '```', jrnl.read_text()[:6000], '```']
    out.write_text('\n'.join(lines), encoding='utf-8')
    print('wrote', out.name, f'({len(d.get("steps",[]))} steps)')
