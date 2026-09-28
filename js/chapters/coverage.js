// Chapter 4: shot list and coverage. The same moment (Nana splinting the kite for Meera) covered from a
// master, over-the-shoulder shots and close-ups, and the 180-degree rule: an imaginary line runs through
// the two characters; keep every camera on one side and each person stays on the same side of the screen.
// Drag the camera (or its slider) across the line and the live panel shows the characters swap sides
// compared with the master. Left/right is measured by projecting both heads through the virtual camera.
import { THREE, M } from '../kit.js';
import { makeRooftop, makeCineCamera, Shooter, makeFrame, placeShot, setControl, LINE_Z, D2R, tallStage, fitNarrow } from '../story.js';

// Coverage set-ups for this moment, in the order they are usually shot: wide to tight.
export const SETUPS = [
  { id: 'master', name: 'Master (two-shot)', size: 'WS', who: 'both', az: 0 },
  { id: 'otsM', name: 'Over Nana, on Meera', size: 'MS', who: 'meera', az: -80 },
  { id: 'otsN', name: 'Over Meera, on Nana', size: 'MS', who: 'nana', az: 80 },
  { id: 'cuM', name: 'Close-up: Meera', size: 'CU', who: 'meera', az: -48 },
  { id: 'cuN', name: 'Close-up: Nana', size: 'CU', who: 'nana', az: 48 },
];

export default {
  id: 'coverage',
  short: 'Coverage & 180°',
  title: 'Shot lists, coverage and the 180° rule',
  subtitle: 'Film one moment from several set-ups, and never cross the line.',
  view: { pos: [2.4, 10.5, 13.5], target: [2.4, 1.5, -0.3] },
  learn: `<p>From the storyboard, the director and the cinematographer make a <b>shot list</b>: every camera <b>set-up</b> needed for each scene. Moving the camera and lights takes time, so a day is planned around set-ups, not scenes.</p>
    <p>A dialogue scene is usually filmed several times over, called <b>coverage</b>. First a <b>master</b>: one wide shot of the whole scene. Then <b>over-the-shoulder</b> shots (OTS), looking past one person at the other. Then <b>close-ups</b> of each face. The editor can now cut between them and choose the best moment of every take.</p>
    <p>All of this obeys the <b>180-degree rule</b>. Imagine a line through the two characters. Keep every camera on one side of it, and Meera always stays on screen right, Nana on screen left, and they look at each other across the cut. Put a camera on the other side and they <b>jump sides</b>: the audience feels lost for a moment. Directors do cross the line, but on purpose, usually by moving the camera across it in a shot so we see it happen.</p>
    <p class="tip"><b>Try it:</b> tap the coverage set-ups. Then drag the blue camera (or use the slider) round the pair until it crosses the red line, and compare the two panels.</p>`,
  terms: [
    { t: 'Shot list', d: 'A list of every shot to film, with its size, angle, move and lens, grouped by set-up.' },
    { t: 'Set-up', d: 'One position of the camera and lights. Changing set-ups takes the crew time.' },
    { t: 'Coverage', d: 'Filming the same action from several set-ups so the editor has choices.' },
    { t: 'Master shot', d: 'A wide shot that records a whole scene in one go.' },
    { t: 'Over-the-shoulder', d: 'A shot looking past one character\'s shoulder at the person they are talking to.' },
    { t: '180-degree rule', d: 'Keep the camera on one side of the line between two characters so they stay on the same sides of the screen.' },
  ],
  defaults: { setup: 'master', cam: 0, size: 'WS', who: 'both' },
  onChange(s, key) {
    if (key === 'setup') { const u = SETUPS.find((x) => x.id === s.setup); if (u) { s.cam = u.az; s.size = u.size; s.who = u.who; } }
    if (key === 'cam') s.setup = 'free';
  },
  controls: [
    { key: 'setup', type: 'seg', label: 'Coverage set-up', options: SETUPS.map((u) => ({ v: u.id, label: u.id === 'master' ? 'Master' : u.id.startsWith('ots') ? 'OTS ' + u.id.slice(3) : 'CU ' + u.id.slice(2) })), fmt: (v) => SETUPS.find((u) => u.id === v)?.name || 'Your own position' },
    { key: 'cam', type: 'range', label: 'Camera position', min: -180, max: 180, step: 1, ends: ['behind them', 'behind them'], fmt: (v) => `${Math.round(v)}° ${Math.abs(v) > 90 ? '· wrong side!' : '· safe side'}` },
    { key: 'size', type: 'seg', label: 'Shot size', options: [{ v: 'WS', label: 'Wide' }, { v: 'MS', label: 'Medium' }, { v: 'CU', label: 'Close-up' }] },
    { key: 'who', type: 'seg', label: 'Frame on', options: [{ v: 'both', label: 'Both' }, { v: 'meera', label: 'Meera' }, { v: 'nana', label: 'Nana' }] },
  ],
  quiz: [
    { q: 'What is a master shot?', options: ['The director\'s favourite shot', 'A wide shot that records the whole scene', 'The last shot of the film', 'A close-up of the hero'], answer: 1, why: 'The master covers the whole scene in one wide set-up. Closer shots are then filmed to cut into it.' },
    { q: 'In the master, Meera is on screen right. The next camera crosses the line. Where is Meera now?', options: ['Still on the right', 'On the left', 'Out of the frame', 'In the middle'], answer: 1, why: 'Crossing the 180-degree line mirrors left and right, so the characters swap sides on screen.' },
    { q: 'Why film coverage, not just one shot?', options: ['To use up more memory cards', 'So the editor can choose sizes and the best moments, and control the rhythm', 'Because cameras overheat', 'It is required by law'], answer: 1, why: 'With a master, over-the-shoulders and close-ups, the editor can cut between angles and pick the best performance from each.' },
  ],
  reel: [
    { ms: 5600, caption: 'Cross the 180-degree line and your characters swap sides on screen.', set: { setup: 'free', size: 'WS', who: 'both' }, anim: { cam: [-20, -165] }, spin: 0 },
  ],

  build({ stage }) {
    const set = makeRooftop(); stage.root.add(set.group); set.setBeat(4);
    stage.floor.visible = false;
    const shooter = new Shooter(stage);
    const WA = [8.2, 4.9, -3.4], WB = [8.2, 2.5, 1.9];
    const A = makeFrame(stage.root, shooter, 4.4, 2.475, WA);
    const B = makeFrame(stage.root, shooter, 4.4, 2.475, WB);
    const wide = () => [A, B].forEach((f) => { f.group.rotation.set(-0.75, -0.25, 0, 'YXZ'); f.group.scale.setScalar(1); });
    wide();
    // The line of action and the two sides.
    const crew = new THREE.Group(); stage.root.add(crew); shooter.hide.push(crew);
    const line = new THREE.Mesh(new THREE.BoxGeometry(10, 0.02, 0.06), M.glow(0xff4757)); line.position.set(0, 0.02, LINE_Z); crew.add(line);
    const sideA = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.7), M.ghost(0x5ce1a9, 0.1)); sideA.rotation.x = -Math.PI / 2; sideA.position.set(0, 0.015, LINE_Z + 2.35); crew.add(sideA);
    const sideB = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.7), M.ghost(0xff4757, 0.08)); sideB.rotation.x = -Math.PI / 2; sideB.position.set(0, 0.015, LINE_Z - 2.35); crew.add(sideB);
    const lblLine = stage.label('The 180° line', [-3.6, 0.2, LINE_Z]);
    lblLine.element.style.borderColor = '#ff4757';
    const lblA = stage.label('Safe side', [3.2, 0.1, 2.2]);
    const lblB = stage.label('Wrong side', [3.2, 0.1, -1.9]);
    // The draggable camera on a tripod.
    const rig = new THREE.Group(); crew.add(rig);
    const cam = makeCineCamera(0x2a2d34); rig.add(cam);
    const legs = new THREE.Group(); rig.add(legs);
    for (let i = 0; i < 3; i++) { const a = i * 2.1; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), M.metal(0x3a3f4b)); legs.add(l); l.userData.a = a; }
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), M.ghost(0x38bdf8, 0.22)); rig.add(handle);
    stage.pickables.push(handle);
    const camLbl = stage.label('Drag me', [0, 0.55, 0], cam, 'hot');

    // Dragging: a pointer on the handle moves the camera round the pair.
    const el = stage.renderer.domElement, ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.02);
    let drag = false;
    const toFloor = (e) => { const b = el.getBoundingClientRect(); v2.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(v2, stage.camera); return ray.ray.intersectPlane(floor, new THREE.Vector3()); };
    const down = (e) => {
      const b = el.getBoundingClientRect(); v2.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(v2, stage.camera);
      if (ray.intersectObject(handle).length) { drag = true; stage.controls.enabled = false; el.setPointerCapture?.(e.pointerId); e.preventDefault(); }
    };
    const move = (e) => {
      if (!drag) return; const p = toFloor(e); if (!p) return;
      const a = Math.round(Math.atan2(p.x - 0.1, p.z - LINE_Z) / D2R);
      if (!setControl('Camera position', a)) { cur.cam = a; cur.setup = 'free'; }
    };
    const up = () => { if (drag) { drag = false; stage.controls.enabled = true; } };
    el.addEventListener('pointerdown', down, true); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);

    const master = placeShot(set, { size: 'WS', subject: 'both', az: 0 });
    shooter.shoot(A.panel, master);
    A.card.redraw({ title: 'MASTER · the reference', sub: 'Nana left, Meera right', col: '#5ce1a9' });

    let cur = null, key = '', last = '', info = {};
    const side = (x) => (Math.abs(x) > 1.05 ? 'off screen' : x < -0.15 ? 'left' : x > 0.15 ? 'right' : 'centre');
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt); cur = s;
        set.setBeat(4, 0, time);
        const place = placeShot(set, { size: s.size, subject: s.who, az: s.cam, angle: 'eye' });
        shooter.shoot(B.panel, place);
        // Where each character lands in this frame.
        shooter.aim(place);
        const pm = shooter.project(set.meera.eye()).x, pn = shooter.project(set.nana.eye()).x;
        const crossed = place.pos.z < LINE_Z - 0.02;
        info = { pm, pn, crossed, dist: place.dist };
        rig.position.set(place.pos.x, 0, place.pos.z);
        cam.position.set(0, place.pos.y, 0);
        cam.lookAt(new THREE.Vector3().copy(place.target));
        cam.rotateY(-Math.PI / 2);
        handle.position.set(0, place.pos.y, 0);
        legs.children.forEach((l) => { const a = l.userData.a; const foot = new THREE.Vector3(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35), top = new THREE.Vector3(0, place.pos.y - 0.12, 0); l.position.copy(foot).add(top).multiplyScalar(0.5); l.scale.y = foot.distanceTo(top); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize()); });
        const k = `${Math.round(s.cam)}|${s.size}|${s.who}|${crossed}|${side(pm)}|${side(pn)}`;
        if (k !== key) {
          key = k;
          B.card.redraw({ title: crossed ? 'YOUR CAMERA · crossed the line!' : 'YOUR CAMERA · safe side', sub: `Nana ${side(pn)}, Meera ${side(pm)}`, col: crossed ? '#ff5a6e' : '#38bdf8' });
        }
        const flip = crossed ? 0xff4757 : 0x38bdf8;
        handle.material.color.setHex(flip);
        const lay = tallStage(stage) ? 'tall' : 'wide';
        if (lay !== last) {
          last = lay;
          if (lay === 'tall') { A.group.position.set(0, 8.9, -4.6); B.group.position.set(0, 5.6, -4.6); [A, B].forEach((f) => { f.group.rotation.set(-0.25, 0, 0); f.group.scale.setScalar(1.25); }); stage.setView([0.2, 9.4, 6.4], [0.2, 4.6, -1.5], 0.6); }
          else { A.group.position.set(...WA); B.group.position.set(...WB); wide(); }
        }
        fitNarrow(stage, [lblA, lblB], -0.2);
        camLbl.visible = !drag;
      },
      readout(s) {
        const u = SETUPS.find((x) => x.id === s.setup);
        return `<div class="big">${info.crossed ? '<span style="color:#ff5a6e">Crossed the line</span>' : 'On the safe side'}</div>
          <div class="row"><span>Set-up</span><b>${u ? u.name : 'Your own position'}</b></div>
          <div class="row"><span>Meera on screen</span><b>${side(info.pm)}${info.crossed && side(info.pm) === 'left' ? ' (was right)' : ''}</b></div>
          <div class="row"><span>Nana on screen</span><b>${side(info.pn)}${info.crossed && side(info.pn) === 'right' ? ' (was left)' : ''}</b></div>
          <div class="row"><span>Camera distance</span><b>${(info.dist || 0).toFixed(1)} m</b></div>`;
      },
      dispose() {
        shooter.dispose(); stage.floor.visible = true; stage.controls.enabled = true; stage.setShift(0, 0);
        el.removeEventListener('pointerdown', down, true); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      },
    };
  },
};
