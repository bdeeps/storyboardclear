// Chapter 5: the animatic. The six storyboard panels of the rooftop scene played in time, with the
// camera moves animated, a timeline of panel durations, a temp soundtrack, and a "pre-vis" switch that
// shows the same shots as shaded 3D instead of pencil.
// Facts used in the text:
//  - Baahubali (2015): VFX supervisor Sanath PC of Firefly Creative Studio, Hyderabad, said the team had
//    "done quite a lot of pre-vis" for the war scenes, shared by the fight master, cinematographer,
//    director and VFX supervisor (interview, The Review Monk, 2015).
//  - RRR (2022): VFX supervisor V. Srinivas Mohan described how previs calculations for the animal
//    stampede gave a spreadsheet of how fast the animals moved, which drove an LED strip on set so the
//    camera and actors knew where the leap happened (befores & afters, "Bending the physics", Dec 2022).
//  - Star Wars (1977): George Lucas cut together WWII dogfight film footage as a reference for the space
//    battles (Wikipedia, "Previsualization").
import { clamp } from '../kit.js';
import { makeRooftop, Shooter, makeFrame, placeShot, board, rrect, text, SANS, COL, BOARD, SIZES, ANGLES, inReel, tallStage, fitNarrow } from '../story.js';
import { SCENE_PAGES } from './page.js';
import { audio } from '../ui.js';

const DK = BOARD.map((_, i) => 'd' + i);
const NOTES = [220, 261.6, 293.7, 329.6, 392, 440];   // an A-minor pentatonic temp score, one note per panel

// A tiny temp track with Web Audio: a soft pad note on each cut and a rising whoosh of wind for the kite.
let ac = null;
function tone(f, dur, whoosh = false) {
  if (audio.muted) return;
  try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime, g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(ac.destination);
  for (const m of [1, 1.5, 2]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * m; o.connect(g); o.start(t); o.stop(t + dur); }
  if (whoosh) {
    const n = ac.createBufferSource(), buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + dur);
    const wg = ac.createGain(); wg.gain.setValueAtTime(0.0001, t); wg.gain.exponentialRampToValueAtTime(0.08, t + dur * 0.7); wg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(wg).connect(ac.destination); n.start(t); n.stop(t + dur);
  }
}

export default {
  id: 'animatic',
  short: 'Animatic & pre-vis',
  title: 'The animatic: a film before the film',
  subtitle: 'Play the storyboard in time, with temp sound, then see it in 3D pre-vis.',
  view: { pos: [0, 4.2, 19.4], target: [0, 3.9, 6] },
  learn: `<p>A storyboard on a wall has no <b>timing</b>. So the next step is an <b>animatic</b>: the panels are put on a timeline, each held for as long as its shot will last, with <b>temp sound</b>, rough dialogue read by anyone and borrowed music. Suddenly you can feel whether the scene drags or rushes, long before paying a crew.</p>
    <p>Animation studios live by animatics. Disney built "story reels" of drawings in the 1930s, and Pixar still rebuilds every film as a reel again and again before animating a frame. Live-action directors use them for anything expensive or dangerous.</p>
    <p><b>Pre-vis</b> (previsualisation) goes one step further: the scene is built as a simple 3D model with virtual cameras, like this box does. George Lucas cut together old war-film dogfights to plan the space battles of Star Wars (1977). In India, Firefly Creative Studio did a lot of pre-vis for <b>Baahubali</b>'s war scenes, so the director, fight master, cinematographer and VFX team all worked from the same plan. For <b>RRR</b>'s animal stampede, pre-vis worked out how fast each animal would run, and those numbers drove a strip of LED lights on set so the camera and actors knew exactly where the leap would happen.</p>
    <p>Our scene fills about half a page (29 of the 54 lines), so the page rule says it should run about 30 seconds. Does your animatic agree?</p>
    <p class="tip"><b>Try it:</b> press play, then change how long each panel is held. Turn on temp sound (with the ♪ button on) and switch to pre-vis to see the shots as shaded 3D.</p>`,
  terms: [
    { t: 'Animatic', d: 'Storyboard panels edited together in time with rough sound, to test a scene\'s rhythm.' },
    { t: 'Temp sound', d: 'Rough voices, effects and borrowed music used while planning or editing, replaced later.' },
    { t: 'Pre-vis', d: 'Previsualisation: planning shots with a simple 3D model of the set, actors and cameras.' },
    { t: 'Story reel', d: 'An animation studio\'s name for a full-length animatic of the film.' },
  ],
  defaults: { play: true, at: 0, sound: false, previs: false, ...Object.fromEntries(DK.map((k, i) => [k, BOARD[i].dur])) },
  controls: [
    { key: 'play', type: 'toggle', label: 'Play the animatic' },
    { key: 'previs', type: 'toggle', label: 'Pre-vis: shaded 3D instead of pencil' },
    { key: 'sound', type: 'toggle', label: 'Temp sound', hint: 'Needs the ♪ sound button on.' },
    ...BOARD.map((b, i) => ({ key: DK[i], type: 'range', label: `Panel ${i + 1}: ${b.size}${b.move !== 'none' ? ' + ' + b.move : ''}`, min: 0.5, max: 6, step: 0.1, fmt: (v) => v.toFixed(1) + ' s' })),
  ],
  quiz: [
    { q: 'What does an animatic add to a storyboard?', options: ['Colour', 'Timing and rough sound', 'Real actors', 'Special effects'], answer: 1, why: 'An animatic holds each panel for the length of its shot, with temp sound, so you can judge the rhythm.' },
    { q: 'What is pre-vis?', options: ['Watching the film before release', 'Planning shots with a simple 3D model and virtual cameras', 'A kind of camera lens', 'The first day of shooting'], answer: 1, why: 'Previsualisation builds a rough 3D version of a scene so camera moves, timing and effects can be planned before the expensive shoot.' },
    { q: 'Our scene is about half a page long. By the page rule, about how long should it run?', options: ['About 5 seconds', 'About 30 seconds', 'About 5 minutes', 'About 50 minutes'], answer: 1, why: 'One page is about a minute, so half a page is roughly 30 seconds.' },
  ],
  reel: [
    { ms: 5800, caption: 'An animatic plays the panels in time, so you can feel the rhythm before shooting.', set: { play: true, at: 0, previs: false, sound: false }, spin: 0 },
    { ms: 5000, caption: 'Pre-vis rebuilds the scene in simple 3D, as Baahubali and RRR did for their battles.', set: { play: true, at: 16.6, previs: true, sound: false }, spin: 0 },
  ],

  build({ stage }) {
    const set = makeRooftop(); stage.root.add(set.group);
    stage.floor.visible = false;
    const shooter = new Shooter(stage, 800, 450);
    const Z = 6;
    const big = makeFrame(stage.root, shooter, 7.2, 4.05, [0, 4.7, Z]);
    const thumbs = BOARD.map((b, i) => { const f = makeFrame(stage.root, shooter, 1.9, 1.07, [(i - 2.5) * 2.25, 1.55, Z], { header: 0.3 }); return f; });
    // Static thumbnails, rendered once.
    const renderThumbs = () => thumbs.forEach((f, i) => {
      const b = BOARD[i]; set.setBeat(b.beat, b.t, 0);
      shooter.shoot(f.panel, placeShot(set, b, b.t));
      f.card.redraw({ title: `${i + 1} · ${b.size} ${ANGLES.find((a) => a.id === b.angle).name.replace(' angle', '').replace('Eye level', 'eye')}` });
      f.over.redraw(b.move, ANGLES.find((a) => a.id === b.angle).roll);
    });
    renderThumbs();
    // The timeline: one block per panel, a temp-track lane and the playhead.
    const tl = board(stage.root, 13.6, 1.1, 1600, 130, (g, w, h, durs = [], at = 0, cur = 0) => {
      g.clearRect(0, 0, w, h); rrect(g, 2, 2, w - 4, h - 4, 12); g.fillStyle = 'rgba(10,12,18,.93)'; g.fill();
      const tot = durs.reduce((a, b) => a + b, 0) || 1, x0 = 110, x1 = w - 20, X = (t) => x0 + (x1 - x0) * t / tot;
      text(g, 'PICTURE', 14, 44, { font: `600 20px ${SANS}`, col: COL.soft }); text(g, 'TEMP', 14, 100, { font: `600 20px ${SANS}`, col: COL.soft });
      let t = 0;
      durs.forEach((d, i) => {
        g.fillStyle = i === cur ? '#38bdf8' : i % 2 ? '#2b3a4d' : '#34475e'; g.fillRect(X(t) + 1, 16, X(t + d) - X(t) - 2, 38);
        text(g, `${i + 1} · ${d.toFixed(1)}s`, X(t) + 8, 43, { font: `600 20px ${SANS}`, col: i === cur ? '#07121c' : '#dfe8f2' });
        // Temp track: a wiggle for dialogue on panels 3 and 5, rising wind on 6.
        g.strokeStyle = i === 5 ? COL.mint : BOARD[i].cap.includes(':') && i !== 4 || i === 4 ? COL.warm : 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.beginPath();
        for (let x = X(t) + 2; x < X(t + d) - 2; x += 3) { const k = (x - X(t)) / (X(t + d) - X(t)); const a = i === 5 ? 4 + 14 * k : i === 2 || i === 4 ? 12 * Math.abs(Math.sin(x * 0.21)) * Math.sin(k * Math.PI) : 3; const y = 100 + a * Math.sin(x * 0.9); if (x === X(t) + 2) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke(); t += d;
      });
      g.fillStyle = '#ff5a6e'; g.fillRect(X(at) - 2, 8, 4, h - 16);
    }, [0, 0.35, Z]);
    let cur = -1, key = '', last = '', frameT = 0;
    const durs = (s) => DK.map((k) => clamp(s[k], 0.5, 6));
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const d = durs(s), tot = d.reduce((a, b) => a + b, 0);
        if (s.play) s.at += dt;
        s.at = ((s.at % tot) + tot) % tot;
        let t = s.at, i = 0; while (i < d.length - 1 && t >= d[i]) { t -= d[i]; i++; }
        const k = clamp(t / d[i], 0, 1), b = BOARD[i];
        if (i !== cur) {
          cur = i;
          if (s.sound && s.play && !inReel()) tone(NOTES[i], Math.min(3, d[i] + 0.4), i === 5);
          big.card.redraw({ title: `Panel ${i + 1} of 6 · ${SIZES.find((x) => x.id === b.size).name}`, sub: b.cap });
          big.over.redraw(b.move, ANGLES.find((a) => a.id === b.angle).roll);
          thumbs.forEach((f, j) => f.card.mesh.material.color.setHex(j === i ? 0x7fd3ff : 0xffffff));
        }
        // Live render of the current panel with its move and action at progress k.
        frameT = b.beat === 5 ? 0.15 + 0.85 * k : k;
        set.setBeat(b.beat, frameT, time);
        shooter.shoot(big.panel, placeShot(set, b, b.move === 'none' ? 0.5 : k));
        big.panel.sketch(s.previs ? 0 : 1);
        const tk = `${d.join(',')}|${i}|${Math.round(s.at * 20)}`;
        if (tk !== key) { key = tk; tl.redraw(d, s.at, i); }
        thumbs.forEach((f, j) => { f.group.position.y = 1.55 + (j === i ? 0.12 : 0); });
        const lay = tallStage(stage) ? 'tall' : 'wide';
        if (lay !== last) {
          last = lay;
          if (lay === 'tall') {
            big.group.position.set(0, 6.2, Z); big.group.scale.setScalar(0.9);
            thumbs.forEach((f, j) => { f.group.position.x = ((j % 3) - 1) * 2.25; f.group.userData.row = Math.floor(j / 3); });
            tl.mesh.scale.set(0.5, 1, 1); stage.setView([0, 4.1, Z + 6.6], [0, 4.0, Z], 0.6);
          } else {
            big.group.position.set(0, 4.7, Z); big.group.scale.setScalar(1);
            thumbs.forEach((f, j) => { f.group.position.x = (j - 2.5) * 2.25; f.group.userData.row = 0; });
            tl.mesh.scale.set(1, 1, 1);
          }
        }
        if (lay === 'tall') thumbs.forEach((f, j) => { f.group.position.y = 2.05 - f.group.userData.row * 1.5 + (j === i ? 0.1 : 0); });
        if (lay === 'tall') tl.mesh.position.y = -0.4;
        else tl.mesh.position.y = 0.35;
        fitNarrow(stage, [], -0.2);
        this.info = { i, tot, k };
      },
      readout(s) {
        const n = this.info || { i: 0, tot: 20, k: 0 };
        const page = Math.round(SCENE_PAGES * 60);
        return `<div class="big">${n.tot.toFixed(1)} s of animatic</div>
          <div class="row"><span>Now showing</span><b>panel ${n.i + 1} of 6</b></div>
          <div class="row"><span>Page rule for this scene</span><b>≈ ${page} s (${Math.round(SCENE_PAGES * 8)}/8 page)</b></div>
          <div class="row"><span>Difference</span><b>${n.tot < page ? 'animatic is ' + Math.round(page - n.tot) + ' s shorter' : 'animatic is ' + Math.round(n.tot - page) + ' s longer'}</b></div>
          <div class="row"><span>View</span><b>${s.previs ? '3D pre-vis' : 'pencil animatic'}</b></div>`;
      },
      dispose() { shooter.dispose(); stage.floor.visible = true; stage.setShift(0, 0); },
    };
  },
};
