#!/usr/bin/env python3
"""perceive.py — the sense model for Natura v8.

The brain NEVER sees coordinates, cell counts, or exact numbers.
It gets what a body would actually pick up:

  - sight in distance tiers, degraded by night / rain / fog
  - estimated distances ("about ten meters", "a few paces") — never cells
  - compass directions, never coordinates
  - hearing (loud carries, with direction), smell, touch, taste context
  - body sensations instead of stat numbers ("your stomach cramps")
  - time as light, never clock numbers
  - attention: percepts ranked by salience; loud/sudden/threatening/novel
    things punch through, ordinary things fade

The runner keeps a private label -> coordinate table per bell so the brain
can say "the creek" and the planner can resolve it. Labels are stable
within a bell; multi-bell plans store coordinates runner-side.
"""
import math

CELL_M = 2.0  # one cell ≈ two meters

# who recognizes whom on sight
KNOWN = {'lena': ['joren'], 'joren': ['lena']}

# actLabel -> sound a nearby ear would catch
SOUNDS = {
    'felling the tree': 'rhythmic thudding, like an axe biting wood',
    'sawing timber': "a saw's harsh rasp",
    'raising a hut': 'thumps and scraping, someone building',
    'making a table': 'knocking and scraping of woodwork',
    'hauling logs to the pile': 'heavy dragging and thumps',
    'lifting the log': 'a grunt of effort',
    'picking berries': 'faint rustling among leaves',
    'picking up stone': 'stone clacking on stone',
}


def compass(dx, dy):
    """dx: +east, dy: +south. Returns compass word."""
    ang = math.degrees(math.atan2(dx, -dy))  # 0 = north
    dirs = ['north', 'north-east', 'east', 'south-east',
            'south', 'south-west', 'west', 'north-west']
    return dirs[int(round(ang / 45)) % 8]


def est_dist(cells):
    """A human guess at distance. Never exact, never cells."""
    m = cells * CELL_M
    if m < 3:
        return 'a few paces away'
    if m < 7:
        return 'a few meters away'
    r = int(round(m / 5.0) * 5)
    return 'about %d meters away' % max(r, 10)


def daypart(tod):
    if 5 <= tod < 8:
        return 'dawn'
    if 8 <= tod < 12:
        return 'morning'
    if 12 <= tod < 15:
        return 'midday'
    if 15 <= tod < 18:
        return 'afternoon'
    if 18 <= tod < 21:
        return 'dusk'
    return 'night'


def build_labels(snap):
    """Private runner-side tables. NEVER shown to the brain.

    Returns (places, items):
      places: label -> (wx, wy)
      items:  label -> ground-item id
    """
    me = snap['me']
    mx, my = me['wx'], me['wy']
    places, items = {}, {}

    def dist_to(wx, wy):
        return math.hypot(wx - mx, wy - my)

    h = snap['home']
    if h['huts']:
        places['the hut'] = (h['huts'][0]['wx'], h['huts'][0]['wy'])
    places['the firepit'] = (snap['fire']['wx'], snap['fire']['wy'])
    places['the bench'] = (h['bench']['wx'], h['bench']['wy'])
    places['the woodpile'] = (h['pile']['wx'], h['pile']['wy'])
    creek = snap['water']['creek']
    if creek:
        c = creek[0]
        places['the creek'] = (c['wx'], c['wy'])
    bushes = snap['see']['bushes']
    if bushes:
        b = bushes[0]
        places['the berry bushes'] = (b['wx'], b['wy'])
    trees = snap['see']['trees']
    if trees:
        t = trees[0]
        places['a mature tree'] = (t['wx'], t['wy'])
    for o in snap.get('others', []):
        places[o['name'].lower()] = (o['wx'], o['wy'])
        places['the ' + o['name'].lower()] = (o['wx'], o['wy'])

    # nearest loose item of each kind
    seen_kinds = {}
    for e in sorted(snap['see']['logs'], key=lambda e: e['d']):
        k = e['type']
        if k not in seen_kinds:
            seen_kinds[k] = e['id']
    if 'stone' in seen_kinds:
        items['a loose stone'] = seen_kinds['stone']
        items['stone'] = seen_kinds['stone']
    if 'log' in seen_kinds:
        items['a fallen log'] = seen_kinds['log']
        items['log'] = seen_kinds['log']
    return places, items


def _body_text(me, w, fire_d, fire_burn):
    parts = []
    feelings = me.get('feelings')
    if feelings:
        # v9: the sim speaks the body's state as words; never show a stat
        parts.extend(feelings[:5])
    else:
        h = me['hunger']
        if h > 0.6:
            parts.append('your belly is full')
        elif h > 0.35:
            parts.append('a hollow feeling gnaws at your stomach')
        elif h > 0.15:
            parts.append('your stomach cramps with hunger')
        else:
            parts.append('you feel faint with hunger')
        e = me['energy']
        if e < 0.3:
            parts.append('you are exhausted; your eyelids droop')
        elif e < 0.6:
            parts.append('your limbs feel heavy')
        if me['hp'] < 0.5:
            parts.append('pain gnaws at you')
        elif me['hp'] < 0.8:
            parts.append('you ache dully')
    t = w['temp']
    if t < 6:
        parts.append('the air bites cold')
    elif t < 14:
        parts.append('a chill hangs in the air')
    elif t > 30:
        parts.append('the heat presses down')
    elif t > 24:
        parts.append('the air is warm')
    if w['rain']:
        parts.append('rain soaks your clothes and hair')
    if fire_burn > 0 and fire_d <= 3:
        parts.append("the fire's warmth touches your face")
    if me.get('pregnant'):
        parts.append('a heaviness low in your belly')
    return '; '.join(parts) + '.'


def _light_text(tod, raining):
    dp = daypart(tod)
    if dp == 'night':
        return 'Night has fallen; beyond the firelight the world is black.'
    if dp == 'dusk':
        return 'Dusk settles; shapes soften at the edges of sight.'
    if dp == 'dawn':
        return 'Dawn light, thin and grey-gold.'
    if raining:
        return 'A grey rainy %s.' % dp
    return 'It is %s.' % dp


def carry_words(me):
    bits = []
    for c in me.get('carrying', []):
        bits.append('a %s in your hand' % c)
    for k, v in me.get('inv', {}).items():
        if v and k not in ('seeds',):
            bits.append('%d %s in your pack' % (v, k))
    if me.get('inv', {}).get('seeds'):
        bits.append('a sack of seed grain')
    return ', '.join(bits) if bits else 'empty hands'


def perceive(name, snap, focus='', prev_keys=()):
    """Build the sense text for one bell.

    Returns (text, keys) where keys is the set of percept keys seen
    (for novelty detection next bell).
    """
    me = snap['me']
    mx, my = me['wx'], me['wy']
    w = snap['weather']
    tod = snap['tod']
    dp = daypart(tod)
    raining = bool(w['rain'])
    storm = bool(w['storm'])
    cloud = w.get('cloud', 0)

    night = dp == 'night'
    dusk = dp in ('dusk', 'dawn')
    sight = 10
    if dusk:
        sight = 5
    if night:
        sight = 2
    if raining or cloud > 0.7:
        sight = max(2, sight // 2)
    if storm:
        sight = 2
    fire = snap['fire']
    fire_d = math.hypot(fire['wx'] - mx, fire['wy'] - my)
    if night and fire['burn'] > 0 and fire_d <= 4:
        sight = max(sight, 4)

    lname = name.lower()
    friends = KNOWN.get(lname, [])
    percepts = []  # (salience, key, text)

    def add(sal, key, text):
        if key not in prev_keys:
            sal += 1.5  # novelty punches through
        if focus and focus.lower() in text.lower():
            sal += 4.0
        percepts.append((sal, key, text))

    def reach(wx, wy):
        return math.hypot(wx - mx, wy - my)

    # ---- other people ----
    for o in snap.get('others', []):
        d = o['d']
        oname = o['name']
        known = oname.lower() in friends
        dx, dy = o['wx'] - mx, o['wy'] - my
        dr = compass(dx, dy)
        recog_r = 5 if not night else 2
        who = oname if (known and d <= recog_r) else 'a figure'
        if d <= 2:
            doing = o.get('doing') or 'standing'
            add(7, 'person-near-%s' % oname,
                '%s is right beside you, %s.' % (who, doing))
        elif d <= 6 and d <= sight:
            doing = o.get('doing') or 'moving'
            add(5, 'person-mid-%s' % oname,
                '%s %s to the %s, %s.' % (who, est_dist(d), dr, doing))
        elif d <= 12:
            add(3, 'person-far-%s' % oname,
                'movement %s to the %s.' % (est_dist(d), dr))
        snd = SOUNDS.get(o.get('doing') or '')
        if snd and d <= 12 and not (d <= 2):
            add(6, 'sound-%s' % oname,
                'You hear %s, from the %s.' % (snd, dr))

    # ---- voices ----
    for m in snap.get('heard', [])[-3:]:
        frm = m.get('from', '?')
        add(6, 'voice-%s-%s' % (frm, (m.get('text') or '')[:20]),
            'You hear %s\'s voice: "%s"' % (frm, (m.get('text') or '')[:90]))

    # ---- trees / bushes / ground things ----
    for t in snap['see']['trees'][:2]:
        d = reach(t['wx'], t['wy'])
        if d <= sight:
            add(1.5, 'tree-%d-%d' % (t['wx'], t['wy']),
                'A mature tree %s to the %s.'
                % (est_dist(d), compass(t['wx'] - mx, t['wy'] - my)))
    for b in snap['see']['bushes'][:2]:
        d = reach(b['wx'], b['wy'])
        if d <= sight:
            add(2, 'bush-%d-%d' % (b['wx'], b['wy']),
                'Berry bushes %s to the %s.'
                % (est_dist(d), compass(b['wx'] - mx, b['wy'] - my)))
    for e in sorted(snap['see']['logs'], key=lambda e: e['d'])[:3]:
        d = e['d']
        if d <= sight:
            kind = 'a loose stone' if e['type'] == 'stone' else 'a fallen log'
            add(1.5, 'item-%d' % e['id'],
                '%s lies %s to the %s.'
                % (kind.capitalize(), est_dist(d),
                   compass(e['wx'] - mx, e['wy'] - my)))

    # ---- creek ----
    creek = snap['water']['creek']
    if creek:
        c = creek[0]
        d = c['d']
        dr = compass(c['wx'] - mx, c['wy'] - my)
        if d <= 3:
            add(2.5, 'creek-near', 'The creek runs beside you, quick and clear.')
        elif d <= sight + 4:  # heard before seen
            add(2, 'creek-far', 'You hear the creek murmuring %s to the %s.'
                % (est_dist(d), dr))
    if snap['water']['dammed']:
        add(4, 'dam', 'Stones choke the creek here; behind them the water '
                      'lies pooled, slow and still.')

    # ---- fire ----
    if fire['burn'] > 0 and fire_d <= 4:
        add(3, 'fire-lit', 'The firepit glows nearby; woodsmoke hangs in the air.')
    elif fire_d <= 4:
        add(2, 'fire-cold', 'The firepit is cold ash.')

    # ---- hut ----
    h = snap['home']
    if h['huts']:
        hx, hy = h['huts'][0]['wx'], h['huts'][0]['wy']
        d = reach(hx, hy)
        if d <= sight and d > 2:
            add(1, 'hut', 'The hut stands %s to the %s.'
                % (est_dist(d), compass(hx - mx, hy - my)))

    # ---- weather ----
    if storm:
        add(9, 'storm', 'The sky is black; thunder cracks overhead and '
                        'the wind tears at the trees.')
    elif raining:
        add(5, 'rain', 'Rain falls steadily out of a grey sky.')
    if w.get('burning'):
        add(9, 'wildfire', 'Acrid smoke — something burns nearby!')
    if raining and not storm:
        add(2, 'rain-smell', 'The air smells of rain and wet earth.')

    # ---- rank by attention ----
    percepts.sort(key=lambda p: -p[0])
    keys = set(k for _, k, _ in percepts)
    main = percepts[:8]
    side = percepts[8:12]

    lines = []
    lines.append(_light_text(tod, raining))
    lines.append('Your body tells you: ' + _body_text(me, w, fire_d, fire['burn']))
    for _, _, text in main:
        lines.append(text)
    if side:
        lines.append('At the edge of notice: ' +
                     ' '.join(t for _, _, t in side))
    if focus:
        lines.append('Your attention keeps returning to: %s.' % focus)
    return '\n'.join(lines), keys
