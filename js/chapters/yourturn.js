// Chapter 6: your turn. A six-panel storyboard builder for the rooftop scene. Each slot has a moment,
// shot size, angle, subject, side of the line and a duration; panels re-render from the 3D set when a
// slot changes. A checklist grades the board against common beginner mistakes, and the total screen
// time is compared with the page rule (the scene is 29 of 54 lines, about 32 s).
import { clamp } from '../kit.js';
import {
  makeRooftop, Shooter, makeFrame, placeShot, board, rrect, text, wrap, setControl,
  SANS, COL, SIZES, ANGLES, tallStage, fitNarrow,
} from '../story.js';
import { SCENE_PAGES } from './page.js';

const MOMENT = ['Rooftops, kites', 'Meera alone', '"It was winning"', 'Nana arrives', 'The splint', 'It flies'];
const FIELDS = ['beat', 'size', 'angle', 'who', 'side', 'dur'];
// A first try with some classic mistakes in it, for the viewer to fix.
const ROUGH = [
  { beat: 1, size: 2, angle: 0, who: 'meera', side: 'A', dur: 4 },
  { beat: 2, size: 2, angle: 0, who: 'meera', side: 'A', dur: 4 },
  { beat: 3, size: 2, angle: 3, who: 'nana', side: 'A', dur: 4 },
  { beat: 4, size: 2, angle: 3, who: 'nana', side: 'B', dur: 4 },
  { beat: 4, size: 2, angle: 0, who: 'meera', side: 'A', dur: 3 },
  { beat: 4, size: 2, angle: 0, who: 'kite', side: 'A', dur: 3 },
];
// A cleaner version: the storyboard from the earlier chapters, plus an ECU insert.
const GOOD = [
  { beat: 0, size: 0, angle: 2, who: 'meera', side: 'A', dur: 4 },
  { beat: 1, size: 1, angle: 0, who: 'meera', side: 'A', dur: 4 },
  { beat: 2, size: 3, angle: 0, who: 'meera', side: 'A', dur: 4 },
  { beat: 3, size: 2, angle: 1, who: 'nana', side: 'A', dur: 5 },
  { beat: 4, size: 4, angle: 0, who: 'kite', side: 'A', dur: 6 },
  { beat: 5, size: 1, angle: 1, who: 'nana', side: 'A', dur: 6 },
];
const copy = (a) => a.map((x) => ({ ...x }));

// The checklist. Each returns [ok, label, why].
export function checks(slots) {
  const tot = slots.reduce((a, x) => a + x.dur, 0), rule = SCENE_PAGES * 60;
  const same = slots.findIndex((x, i) => i > 0 && x.size === slots[i - 1].size && x.who === slots[i - 1].who && x.angle === slots[i - 1].angle);
  const order = slots.every((x, i) => i === 0 || x.beat >= slots[i - 1].beat);
  return [
    [slots[0].size <= 1, 'Opens wide to set the scene', 'Start with an EWS or WS so we know where we are.'],
    [same < 0, 'No jump cuts', same < 0 ? 'Every cut changes size, subject or angle.' : `Shots ${same} and ${same + 1} are too alike: the cut will jump.`],
    [slots.every((x) => x.side === 'A'), 'Stays on one side of the line', 'A camera on side B flips who is left and right.'],
    [slots.some((x) => x.size >= 3), 'A close-up for the big feeling', 'Use a CU or ECU where emotion or detail matters.'],
    [order && slots[slots.length - 1].beat === 5, 'Tells the story in order, to the payoff', 'End on the kite flying: the moment the scene builds to.'],
    [slots.filter((x) => x.angle === 3).length <= 1, 'Dutch angles used sparingly', 'A tilt once is a feeling. Every shot tilted is just seasick.'],
    [tot >= rule * 0.6 && tot <= rule * 1.5, `Screen time close to the page rule (≈${Math.round(rule)} s)`, `Now ${tot.toFixed(1)} s.`],
  ];
}

export default {
  id: 'yourturn',
  short: 'Your turn',
  title: 'Your turn: board the scene',
  subtitle: 'Pick six shots, time them, and check your board for the classic mistakes.',
  view: { pos: [2.35, 4.3, 23.9], target: [2.35, 4.0, 6] },
  learn: `<p>Now you are the director. The scene is on the page: Meera, the torn kite, Nana and the wind. You have <b>six shots</b> to tell it. For each one choose the <b>moment</b>, the <b>shot size</b>, the <b>angle</b>, who to frame, which <b>side of the line</b> the camera stands, and how long it lasts.</p>
    <p>The board starts as a rough first try, full of classic mistakes. The checklist on the right shows what an editor would grumble about: no <b>establishing shot</b>, <b>jump cuts</b> between shots that look almost the same, a camera that <b>crosses the line</b>, no <b>close-up</b> when feelings run high, and a scene that never reaches its payoff.</p>
    <p>There is no single right answer. Great directors break every rule, but they know they are doing it. Satyajit Ray, Alfred Hitchcock and Akira Kurosawa all planned their films shot by shot on paper first, and then felt free on set.</p>
    <p class="tip"><b>Try it:</b> tap a panel (or pick its number), then change it until all seven checks go green. Load the good example to compare.</p>`,
  terms: [
    { t: 'Establishing shot', d: 'A wide opening shot that shows where a scene takes place.' },
    { t: 'Jump cut', d: 'A cut between two shots that are almost the same, so the picture seems to jump.' },
    { t: 'Insert', d: 'A close shot of a detail, like hands or an object, cut into a scene.' },
    { t: 'Payoff', d: 'The moment a scene has been building towards.' },
  ],
  defaults: { slot: 0, beat: 1, size: 2, angle: 0, who: 'meera', side: 'A', dur: 3 },
  onChange(s, key) {
    if (!s.slots) s.slots = copy(ROUGH);
    if (key === null || key === 'slot' || key === 'action') { const x = s.slots[clamp(Math.round(s.slot), 0, 5)]; FIELDS.forEach((f) => { s[f] = x[f]; }); }
    else if (FIELDS.includes(key)) s.slots[clamp(Math.round(s.slot), 0, 5)][key] = s[key];
    s.rev = (s.rev || 0) + 1;
  },
  controls: [
    { key: 'slot', type: 'seg', label: 'Shot to edit', options: [0, 1, 2, 3, 4, 5].map((i) => ({ v: i, label: String(i + 1) })) },
    { key: 'beat', type: 'seg', label: 'Moment', options: MOMENT.map((m, i) => ({ v: i, label: String(i + 1) })), fmt: (v) => MOMENT[v] },
    { key: 'size', type: 'seg', label: 'Shot size', options: SIZES.map((x, i) => ({ v: i, label: x.id })), fmt: (v) => SIZES[v]?.name || '' },
    { key: 'angle', type: 'seg', label: 'Angle', options: ANGLES.map((x, i) => ({ v: i, label: x.name.replace(' angle', '').replace('Eye level', 'Eye') })) },
    { key: 'who', type: 'seg', label: 'Frame on', options: [{ v: 'meera', label: 'Meera' }, { v: 'nana', label: 'Nana' }, { v: 'both', label: 'Both' }, { v: 'kite', label: 'Kite' }] },
    { key: 'side', type: 'seg', label: 'Side of the line', options: [{ v: 'A', label: 'Safe side' }, { v: 'B', label: 'Across the line' }] },
    { key: 'dur', type: 'range', label: 'Duration', min: 1, max: 10, step: 0.5, fmt: (v) => v.toFixed(1) + ' s' },
    { key: 'ex', type: 'buttons', label: 'Examples', items: [{ label: 'Load a good example', act: (s) => { s.slots = copy(GOOD); } }, { label: 'Back to the rough try', act: (s) => { s.slots = copy(ROUGH); } }] },
  ],
  quiz: [
    { q: 'Why start a scene with a wide shot?', options: ['It is cheaper', 'It shows the audience where they are before cutting closer', 'Close-ups are not allowed first', 'To hide the actors'], answer: 1, why: 'An establishing shot gives the geography of the scene, so the closer shots that follow make sense.' },
    { q: 'Two shots in a row are both medium shots of Meera from the same angle. What is the risk?', options: ['A jump cut: the picture seems to jump', 'The film will be too long', 'The line is crossed', 'Nothing at all'], answer: 0, why: 'If the size, subject and angle barely change, the cut looks like a glitch. Change at least one of them clearly.' },
    { q: 'Your six shots add up to 90 seconds for a half-page scene. What does that suggest?', options: ['The scene will probably feel slow', 'It is perfect', 'The script is too short', 'The camera is on the wrong side'], answer: 0, why: 'Half a page is about 30 seconds by the page rule. Three times that usually means shots held too long.' },
  ],
  reel: [
    { ms: 5600, caption: 'Plan every shot on paper, and the film is half made before anyone says action.', set: {}, act: (s) => { s.slots = copy(GOOD); }, anim: { slot: [0, 5] }, spin: 0 },
  ],

  build({ stage }) {
    const set = makeRooftop(); stage.root.add(set.group);
    stage.floor.visible = false;
    const shooter = new Shooter(stage, 512, 288);
    const Z = 6, PW = 3.2, PH = 1.8;
    const pos = (i, tall) => (tall ? [((i % 2) - 0.5) * 3.7, 7.2 - Math.floor(i / 2) * 2.55, Z] : [((i % 3) - 1) * 3.6 - 1.6, 5.2 - Math.floor(i / 3) * 2.6, Z]);
    const frames = [0, 1, 2, 3, 4, 5].map((i) => makeFrame(stage.root, shooter, PW, PH, pos(i, false), { header: 0.36 }));
    frames.forEach((f, i) => { f.panel.mesh.userData.slot = i; stage.pickables.push(f.panel.mesh); });
    const list = board(stage.root, 4.6, 5.1, 700, 776, (g, w, h, cks = [], tot = 0) => {
      g.clearRect(0, 0, w, h); rrect(g, 3, 3, w - 6, h - 6, 16); g.fillStyle = 'rgba(10,12,18,.94)'; g.fill();
      const ok = cks.filter((c) => c[0]).length;
      text(g, 'DIRECTOR\'S CHECKLIST', 26, 48, { font: `700 28px ${SANS}`, col: COL.c });
      text(g, `${ok} / ${cks.length}`, w - 26, 48, { font: `700 30px ${SANS}`, col: ok === cks.length ? COL.good : COL.hot, align: 'right' });
      let y = 100;
      cks.forEach(([good, label, why]) => {
        g.fillStyle = good ? COL.good : COL.bad; g.beginPath(); g.arc(40, y - 8, 13, 0, Math.PI * 2); g.fill();
        text(g, good ? '✓' : '✗', 40, y - 1, { font: `700 20px ${SANS}`, col: '#0a0c12', align: 'center' });
        text(g, label, 66, y, { font: `600 24px ${SANS}`, col: '#eef3fa' });
        y = wrap(g, why, 66, y + 30, w - 90, 26, { font: `20px ${SANS}`, col: 'rgba(255,255,255,.6)' }) + 12;
      });
      text(g, `Total screen time: ${tot.toFixed(1)} s`, 26, h - 30, { font: `600 24px ${SANS}`, col: '#fff' });
    }, [9.0, 4.3, Z]);
    const keys = ['', '', '', '', '', ''];
    let last = '', sel = -1, rev = -1, cks = [];
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const slots = s.slots;
        slots.forEach((x, i) => {
          const k = `${x.beat}|${x.size}|${x.angle}|${x.who}|${x.side}|${x.dur}`;
          if (k === keys[i]) return;
          keys[i] = k;
          const spec = { size: SIZES[x.size].id, angle: ANGLES[x.angle].id, subject: x.who, side: x.side, move: 'none' };
          set.setBeat(x.beat, x.beat === 5 ? 0.75 : 0, 0);
          shooter.shoot(frames[i].panel, placeShot(set, spec, 0.5));
          frames[i].over.redraw('none', ANGLES[x.angle].roll);
          frames[i].dirtyCard = true;
        });
        const si = clamp(Math.round(s.slot), 0, 5);
        if (sel !== si || rev !== s.rev || frames.some((f) => f.dirtyCard)) {
          sel = si; rev = s.rev;
          frames.forEach((f, i) => {
            const x = slots[i];
            f.card.redraw({ title: `${i + 1} · ${SIZES[x.size].id} · ${x.dur.toFixed(1)} s`, sub: `${MOMENT[x.beat]}${x.side === 'B' ? ' · side B' : ''}`, col: i === si ? '#38bdf8' : x.side === 'B' ? '#ff5a6e' : undefined });
            f.dirtyCard = false;
          });
          cks = checks(slots);
          list.redraw(cks, slots.reduce((a, x) => a + x.dur, 0));
        }
        const b = slots[si];
        set.setBeat(b.beat, b.beat === 5 ? 0.75 : 0, time);
        const lay = tallStage(stage) ? 'tall' : 'wide';
        if (lay !== last) {
          last = lay;
          frames.forEach((f, i) => f.group.position.set(...pos(i, lay === 'tall')));
          if (lay === 'tall') { list.mesh.position.set(0, -1.1, Z); list.mesh.rotation.y = 0; list.mesh.scale.setScalar(0.9); stage.setView([0, 2.1, Z + 7.2], [0, 2.0, Z], 0.6); }
          else { list.mesh.position.set(9.0, 4.3, Z); list.mesh.rotation.y = 0; list.mesh.scale.setScalar(1); }
        }
        frames.forEach((f, i) => { f.group.position.z = Z + (i === si ? 0.25 : 0); });
        fitNarrow(stage, [], -0.2);
      },
      pick(o) { const i = o.userData.slot; if (i !== undefined) setControl('Shot to edit', i); },
      readout(s) {
        const slots = s.slots || ROUGH, tot = slots.reduce((a, x) => a + x.dur, 0), ok = cks.filter((c) => c[0]).length;
        const x = slots[clamp(Math.round(s.slot), 0, 5)];
        return `<div class="big">${ok} of 7 checks · ${tot.toFixed(1)} s</div>
          <div class="row"><span>Shot ${Math.round(s.slot) + 1}</span><b>${SIZES[x.size].name}, ${ANGLES[x.angle].name.toLowerCase()}</b></div>
          <div class="row"><span>Moment</span><b>${MOMENT[x.beat]}</b></div>
          <div class="row"><span>Page rule for this scene</span><b>≈ ${Math.round(SCENE_PAGES * 60)} s</b></div>`;
      },
      dispose() { shooter.dispose(); stage.floor.visible = true; stage.setShift(0, 0); },
    };
  },
};
