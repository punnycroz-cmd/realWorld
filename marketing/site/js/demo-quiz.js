// Real World — demo page "Would it air?" screening quiz (demo.html only).
// Six requests, three verdicts each — every outcome maps to a real reason
// code in the world/moderation.json taxonomy. Local-only: nothing is filed,
// nothing is scored server-side. See marketing/DEMO-PAGE.md §4a-vii.
(function () {
  "use strict";

  var root = document.getElementById("screen-quiz");
  if (!root) return;

  // answer: "run" | "review" | "deny" — code is the real reason code (or
  // null for a clean compatible run).
  var ROUNDS = [
    { text: "Possess my courier for 30 minutes — take the long way past the park.",
      answer: "run", code: null,
      why: "Clean compatible request — runs alongside everyone else's, no shared resource locked. Control hands back to the resident's AI when time ends." },
    { text: "Book the back room at The 600 Club for a poetry night.",
      answer: "review", code: "exclusive",
      why: "Every exclusive request is human-reviewed before it fires — a venue slot locks a shared resource. No review time is ever promised." },
    { text: "Nudge the two baristas at Mudhaus into finally going on a date.",
      answer: "review", code: "surface-relationship",
      why: "Requests touching a main resident's job, marriage, or friendships always get human eyes first — the feed shows the outcome, never the screened text." },
    { text: "Have Jules tell the camera what she's hiding.",
      answer: "deny", code: "secret-extraction",
      why: "Denied and refunded in full. Nobody can ask a resident to reveal a secret — secrets are absent from every player-facing schema, not just filtered." },
    { text: "Stage a fight outside the café — rough up the landlord's kid for the drama.",
      answer: "deny", code: "harm-targeting",
      why: "Denied and refunded in full. Requests that target a resident — harm, humiliation, staged fights — are rejected outright." },
    { text: "Raise the rent on the Guerrero flat until the tenant leaves.",
      answer: "deny", code: "admin-domain",
      why: "Denied and refunded in full. Rent, leases, and evictions are admin-only powers — no request can touch another resident's tenancy." },
    { text: "Close Dolores Park for an hour — private shoot, keep everyone out.",
      answer: "review", code: "venue-lock",
      why: "In review. Locking a story-adjacent public space goes to a human reviewer before it can fire." }
  ];

  var PICKS = [
    ["run", "Runs", "tag-run"],
    ["review", "In review", "tag-queue"],
    ["deny", "Not approved", "tag-refund"]
  ];

  var round = 0, score = 0, answered = false;

  function track(pick, correct) {
    if (window.rw && window.rw.track) {
      window.rw.track("screening_quiz", {
        round: round + 1, pick: pick, verdict: ROUNDS[round].answer,
        code: ROUNDS[round].code || "clean", correct: correct
      });
    }
  }

  function verdictTag(answer) {
    return answer === "run" ? ["request · approved", "tag-run"]
      : answer === "review" ? ["request · in_review", "tag-queue"]
      : ["request · not approved", "tag-refund"];
  }

  function render() {
    answered = false;
    var r = ROUNDS[round];
    var html =
      '<p class="quiz-step">' + (round + 1) + " / " + ROUNDS.length + "</p>" +
      '<blockquote class="quiz-ask">&ldquo;' + r.text + '&rdquo;</blockquote>' +
      '<div class="quiz-picks" role="group" aria-label="Your call">';
    for (var i = 0; i < PICKS.length; i++) {
      html += '<button type="button" class="quiz-pick ' + PICKS[i][2] +
        '" data-pick="' + PICKS[i][0] + '">' + PICKS[i][1] + "</button>";
    }
    html += '</div><div class="quiz-verdict" id="quiz-verdict" aria-live="polite"></div>';
    root.innerHTML = html;

    var picks = root.querySelectorAll(".quiz-pick");
    for (var j = 0; j < picks.length; j++) {
      picks[j].addEventListener("click", onPick);
    }
  }

  function onPick(e) {
    if (answered) return;
    answered = true;
    var pick = e.currentTarget.getAttribute("data-pick");
    var r = ROUNDS[round];
    var correct = pick === r.answer;
    if (correct) score++;
    track(pick, correct);

    var picks = root.querySelectorAll(".quiz-pick");
    for (var i = 0; i < picks.length; i++) {
      var p = picks[i].getAttribute("data-pick");
      picks[i].disabled = true;
      if (p === r.answer) picks[i].classList.add("is-right");
      else if (p === pick) picks[i].classList.add("is-wrong");
    }

    var v = verdictTag(r.answer);
    var out = document.getElementById("quiz-verdict");
    var last = round === ROUNDS.length - 1;
    out.innerHTML =
      '<p class="quiz-call">' + (correct ? "Right call." : "Not quite —") +
      ' <span class="feed-tag ' + v[1] + '">' + v[0] + "</span>" +
      (r.code ? ' <code>' + r.code + "</code>" : "") + "</p>" +
      "<p>" + r.why + "</p>" +
      '<button type="button" class="btn btn-ghost btn-sm" id="quiz-next">' +
      (last ? "See the score" : "Next request") + "</button>";
    out.querySelector("#quiz-next").addEventListener("click",
      last ? finish : function () { round++; render(); });
    out.querySelector("#quiz-next").focus();
  }

  function finish() {
    root.innerHTML =
      '<p class="quiz-step">Score</p>' +
      '<p class="quiz-score">' + score + " / " + ROUNDS.length + "</p>" +
      "<p>" + (score === ROUNDS.length
        ? "Flawless eye — you'd survive the screening desk."
        : score >= 4
        ? "Solid read on where the lines sit."
        : "The lines are subtler than they look — which is exactly why they're public.") +
      " The real screen reads intent, not keywords; gray zones go to a human; " +
      "denies always refund, and every outcome posts to the public feed " +
      "with the requester's name on it.</p>" +
      '<button type="button" class="btn btn-ghost btn-sm" id="quiz-again" ' +
      'data-rw-event="cta_click" data-rw-props=\'{"cta":"demo-quiz"}\'>Run it again</button>';
    root.querySelector("#quiz-again").addEventListener("click", function () {
      round = 0; score = 0; render();
    });
    if (window.rw && window.rw.track) {
      window.rw.track("screening_quiz", { round: "final", score: score,
        verdict: "complete", code: "—", correct: null });
    }
  }

  render();
})();
