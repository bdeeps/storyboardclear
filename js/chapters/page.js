// Chapter 1: the screenplay page. An original one-scene script typed in standard screenplay format on a
// US Letter page (8.5 × 11 in), with each element's margin, a script stack whose thickness follows the
// page count, and the "one page ≈ one minute" rule.
// Format numbers (widely used industry defaults, e.g. Final Draft's templates, Christopher Riley's
// "The Hollywood Standard", StudioBinder's formatting guide): 12-point Courier, 10 characters and 6 lines
// to the inch; 1 in top and bottom margins; scene headings and action from 1.5 in to 7.5 in; dialogue
// from 2.5 in, about 3.5 in wide; parentheticals from 3.1 in; character names at 3.7 in; transitions
// flush right at 7.5 in; the page number top right, 0.5 in from the top.
// Paper: 20 lb US Letter paper is about 0.1 mm thick. Scripts are three-hole punched and held by two brads.
import { THREE, M, box, clamp } from '../kit.js';
import { board, rrect, text, MONO, SANS, COL, PAGE_LINES, fitNarrow, tallStage, narrowStage, inReel } from '../story.js';

// The scene. Our own story: Meera, 11, and her grandfather on a Mumbai rooftop at Makar Sankranti.
export const SCRIPT = [
  { t: 'heading', s: 'EXT. CHAWL ROOFTOP, DADAR, MUMBAI - DAY' },
  { t: 'action', s: 'Makar Sankranti. The sky is crowded with kites. Washing lines sag between black water tanks.' },
  { t: 'action', s: 'MEERA (11) stands alone at the parapet, holding a torn red kite. Its spine has snapped in two.' },
  { t: 'character', s: 'MEERA' },
  { t: 'dialogue', s: 'It was winning. It was actually winning.' },
  { t: 'action', s: 'The stair door BANGS open. NANA (70) climbs out, a roll of tape in one hand.' },
  { t: 'character', s: 'NANA' },
  { t: 'paren', s: '(out of breath)' },
  { t: 'dialogue', s: 'Kites don\'t win, beta. The wind wins. Kites just listen.' },
  { t: 'action', s: 'He kneels and splints the spine with a matchstick.' },
  { t: 'character', s: 'MEERA' },
  { t: 'dialogue', s: 'Will it fly?' },
  { t: 'action', s: 'Nana lifts the kite over his head. The wind snatches it up, up, into the crowded sky.' },
  { t: 'transition', s: 'CUT TO:' },
];
// Left edge (inches from the paper's left side) and width in characters for each element.
export const ELEMENTS = {
  heading: { tag: 'HEADING', name: 'Scene heading', left: 1.5, chars: 60, col: '#0a84c6', rule: 'Also called a slugline. INT. or EXT., the place, then DAY or NIGHT, in capitals. Starts 1.5 in from the left.' },
  action: { tag: 'ACTION', name: 'Action', left: 1.5, chars: 60, col: '#2f7d4f', rule: 'What we see and hear, in the present tense. A character\'s first appearance is in CAPITALS. Full width, from 1.5 in.' },
  character: { tag: 'NAME', name: 'Character name', left: 3.7, chars: 30, col: '#b06a00', rule: 'Who speaks, in capitals, about 3.7 in from the left edge.' },
  paren: { tag: 'PAREN.', name: 'Parenthetical', left: 3.1, chars: 25, col: '#9a4fc9', rule: 'A short hint on how a line is said, in brackets, from 3.1 in. Use it rarely.' },
  dialogue: { tag: 'DIALOGUE', name: 'Dialogue', left: 2.5, chars: 35, col: '#c2334a', rule: 'The words spoken, in a narrow column from 2.5 in, about 3.5 in wide.' },
  transition: { tag: 'TRANSITION', name: 'Transition', left: 6.0, chars: 15, col: '#5b5f6b', rule: 'How we move to the next scene, such as CUT TO:, flush right at 7.5 in. Many writers now leave these out.' },
};
// Lay the script out as typed lines: [{ text, x (in), el, idx }].
export function layout() {
  const lines = [];
  SCRIPT.forEach((e, i) => {
    const E = ELEMENTS[e.t];
    const tight = e.t === 'dialogue' || e.t === 'paren';
    if (lines.length && !tight) lines.push(null);
    const words = e.s.split(' '); let cur = '';
    let first = true;
    const push = (s) => { lines.push({ text: s, x: e.t === 'transition' ? 7.5 - s.length / 10 : E.left, el: e.t, idx: i, first }); first = false; };
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (t.length > E.chars && cur) { push(cur); cur = w; } else cur = t; }
    if (cur) push(cur);
  });
  return lines;
}
const LINES = layout();
export const SCENE_PAGES = LINES.length / PAGE_LINES;

const PX = 120;                // canvas pixels per inch: 12-pt Courier at 20 px, 12 px per character
const W_IN = 8.5, H_IN = 11, U = 0.3;   // world units per inch
const PACE = { talky: 0.85, avg: 1, action: 1.2 };   // rough minutes per page (see learn text)

export default {
  id: 'page',
  short: 'The script page',
  title: 'The screenplay page',
  subtitle: 'Why every script looks the same, and how one page becomes about one minute.',
  view: { pos: [0.45, 2.5, 4.5], target: [0.3, 2.42, 0] },
  learn: `<p>Before a single frame is shot, a film is a <b>screenplay</b>: a script typed in a strict, old-fashioned layout. Every page uses <b>12-point Courier</b>, a typewriter font where every letter is the same width, and fixed margins for each part.</p>
    <p>Each scene starts with a <b>scene heading</b>: inside or outside (<b>INT.</b> or <b>EXT.</b>), the place, and the time of day. Then <b>action</b> says what we see. A <b>character name</b> in capitals sits above that person's <b>dialogue</b>, which runs in a narrow column. A <b>parenthetical</b> gives a hint on how to say a line, and a <b>transition</b> such as CUT TO: moves us on.</p>
    <p>Why so strict? Because the layout makes a neat rule of thumb: <b>one page ≈ one minute</b> of screen time. A 110-page script makes a film of about two hours. Producers use it to budget, and assistant directors split every page into <b>eighths</b> to plan how much to shoot each day. It is only a rough guide: a page of fast chatter plays quicker, and a page that says "the battle begins" can take ten minutes.</p>
    <p>The scene on this page is ours, and every other chapter films it: Meera, 11, her broken kite, and her grandfather on a Mumbai rooftop.</p>
    <p class="tip"><b>Try it:</b> pick each element to see its margin and rule. Then drag the page count and watch the script stack grow and the running time change.</p>`,
  terms: [
    { t: 'Screenplay', d: 'The script of a film, written in a standard layout so that one page runs about one minute.' },
    { t: 'Scene heading', d: 'The line that starts a scene: INT. or EXT., the location, and DAY or NIGHT. Also called a slugline.' },
    { t: 'Action', d: 'The description of what we see and hear, written in the present tense.' },
    { t: 'Parenthetical', d: 'A short note in brackets under a character name, saying how a line is spoken.' },
    { t: 'Transition', d: 'An instruction for moving between scenes, like CUT TO: or DISSOLVE TO:.' },
    { t: 'Spec script', d: 'A screenplay written before anyone has paid for it, hoping to sell it. It has no scene numbers or camera directions.' },
  ],
  defaults: { el: 'all', ruler: true, pages: 110, pace: 'avg' },
  controls: [
    { key: 'el', type: 'seg', label: 'Show me', options: [{ v: 'all', label: 'All' }, { v: 'heading', label: 'Heading' }, { v: 'action', label: 'Action' }, { v: 'character', label: 'Name' }, { v: 'paren', label: 'Paren.' }, { v: 'dialogue', label: 'Dialogue' }, { v: 'transition', label: 'Transition' }], fmt: (v) => (v === 'all' ? 'every element' : ELEMENTS[v].name) },
    { key: 'ruler', type: 'toggle', label: 'Show the margins in inches' },
    { key: 'pages', type: 'range', label: 'Pages in the script', min: 1, max: 180, step: 1, ends: ['1 page', '180 pages'], fmt: (v) => Math.round(v) + (v === 1 ? ' page' : ' pages') },
    { key: 'pace', type: 'seg', label: 'What kind of pages?', options: [{ v: 'talky', label: 'Fast talk' }, { v: 'avg', label: 'Typical' }, { v: 'action', label: 'Big action' }], fmt: (v) => `≈ ${PACE[v]} min a page (rough)` },
  ],
  quiz: [
    { q: 'What does "EXT. ROOFTOP - DAY" tell the crew?', options: ['The scene is outdoors, on a rooftop, in daytime', 'The scene is an extra scene', 'The actor must exit the rooftop', 'The scene is filmed from outside the building'], answer: 0, why: 'A scene heading gives three things: INT. or EXT. (inside or outside), the place, and the time of day.' },
    { q: 'Roughly how long a film does a 100-page screenplay make?', options: ['About 10 minutes', 'About 100 minutes', 'About 5 hours', 'There is no way to tell'], answer: 1, why: 'The standard layout makes one page about one minute of screen time, so 100 pages is roughly 100 minutes.' },
    { q: 'Why are scripts typed in Courier, where every letter is the same width?', options: ['It is the only font printers have', 'It keeps the amount of text on every page the same, so page counts stay a reliable guide to time', 'It looks old and stylish', 'It is easier to translate'], answer: 1, why: 'With a fixed-width font and fixed margins, a page always holds about the same amount of story, so pages can be used to estimate running time and plan the shoot.' },
  ],
  reel: [
    { ms: 5200, caption: 'Every film starts as a screenplay, typed in the same strict layout.', set: { el: 'all', ruler: false, pages: 110 }, anim: { pages: [110, 111] }, spin: 0 },
    { ms: 5400, caption: 'The layout makes a handy rule: one page is about one minute on screen.', set: { el: 'dialogue', ruler: true, pace: 'avg' }, anim: { pages: [10, 150] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // A desk.
    const wood = M.matte(0x6b4a33);
    const desk = box(5.2, 0.08, 2.4, wood); desk.position.set(0.3, 0.76, -0.2); root.add(desk);
    for (const [x, z] of [[-2.2, -1.25], [2.8, -1.25], [-2.2, 0.85], [2.8, 0.85]]) { const l = box(0.08, 0.76, 0.08, wood); l.position.set(x, 0.38, z); root.add(l); }
    // The page, leaning back on a stand.
    const pw = W_IN * U, ph = H_IN * U;
    const pg = new THREE.Group(); pg.position.set(0.8, 0.8 + ph / 2 * Math.cos(0.18), -0.4); pg.rotation.x = -0.18; root.add(pg);
    const stand = box(pw * 0.8, 0.05, 0.3, M.matte(0x2a2d34)); stand.position.set(0.8, 0.82, -0.3); root.add(stand);
    let hl = 'all', rul = true;
    const page = board(pg, pw, ph, W_IN * PX, H_IN * PX, (g, w, h) => {
      g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h);
      if (rul) {
        g.strokeStyle = 'rgba(56,150,220,.5)'; g.setLineDash([10, 8]); g.lineWidth = 2;
        for (const x of [1.5, 2.5, 3.1, 3.7, 6.0, 7.5]) { g.beginPath(); g.moveTo(x * PX, 0.8 * PX); g.lineTo(x * PX, 10.2 * PX); g.stroke(); }
        g.setLineDash([]);
        g.fillStyle = 'rgba(56,150,220,.9)'; g.font = `600 22px ${SANS}`; g.textAlign = 'center';
        for (const x of [1.5, 2.5, 3.1, 3.7, 6.0, 7.5]) g.fillText(x + '"', x * PX, 0.7 * PX);
        for (let i = 0; i <= 8; i++) { g.fillRect(i * PX - 1, h - 40, 2, i % 1 ? 10 : 22); if (i) g.fillText(i + '"', i * PX, h - 48); }
        g.textAlign = 'left';
      }
      g.font = `20px ${MONO}`; g.fillStyle = '#111';
      g.fillText('1.', 7.25 * PX, 0.5 * PX + 14);
      let y = 1 * PX + 16;
      for (const L of LINES) {
        if (L) {
          const on = hl === 'all' || hl === L.el, E = ELEMENTS[L.el];
          if (hl !== 'all' && on) { g.fillStyle = E.col + '26'; g.fillRect(L.x * PX - 6, y - 17, L.text.length * 12 + 12, 22); }
          g.fillStyle = on ? (hl === 'all' ? '#141414' : E.col) : 'rgba(20,20,20,.22)';
          g.fillText(L.text, L.x * PX, y);
          // A small tag in the left margin on the first line of each element.
          if (L.first) { g.font = `700 15px ${SANS}`; g.fillStyle = on ? E.col : 'rgba(20,20,20,.25)'; g.fillText(E.tag, 0.18 * PX, y - 2); g.font = `20px ${MONO}`; }
        }
        y += PX / 6;
      }
      // Where the page would end: 54 lines.
      g.fillStyle = 'rgba(0,0,0,.35)'; g.font = `italic 18px ${SANS}`;
      g.fillText(`${LINES.length} of ${PAGE_LINES} lines used: this scene is about ${Math.round(SCENE_PAGES * 8)}/8 of a page`, 1.5 * PX, y + 30);
    }, [0, 0, 0], { opaque: true });
    page.mesh.castShadow = true;
    // The whole script as a stack of paper with two brass brads.
    const stackG = new THREE.Group(); stackG.position.set(-1.35, 0.8, 0.6); stackG.rotation.y = 0.4; root.add(stackG);
    const paperM = M.matte(0xf4f1e8), coverM = M.matte(0xc9a86a);
    const stack = box(pw * 0.42, 1, ph * 0.42, paperM); stackG.add(stack);
    const cover = box(pw * 0.42, 0.004, ph * 0.42, coverM); stackG.add(cover);
    const brads = [-0.22, 0.22].map((z) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.01, 16), M.metal(0xd9b45a)); b.position.set(-pw * 0.17, 0, z * ph * 0.42 * 0.8); stackG.add(b); return b; });
    const stackLbl = stage.label('', [0, 0.3, 0], stackG);
    // A runtime board: the clock the pages turn into.
    const clock = board(root, 1.9, 1.05, 520, 288, (g, w, h, pages = 110, pace = 1) => {
      g.clearRect(0, 0, w, h); rrect(g, 3, 3, w - 6, h - 6, 16); g.fillStyle = 'rgba(10,12,18,.93)'; g.fill();
      const mins = pages * pace;
      text(g, 'SCREEN TIME', 22, 40, { font: `600 22px ${SANS}`, col: COL.c });
      const hh = Math.floor(mins / 60), mm = Math.round(mins % 60);
      text(g, hh ? `${hh} h ${String(mm).padStart(2, '0')} min` : `${Math.round(mins)} min`, 22, 108, { font: `600 58px ${SANS}`, col: '#fff' });
      text(g, `${Math.round(pages)} pages × ${pace} min`, 22, 146, { font: `22px ${SANS}`, col: COL.soft });
      // Scale bar 0..180 min with common lengths.
      const x0 = 22, x1 = w - 22, yb = 214, X = (m) => x0 + (x1 - x0) * clamp(m / 180, 0, 1);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x0, yb, x1 - x0, 14);
      g.fillStyle = COL.c; g.fillRect(x0, yb, X(mins) - x0, 14);
      for (const [m, s] of [[30, 'TV half hour'], [100, 'feature'], [150, 'Indian epic']]) { g.fillStyle = COL.hot; g.fillRect(X(m) - 1, yb - 8, 2, 30); text(g, s, X(m), yb + 48, { font: `18px ${SANS}`, col: COL.hot, align: 'center' }); }
    }, [-1.5, 1.75, -0.4]);
    clock.mesh.rotation.y = 0.25; clock.mesh.scale.setScalar(0.85);

    let key = '', last = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const k = `${s.el}|${s.ruler}`;
        if (k !== key) { key = k; hl = s.el; rul = s.ruler; page.redraw(); }
        const pages = clamp(s.pages, 1, 180);
        const thick = pages * 0.0001 / 0.0254 * U;         // 0.1 mm a sheet, in world units
        const shown = Math.max(0.004, thick * 2);           // drawn 2× thicker so it is visible
        stack.scale.y = shown; stack.position.y = shown / 2; cover.position.y = shown + 0.002;
        brads.forEach((b) => { b.position.y = shown + 0.008; });
        stackLbl.position.y = shown + 0.25;
        stackLbl.element.textContent = `${Math.round(pages)} pages · ${(pages * 0.1).toFixed(1)} mm thick`;
        const ck = `${Math.round(pages)}|${s.pace}`;
        if (clock.key !== ck) { clock.key = ck; clock.redraw(pages, PACE[s.pace]); }
        fitNarrow(stage, [stackLbl], -0.15);
        clock.mesh.visible = !(narrowStage(stage) && !inReel());   // on a phone the readout already shows the time
        const lay = tallStage(stage) ? 'tall' : 'wide';
        if (lay !== last) {
          last = lay;
          if (lay === 'tall') { pg.position.x = 0; clock.mesh.position.set(0, 5.05, -0.2); clock.mesh.rotation.y = 0; clock.mesh.scale.setScalar(1.35); stackG.position.set(1.1, 0.8, 0.9); stage.setView([0.1, 3.4, 3.5], [0.1, 3.3, 0], 0.6); }
          else { pg.position.x = 0.8; clock.mesh.position.set(-1.5, 1.75, -0.4); clock.mesh.rotation.y = 0.25; clock.mesh.scale.setScalar(0.85); stackG.position.set(-1.35, 0.8, 0.6); }
        }
      },
      readout(s) {
        const mins = s.pages * PACE[s.pace];
        const E = ELEMENTS[s.el];
        const kind = s.pages < 40 ? 'a short film' : s.pages < 75 ? 'an hour of TV or a short feature' : s.pages <= 130 ? 'a typical feature film' : 'a very long film';
        return `<div class="big">${Math.round(s.pages)} pages ≈ ${Math.round(mins)} min</div>
          <div class="row"><span>That is</span><b>${kind}</b></div>
          <div class="row"><span>This scene</span><b>${Math.round(SCENE_PAGES * 8)}/8 page ≈ ${Math.round(SCENE_PAGES * 60 * PACE[s.pace])} s</b></div>
          ${E ? `<div class="row"><span>${E.name}</span><b>${E.left}" from the left</b></div>` : '<div class="row"><span>Font</span><b>12-pt Courier, 6 lines an inch</b></div>'}`;
      },
    };
  },
};
