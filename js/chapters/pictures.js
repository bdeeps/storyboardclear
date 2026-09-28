// Chapter 3: from words to pictures. The rooftop set built at full size, a virtual cine camera placed by
// shot size and angle (see placeShot in story.js for the framing maths), and a storyboard panel that
// re-renders what that camera sees as a pencil sketch, with the camera move drawn as arrows.
import { THREE } from '../kit.js';
import {
  makeRooftop, makeCineCamera, makeFrustum, Shooter, makeFrame, drawMoveArrows, placeShot,
  SIZES, ANGLES, MOVES, BOARD, FOCAL, HFOV, D2R, inReel, tallStage, fitNarrow,
} from '../story.js';

const MOMENTS = BOARD.map((b, i) => ({ v: i, label: String(i + 1) }));
const WHO = [{ v: 'meera', label: 'Meera' }, { v: 'nana', label: 'Nana' }, { v: 'kite', label: 'Kite' }];

export default {
  id: 'pictures',
  short: 'Words to pictures',
  title: 'From words to pictures',
  subtitle: 'Shot sizes, camera angles and camera moves: turning each line of script into a drawing.',
  view: { pos: [1.6, 7.2, 15.5], target: [1.6, 4.4, -1] },
  learn: `<p>A script says what happens. A <b>storyboard</b> shows how the audience will <b>see</b> it: a comic strip of the film, one drawing per <b>shot</b>. The director and a storyboard artist decide, line by line, where the camera goes.</p>
    <p>First choice: the <b>shot size</b>. An <b>extreme wide shot (EWS)</b> shows the whole place and sets the scene. A <b>wide shot (WS)</b> shows a whole person. A <b>medium shot (MS)</b> cuts at the waist. A <b>close-up (CU)</b> fills the frame with a face, so we feel what they feel. An <b>extreme close-up (ECU)</b> picks out one detail. The lens stays the same here: the camera simply moves closer.</p>
    <p>Second: the <b>angle</b>. At <b>eye level</b> we are equals. A <b>low angle</b> looks up and makes someone powerful; a <b>high angle</b> looks down and makes them small. A <b>Dutch angle</b> tilts the horizon to make us uneasy.</p>
    <p>Third: the <b>move</b>. A <b>pan</b> turns the camera left or right, and a <b>tilt</b> nods it up or down, both from one spot. A <b>dolly</b> rolls the whole camera closer, and a <b>track</b> slides it alongside the action. Artists draw moves as <b>arrows</b> on the panel.</p>
    <p>Many directors draw their own boards. Satyajit Ray sketched his shots in notebooks; Alfred Hitchcock planned films so fully that he said the shoot was the boring part.</p>
    <p class="tip"><b>Try it:</b> pick a moment in the scene, then change the shot size and angle. Watch the blue camera move on the set and the panel redraw itself. Add a move and it plays back.</p>`,
  terms: [
    { t: 'Storyboard', d: 'A series of drawings, one per shot, showing what the camera will see.' },
    { t: 'Shot size', d: 'How much of the subject fits in the frame, from extreme wide to extreme close-up.' },
    { t: 'Low angle', d: 'The camera looks up at the subject, which makes them seem big or strong.' },
    { t: 'Dutch angle', d: 'A shot with the camera tilted sideways, so the horizon slopes.' },
    { t: 'Pan and tilt', d: 'Turning the camera sideways (pan) or up and down (tilt) without moving it.' },
    { t: 'Dolly and track', d: 'Moving the whole camera, towards the subject (dolly) or sideways with it (track), often on rails.' },
  ],
  defaults: { moment: 2, size: 3, angle: 0, move: 'none', who: 'meera', sketch: true },
  onChange(s, key) {
    if (key === 'moment' || key === null) {
      const b = BOARD[Math.round(s.moment)] || BOARD[0];
      if (key === 'moment') { s.size = SIZES.findIndex((x) => x.id === b.size); s.angle = ANGLES.findIndex((x) => x.id === b.angle); s.move = b.move; s.who = b.subject; }
    }
  },
  controls: [
    { key: 'moment', type: 'seg', label: 'Moment in the scene', options: MOMENTS, fmt: (v) => BOARD[v].cap },
    { key: 'size', type: 'seg', label: 'Shot size', options: SIZES.map((x, i) => ({ v: i, label: x.id })), fmt: (v) => SIZES[Math.round(v)]?.name || '' },
    { key: 'angle', type: 'seg', label: 'Camera angle', options: ANGLES.map((x, i) => ({ v: i, label: x.name.replace(' angle', '').replace('Eye level', 'Eye') })), fmt: (v) => ANGLES[Math.round(v)]?.name || '' },
    { key: 'move', type: 'seg', label: 'Camera move', options: MOVES.map((x) => ({ v: x.id, label: x.name.replace(' in', '') })), fmt: (v) => MOVES.find((m) => m.id === v)?.what || '' },
    { key: 'who', type: 'seg', label: 'Frame on', options: WHO },
    { key: 'sketch', type: 'toggle', label: 'Pencil sketch (off: shaded 3D)' },
  ],
  quiz: [
    { q: 'Which shot best shows how a character feels?', options: ['Extreme wide shot', 'Wide shot', 'Close-up', 'A shot of the sky'], answer: 2, why: 'A close-up fills the frame with a face, so we can read every small change of expression.' },
    { q: 'You want a villain to look powerful. Which angle?', options: ['High angle, looking down', 'Low angle, looking up', 'Eye level', 'Overhead'], answer: 1, why: 'Looking up at someone makes them tower over us, so a low angle makes a character seem strong or scary.' },
    { q: 'What is the difference between a pan and a track?', options: ['There is none', 'A pan turns the camera on one spot; a track moves the whole camera sideways', 'A pan is faster', 'A track only works in animation'], answer: 1, why: 'A pan rotates the camera on its tripod head. A track physically carries the camera alongside the action, so the view of the background changes too.' },
  ],
  reel: [
    { ms: 5600, caption: 'A storyboard turns each line of script into a drawing of one shot.', set: { moment: 1, angle: 0, move: 'none', who: 'meera', sketch: true }, anim: { size: [0, 4] }, spin: 0 },
    { ms: 5200, caption: 'Low angles make people look strong; a tilted Dutch angle feels uneasy.', set: { moment: 4, size: 2, move: 'none', who: 'nana', sketch: true }, anim: { angle: [0, 3] }, spin: 0 },
  ],

  build({ stage }) {
    const set = makeRooftop(); stage.root.add(set.group);
    const shooter = new Shooter(stage);
    const fr = makeFrame(stage.root, shooter, 8, 4.5, [2.6, 7.4, -5.6]);
    fr.group.rotation.x = -0.12;
    const cam = makeCineCamera(0x2a2d34); stage.root.add(cam); shooter.hide.push(cam);
    const fr2 = makeFrustum(0x38bdf8); stage.root.add(fr2); shooter.hide.push(fr2);
    const camLbl = stage.label('Camera', [0, 0.3, 0], cam, 'hot');
    const setLbl = stage.label('The set: a Mumbai rooftop', [-3.7, 3.0, -3.3]);
    stage.floor.visible = false;
    let t = 0, key = '', last = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const moving = s.move !== 'none';
        t = moving ? (t + dt / 3.2) % 1.25 : 0.5;
        const b = BOARD[Math.round(s.moment)] || BOARD[0];
        set.setBeat(b.beat, b.beat === 5 ? 0.75 : 0, time);
        const spec = { size: SIZES[Math.round(s.size)].id, angle: ANGLES[Math.round(s.angle)].id, subject: s.who, move: s.move, az: s.who === b.subject && Math.round(s.size) === SIZES.findIndex((x) => x.id === b.size) ? b.az : undefined };
        const place = placeShot(set, spec, Math.min(1, t));
        this.place = place;
        shooter.shoot(fr.panel, place);
        fr.panel.sketch(s.sketch ? 1 : 0);
        // The camera model and its view cone, on the set.
        cam.position.copy(place.pos); cam.lookAt(place.target); cam.rotateY(-Math.PI / 2); cam.rotateX(place.roll);
        fr2.update(shooter.cam, Math.min(place.pos.distanceTo(place.target), 40));
        cam.visible = place.pos.distanceTo(new THREE.Vector3(0, 1, 0)) < 16;
        camLbl.visible = cam.visible;
        const k = `${s.size}|${s.angle}|${s.move}|${s.who}|${s.moment}`;
        if (k !== key) {
          key = k;
          fr.card.redraw({ title: `Shot ${Math.round(s.moment) + 1} · ${spec.size} · ${ANGLES[Math.round(s.angle)].name}`, sub: b.cap, col: '#e8eef8' });
          fr.over.redraw(s.move, ANGLES[Math.round(s.angle)].roll);
        }
        // Tall video: the panel goes above the set.
        const lay = tallStage(stage) ? 'tall' : 'wide';
        if (lay !== last) {
          last = lay;
          if (lay === 'tall') { fr.group.position.set(0, 7.4, -5.2); fr.group.scale.setScalar(1.1); stage.setView([0, 6.4, 7.8], [0, 4.6, -2], 0.6); }
          else { fr.group.position.set(2.6, 7.4, -5.6); fr.group.rotation.y = 0; fr.group.scale.setScalar(1); }
        }
        fitNarrow(stage, [setLbl], -0.25);
        void inReel;
      },
      readout(s) {
        const p = this.place; if (!p) return '';
        const size = SIZES[Math.round(s.size)], ang = ANGLES[Math.round(s.angle)];
        return `<div class="big">${size.name}: ${size.what}</div>
          <div class="row"><span>Angle</span><b>${ang.name}</b></div>
          <div class="row"><span>Camera to subject</span><b>${p.dist < 10 ? p.dist.toFixed(1) : Math.round(p.dist)} m</b></div>
          <div class="row"><span>Frame shows</span><b>${p.H < 1 ? Math.round(p.H * 100) + ' cm' : p.H.toFixed(1) + ' m'}, top to bottom</b></div>
          <div class="row"><span>Lens</span><b>${FOCAL} mm, ${Math.round(HFOV / D2R)}° wide</b></div>`;
      },
      dispose() { shooter.dispose(); stage.floor.visible = true; stage.setShift(0, 0); },
    };
  },
};
