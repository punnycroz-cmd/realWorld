#!/usr/bin/env python3
"""convert_sf_osm.py — OSM XML -> src/data/sf_map.js for the SF scenario.

Reads the two half-bbox extracts fetched into rw-sf-spike/osm_raw/
(part1.osm west, part2.osm east; they overlap at lon -122.4253 and are
deduped by id) and emits a JS module consumed by src/sf/*.

Coverage bbox: (-122.4340, 37.7490, -122.4165, 37.7636) — Dolores Park at
center-ish, south to 24th St (Haus Coffee / El Farolito), east to Mission St.

Tile codes (engine extension):
  0 open/grass  10 street  11 sidewalk/footway  12 building  13 park
  14 poi marker  15 park path (footway inside green)  16 crosswalk
"""
import xml.etree.ElementTree as ET
import json, math, collections, os, sys

SPIKE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     '..', 'rw-sf-spike')
OSM_FILES = [os.path.join(SPIKE, 'osm_raw', 'part1.osm'),
             os.path.join(SPIKE, 'osm_raw', 'part2.osm')]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'src', 'data', 'sf_map.js')

CELL_M = 2.0
LAT0, LON0 = 37.7596, -122.4269
M_PER_LAT = 111320.0
M_PER_LON = M_PER_LAT * math.cos(math.radians(LAT0))
BBOX = (-122.4340, 37.7490, -122.4165, 37.7636)  # minlon,minlat,maxlon,maxlat

def proj(lat, lon):
    return ((lon - LON0) * M_PER_LON, -(lat - LAT0) * M_PER_LAT)

def parse_height(s):
    try:
        return float(str(s).replace('m', '').strip())
    except (ValueError, TypeError):
        return None

# ---- merge extracts ----
nodes, ways, poi_nodes = {}, [], []
seen_w = set()
for f in OSM_FILES:
    root = ET.parse(f).getroot()
    for n in root.findall('node'):
        tags = {t.get('k'): t.get('v') for t in n.findall('tag')}
        nid = int(n.get('id'))
        lat, lon = float(n.get('lat')), float(n.get('lon'))
        nodes[nid] = proj(lat, lon)
        if tags.get('name') and any(k in tags for k in
                ('amenity', 'shop', 'tourism', 'leisure', 'office', 'craft')):
            poi_nodes.append({'name': tags['name'],
                              'kind': tags.get('amenity') or tags.get('shop') or
                                      tags.get('tourism') or tags.get('leisure') or 'poi',
                              'lat': lat, 'lon': lon})
    for w in root.findall('way'):
        wid = int(w.get('id'))
        if wid in seen_w:
            continue
        seen_w.add(wid)
        tags = {t.get('k'): t.get('v') for t in w.findall('tag')}
        refs = [int(nd.get('ref')) for nd in w.findall('nd')]
        pts = [nodes[r] for r in refs if r in nodes]
        if len(pts) < 2:
            continue
        ways.append({'id': wid, 'tags': tags, 'pts': pts,
                     'closed': bool(refs) and refs[0] == refs[-1]})

_min = proj(BBOX[3], BBOX[0]); _max = proj(BBOX[1], BBOX[2])
minx, miny = _min; maxx, maxy = _max
GW = int((maxx - minx) // CELL_M) + 1
GH = int((maxy - miny) // CELL_M) + 1
grid = [[0] * GW for _ in range(GH)]
parkmask = [[False] * GW for _ in range(GH)]

def cell_of(x, y):
    return int((x - minx) // CELL_M), int((y - miny) // CELL_M)

def pt_in_poly(x, y, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            inside = not inside
        j = i
    return inside

def raster_poly(poly, val, mask=None):
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    cx0, cy0 = cell_of(min(xs), min(ys)); cx1, cy1 = cell_of(max(xs), max(ys))
    for cy in range(max(0, cy0), min(GH, cy1 + 2)):
        for cx in range(max(0, cx0), min(GW, cx1 + 2)):
            px, py = minx + (cx + 0.5) * CELL_M, miny + (cy + 0.5) * CELL_M
            if pt_in_poly(px, py, poly):
                if mask is not None:
                    mask[cy][cx] = True
                else:
                    grid[cy][cx] = val

def raster_line(pts, half_w, mode):
    """mode: 'street' -> 10; 'foot' -> 11, or 15 inside park, 16 over street."""
    for a, b in zip(pts, pts[1:]):
        ax, ay = a; bx, by = b
        length = math.hypot(bx - ax, by - ay)
        steps = max(1, int(length / (CELL_M * 0.5)))
        for s in range(steps + 1):
            t = s / steps
            px, py = ax + (bx - ax) * t, ay + (by - ay) * t
            r = int(math.ceil(half_w / CELL_M))
            cx0, cy0 = cell_of(px, py)
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    cx, cy = cx0 + dx, cy0 + dy
                    if not (0 <= cx < GW and 0 <= cy < GH):
                        continue
                    if dx * dx + dy * dy > r * r + 0.5:
                        continue
                    cur = grid[cy][cx]
                    if mode == 'street':
                        if cur in (0, 13, 14):
                            grid[cy][cx] = 10
                    else:  # foot
                        if cur == 10:
                            grid[cy][cx] = 16          # crossing -> zebra
                        elif cur in (0, 14):
                            grid[cy][cx] = 15 if parkmask[cy][cx] else 11
                        elif cur == 13:
                            grid[cy][cx] = 15          # park path

GREEN_LEISURE = {'park', 'garden', 'pitch', 'playground', 'dog_park',
                 'recreation_ground', 'common'}
GREEN_LANDUSE = {'grass', 'recreation_ground', 'village_green', 'meadow',
                 'greenfield'}
ROAD_HALF_W = {'secondary': 8.0, 'secondary_link': 5.0, 'tertiary': 7.0,
               'residential': 6.0, 'service': 3.0, 'unclassified': 5.0,
               'footway': 1.6, 'steps': 1.6, 'path': 1.6, 'pedestrian': 4.0,
               'cycleway': 2.0, 'platform': 2.0, 'living_street': 5.0}
FOOT_CLASSES = {'footway', 'steps', 'path', 'pedestrian', 'platform'}

roads, buildings, pois = [], [], []

# pass 1: park mask
green_polys = []
for w in ways:
    t = w['tags']
    if (t.get('leisure') in GREEN_LEISURE or t.get('landuse') in GREEN_LANDUSE
            or t.get('natural') in ('grassland', 'scrub', 'wood', 'tree_row')) \
            and w['closed']:
        green_polys.append(w['pts'])
        raster_poly(w['pts'], None, mask=parkmask)
for poly in green_polys:
    raster_poly(poly, 13)

# pass 2: streets, then footways (footways may punch crosswalks through streets)
for w in ways:
    hw = w['tags'].get('highway')
    if hw and hw in ROAD_HALF_W and w['tags'].get('area') != 'yes' \
            and hw not in FOOT_CLASSES:
        raster_line(w['pts'], ROAD_HALF_W[hw], 'street')
        if w['tags'].get('name'):
            mid = w['pts'][len(w['pts']) // 2]
            a, b = w['pts'][0], w['pts'][-1]
            ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
            roads.append({'name': w['tags']['name'], 'cls': hw,
                          'x': round(mid[0] - minx, 1), 'y': round(mid[1] - miny, 1),
                          'angle': round(ang, 1)})
for w in ways:
    hw = w['tags'].get('highway')
    if hw in FOOT_CLASSES and w['tags'].get('area') != 'yes':
        raster_line(w['pts'], ROAD_HALF_W[hw], 'foot')

# pass 2.5: demote false crosswalks. OSM sidewalk footways run PARALLEL to
# streets; where they overlap the street raster edge they were marked 16.
# A real crossing leaves the street within road-width cells along the
# footway's own direction on BOTH sides. For each 16 cell, record the
# footway direction during rasterization is unavailable now — instead use
# the local street axis: sample the 16 cell's street-connected band.
# Simpler robust rule: a cell stays 16 only if walking perpendicular to the
# road axis exits the 10/16 band within ~14m on both sides (crossing the
# roadway); bands running along the road fail and become sidewalk (11).
# compute runs on a frozen copy, then apply — otherwise early demotions
# shrink the runs of later cells in the same band and they survive
demote = []
for cy in range(GH):
    for cx in range(GW):
        if grid[cy][cx] != 16:
            continue
        def run16(dx, dy):
            a = b = 0
            x, y = cx + dx, cy + dy
            while 0 <= x < GW and 0 <= y < GH and grid[y][x] == 16:
                a += 1; x += dx; y += dy
            x, y = cx - dx, cy - dy
            while 0 <= x < GW and 0 <= y < GH and grid[y][x] == 16:
                b += 1; x -= dx; y -= dy
            return a + b + 1
        if max(run16(1, 0), run16(0, 1)) > 9:
            demote.append((cy, cx))
for cy, cx in demote:
    grid[cy][cx] = 11                    # long 16 band = sidewalk, not zebra

# pass 3: buildings win
addr_of_bld = []
for w in ways:
    t = w['tags']
    if 'building' in t and w['closed']:
        raster_poly(w['pts'], 12)
        h = parse_height(t.get('height'))
        if h is None:
            lv = parse_height(t.get('building:levels'))
            h = lv * 3.0 if lv else 8.0
        xs = [p[0] - minx for p in w['pts']]; ys = [p[1] - miny for p in w['pts']]
        bidx = len(buildings)
        buildings.append({
            'poly': [[round(p[0] - minx, 1), round(p[1] - miny, 1)] for p in w['pts']],
            'h': round(h, 1), 'real': 'height' in t,
            'name': t.get('name'), 'kind': t.get('building'),
            'hn': t.get('addr:housenumber'), 'st': t.get('addr:street'),
            'cx': round(sum(xs) / len(xs), 1), 'cy': round(sum(ys) / len(ys), 1)})
        if t.get('name') and any(k in t for k in ('amenity', 'shop', 'tourism')):
            pois.append({'name': t['name'],
                         'kind': t.get('amenity') or t.get('shop') or t.get('tourism'),
                         'x': round(sum(xs) / len(xs), 1),
                         'y': round(sum(ys) / len(ys), 1), 'bld': bidx})

# poi nodes
for p in poi_nodes:
    x, y = proj(p.pop('lat'), p.pop('lon'))
    if not (minx <= x <= maxx and miny <= y <= maxy):
        continue
    p['x'], p['y'] = round(x - minx, 1), round(y - miny, 1)
    p['bld'] = -1
    pois.append(p)

# attach un-attributed poi nodes to their containing building
def bld_cells(b):
    xs = [p[0] for p in b['poly']]; ys = [p[1] for p in b['poly']]
    return min(xs), min(ys), max(xs), max(ys)
for p in pois:
    if p.get('bld', -1) >= 0:
        continue
    px, py = p['x'] + minx, p['y'] + miny
    for i, b in enumerate(buildings):
        bx0, by0, bx1, by1 = bld_cells(b)
        if bx0 - 2 <= px <= bx1 + 2 and by0 - 2 <= py <= by1 + 2 and \
                pt_in_poly(px, py, [[q[0] + minx, q[1] + miny] for q in b['poly']]):
            p['bld'] = i
            break

# ---- entrances: nearest walkable cell outside each building ----
WALKABLE = (0, 10, 11, 13, 14, 15, 16)
def nearest_road_cell(cx, cy, maxr=30):
    best, bd = None, 1e9
    for r in range(1, maxr):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r:
                    continue
                x, y = cx + dx, cy + dy
                if 0 <= x < GW and 0 <= y < GH and grid[y][x] in (10, 11, 16):
                    d = dx * dx + dy * dy
                    if d < bd:
                        bd, best = d, (x, y)
        if best:
            return best
    return None

# building cell set for boundary detection (only near building bbox)
for b in buildings:
    bx0, by0, bx1, by1 = bld_cells(b)
    c0x, c0y = cell_of(bx0 + minx, by0 + miny)
    c1x, c1y = cell_of(bx1 + minx, by1 + miny)
    cand = []
    for cy in range(max(0, c0y - 1), min(GH, c1y + 2)):
        for cx in range(max(0, c0x - 1), min(GW, c1x + 2)):
            if grid[cy][cx] == 12:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < GW and 0 <= ny < GH and grid[ny][nx] in WALKABLE:
                        cand.append((nx, ny))
    if not cand:
        b['door'] = None
        continue
    # candidate closest to a road/sidewalk cell
    ccx, ccy = cell_of(b['cx'] + minx, b['cy'] + miny)
    rc = nearest_road_cell(ccx, ccy)
    if rc:
        b['door'] = min(cand, key=lambda c: (c[0] - rc[0]) ** 2 + (c[1] - rc[1]) ** 2)
    else:
        b['door'] = cand[0]
    b['door'] = {'cx': b['door'][0], 'cy': b['door'][1]}

# mark poi marker cells
for p in pois:
    cx, cy = cell_of(p['x'] + minx, p['y'] + miny)
    if 0 <= cx < GW and 0 <= cy < GH and grid[cy][cx] == 0:
        grid[cy][cx] = 14

# ---- park trees / benches / lamps + street lamps ----
props = []
def h2(x, y, s):
    h = (int(x) * 73856093) ^ (int(y) * 19349663) ^ (s * 83492791)
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffffffff) / 4294967295

for cy in range(2, GH - 2):
    for cx in range(2, GW - 2):
        if grid[cy][cx] == 13:
            # interior park trees, spaced ~7 cells w/ jitter
            if cx % 7 == int(h2(cy, 3, 77) * 7) and cy % 7 == int(h2(cx, 5, 78) * 7):
                if h2(cx, cy, 79) < 0.75:
                    props.append({'k': 'tree', 'x': round(cx * CELL_M, 1),
                                  'y': round(cy * CELL_M, 1)})
            # palms along park edge (park cell adjacent to sidewalk/street)
            else:
                edge = any(grid[cy + dy][cx + dx] in (10, 11, 16)
                           for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                if edge and h2(cx, cy, 80) < 0.10:
                    props.append({'k': 'palm', 'x': round(cx * CELL_M, 1),
                                  'y': round(cy * CELL_M, 1)})
        elif grid[cy][cx] == 15:
            if h2(cx, cy, 81) < 0.02:
                props.append({'k': 'bench', 'x': round(cx * CELL_M, 1),
                              'y': round(cy * CELL_M, 1)})
            elif h2(cx, cy, 82) < 0.012:
                props.append({'k': 'lamp', 'x': round(cx * CELL_M, 1),
                              'y': round(cy * CELL_M, 1)})
        elif grid[cy][cx] == 11 and cy % 9 == 0:
            # sidewalk lamps along bigger streets: sidewalk cell touching street
            if any(grid[cy + dy][cx + dx] == 10
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) \
                    and h2(cx, cy, 83) < 0.05:
                props.append({'k': 'lamp', 'x': round(cx * CELL_M, 1),
                              'y': round(cy * CELL_M, 1)})

# ---- fictional anchors mapped to real OSM features ----
anchors = {}
def find_poi(name):
    for p in pois:
        if p['name'] == name:
            return p
    return None
def bld_by_addr(hn, street_frag):
    for i, b in enumerate(buildings):
        if not b['hn'] or not b['st'] or street_frag.lower() not in b['st'].lower():
            continue
        for part in str(b['hn']).replace(',', ';').split(';'):
            if part.strip() == str(hn):
                return i
    return None

p = find_poi('Taqueria El Farolito')
if p: anchors['farolito'] = {'x': p['x'], 'y': p['y'], 'bld': p.get('bld', -1), 'osm': p['name']}
p = find_poi('Cafe La Boheme') or find_poi('Beloved Cafe')
if p: anchors['haus'] = {'x': p['x'], 'y': p['y'], 'bld': p.get('bld', -1),
                         'osm': p['name'], 'alias': 'Haus Coffee'}
p = find_poi('U-Save Plumbing and Hardware')
if p: anchors['auerbach'] = {'x': p['x'], 'y': p['y'], 'bld': p.get('bld', -1),
                             'osm': p['name'], 'alias': 'Auerbach Hardware'}
i = bld_by_addr('744', 'Guerrero')
if i is not None:
    anchors['g744'] = {'bld': i, 'x': buildings[i]['cx'], 'y': buildings[i]['cy']}
    # 750: same side of street (even numbers) — nearest even-numbered >744
    best, bd = None, 1e9
    for j, b in enumerate(buildings):
        if not b['hn'] or not b['st'] or 'uerrero' not in b['st'].lower():
            continue
        for part in str(b['hn']).replace(',', ';').split(';'):
            try:
                n = int(part.strip())
            except ValueError:
                continue
            if n > 744 and n % 2 == 0:
                d = abs(n - 750) * 1000 + \
                    (b['cx'] - buildings[i]['cx']) ** 2 + (b['cy'] - buildings[i]['cy']) ** 2
                if d < bd:
                    bd, best = d, j
    if best is not None:
        anchors['g750'] = {'bld': best, 'x': buildings[best]['cx'],
                           'y': buildings[best]['cy'],
                           'osm_hn': buildings[best]['hn']}

# attach anchor POIs to their nearest real building (<=25m) so doors work
for key in ('farolito', 'haus', 'auerbach'):
    a = anchors.get(key)
    if not a or a.get('bld', -1) >= 0:
        continue
    best, bd = None, 25.0 * 25.0
    for j, b in enumerate(buildings):
        d = (b['cx'] - a['x']) ** 2 + (b['cy'] - a['y']) ** 2
        if d < bd:
            bd, best = d, j
    if best is not None:
        a['bld'] = best

# Dolores Park gathering spots: inside the named park polygon only
dolo = None
for w in ways:
    if w['tags'].get('leisure') == 'park' and \
            'dolores' in (w['tags'].get('name') or '').lower() and w['closed']:
        dolo = w['pts']
        break
if dolo is None:
    dolo = max(green_polys, key=lambda p: (max(q[0] for q in p) - min(q[0] for q in p)))
pc = [c for cy in range(GH) for cx in range(GW) if grid[cy][cx] == 13
      for c in [(cx, cy)]
      if pt_in_poly(minx + (cx + 0.5) * CELL_M, miny + (cy + 0.5) * CELL_M, dolo)]
if pc:
    acx = sum(c[0] for c in pc) / len(pc)
    acy = sum(c[1] for c in pc) / len(pc)
    anchors['park_center'] = {'cx': round(acx), 'cy': round(acy)}
    anchors['park_north'] = {'cx': round(acx), 'cy': min(c[1] for c in pc) + 4}
    anchors['park_south'] = {'cx': round(acx), 'cy': max(c[1] for c in pc) - 4}

# ---- emit ----
rows = []
for row in grid:
    runs = []
    cur, n = row[0], 1
    for v in row[1:]:
        if v == cur:
            n += 1
        else:
            runs.append(f'{cur}x{n}' if n > 1 else str(cur))
            cur, n = v, 1
    runs.append(f'{cur}x{n}' if n > 1 else str(cur))
    rows.append(','.join(runs))

data = {'meta': {'cell_m': CELL_M, 'gw': GW, 'gh': GH, 'minx': round(minx, 2),
                 'miny': round(miny, 2), 'lat0': LAT0, 'lon0': LON0},
        'tilesR': rows, 'buildings': buildings, 'roads': roads,
        'pois': pois, 'props': props, 'anchors': anchors}

js = ('/* SF Mission map data — generated by scripts/convert_sf_osm.py from\n'
      '   rw-sf-spike/osm_raw/part{1,2}.osm. Do not hand-edit. */\n'
      'const SF_MAP = ' + json.dumps(data, separators=(',', ':')) + ';\n')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(js)

stats = collections.Counter(c for row in grid for c in row)
print('grid', GW, 'x', GH, '|', dict(stats))
print('buildings', len(buildings),
      'real-height', sum(1 for b in buildings if b['real']),
      'with-door', sum(1 for b in buildings if b.get('door')))
print('roads', len(roads), 'pois', len(pois), 'props', len(props))
print('anchors:', json.dumps(anchors))
print('wrote', OUT, len(js), 'bytes')
