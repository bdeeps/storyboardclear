// Chapter 2: structure. A corkboard beat board: index cards pinned along a page timeline, act bands,
// and a tension curve. A playhead runs along the script.
// Frameworks and typical placements (rules of thumb, not laws):
//  - Three-act "paradigm": Syd Field, Screenplay: The Foundations of Screenwriting (1979). Act I about
//    the first quarter (pp. 1–30 of 120), plot point I near p. 25–27, Act II to about p. 90 with a
//    midpoint near p. 60 (Field added the midpoint in The Screenwriter's Workbook, 1984), plot point II
//    near p. 85–90, Act III to the end.
//  - Save the Cat beat sheet: Blake Snyder, Save the Cat! (2005), written for a 110-page script:
//    Opening Image 1, Theme Stated 5, Set-Up 1–10, Catalyst 12, Debate 12–25, Break into Two 25,
//    B Story 30, Fun and Games 30–55, Midpoint 55, Bad Guys Close In 55–75, All Is Lost 75,
//    Dark Night of the Soul 75–85, Break into Three 85, Finale 85–110, Final Image 110.
//  - Hero's Journey: Joseph Campbell, The Hero with a Thousand Faces (1949), as boiled down to 12 stages
//    by Christopher Vogler (Disney memo 1985, The Writer's Journey 1992). Placements are typical guesses.
//  - Indian mainstream films usually stop for an interval near the middle, and writers build a big turn,
//    the "interval point" or "interval bang", just before it. Running times of 140–170 minutes are common.
// Tension values (0–1) are our own sketch of a typical rising curve, to show the shape.
import { THREE, M, box, clamp, lerp } from '../kit.js';
import { board, text, wrap, SANS, tallStage, fitNarrow } from '../story.js';

export const FW = {
  three: {
    name: 'Three acts', who: 'Syd Field, 1979',
    acts: [[0, 0.25, 'ACT I · SET-UP', '#5ce1a9'], [0.25, 0.75, 'ACT II · CONFRONTATION', '#ffb547'], [0.75, 1, 'ACT III · RESOLUTION', '#ff7a59']],
    beats: [
      [0.01, 'Opening', 0.15, 'Meet the hero in their normal world.'],
      [0.1, 'Inciting incident', 0.35, 'Something upsets that world and starts the story.'],
      [0.22, 'Plot point I', 0.45, 'The hero commits. There is no going back.'],
      [0.5, 'Midpoint', 0.62, 'A big twist raises the stakes halfway through.'],
      [0.73, 'Plot point II', 0.5, 'The lowest moment, then a new plan.'],
      [0.88, 'Climax', 1, 'The final showdown. The highest tension in the film.'],
      [0.97, 'Resolution', 0.2, 'The new normal. Loose ends tied up.'],
    ],
  },
  cat: {
    name: 'Save the Cat', who: 'Blake Snyder, 2005',
    acts: [[0, 25 / 110, 'ACT ONE', '#5ce1a9'], [25 / 110, 85 / 110, 'ACT TWO', '#ffb547'], [85 / 110, 1, 'ACT THREE', '#ff7a59']],
    beats: [
      [1 / 110, 'Opening image', 0.12, 'A snapshot of the hero before the change.'],
      [5 / 110, 'Theme stated', 0.15, 'Someone hints at the lesson the hero must learn.'],
      [12 / 110, 'Catalyst', 0.35, 'The event that knocks the hero\'s life off course.'],
      [18 / 110, 'Debate', 0.3, 'Should I go? The hero hesitates.'],
      [25 / 110, 'Break into two', 0.45, 'The hero chooses to step into a new world.'],
      [30 / 110, 'B story', 0.42, 'A new friend or love story that carries the theme.'],
      [42 / 110, 'Fun and games', 0.5, 'The "promise of the premise": the scenes in the trailer.'],
      [55 / 110, 'Midpoint', 0.65, 'A false win or a false defeat. Stakes go up.'],
      [65 / 110, 'Bad guys close in', 0.7, 'Trouble from outside and inside.'],
      [75 / 110, 'All is lost', 0.45, 'The worst moment. Something or someone is lost.'],
      [80 / 110, 'Dark night', 0.35, 'The hero sits with the loss.'],
      [85 / 110, 'Break into three', 0.6, 'A new idea, from the B story.'],
      [97 / 110, 'Finale', 1, 'The hero uses what they learned and wins.'],
      [109 / 110, 'Final image', 0.18, 'The opposite of the opening image: proof of change.'],
    ],
  },
  hero: {
    name: 'Hero\'s Journey', who: 'Campbell 1949, Vogler 1992',
    acts: [[0, 0.25, 'DEPARTURE', '#5ce1a9'], [0.25, 0.75, 'INITIATION', '#ffb547'], [0.75, 1, 'RETURN', '#ff7a59']],
    beats: [
      [0.02, 'Ordinary world', 0.12, 'The hero\'s everyday life.'],
      [0.09, 'Call to adventure', 0.3, 'A problem or a quest appears.'],
      [0.14, 'Refusal', 0.26, 'Fear. The hero says no, at first.'],
      [0.19, 'Mentor', 0.3, 'A wise helper gives advice or a gift.'],
      [0.25, 'Threshold', 0.45, 'The hero crosses into the special world.'],
      [0.36, 'Tests, allies, enemies', 0.5, 'Learning the rules of the new world.'],
      [0.46, 'Approach', 0.58, 'Getting ready for the big danger.'],
      [0.55, 'Ordeal', 0.78, 'A life-or-death crisis.'],
      [0.64, 'Reward', 0.5, 'The hero seizes the prize.'],
      [0.74, 'Road back', 0.62, 'The chase home, with new danger.'],
      [0.88, 'Resurrection', 1, 'A final test where the hero is reborn.'],
      [0.97, 'Return with elixir', 0.2, 'Home, changed, with something to share.'],
    ],
  },
  india: {
    name: 'With an interval', who: 'Indian mainstream films',
    acts: [[0, 0.5, 'FIRST HALF', '#5ce1a9'], [0.5, 0.52, 'INTERVAL', '#ff5a6e'], [0.52, 1, 'SECOND HALF', '#ffb547']],
    beats: [
      [0.02, 'Hero intro', 0.3, 'Often a big entry scene, and maybe a song.'],
      [0.12, 'Inciting incident', 0.38, 'The problem arrives.'],
      [0.28, 'Rising stakes', 0.5, 'Songs, romance and conflict build the first half.'],
      [0.49, 'Interval point', 0.85, 'A huge twist or reveal just before the break, so people come back.'],
      [0.56, 'New game', 0.5, 'The second half restarts with new rules.'],
      [0.76, 'Crisis', 0.65, 'The villain seems to have won.'],
      [0.9, 'Climax', 1, 'The final fight or confrontation.'],
      [0.98, 'Resolution', 0.2, 'Order restored. Credits, often over a song.'],
    ],
  },
};
// Tension at fraction f: smooth (cosine) interpolation between beats, starting and ending low.
export function tension(fw, f) {
  const pts = [[0, 0.08], ...FW[fw].beats.map((b) => [b[0], b[2]]), [1, 0.1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, va] = pts[i], [b, vb] = pts[i + 1];
    if (f <= b) { const k = b > a ? (f - a) / (b - a) : 0; return lerp(va, vb, (1 - Math.cos(Math.PI * k)) / 2); }
  }
  return 0.1;
}

const BW = 11.2, BH = 5.2, X0 = -BW / 2 + 0.5, X1 = BW / 2 - 0.5;   // board size and timeline ends (world)
const CY0 = -BH / 2 + 0.75, CH = 1.5;                               // tension graph base and height (world)
const X = (f) => lerp(X0, X1, f);

export default {
  id: 'structure',
  short: 'Structure',
  title: 'Story structure: the beat board',
  subtitle: 'Where the big turns go, and how the tension climbs across a script.',
  view: { pos: [0.3, 4.4, 11.6], target: [0.3, 4.4, 0] },
  learn: `<p>Before writing scenes, many writers plan the <b>beats</b>: the big turning points of the story. They write each on an index card and pin the cards to a board, in order, so they can see the whole film at once and move things around.</p>
    <p>The most common shape is <b>three acts</b>. <b>Act I</b> sets up the hero and their world, until an <b>inciting incident</b> knocks it over. <b>Act II</b>, the longest, is the struggle, with a <b>midpoint</b> twist in the middle. <b>Act III</b> brings the <b>climax</b> and the <b>resolution</b>. Syd Field drew this "paradigm" in 1979 for a 120-page script: roughly pages 1–30, 30–90 and 90–120.</p>
    <p>Other maps say the same thing in more detail. Joseph Campbell's <b>Hero's Journey</b> (1949) found one pattern in myths from all over the world. Blake Snyder's <b>Save the Cat</b> (2005) gives 15 beats with page numbers. Indian films add something special: the <b>interval</b>. Writers place a huge twist just before it, the "interval bang", so the audience comes back from their samosas desperate to know what happens.</p>
    <p>None of these are rules. They are tools for checking that the <b>tension</b> keeps rising, and that nothing sags for 20 pages.</p>
    <p class="tip"><b>Try it:</b> drag the playhead through the script and watch the tension curve. Switch frameworks and see how the same shape keeps appearing. Try the interval and make the film longer.</p>`,
  terms: [
    { t: 'Beat', d: 'An important moment where the story turns. Also a tiny pause in a line of dialogue.' },
    { t: 'Inciting incident', d: 'The event that upsets the hero\'s normal life and starts the story.' },
    { t: 'Midpoint', d: 'A twist near the middle that raises the stakes.' },
    { t: 'Climax', d: 'The moment of highest tension, where the main conflict is settled.' },
    { t: 'Interval point', d: 'The big turn placed just before the interval of an Indian film.' },
    { t: 'Beat sheet', d: 'A list of a story\'s beats with the page each one should land on.' },
  ],
  defaults: { fw: 'three', len: 120, at: 0.5, play: false },
  onChange(s, key) { if (key === 'fw' && s.fw === 'india' && s.len < 140) s.len = 150; },
  controls: [
    { key: 'fw', type: 'seg', label: 'Story map', options: Object.entries(FW).map(([v, f]) => ({ v, label: f.name })), fmt: (v) => FW[v].who },
    { key: 'at', type: 'range', label: 'Playhead', min: 0, max: 1, step: 0.001, ends: ['page 1', 'last page'], fmt: (v, s) => `page ${Math.max(1, Math.round(v * s.len))}` },
    { key: 'len', type: 'range', label: 'Script length', min: 80, max: 180, step: 1, ends: ['80 pages', '180 pages'], fmt: (v) => `${Math.round(v)} pages ≈ ${Math.round(v)} min` },
    { key: 'play', type: 'toggle', label: 'Play through the script' },
  ],
  quiz: [
    { q: 'In a 120-page three-act script, roughly where does Act II end?', options: ['Page 10', 'Page 60', 'Page 90', 'Page 120'], answer: 2, why: 'Syd Field\'s paradigm puts Act I at about pages 1–30, Act II at 30–90 and Act III at 90–120. Act II is the longest.' },
    { q: 'What is the "inciting incident"?', options: ['The final fight', 'The event that upsets the hero\'s normal world and starts the story', 'The title sequence', 'The interval'], answer: 1, why: 'The inciting incident knocks the hero\'s life off balance, so the rest of the story is about putting it right.' },
    { q: 'Why do Indian writers put a big twist just before the interval?', options: ['The projector needs a rest', 'So the audience returns eager to see what happens next', 'Censors require it', 'To make the film shorter'], answer: 1, why: 'The interval point, or "interval bang", is a cliffhanger: it keeps people hooked through the break.' },
  ],
  reel: [
    { ms: 5600, caption: 'Most films follow three acts, with the tension climbing to a climax.', set: { fw: 'three', len: 120, play: false }, anim: { at: [0.02, 0.9] }, spin: 0 },
    { ms: 5000, caption: 'Indian films add an interval, with a huge twist right before it.', set: { fw: 'india', len: 150, play: false }, anim: { at: [0.3, 0.5] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = BH / 2 + 0.1; stage.root.add(root);
    const frame = box(BW + 0.3, BH + 0.3, 0.12, M.matte(0x5a3b24)); frame.position.z = -0.08; root.add(frame);
    let fw = '', len = 0;
    // The cork: act bands, page ticks, and the tension curve drawn on canvas.
    const cork = board(root, BW, BH, 2240, 1040, (g, w, h) => {
      if (!FW[fw]) return;
      const F = FW[fw], k = w / BW, px = (x) => (x + BW / 2) * k, py = (y) => (BH / 2 - y) * k;
      g.fillStyle = '#b9895a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${60 + (i * 37) % 50},${35 + (i * 13) % 30},20,.18)`; g.fillRect((i * 811) % w, (i * 467) % h, 3, 3); }
      // Act bands along the bottom strip.
      for (const [a, b, name, col] of F.acts) {
        g.fillStyle = col + '40'; g.fillRect(px(X(a)), py(CY0 + CH + 0.25), px(X(b)) - px(X(a)), py(-BH / 2 + 0.28) - py(CY0 + CH + 0.25));
        g.fillStyle = col; g.fillRect(px(X(a)), py(-BH / 2 + 0.42), px(X(b)) - px(X(a)) - 3, 16);
        if (b - a > 0.05) text(g, name, (px(X(a)) + px(X(b))) / 2, py(-BH / 2 + 0.42) + 44, { font: `700 30px ${SANS}`, col: '#2a1a0c', align: 'center' });
        else text(g, name, px(X(a)), py(CY0 + CH + 0.3), { font: `700 30px ${SANS}`, col: '#ff5a6e', align: 'center' });
      }
      // Page ticks.
      g.fillStyle = '#2a1a0c'; g.font = `24px ${SANS}`; g.textAlign = 'center';
      const step = len > 140 ? 20 : 10;
      for (let p = 0; p <= len; p += step) { const x = px(X(p / len)); g.fillRect(x - 1, py(CY0) - 2, 2, 14); g.fillText(p || 1, x, py(CY0) + 36); }
      g.textAlign = 'left';
      // Axis and the tension curve.
      g.strokeStyle = 'rgba(42,26,12,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(px(X0), py(CY0)); g.lineTo(px(X1), py(CY0)); g.stroke();
      text(g, 'TENSION', px(X0) + 4, py(CY0 + CH) - 14, { font: `700 24px ${SANS}`, col: 'rgba(42,26,12,.75)' });
      g.beginPath();
      for (let i = 0; i <= 300; i++) { const f = i / 300, x = px(X(f)), y = py(CY0 + tension(fw, f) * CH); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.lineTo(px(X1), py(CY0)); g.lineTo(px(X0), py(CY0)); g.closePath(); g.fillStyle = 'rgba(224,69,58,.18)'; g.fill();
      g.beginPath();
      for (let i = 0; i <= 300; i++) { const f = i / 300, x = px(X(f)), y = py(CY0 + tension(fw, f) * CH); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.strokeStyle = '#c0392b'; g.lineWidth = 6; g.stroke();
      text(g, `${F.name.toUpperCase()} · ${F.who}`, 30, 46, { font: `700 32px ${SANS}`, col: '#2a1a0c' });
    }, [0, 0, 0], { opaque: true });
    cork.mesh.receiveShadow = true;

    // Index cards: made once per framework.
    const cardsG = new THREE.Group(); root.add(cardsG);
    let cards = [];
    const makeCards = () => {
      cardsG.children.slice().forEach((c) => { cardsG.remove(c); c.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); });
      const F = FW[fw], cw = F.beats.length > 9 ? 1.02 : 1.3, chh = 0.72;
      const rows = [], top = BH / 2 - 0.95;
      cards = F.beats.map(([f, name, , what], i) => {
        const bx = X(f);
        let row = 0; while (rows[row] !== undefined && bx - rows[row] < cw + 0.05) row++;
        const x = clamp(Math.max(bx, (rows[row] ?? -99) + cw + 0.05), -BW / 2 + cw / 2 + 0.1, BW / 2 - cw / 2 - 0.1);
        rows[row] = x;
        const y = top - row * (chh + 0.12);
        const g = new THREE.Group(); g.position.set(x, y, 0.03); cardsG.add(g);
        const red = name === 'Interval point';
        const c = board(g, cw, chh, 360, 250, (x2, w, h, on = false) => {
          x2.fillStyle = red ? '#ffe3e0' : '#fdfbf3'; x2.fillRect(0, 0, w, h);
          x2.fillStyle = on ? '#e0453a' : '#7fb3d9'; x2.fillRect(0, 36, w, 3);
          text(x2, `p. ${Math.max(1, Math.round(f * len))}`, 14, 30, { font: `600 28px ${SANS}`, col: '#8a6a4a' });
          wrap(x2, name, 14, 90, w - 28, 44, { font: `700 ${cw < 1.1 ? 40 : 44}px ${SANS}`, col: on ? '#c0392b' : '#1e2430' });
        }, [0, 0, 0], { opaque: true });
        c.mesh.castShadow = true;
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), M.plastic(red ? 0xe0453a : [0xe0453a, 0x3f7ad9, 0x2fb37a, 0xf2a93b][i % 4])); pin.position.set(0, chh / 2 - 0.08, 0.04); g.add(pin);
        // A thread from the card down to its exact page on the tension curve.
        const yCurve = CY0 + tension(fw, f) * CH;
        const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 5), M.matte(0x444444));
        const x0 = x, y0 = y - chh / 2, x1 = bx, y1 = yCurve;
        thread.position.set((x0 - x) / 2 + (x1 - x) / 2, (y0 + y1) / 2 - y, -0.01); thread.scale.y = Math.hypot(x1 - x0, y1 - y0);
        thread.rotation.z = Math.atan2(-(x1 - x0), y1 - y0) + Math.PI; g.add(thread);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.glow(0x2a1a0c)); dot.position.set(bx - x, yCurve - y, 0.0); g.add(dot);
        return { g, c, f, name, what, on: false };
      });
    };
    // The playhead: a red string across the board, and a bead riding the curve.
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, BH - 0.2, 8), M.glow(0xe0453a)); head.position.z = 0.09; root.add(head);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 12), M.glow(0xffd166)); bead.position.z = 0.1; root.add(bead);
    const lbl = stage.label('', [0, 0, 0.2], bead, 'hot');
    lbl.center.set(0.5, 1.6);

    let cur = null, last = '';
    const beatAt = (s) => { const F = FW[s.fw]; let b = null; for (const x of F.beats) if (x[0] <= s.at + 0.004) b = x; return b; };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        if (s.play) { s.at += dt / 30; if (s.at > 1) s.at = 0; }
        s.at = clamp(s.at, 0, 1);
        if (s.fw !== fw || Math.round(s.len) !== len) { fw = s.fw; len = Math.round(s.len); cork.redraw(); makeCards(); cur = null; }
        const x = X(s.at);
        head.position.x = x; bead.position.set(x, CY0 + tension(fw, s.at) * CH, 0.12);
        const b = beatAt(s);
        const name = b ? b[1] : 'Page 1';
        if (cur !== name) {
          cur = name;
          cards.forEach((c) => { const on = c.name === name; if (on !== c.on) { c.on = on; c.c.redraw(on); } });
          lbl.element.textContent = name;
        }
        cards.forEach((c) => { c.g.position.z = lerp(c.g.position.z, c.on ? 0.3 : 0.03, 1 - Math.exp(-10 * dt)); c.g.scale.setScalar(lerp(c.g.scale.x, c.on ? 1.12 : 1, 1 - Math.exp(-10 * dt))); });
        fitNarrow(stage, [], -0.2);
        const lay = tallStage(stage) ? 'tall' : 'wide';
        if (lay !== last) { last = lay; if (lay === 'tall') stage.setView([0.3, 2.75, 10.7], [0.3, 2.75, 0], 0.6); }
      },
      readout(s) {
        const F = FW[s.fw], b = beatAt(s), page = Math.max(1, Math.round(s.at * s.len));
        const act = F.acts.find(([a, e]) => s.at >= a && s.at <= e) || F.acts[0];
        return `<div class="big">Page ${page} · ${act[2].toLowerCase().replace(/^./, (c) => c.toUpperCase())}</div>
          <div class="row"><span>Latest beat</span><b>${b ? b[1] : 'none yet'}</b></div>
          <div class="row"><span>Tension</span><b>${Math.round(tension(s.fw, s.at) * 100)}%</b></div>
          <div class="row"><span>Screen time</span><b>≈ ${page} of ${Math.round(s.len)} min</b></div>
          ${b ? `<div class="row" style="max-width:300px"><span>${b[3]}</span></div>` : ''}`;
      },
    };
  },
};
