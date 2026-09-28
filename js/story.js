// Shared parts for StoryboardClear: canvas boards, a Mumbai rooftop set with two faceless mannequins
// (Meera, 11, and her grandfather Nana), a torn kite, a virtual film camera that frames shots by size
// and angle, and "panels" that render that camera's view into a pencil-sketch storyboard frame.
//
// The story, characters, script and every frame here are original to this box. Nothing copies a real
// film's script, characters or storyboards.
//
// Scenes are built in metres: +x to the right, +y up, +z towards the default viewer. The set is a flat
// chawl terrace whose top is y = 0. The line between Meera and Nana (the "180-degree line") runs along x.
//
// Camera numbers: the virtual camera is a 35 mm lens on a Super 35 digital sensor used at 16:9,
// about 24.9 × 14.0 mm (ARRI Alexa 35 / RED Super 35 class sensors are about 25 mm wide). Its vertical
// field of view is 2·atan(7.0 / 35) ≈ 22.6°, horizontal 2·atan(12.45 / 35) ≈ 39.2°.
// Shot sizes follow the usual definitions (e.g. StudioBinder, "Ultimate Guide to Camera Shots"; Mascelli,
// The Five C's of Cinematography, 1965): an extreme wide shot shows the whole place, a wide shot the whole
// body, a medium shot from the waist up, a close-up the face, an extreme close-up one detail.
import { THREE, M, box, beam, sphere, clamp, lerp } from './kit.js';

export const D2R = Math.PI / 180;
export const TAU = Math.PI * 2;
export const SENSOR = { w: 24.9, h: 14.0 };                // mm, Super 35 at 16:9
export const FOCAL = 35;                                   // mm
export const VFOV = 2 * Math.atan(SENSOR.h / 2 / FOCAL);   // radians, ≈ 22.6°
export const HFOV = 2 * Math.atan(SENSOR.w / 2 / FOCAL);   // radians, ≈ 39.2°

// ---------------------------------------------------------------- boards (after FanClear / FilmClear)
export const COL = {
  c: '#38bdf8', hot: '#ffd166', warm: '#ffb547', red: '#ff5a6e', good: '#7be08c', bad: '#ff5a8a',
  violet: '#c49bff', mint: '#5ce1a9', soft: 'rgba(255,255,255,.62)', dim: 'rgba(255,255,255,.4)',
};
export const SANS = 'Geist, system-ui, sans-serif';
export const MONO = '"Courier New", Courier, monospace';
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.93)'; g.fillRect(0, 0, w, h); }
export function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function text(g, s, x, y, { font = `18px ${SANS}`, col = 'rgba(255,255,255,.82)', align = 'left' } = {}) {
  g.font = font; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left';
}
export function wrap(g, s, x, y, maxW, lh, opts = {}) {
  g.font = opts.font || `18px ${SANS}`;
  const words = s.split(' '); let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { text(g, line, x, yy, opts); line = w; yy += lh; } else line = t;
  }
  if (line) text(g, line, x, yy, opts);
  return yy + lh;
}
// A flat canvas board in the scene.
export function board(root, w, h, pxW, pxH, draw, pos, { opaque = false } = {}) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = (...a) => { draw(g, pxW, pxH, ...a); tex.needsUpdate = true; };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !opaque, toneMapped: false, side: THREE.DoubleSide }));
  if (pos) m.position.set(...pos);
  root.add(m);
  redraw();
  return { tex, redraw, canvas: c, mesh: m };
}

// ---------------------------------------------------------------- stage helpers
export const inReel = () => document.body.classList.contains('gb-reel');
export const tallStage = (stage) => stage.host.clientWidth / Math.max(1, stage.host.clientHeight) < 0.9;
export const narrowStage = (stage) => stage.host.clientWidth < 560;
// Hide minor labels on a phone and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = [], y0 = -0.1) {
  const narrow = narrowStage(stage);
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? y0 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Set a range/seg control in the side panel as if the viewer moved it, so the readout and UI stay in step.
export function setControl(label, value) {
  const inp = [...document.querySelectorAll('#panel input[type=range]')].find((x) => x.getAttribute('aria-label') === label);
  if (inp) { inp.value = value; inp.dispatchEvent(new Event('input')); return true; }
  const b = [...document.querySelectorAll('#panel .seg')].find((x) => x.getAttribute('aria-label') === label)?.querySelector(`button[data-v="${value}"]`);
  if (b) { b.click(); return true; }
  return false;
}
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// Point a group whose front is +x towards (x, z) on the floor.
export function face(obj, x, z) { obj.rotation.y = Math.atan2(-(z - obj.position.z), x - obj.position.x); }

// ---------------------------------------------------------------- people
// A faceless mannequin, feet at the origin, facing +x. s = 1 is about 1.75 m tall.
// pose({ armL, armR, elbowL, elbowR, kneel, lean, head }) : angles in radians, kneel 0..1.
export function makePerson({ shirt = 0x3b6fd8, pants = 0x2b3242, skin = 0xc99b77, hair = 0x1c1a1a, s = 1, braid = false } = {}) {
  const g = new THREE.Group(), pelvis = new THREE.Group(), body = new THREE.Group();
  g.add(pelvis); pelvis.add(body);
  const cloth = M.matte(shirt), trousers = M.matte(pants), sk = M.matte(skin, { roughness: 0.6 }), hr = M.matte(hair);
  const hipY = 0.9 * s, T = 0.44 * s;
  pelvis.position.y = hipY;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * s, 0.36 * s, 6, 14), cloth); torso.position.y = 0.3 * s; torso.scale.z = 1.25; torso.castShadow = true; body.add(torso);
  const hipM = new THREE.Mesh(new THREE.CapsuleGeometry(0.15 * s, 0.1 * s, 6, 12), trousers); hipM.scale.z = 1.3; hipM.position.y = 0.02 * s; body.add(hipM);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * s, 0.05 * s, 0.1 * s, 10), sk); neck.position.y = 0.62 * s; body.add(neck);
  const headG = new THREE.Group(); headG.position.y = 0.7 * s; body.add(headG);
  const head = sphere(0.11 * s, sk, 24); head.scale.set(0.95, 1.12, 0.95); head.position.y = 0.07 * s; headG.add(head);
  const nose = sphere(0.022 * s, sk, 10); nose.position.set(0.1 * s, 0.07 * s, 0); headG.add(nose);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.118 * s, 24, 12, Math.PI * 1.28, Math.PI * 1.44, 0, Math.PI * 0.6), hr);
  cap.scale.set(0.95, 1.12, 0.95); cap.position.y = 0.075 * s; cap.castShadow = true; headG.add(cap);
  if (braid) { const b = sphere(0.045 * s, hr, 12); b.position.set(-0.12 * s, 0.02 * s, 0); headG.add(b); const b2 = sphere(0.035 * s, hr, 10); b2.position.set(-0.14 * s, -0.06 * s, 0); headG.add(b2); }
  const limb = (len, r, mat) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 4, 10), mat); m.position.y = -len / 2; m.castShadow = true; p.add(m); return p; };
  const arms = [-1, 1].map((z) => {
    const up = limb(0.3 * s, 0.05 * s, cloth); up.position.set(0, 0.52 * s, z * 0.22 * s); body.add(up);
    const fore = limb(0.3 * s, 0.045 * s, sk); fore.position.y = -0.3 * s; up.add(fore);
    const hand = sphere(0.05 * s, sk, 12); hand.position.y = -0.3 * s; fore.add(hand);
    up.fore = fore; up.hand = hand; return up;
  });
  const legs = [-1, 1].map((z) => {
    const th = limb(T, 0.07 * s, trousers); th.position.set(0, 0, z * 0.1 * s); pelvis.add(th);
    const sh = limb(0.46 * s, 0.06 * s, trousers); sh.position.y = -T; th.add(sh);
    const shoe = box(0.22 * s, 0.07 * s, 0.1 * s, M.matte(0x2a2420)); shoe.position.set(0.05 * s, -0.43 * s, 0); sh.add(shoe);
    th.shin = sh; return th;
  });
  g.pose = ({ armL = 0, armR = armL, elbowL = 0, elbowR = elbowL, kneel = 0, lean = 0, head: hd = 0 } = {}) => {
    arms[0].rotation.z = armL; arms[1].rotation.z = armR;
    arms[0].fore.rotation.z = elbowL; arms[1].fore.rotation.z = elbowR;
    pelvis.position.y = hipY - kneel * T;
    // One knee down: front (left) thigh swings forward, both shins fold back.
    legs[0].rotation.z = kneel * Math.PI / 2; legs[0].shin.rotation.z = -kneel * Math.PI / 2;
    legs[1].rotation.z = 0; legs[1].shin.rotation.z = -kneel * Math.PI / 2;
    body.rotation.z = -lean; headG.rotation.z = hd;
  };
  g.pose();
  g.arms = arms; g.head = head; g.headG = headG; g.height = 1.75 * s; g.s = s;
  g.eye = (v = new THREE.Vector3()) => { g.updateMatrixWorld(true); return head.getWorldPosition(v); };
  g.handsMid = (v = new THREE.Vector3()) => { g.updateMatrixWorld(true); const a = arms[0].hand.getWorldPosition(new THREE.Vector3()); return arms[1].hand.getWorldPosition(v).add(a).multiplyScalar(0.5); };
  return g;
}

// ---------------------------------------------------------------- the kite
// An Indian fighter kite (patang): a square diamond of paper about 50 cm across, a bamboo spine and a
// bow. torn = 0..1 folds the bottom half back along a snapped spine; fixed shows the tape splint.
export function makeKite(color = 0xd9303a, size = 0.5) {
  const g = new THREE.Group(), a = size / 2;
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#' + color.toString(16).padStart(6, '0'); x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#ffd166'; x.beginPath(); x.arc(64, 64, 22, 0, TAU); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide });
  const tri = (pts) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(pts.map((p) => [p[0] / size + 0.5, p[1] / size + 0.5]).flat(), 2)); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m; };
  const top = tri([[0, a, 0], [-a, 0, 0], [a, 0, 0]]);
  const low = new THREE.Group(); low.add(tri([[-a, 0, 0], [0, -a, 0], [a, 0, 0]]));
  const cane = M.matte(0xc9a66b);
  const spineTop = beam([0, 0, 0.004], [0, a, 0.004], 0.005, cane, 6);
  const spineLow = beam([0, 0, 0.004], [0, -a, 0.004], 0.005, cane, 6); low.add(spineLow);
  const bowPts = []; for (let i = 0; i <= 16; i++) { const u = i / 16 * 2 - 1; bowPts.push(new THREE.Vector3(u * a, a * 0.28 * (1 - u * u), 0.006)); }
  const bow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bowPts), 24, 0.004, 5), cane);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 3), mat); tail.rotation.z = Math.PI; tail.position.y = -a - 0.05; low.add(tail);
  const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 10), M.matte(0xf2efe6)); tape.position.set(0, 0, 0.006);
  g.add(top, low, spineTop, bow, tape);
  g.set = ({ torn = 0, fixed = false } = {}) => { low.rotation.x = -torn * 1.0; tape.visible = fixed; };
  g.set();
  return g;
}

// ---------------------------------------------------------------- props
// A cine camera with its lens along +x, about 45 cm long.
export function makeCineCamera(color = 0x2a2d34) {
  const g = new THREE.Group(), dark = M.matte(color), metal = M.metal(0x9aa3b2, { roughness: 0.35 });
  g.add(box(0.3, 0.2, 0.16, dark));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.18, 24), M.matte(0x16181d)); lens.rotation.z = -Math.PI / 2; lens.position.x = 0.24; g.add(lens);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.03, 24), metal); ring.rotation.z = -Math.PI / 2; ring.position.x = 0.22; g.add(ring);
  const matte = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.08, 4, 1, true), M.matte(0x111216, { side: THREE.DoubleSide })); matte.rotation.z = -Math.PI / 2; matte.rotation.x = Math.PI / 4; matte.position.x = 0.37; g.add(matte);
  const handle = box(0.22, 0.03, 0.03, metal); handle.position.y = 0.15; g.add(handle);
  const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 24), dark); mag.rotation.x = Math.PI / 2; mag.position.set(-0.05, 0.08, 0.1); g.add(mag);
  const tally = sphere(0.014, M.glow(0xff3344), 10); tally.position.set(0.1, 0.1, 0.08); g.add(tally);
  return g;
}

// ---------------------------------------------------------------- the set
// A chawl terrace in Mumbai on Makar Sankranti: parapets, a stair room with a door, a black water tank,
// a washing line, neighbouring buildings and kites in the sky.
// Beats of the scene (see SCRIPT): 0 sky, 1 alone, 2 "It was winning", 3 Nana arrives, 4 the splint, 5 it flies.
export const MEERA_AT = [0.75, 0.2], NANA_AT = [-0.55, 0.2], DOOR = [-3.7, -2.05], LINE_Z = 0.2;
export function makeRooftop() {
  const g = new THREE.Group();
  const conc = M.matte(0x8f8a82), wallM = M.matte(0xb9ae9c), dark = M.matte(0x3a3530);
  const slab = box(10, 0.3, 10, conc); slab.position.y = -0.15; g.add(slab);
  const skirt = box(10.02, 20, 10.02, M.matte(0xa89f8e)); skirt.position.y = -10.3; g.add(skirt);
  for (const [w, d, x, z] of [[10, 0.2, 0, -4.9], [0.2, 10, -4.9, 0], [0.2, 10, 4.9, 0]]) { const p = box(w, 0.9, d, wallM); p.position.set(x, 0.45, z); g.add(p); }
  // Stair room with a door facing +z.
  const room = box(2.2, 2.5, 2.0, M.matte(0xc8b9a0)); room.position.set(DOOR[0], 1.25, -3.3); g.add(room);
  const door = box(0.9, 2.0, 0.06, M.matte(0x3f6f8f)); door.position.set(DOOR[0] + 0.2, 1.0, -2.28); g.add(door);
  const knob = sphere(0.03, M.metal(0xd8c070), 8); knob.position.set(DOOR[0] + 0.55, 1.0, -2.24); g.add(knob);
  // Black plastic water tank on a stand.
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.3, 32), M.plastic(0x1d1f22)); tank.position.set(3.6, 1.25, -3.7); tank.castShadow = true; g.add(tank);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 20), M.plastic(0x1d1f22)); lid.position.set(3.6, 1.95, -3.7); g.add(lid);
  const stand = box(1.6, 0.6, 1.6, conc); stand.position.set(3.6, 0.3, -3.7); g.add(stand);
  // Washing line with clothes.
  const pole = M.metal(0x6b6f76);
  g.add(beam([-1.6, 0, -4.5], [-1.6, 1.95, -4.5], 0.03, pole), beam([1.9, 0, -4.5], [1.9, 1.95, -4.5], 0.03, pole), beam([-1.6, 1.9, -4.5], [1.9, 1.9, -4.5], 0.008, M.matte(0xdddddd)));
  [[0xe8b04a, -1.1, 0.7], [0x4a90d9, -0.2, 0.9], [0xd96aa0, 0.7, 0.6], [0xf2f0ea, 1.4, 0.8]].forEach(([c, x, h]) => {
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.62, h), M.matte(c, { side: THREE.DoubleSide })); cl.position.set(x, 1.9 - h / 2, -4.5); cl.castShadow = true; g.add(cl);
  });
  // Neighbouring buildings (none on the +z side, where the cameras usually stand).
  const r = rng(7), cols = [0xa89a80, 0x8494a2, 0xa08480, 0xb0a898, 0x7f9080, 0x9a90a8, 0x958670];
  for (let i = 0; i < 46; i++) {
    const ang = r() * TAU, rad = 14 + r() * 38, x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    if (z > -4) continue;
    const top = -9 + r() * 15, w = 5 + r() * 8, d = 5 + r() * 8;
    const b = box(w, top + 40, d, M.matte(cols[i % cols.length])); b.position.set(x, (top - 40) / 2, z); b.castShadow = false; g.add(b);
    if (r() < 0.6) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16), M.plastic(0x1d1f22)); t.position.set(x + (r() - 0.5) * w * 0.6, top + 0.6, z + (r() - 0.5) * d * 0.6); g.add(t); }
  }
  // Other people's kites in the sky.
  const skyKites = [];
  for (let i = 0; i < 9; i++) {
    const k = makeKite([0x3f7ad9, 0x2fb37a, 0xf2a93b, 0x9b59d0, 0xe24a6a][i % 5], 0.9);
    k.position.set(-22 + i * 5.5 + r() * 3, 12 + r() * 16, -14 - r() * 18); k.rotation.z = (r() - 0.5) * 0.6;
    k.userData.ph = r() * TAU; k.userData.y0 = k.position.y; g.add(k); skyKites.push(k);
  }

  const meera = makePerson({ shirt: 0xe0584f, pants: 0x3b3f6b, s: 0.78, braid: true });
  const nana = makePerson({ shirt: 0xeee8da, pants: 0xd9d0bc, hair: 0xd0d0cc, s: 1.0 });
  g.add(meera, nana);
  const kite = makeKite(); g.add(kite);
  const tape = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.015, 8, 18), M.matte(0xf2efe6)); g.add(tape);
  const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const stringGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const string = new THREE.Line(stringGeo, stringMat); g.add(string);

  const set = { group: g, meera, nana, kite, beat: -1 };
  const tmp = new THREE.Vector3();
  set.setBeat = (b, t = 0, time = 0) => {
    set.beat = b;
    meera.position.set(MEERA_AT[0], 0, MEERA_AT[1]);
    nana.visible = b >= 3;
    string.visible = false; tape.visible = false;
    if (b <= 2) {
      face(meera, 0.3, 4); meera.pose({ armL: 0.9, elbowL: 0.7, head: b === 2 ? 0.05 : -0.35 });
    } else if (b === 3) {
      face(meera, DOOR[0], DOOR[1]); meera.pose({ armL: 0.8, elbowL: 0.6, head: 0 });
      nana.position.set(DOOR[0] + 0.2, 0, DOOR[1]); face(nana, MEERA_AT[0], MEERA_AT[1]);
      nana.pose({ armL: 0.1, armR: 0.9, elbowR: 0.8, lean: 0.12 });
      tape.visible = true;
    } else {
      face(meera, NANA_AT[0], NANA_AT[1]);
      nana.position.set(NANA_AT[0], 0, NANA_AT[1]); face(nana, MEERA_AT[0], MEERA_AT[1]);
      if (b === 4) { meera.pose({ armL: 0.25, head: -0.35 }); nana.pose({ armL: 0.95, elbowL: 0.55, kneel: 1, head: -0.35 }); }
      else { const up = clamp(t * 3, 0, 1); meera.pose({ armL: 0.2 + up * 0.5, head: 0.2 + up * 0.5 }); nana.pose({ armL: 0.9 + up * 1.9, elbowL: 0.5 - up * 0.5, head: 0.1 + up * 0.6 }); }
    }
    // Where the kite is.
    kite.rotation.set(0, 0, 0);
    if (b <= 3) {
      meera.handsMid(tmp); kite.position.copy(tmp); kite.rotation.y = meera.rotation.y + Math.PI / 2; kite.rotation.x = -0.25;
      kite.position.add(new THREE.Vector3(Math.cos(meera.rotation.y), 0, -Math.sin(meera.rotation.y)).multiplyScalar(0.06));
      kite.set({ torn: 1, fixed: false });
      if (b === 3) nana.arms[1].hand.getWorldPosition(tape.position);
    } else if (b === 4) {
      nana.handsMid(tmp); kite.position.copy(tmp).add(new THREE.Vector3(0.12, 0.05, 0));
      kite.rotation.y = nana.rotation.y + Math.PI / 2; kite.rotation.x = -0.9;
      kite.set({ torn: 0, fixed: true });
    } else {
      nana.handsMid(tmp); const up = smoothK(t);
      const sky = new THREE.Vector3(-2.5, 13, -9);
      kite.position.copy(tmp).lerp(sky, up); kite.position.y += 0.15;
      kite.rotation.y = Math.PI / 2 * (1 - up); kite.rotation.z = Math.sin(time * 2.1) * 0.15 * up; kite.rotation.x = -0.2;
      kite.set({ torn: 0, fixed: true });
      if (up > 0.02) { string.visible = true; const p = stringGeo.attributes.position; p.setXYZ(0, tmp.x, tmp.y, tmp.z); p.setXYZ(1, kite.position.x, kite.position.y - 0.2, kite.position.z); p.needsUpdate = true; stringGeo.computeBoundingSphere(); }
    }
    skyKites.forEach((k, i) => { k.position.y = k.userData.y0 + Math.sin(time * 0.9 + k.userData.ph) * 0.4; k.rotation.z = Math.sin(time * 1.3 + i) * 0.2; });
    g.updateMatrixWorld(true);
  };
  set.setBeat(0);
  return set;
}
const smoothK = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

// ---------------------------------------------------------------- shots
export const SIZES = [
  { id: 'EWS', name: 'Extreme wide', what: 'the whole place; people are tiny' },
  { id: 'WS', name: 'Wide', what: 'the whole body, head to feet' },
  { id: 'MS', name: 'Medium', what: 'from the waist up' },
  { id: 'CU', name: 'Close-up', what: 'the face fills the frame' },
  { id: 'ECU', name: 'Extreme close-up', what: 'one detail: eyes, hands, an object' },
];
export const ANGLES = [
  { id: 'eye', name: 'Eye level', el: 0, roll: 0, what: 'neutral, like standing there' },
  { id: 'low', name: 'Low angle', el: -24, roll: 0, what: 'looks up: the subject feels big and strong' },
  { id: 'high', name: 'High angle', el: 32, roll: 0, what: 'looks down: the subject feels small' },
  { id: 'dutch', name: 'Dutch angle', el: 4, roll: 18, what: 'the horizon tilts: something feels wrong' },
];
export const MOVES = [
  { id: 'none', name: 'Still', what: 'the camera does not move' },
  { id: 'pan', name: 'Pan', what: 'the camera turns left or right on the tripod' },
  { id: 'tilt', name: 'Tilt', what: 'the camera nods up or down on the tripod' },
  { id: 'dolly', name: 'Dolly in', what: 'the whole camera rolls towards the subject' },
  { id: 'track', name: 'Track', what: 'the whole camera slides sideways, alongside the action' },
];
export const sizeIdx = (id) => Math.max(0, SIZES.findIndex((x) => x.id === id));
export const angleIdx = (id) => Math.max(0, ANGLES.findIndex((x) => x.id === id));

// Who a shot is about, and where the camera goes to see their face (az: 0 = from +z, the front).
function subjectOf(set, who) {
  const m = set.meera, n = set.nana, b = set.beat;
  const out = { aim: new THREE.Vector3(), h: 1.37, eye: new THREE.Vector3(), az: 0 };
  if (who === 'kite') { out.eye.copy(set.kite.position); out.h = 0.55; out.az = b >= 4 ? 20 : -20; out.kite = true; }
  else if (who === 'nana' && n.visible) { n.eye(out.eye); out.h = n.height * (b === 4 ? 0.66 : 1); out.az = b === 3 ? 25 : 55; out.feet = n.position; }
  else if (who === 'both' && n.visible) { const a = m.eye(new THREE.Vector3()), c = n.eye(new THREE.Vector3()); out.eye.copy(a).add(c).multiplyScalar(0.5); out.h = 1.75; out.az = b === 3 ? 20 : 0; out.feet = new THREE.Vector3((m.position.x + n.position.x) / 2, 0, (m.position.z + n.position.z) / 2); out.both = true; }
  else { m.eye(out.eye); out.h = m.height; out.az = b <= 2 ? -12 : b === 3 ? -35 : -55; out.feet = m.position; }
  return out;
}
// Place the virtual camera for a shot spec { size, angle, subject, az?, move, beat } at move progress t.
export function placeShot(set, spec, t = 0.5) {
  const sub = subjectOf(set, spec.subject || 'meera');
  const size = spec.size || 'WS', ang = ANGLES[angleIdx(spec.angle || 'eye')];
  const feetY = 0, h = sub.h, aim = new THREE.Vector3();
  let H;   // how much height the frame shows, in metres
  if (sub.kite) { H = { EWS: 16, WS: 2.6, MS: 1.1, CU: 0.62, ECU: 0.2 }[size]; aim.copy(sub.eye); if (size === 'EWS' || size === 'WS') aim.y = Math.max(aim.y, sub.eye.y * 0.6 + 0.4); }
  else if (size === 'EWS') { H = 16; aim.set(sub.eye.x, 1.2, sub.eye.z); }
  else if (size === 'WS') { H = sub.both ? (set.beat === 4 ? 1.9 : 2.5) : h * 1.3; aim.set(sub.eye.x, feetY + (sub.both ? H * 0.45 : h * 0.5), sub.eye.z); }
  else if (size === 'MS') { H = sub.both ? 1.4 : h * 0.6; aim.copy(sub.eye); aim.y -= H * 0.3; }
  else if (size === 'CU') { H = 0.42; aim.copy(sub.eye); aim.y -= 0.03; }
  else { H = 0.15; aim.copy(sub.eye); aim.y += 0.01; }
  let d = H / (2 * Math.tan(VFOV / 2));
  let azd = spec.az ?? sub.az;
  if (spec.side === 'B') azd = 180 - azd;          // the mirror position, across the line (which runs along x)
  const az = azd * D2R, el = ang.el * D2R;
  const mv = spec.move || 'none', k = smoothK(t);
  if (mv === 'dolly') d *= lerp(1.45, 0.82, k);
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const pos = aim.clone().addScaledVector(dir, d);
  if (pos.y < 0.14) pos.y = 0.14;                     // the camera cannot go through the roof
  const target = aim.clone();
  const side = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));   // screen-right, seen from the camera
  if (mv === 'track') { const off = lerp(-0.35, 0.35, k) * d; pos.addScaledVector(side, off); target.addScaledVector(side, off * 0.4); }
  if (mv === 'pan' || mv === 'tilt') {
    const look = target.clone().sub(pos), L = look.length();
    const yaw = mv === 'pan' ? lerp(22, -8, k) * D2R : 0, pitch = mv === 'tilt' ? lerp(-4, 42, k) * D2R : 0;
    look.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const right = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0, 1, 0)).normalize();
    look.applyAxisAngle(right, pitch);
    target.copy(pos).addScaledVector(look.normalize(), L);
  }
  return { pos, target, roll: ang.roll * D2R, dist: pos.distanceTo(sub.eye), H, sub };
}

// ---------------------------------------------------------------- panels
// The pencil-sketch look: edges from a Sobel filter plus two directions of hatching in the darker tones.
const SKETCH_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKETCH_FS = `
uniform sampler2D tMap; uniform vec2 uRes; uniform float uSketch;
varying vec2 vUv;
vec3 enc(vec3 c){ return pow(clamp(c,0.0,1.0), vec3(1.0/2.2)); }
float L(vec2 uv){ return dot(enc(texture2D(tMap, uv).rgb), vec3(0.299,0.587,0.114)); }
void main(){
  vec2 px = 1.0 / uRes;
  float tl=L(vUv+px*vec2(-1.,1.)), t=L(vUv+px*vec2(0.,1.)), tr=L(vUv+px*vec2(1.,1.));
  float l=L(vUv-px*vec2(1.,0.)), c=L(vUv), r=L(vUv+px*vec2(1.,0.));
  float bl=L(vUv-px), b=L(vUv-px*vec2(0.,1.)), br=L(vUv+px*vec2(1.,-1.));
  float gx = -tl-2.0*l-bl+tr+2.0*r+br, gy = -bl-2.0*b-br+tl+2.0*t+tr;
  float e = smoothstep(0.10, 0.42, length(vec2(gx,gy)));
  vec2 p = vUv * uRes;
  float ink = 0.0;
  if (c < 0.66) ink = max(ink, step(0.62, fract((p.x + p.y) / 4.5)) * 0.32);
  if (c < 0.42) ink = max(ink, step(0.62, fract((p.x - p.y) / 4.5)) * 0.45);
  if (c < 0.2) ink = max(ink, 0.55);
  float wash = mix(0.86, 1.0, smoothstep(0.35, 0.8, c));
  float v = (1.0 - max(e * 0.92, ink)) * wash;
  vec3 paper = vec3(0.975, 0.962, 0.93), lead = vec3(0.17, 0.18, 0.22);
  vec3 sketch = mix(lead, paper, v);
  gl_FragColor = vec4(mix(enc(texture2D(tMap, vUv).rgb), sketch, uSketch), 1.0);
}`;
const SKY = new THREE.Color(0xa9cbe6);

// Renders the stage's own scene from a virtual camera into a texture. hide: objects that belong to the
// "crew" (boards, the camera model) and must not appear in the shot.
export class Shooter {
  constructor(stage, pxW = 640, pxH = 360) {
    this.stage = stage; this.pxW = pxW; this.pxH = pxH;
    this.cam = new THREE.PerspectiveCamera(VFOV / D2R, 16 / 9, 0.05, 600);
    this.hide = []; this.panels = [];
  }
  panel(w, h) {
    const rt = new THREE.WebGLRenderTarget(this.pxW, this.pxH, { samples: 4 });
    const mat = new THREE.ShaderMaterial({ vertexShader: SKETCH_VS, fragmentShader: SKETCH_FS, uniforms: { tMap: { value: rt.texture }, uRes: { value: new THREE.Vector2(this.pxW, this.pxH) }, uSketch: { value: 1 } }, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const p = { rt, mat, mesh, sketch: (k) => { mat.uniforms.uSketch.value = k; } };
    this.panels.push(p); this.hide.push(mesh);
    return p;
  }
  aim(place) {
    const c = this.cam;
    c.position.copy(place.pos); c.up.set(0, 1, 0); c.lookAt(place.target); c.rotateZ(place.roll || 0);
    c.updateMatrixWorld(true);
    return c;
  }
  shoot(panel, place) {
    const st = this.stage, r = st.renderer, sc = st.scene;
    this.aim(place);
    const vis = this.hide.map((o) => o.visible), fl = st.floor.visible, bg = sc.background;
    this.hide.forEach((o) => { o.visible = false; }); st.floor.visible = false; sc.background = SKY;
    r.setRenderTarget(panel.rt); r.clear(); r.render(sc, this.cam); r.setRenderTarget(null);
    this.hide.forEach((o, i) => { o.visible = vis[i]; }); st.floor.visible = fl; sc.background = bg;
  }
  // Where a world point lands in the frame: x, y from -1 (left/bottom) to 1.
  project(v) { return v.clone().project(this.cam); }
  dispose() { this.panels.forEach((p) => p.rt.dispose()); }
}

// A storyboard frame: a dark card with a header, the sketch screen, and a see-through overlay canvas for
// the camera-move arrows drawn over the picture, as storyboard artists do.
export function makeFrame(root, shooter, w, h, pos, { header = 0.5 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); root.add(g);
  const pad = 0.12;
  const card = board(g, w + pad * 2, h + pad * 2 + header, 512, Math.round(512 * (h + pad * 2 + header) / (w + pad * 2)), (x, W, H, o = {}) => {
    x.clearRect(0, 0, W, H); rrect(x, 2, 2, W - 4, H - 4, 14); x.fillStyle = 'rgba(12,14,20,.95)'; x.fill();
    x.lineWidth = 4; x.strokeStyle = o.col || 'rgba(255,255,255,.25)'; x.stroke();
    const k = W / (w + pad * 2);
    text(x, o.title || '', 16, header * k * 0.5 + 4, { font: `600 ${Math.round(header * k * 0.36)}px ${SANS}`, col: o.col || '#e8eef8' });
    if (o.sub) text(x, o.sub, W - 16, header * k * 0.5 + 4, { font: `${Math.round(header * k * 0.3)}px ${SANS}`, col: 'rgba(255,255,255,.65)', align: 'right' });
  }, [0, -header / 2, 0]);
  card.mesh.position.set(0, header / 2, -0.01);
  const p = shooter.panel(w, h); g.add(p.mesh);
  const over = board(g, w, h, 640, 360, drawMoveArrows, [0, 0, 0.01]);
  shooter.hide.push(g);
  return { group: g, card, panel: p, over, w, h };
}
// Storyboard arrows for camera moves, drawn over the picture.
export function drawMoveArrows(x, W, H, move = 'none', roll = 0) {
  x.clearRect(0, 0, W, H);
  if (!move || move === 'none') { if (roll) tag(x, W, H, 'DUTCH'); return; }
  x.strokeStyle = '#e0453a'; x.fillStyle = '#e0453a'; x.lineWidth = 7; x.lineCap = 'round';
  const head = (ax, ay, ang) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax - 26 * Math.cos(ang - 0.45), ay - 26 * Math.sin(ang - 0.45)); x.lineTo(ax - 26 * Math.cos(ang + 0.45), ay - 26 * Math.sin(ang + 0.45)); x.closePath(); x.fill(); };
  if (move === 'pan') { x.beginPath(); x.moveTo(W * 0.72, H * 0.14); x.quadraticCurveTo(W * 0.5, H * 0.06, W * 0.26, H * 0.14); x.stroke(); head(W * 0.24, H * 0.15, Math.PI + 0.35); tag(x, W, H, 'PAN'); }
  if (move === 'tilt') { x.beginPath(); x.moveTo(W * 0.9, H * 0.78); x.quadraticCurveTo(W * 0.95, H * 0.5, W * 0.9, H * 0.2); x.stroke(); head(W * 0.9, H * 0.18, -Math.PI / 2 - 0.3); tag(x, W, H, 'TILT UP'); }
  if (move === 'track') { x.beginPath(); x.moveTo(W * 0.2, H * 0.9); x.lineTo(W * 0.8, H * 0.9); x.stroke(); head(W * 0.82, H * 0.9, 0); tag(x, W, H, 'TRACK'); }
  if (move === 'dolly') {
    x.lineWidth = 5;
    for (const [cx, cy, s] of [[0.1, 0.12, 1], [0.9, 0.12, -1], [0.1, 0.88, 1], [0.9, 0.88, -1]]) {
      const x0 = W * cx, y0 = H * cy, x1 = x0 + s * W * 0.1, y1 = y0 + (cy < 0.5 ? 1 : -1) * H * 0.12;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); head(x1, y1, Math.atan2(y1 - y0, x1 - x0));
    }
    tag(x, W, H, 'DOLLY IN');
  }
  if (roll) tag(x, W, H, 'DUTCH', true);
}
function tag(x, W, H, s, second = false) {
  x.font = `700 26px ${SANS}`; const w = x.measureText(s).width + 20, y = second ? 52 : 12;
  x.fillStyle = 'rgba(224,69,58,.92)'; rrect(x, W - w - 12, y, w, 34, 6); x.fill();
  x.fillStyle = '#fff'; x.fillText(s, W - w - 2, y + 26);
}

// Frustum lines from the virtual camera to the corners of its frame at distance d.
export function makeFrustum(color = 0x38bdf8) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(16 * 3).fill(0), 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }));
  lines.frustumCulled = false;
  lines.update = (cam, d) => {
    const hh = Math.tan(VFOV / 2) * d, hw = hh * 16 / 9, p = geo.attributes.position;
    const o = cam.position, c = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => new THREE.Vector3(x, y, -d).applyMatrix4(cam.matrixWorld));
    let i = 0; const put = (v) => { p.setXYZ(i++, v.x, v.y, v.z); };
    for (let k = 0; k < 4; k++) { put(o); put(c[k]); }
    for (let k = 0; k < 4; k++) { put(c[k]); put(c[(k + 1) % 4]); }
    p.needsUpdate = true;
  };
  return lines;
}

// ---------------------------------------------------------------- the scene, as a storyboard
// Six panels for the rooftop scene. dur in seconds. az, where given, overrides the default side.
export const BOARD = [
  { beat: 0, size: 'EWS', angle: 'high', subject: 'meera', move: 'none', dur: 3.5, t: 0.5, cap: 'Kites fill the sky over the rooftops.' },
  { beat: 1, size: 'WS', angle: 'eye', subject: 'meera', move: 'dolly', dur: 3, t: 0.5, cap: 'Meera, alone, with her torn kite.' },
  { beat: 2, size: 'CU', angle: 'eye', subject: 'meera', move: 'none', dur: 2.5, t: 0.5, cap: 'MEERA: "It was winning."' },
  { beat: 3, size: 'MS', angle: 'low', subject: 'nana', move: 'pan', dur: 3, t: 0.5, cap: 'The door bangs. Nana climbs out.' },
  { beat: 4, size: 'MS', angle: 'eye', subject: 'nana', az: 80, move: 'none', dur: 4, t: 0.5, cap: 'Over Meera\'s shoulder: Nana splints it.' },
  { beat: 5, size: 'WS', angle: 'low', subject: 'nana', move: 'tilt', dur: 4.5, t: 0.75, cap: 'The wind lifts the kite into the sky.' },
];
export const PAGE_LINES = 54;   // lines of text on a US Letter screenplay page (66 lines at 6 per inch, minus 1-inch top and bottom margins)
