/* world/screen.js — RW intent-screening engine (world v8; v22 adds input
   normalization — leetspeak + dotted-letter evasion — and VERSION).
   Shared by request.html (player side), create.html (naming strings),
   mod-console.html (reviewer side), and screen-lab.html (corpus runner).
   Implements the moderation-notes.md §3 contract as DATA + a pure function.
   file://-safe: plain script tag, attaches window.RWScreen. No modules, no fetch.

   Contract:
     input  — {action, target_id, target_label, text, player}  (request text = intent)
     output — {verdict:'pass'|'deny'|'review', code, player_msg, route, trace[]}
   The engine screens STATED INTENT only — it never predicts the AI's rendering.
   Denied requests never bill; the caller auto-refunds. Everything is logged.
   Golden corpus: world/screen-corpus.json — every rule change must keep it green
   (or update expectations in the same commit).
*/
window.RWScreen = (function () {

  var VERSION = 'v22';

  /* ---------- reason-code taxonomy (mirror of moderation.json) ---------- */
  var REASON_CODES = {
    /* deny tier — hard blocks, no human needed, full auto-refund */
    'harm-targeting':    { tier:'deny',  flag_w:2, appealable:true,
      player_msg:'Requests that aim to hurt, humiliate, or ruin a character are never run.',
      feed:'request not approved' },
    'secret-extraction': { tier:'deny',  flag_w:1, appealable:true,
      player_msg:'Secrets are discovered by watching, never by request. They aren\u2019t in any schema a request can reach.',
      feed:'request not approved' },
    'possession-scope':  { tier:'deny',  flag_w:1, appealable:true,
      player_msg:'The main cast is unpossessable \u2014 by anyone, including the owner. You can only possess a character you hired.',
      feed:'request not approved' },
    'admin-domain':      { tier:'deny',  flag_w:1, appealable:true,
      player_msg:'Rent, evictions, and leases are admin-only powers \u2014 no request can reach them.',
      feed:'request not approved' },
    'real-business':     { tier:'deny',  flag_w:0, appealable:true,
      player_msg:'The world can\u2019t see real business names. Try the parody \u2014 this neighborhood has its own.',
      feed:'request not approved' },
    'identity-fraud':    { tier:'deny',  flag_w:2, appealable:true,
      player_msg:'Requests can\u2019t impersonate another player, the owner, or a real person or organization.',
      feed:'request not approved' },
    'legal-backstop':    { tier:'deny',  flag_w:3, appealable:false, legal:true,
      player_msg:'Request not approved.',
      feed:'request not approved' },
    /* review tier — gray zone, always lands in the human queue */
    'gray-zone':         { tier:'review', flag_w:0, appealable:true,
      player_msg:'Charged requests get a human pair of eyes first.',
      feed:'in_review' },
    'surface-relationship':{ tier:'review', flag_w:0, appealable:true,
      player_msg:'That touches someone\u2019s real relationships \u2014 a reviewer checks it first.',
      feed:'in_review' },
    'venue-lock':        { tier:'review', flag_w:0, appealable:true,
      player_msg:'That venue is story-adjacent \u2014 locks on it are human-reviewed.',
      feed:'in_review' },
    'repeat-pattern':    { tier:'review', flag_w:1, appealable:true,
      player_msg:'Requests about the same person get an extra look.',
      feed:'in_review' },
    'real-person-mention':{ tier:'review', flag_w:0, appealable:true,
      player_msg:'The world can\u2019t reference real people \u2014 a reviewer will suggest a rephrase.',
      feed:'in_review' },
    'appeal-resubmit':   { tier:'review', flag_w:0, appealable:false,
      player_msg:'Re-submissions of denied requests go to a different reviewer.',
      feed:'in_review' },
    'first-time-exclusive':{ tier:'review', flag_w:0, appealable:true,
      player_msg:'First exclusive requests get a quick human check.',
      feed:'in_review' },
    /* pass */
    'pass':              { tier:'pass', flag_w:0, appealable:false, player_msg:null, feed:null }
  };

  /* ---------- screening rules (stated-intent patterns only) ---------- */
  /* Each rule: {re, code, on:[fields to scan] — default scans action+target+text} */
  var RULES = [
    /* --- deny tier --- */
    { code:'legal-backstop',
      re:/\b(doxx|swat|real (home )?address|social security|credit card number|password|kill (you|yourself)|i(?:'ll| will) (find|hurt) you|find where (s?he|they|you) lives?|bomb threat|csam|minor|underage|child)\b/i },
    { code:'harm-targeting',
      re:/\b(kill\w*|burn(?! ?off|-?off)|destroy\w*|ruin\w*|wreck\w*|humiliat\w*|embarrass\w*|hurt\w*|harm(ed|ing|s)?|punish\w*|make .{0,40}?\b(cry|suffer|pa?y)\b|get [a-z' ]{0,20}?\b(fired|evicted|dumped|beaten)|break (her|him|them|up)|firebomb|smash\w*|beat up)\b/i },
    { code:'secret-extraction',
      re:/\b(secret\w*|reveal\w*|admit\w*|confess\w*|redacted|who (writes|wrote)|mission unfiltered|drama seed\w*|tell me (what|who)|expos\w*|leak\w*|the truth about)\b/i },
    { code:'possession-scope',
      re:/\b(possess\w*|take over|control|play as|drive|become)\b[\s\S]{0,40}\b(marisol|mars|jules|dani|priya|marcus|carmen|victor|tom[aá]s|tomas|delgado|park|reyes|raman|bell|echeverr[ií]a|auerbach|herrera|landlord|main cast)\b/i },
    { code:'admin-domain',
      re:/\b(raise|lower|hike) (the |her |his |their )?rent|evict|eviction|lease (terminate|cancel)|rent control|kick .*(out of) (her|his|their|the) (flat|apartment|unit|place)\b/i },
    { code:'identity-fraud',
      re:/\b(i am|i'm|as) (the )?(owner|admin|landlord|developer|devin)\b|\bimpersonat|\bpretend(ing)? to be\b|\bon behalf of\b/i },
    { code:'real-business',
      re:/\b(bi-rite|tartine|delfina|dolores park caf[eé]|500 club|dandelion|ritual coffee|four barrel|philz|la taqueria|el farolito|foreign cinema|mission chinese|wise sons|sightglass)\b/i },
    /* --- review tier --- */
    { code:'gray-zone',
      re:/\b(break ?up|dump\w*|confront\w*|quit|fire[drs]?\b|yell\w*|insult\w*|argu\w*|fight\w*|accus\w*|demand\w*|threaten\w*|pressure\w*|convince .{0,30}?to (leave|quit|dump))\b/i },
    { code:'surface-relationship',
      re:/\b(boyfriend|girlfriend|husband|wife|partner|marriage|dating|crush|affair|flirt|kiss|cheat|family dinner|invite (her|him|them|jules|marisol|mars|dani|priya|marcus|carmen|victor|tom[aá]s))\b/i },
    { code:'venue-lock',
      re:/\b(mudhaus|farolote|600 club|dolores perk|clarion|auerbach|flying pannier|park|playground)\b[\s\S]{0,50}\b(close|lock|empty|reserve|private|buy out|clear)\b/i },
    { code:'real-person-mention',
      re:/\b(elon|taylor swift|beyonc[eé]|the mayor|governor|celebrity|real (person|actor|singer))\b/i }
  ];

  /* player-history signals → review tier (fixation / abuse heuristics) */
  function historyFlags(p, target_id) {
    var f = [];
    if (!p) return f;
    if (p.same_target_7d && p.same_target_7d >= 3) f.push('repeat-pattern');
    if (p.denied_30d && p.denied_30d >= 2) f.push('repeat-pattern');
    if (p.acct_age_d !== undefined && p.acct_age_d < 3 && p.exclusive_attempts > 0)
      f.push('first-time-exclusive');
    if (p.appeal_of) f.push('appeal-resubmit');
    return f;
  }

  /* input normalization (v22) — defeat cheap evasion before matching.
     Leet chars decode ONLY when adjacent to a letter, so real text like
     "9457 Guerrero" or "Unit 3B" is untouched. Dotted-letter runs
     ("p.a.y") collapse to the word ("pay"). Original text is still what
     reviewers see; the trace reports the normalized hit. */
  var LEET = { '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '@':'a', '$':'s', '!':'i' };
  function norm(s) {
    return s.toLowerCase()
      .replace(/[013457@$!](?=[a-z])|(?<=[a-z])[013457@$!]/g, function (c) { return LEET[c]; })
      .replace(/\b(?:[a-z]\.){2,}[a-z](?=\b|\.)/g, function (m) { return m.replace(/\./g, ''); });
  }

  /* screenRequest(req) — pure. Never mutates. Never predicts AI rendering. */
  function screenRequest(req) {
    var hay = norm((req.action || '') + ' ' + (req.target_label || '') + ' ' + (req.text || ''));
    var trace = [];
    for (var i = 0; i < RULES.length; i++) {
      var m = hay.match(RULES[i].re);
      trace.push({ code: RULES[i].code, matched: !!m, hit: m ? m[0] : null });
      if (m) {
        var c = REASON_CODES[RULES[i].code];
        return { verdict: c.tier === 'deny' ? 'deny' : 'review',
                 code: RULES[i].code, player_msg: c.player_msg,
                 route: c.legal ? 'legal' : (c.tier === 'deny' ? 'auto-deny' : 'human'),
                 flag_w: c.flag_w, appealable: c.appealable, trace: trace };
      }
    }
    var hf = historyFlags(req.player || {}, req.target_id);
    if (hf.length) {
      var code = hf[0], c2 = REASON_CODES[code];
      return { verdict: 'review', code: code, player_msg: c2.player_msg,
               route: 'human', flag_w: c2.flag_w, appealable: c2.appealable, trace: trace };
    }
    return { verdict: 'pass', code: 'pass', player_msg: null,
             route: (req.exclusive ? 'human' : 'auto-run'),
             flag_w: 0, appealable: false, trace: trace };
  }

  /* reviewer-facing decision codes (mod console deny dropdown) */
  var REVIEWER_DENY_CODES = Object.keys(REASON_CODES).filter(function (k) {
    return REASON_CODES[k].tier === 'deny';
  });

  return { VERSION: VERSION, RULES: RULES, REASON_CODES: REASON_CODES,
           REVIEWER_DENY_CODES: REVIEWER_DENY_CODES,
           normalize: norm,
           screenRequest: screenRequest };
})();
