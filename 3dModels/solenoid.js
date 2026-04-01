import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Renderer ───────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
const root = document.getElementById('root') ?? document.body;
root.appendChild(renderer.domElement);

// ─── Scene / Camera ─────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e1a);
scene.fog = new THREE.FogExp2(0x0a0e1a, 0.04);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 200);
camera.position.set(6, 4, 9);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.5, 0);
controls.minDistance = 3;
controls.maxDistance = 20;

// ─── Lighting ────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x1a2040, 1.5);
ambient.name = 'ambientLight';
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.5);
keyLight.position.set(8, 12, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.bias = -0.001;
keyLight.shadow.normalBias = 0.02;
keyLight.name = 'keyLight';
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x4060ff, 0.8);
fillLight.position.set(-6, 4, -4);
fillLight.name = 'fillLight';
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x00c8ff, 0.6);
rimLight.position.set(0, 6, -8);
rimLight.name = 'rimLight';
scene.add(rimLight);

const glowPointLight = new THREE.PointLight(0xff6600, 0, 6);
glowPointLight.position.set(0, 0.8, 0);
glowPointLight.name = 'glowPointLight';
scene.add(glowPointLight);

// ─── Lab Table ───────────────────────────────────────────────────────────────
const tableMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e, roughness: 0.3, metalness: 0.05,
    envMapIntensity: 0.5
});
const tableGeo = new THREE.BoxGeometry(14, 0.18, 8);
const table = new THREE.Mesh(tableGeo, tableMat);
table.name = 'table';
table.position.set(0, -0.09, 0);
table.receiveShadow = true;
scene.add(table);

// Table edge highlight
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.2, metalness: 0.3 });
const edgeGeo = new THREE.BoxGeometry(14, 0.02, 8);
const tableEdge = new THREE.Mesh(edgeGeo, edgeMat);
tableEdge.name = 'tableEdge';
tableEdge.position.set(0, 0.0, 0);
scene.add(tableEdge);

// Table legs
const legMat = new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.4, metalness: 0.6 });
[[-5.8, -1.2, -3.2], [5.8, -1.2, -3.2], [-5.8, -1.2, 3.2], [5.8, -1.2, 3.2]].forEach((p, i) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8), legMat);
    leg.name = `tableLeg${i}`;
    leg.position.set(...p);
    leg.castShadow = true;
    scene.add(leg);
});

// Grid lines on table
const gridHelper = new THREE.GridHelper(12, 24, 0x2a3050, 0x1e2440);
gridHelper.position.y = 0.005;
gridHelper.name = 'gridHelper';
scene.add(gridHelper);

// ─── Iron Rod (Core) ─────────────────────────────────────────────────────────
const ironMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a5a, roughness: 0.35, metalness: 0.92,
    envMapIntensity: 1.0
});
const ironGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.6, 32);
const ironRod = new THREE.Mesh(ironGeo, ironMat);
ironRod.name = 'ironRod';
ironRod.rotation.z = Math.PI / 2;
ironRod.position.set(0, 0.22, 0);
ironRod.castShadow = true;
ironRod.receiveShadow = true;
scene.add(ironRod);

// Rod end caps
[-1.8, 1.8].forEach((x, i) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 32), ironMat);
    cap.name = `rodCap${i}`;
    cap.rotation.z = Math.PI / 2;
    cap.position.set(x, 0.22, 0);
    cap.castShadow = true;
    scene.add(cap);
});

// ─── Copper Coil ────────────────────────────────────────────────────────────
const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc87533, roughness: 0.15, metalness: 0.95,
    envMapIntensity: 1.2
});
const glowCopperMat = new THREE.MeshStandardMaterial({
    color: 0xff9900, roughness: 0.1, metalness: 0.9,
    emissive: new THREE.Color(0xff6600), emissiveIntensity: 0,
    envMapIntensity: 1.0
});

const coilGroup = new THREE.Group();
coilGroup.name = 'coilGroup';
scene.add(coilGroup);

const TURNS = 36;
const COIL_LENGTH = 3.0;
const COIL_RADIUS = 0.175;
const WIRE_RADIUS = 0.018;

function buildCoil(visible) {
    while (coilGroup.children.length) coilGroup.remove(coilGroup.children[0]);
    const pts = [];
    const totalSteps = TURNS * 64;
    for (let i = 0; i <= totalSteps; i++) {
        const t = i / totalSteps;
        const angle = t * TURNS * Math.PI * 2;
        const x = (t - 0.5) * COIL_LENGTH;
        pts.push(new THREE.Vector3(x, COIL_RADIUS * Math.sin(angle) + 0.22, COIL_RADIUS * Math.cos(angle)));
    }
    const path = new THREE.CatmullRomCurve3(pts);
    const coilGeo = new THREE.TubeGeometry(path, totalSteps, WIRE_RADIUS, 8, false);
    const coil = new THREE.Mesh(coilGeo, glowCopperMat.clone());
    coil.name = 'coilMesh';
    coil.castShadow = true;
    coil.receiveShadow = true;
    coil.visible = visible;
    coilGroup.add(coil);
    return coil;
}

let coilMesh = buildCoil(false);

// ─── Lead Wires ──────────────────────────────────────────────────────────────
function makeLead(pts, name) {
    const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(path, 40, 0.022, 8, false);
    const mat = new THREE.MeshStandardMaterial({ color: 0xc87533, roughness: 0.2, metalness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
}

const leadLeft = makeLead([[-1.5, 0.22, 0], [-2.0, 0.4, 0], [-2.8, 0.5, 0], [-3.5, 0.5, -0.5], [-4.0, 0.3, -1.0]], 'leadLeft');
const leadRight = makeLead([[1.5, 0.22, 0], [2.0, 0.4, 0], [2.8, 0.5, 0], [3.5, 0.5, -0.5], [4.0, 0.3, -1.0]], 'leadRight');

// ─── Power Supply ─────────────────────────────────────────────────────────────
const psuGroup = new THREE.Group();
psuGroup.name = 'psuGroup';
psuGroup.position.set(-4.5, 0.18, -1.2);
scene.add(psuGroup);

const psuBodyMat = new THREE.MeshStandardMaterial({ color: 0x1c2030, roughness: 0.4, metalness: 0.6 });
const psuBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.1), psuBodyMat);
psuBody.name = 'psuBody';
psuBody.castShadow = true;
psuBody.receiveShadow = true;
psuGroup.add(psuBody);

const psuFaceMat = new THREE.MeshStandardMaterial({ color: 0x2a3050, roughness: 0.3, metalness: 0.5 });
const psuFace = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.66), psuFaceMat);
psuFace.name = 'psuFace';
psuFace.rotation.y = -Math.PI / 2;
psuFace.position.x = 0.805;
psuGroup.add(psuFace);

// PSU display glow
const psuDisplayMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88, roughness: 0.1, metalness: 0,
    emissive: new THREE.Color(0x00ff88), emissiveIntensity: 0.5
});
const psuDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), psuDisplayMat);
psuDisplay.name = 'psuDisplay';
psuDisplay.rotation.y = -Math.PI / 2;
psuDisplay.position.set(0.811, 0.1, -0.1);
psuGroup.add(psuDisplay);

// PSU knob
const knobMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
const psuKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), knobMat);
psuKnob.name = 'psuKnob';
psuKnob.rotation.z = Math.PI / 2;
psuKnob.position.set(0.815, 0.1, 0.25);
psuGroup.add(psuKnob);

// Terminals
['red', 'black'].forEach((col, i) => {
    const termMat = new THREE.MeshStandardMaterial({ color: col === 'red' ? 0xff2200 : 0x111111, roughness: 0.3, metalness: 0.8 });
    const term = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), termMat);
    term.name = `psuTerminal${i}`;
    term.rotation.z = Math.PI / 2;
    term.position.set(0.845, -0.1, i === 0 ? 0.2 : -0.2);
    psuGroup.add(term);
});

// Right PSU (second unit)
const psuGroup2 = psuGroup.clone();
psuGroup2.name = 'psuGroup2';
psuGroup2.position.set(4.2, 0.18, -1.2);
scene.add(psuGroup2);

// ─── Magnetic Field Lines ─────────────────────────────────────────────────────
const fieldGroup = new THREE.Group();
fieldGroup.name = 'fieldGroup';
scene.add(fieldGroup);

const fieldLineMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff, transparent: true, opacity: 0, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending
});

const fieldLines = [];
const NUM_FIELD_LINES = 10;
for (let i = 0; i < NUM_FIELD_LINES; i++) {
    const t = i / NUM_FIELD_LINES;
    const r = 0.4 + t * 1.2;
    const pts = [];
    const steps = 60;
    for (let s = 0; s <= steps; s++) {
        const ang = (s / steps) * Math.PI * 2;
        const xOffset = Math.cos(ang) * 2.5;
        const yOffset = Math.sin(ang) * r;
        pts.push(new THREE.Vector3(xOffset, 0.22 + yOffset, 0));
    }
    const path = new THREE.CatmullRomCurve3(pts, true);
    const geo = new THREE.TubeGeometry(path, 80, 0.008, 6, true);
    const mat = fieldLineMat.clone();
    mat.color = new THREE.Color().setHSL(0.58 + t * 0.08, 1, 0.65);
    const fl = new THREE.Mesh(geo, mat);
    fl.name = `fieldLine${i}`;
    fieldGroup.add(fl);
    fieldLines.push(fl);
}

// External arc field lines
for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const pts = [];
    for (let s = 0; s <= 40; s++) {
        const t = s / 40;
        const a = t * Math.PI;
        const x = Math.cos(Math.PI + a) * 2.0;
        const y = 0.22 + Math.sin(a) * (0.8 + i * 0.25);
        const z = Math.sin(angle) * 0.3;
        pts.push(new THREE.Vector3(x, y, z));
    }
    const path = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(path, 40, 0.007, 6, false);
    const mat = fieldLineMat.clone();
    mat.color = new THREE.Color(0x4488ff);
    const fl = new THREE.Mesh(geo, mat);
    fl.name = `arcField${i}`;
    fieldGroup.add(fl);
    fieldLines.push(fl);
}

// ─── Nails ────────────────────────────────────────────────────────────────────
const nailGroup = new THREE.Group();
nailGroup.name = 'nailGroup';
scene.add(nailGroup);

const nailIronMat = new THREE.MeshStandardMaterial({
    color: 0x555565, roughness: 0.4, metalness: 0.88,
    envMapIntensity: 0.8
});
const nailHeadMat = new THREE.MeshStandardMaterial({
    color: 0x666677, roughness: 0.3, metalness: 0.9
});

const nailsData = [];
const NAIL_COUNT = 22;

function createNail(idx) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.4 + Math.random() * 2.2;
    const startX = Math.cos(angle) * dist;
    const startZ = Math.sin(angle) * dist * 0.6;
    const g = new THREE.Group();
    g.name = `nail${idx}`;

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.007, 0.3, 8), nailIronMat);
    shaft.name = `nailShaft${idx}`;
    shaft.castShadow = true;
    g.add(shaft);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), nailHeadMat);
    head.name = `nailHead${idx}`;
    head.position.y = 0.16;
    head.castShadow = true;
    g.add(head);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.04, 8), nailIronMat);
    tip.name = `nailTip${idx}`;
    tip.position.y = -0.17;
    tip.castShadow = true;
    g.add(tip);

    // Random resting orientation on table
    const restRot = (Math.random() - 0.5) * 0.3;
    g.rotation.set(Math.random() * 0.1, Math.random() * Math.PI * 2, Math.PI / 2 + restRot);
    g.position.set(startX, 0.025, startZ);

    nailGroup.add(g);
    return {
        group: g,
        startX, startZ,
        startY: 0.025,
        attracted: false,
        attracting: false,
        attractT: 0,
        fallY: 0.025,
        falling: false,
        fallVY: 0,
        restRotX: g.rotation.x,
        restRotY: g.rotation.y,
        restRotZ: g.rotation.z,
    };
}

for (let i = 0; i < NAIL_COUNT; i++) nailsData.push(createNail(i));

// ─── Audio Context ────────────────────────────────────────────────────────────
let audioCtx = null;
let humGain = null, humOsc = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Electric hum
    humOsc = audioCtx.createOscillator();
    humOsc.frequency.value = 60;
    humOsc.type = 'sawtooth';
    const humFilter = audioCtx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 300;
    humGain = audioCtx.createGain();
    humGain.gain.value = 0;
    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(audioCtx.destination);
    humOsc.start();
}

function playMetalContact() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.value = 800 + Math.random() * 400;
    osc.type = 'triangle';
    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// ─── Glow Sprites ────────────────────────────────────────────────────────────
function makeGlowSprite(color, size) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, color.replace('1)', '0.4)'));
    grad.addColorStop(1, color.replace('1)', '0)'));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size, size, 1);
    return sprite;
}

const coilGlow = makeGlowSprite('rgba(255,140,0,1)', 5);
coilGlow.name = 'coilGlow';
coilGlow.position.set(0, 0.22, 0);
scene.add(coilGlow);

// ─── Labels ───────────────────────────────────────────────────────────────────
function makeLabel(text, color = '#ffffff') {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 320, 80);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 4, 312, 72);
    ctx.fillStyle = 'rgba(10,14,26,0.7)';
    ctx.fillRect(5, 5, 310, 70);
    ctx.fillStyle = color;
    ctx.font = 'bold 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 160, 40);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.4, 1);
    return sprite;
}

const labelIronCore = makeLabel('Iron Core', '#aaddff');
labelIronCore.name = 'labelIronCore';
labelIronCore.position.set(0, 1.0, 0.5);
scene.add(labelIronCore);

const labelCoil = makeLabel('Copper Coil', '#ffcc44');
labelCoil.name = 'labelCoil';
labelCoil.position.set(-1.5, 0.85, 0.8);
labelCoil.visible = false;
scene.add(labelCoil);

const labelCurrent = makeLabel('⚡ Current Flow', '#ff8833');
labelCurrent.name = 'labelCurrent';
labelCurrent.position.set(0, 1.5, 0);
labelCurrent.visible = false;
scene.add(labelCurrent);

const labelField = makeLabel('Magnetic Field', '#44aaff');
labelField.name = 'labelField';
labelField.position.set(2.2, 1.3, 0);
labelField.visible = false;
scene.add(labelField);

// ─── Animation State Machine ──────────────────────────────────────────────────
// Phases: 'idle' | 'coilWrap' | 'connect' | 'activate' | 'active' | 'deactivate' | 'reset'
let phase = 'idle';
let phaseT = 0;
let activated = false;
let magnetStrength = 0;
let coilWrapProgress = 0;
let slowMotion = false;
let cameraOrbitActive = false;

// ─── UI ───────────────────────────────────────────────────────────────────────
const ui = document.createElement('div');
ui.style.cssText = `
  position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
  display:flex; gap:12px; z-index:100; font-family:'Inter',Arial,sans-serif;
  align-items:center; flex-wrap:wrap; justify-content:center;
`;
root.appendChild(ui);

function makeBtn(label, color, onclick) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `
    padding:10px 22px; border:1px solid ${color}55; background:rgba(10,14,26,0.88);
    color:${color}; font-size:13px; font-weight:600; letter-spacing:0.06em;
    border-radius:4px; cursor:pointer; transition:all 0.2s; outline:none;
  `;
    b.onmouseenter = () => { b.style.background = `${color}22`; b.style.borderColor = color; };
    b.onmouseleave = () => { b.style.background = 'rgba(10,14,26,0.88)'; b.style.borderColor = `${color}55`; };
    b.onclick = onclick;
    return b;
}

const btnActivate = makeBtn('⚡ Activate', '#ff8833', () => { initAudio(); triggerActivate(); });
const btnDeactivate = makeBtn('○ Deactivate', '#4499ff', () => { triggerDeactivate(); });
const btnSlowMo = makeBtn('◎ Slow-Mo', '#88ff44', () => { slowMotion = !slowMotion; btnSlowMo.textContent = slowMotion ? '▶ Normal Speed' : '◎ Slow-Mo'; });
const btnReset = makeBtn('↺ Reset', '#aaaacc', () => { triggerReset(); });
btnDeactivate.disabled = true; btnDeactivate.style.opacity = '0.4';
ui.append(btnActivate, btnDeactivate, btnSlowMo, btnReset);

// Status
const status = document.createElement('div');
status.style.cssText = `
  position:fixed; top:16px; left:50%; transform:translateX(-50%);
  color:#aaddff; font-family:'Inter',Arial,sans-serif; font-size:13px;
  letter-spacing:0.08em; background:rgba(10,14,26,0.7); padding:8px 20px;
  border:1px solid #2a3a5a; border-radius:4px; z-index:100; text-align:center;
`;
status.textContent = 'ELECTROMAGNET PHYSICS LAB  ·  Click ACTIVATE to begin';
root.appendChild(status);

function setStatus(t) { status.textContent = t; }

// ─── Phase triggers ───────────────────────────────────────────────────────────
function triggerActivate() {
    if (phase !== 'idle' && phase !== 'reset') return;
    phase = 'coilWrap';
    phaseT = 0;
    coilWrapProgress = 0;
    coilMesh.visible = true;
    btnActivate.disabled = true;
    btnActivate.style.opacity = '0.4';
    setStatus('Wrapping copper coil around iron core...');
}

function triggerDeactivate() {
    if (phase !== 'active') return;
    phase = 'deactivate';
    phaseT = 0;
    btnDeactivate.disabled = true;
    btnDeactivate.style.opacity = '0.4';
    setStatus('Deactivating electromagnet...');
    if (humGain) humGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
}

function triggerReset() {
    phase = 'reset';
    phaseT = 0;
    magnetStrength = 0;
    coilMesh.visible = false;
    leadLeft.visible = false;
    leadRight.visible = false;
    labelCoil.visible = false;
    labelCurrent.visible = false;
    labelField.visible = false;
    coilGlow.material.opacity = 0;
    glowPointLight.intensity = 0;
    fieldLines.forEach(fl => { fl.material.opacity = 0; });
    nailsData.forEach((nd, i) => {
        nailGroup.remove(nd.group);
    });
    nailsData.length = 0;
    for (let i = 0; i < NAIL_COUNT; i++) nailsData.push(createNail(i));
    btnActivate.disabled = false;
    btnActivate.style.opacity = '1';
    btnDeactivate.disabled = true;
    btnDeactivate.style.opacity = '0.4';
    if (humGain) humGain.gain.value = 0;
    setStatus('Reset complete. Click ACTIVATE to begin');
}

// ─── Coil animation (partial draw using drawRange) ───────────────────────────
let partialCoilProgress = 0;

function updateCoilDraw(progress) {
    if (!coilMesh || !coilMesh.geometry) return;
    const geo = coilMesh.geometry;
    const totalCount = geo.index ? geo.index.count : geo.attributes.position.count;
    geo.setDrawRange(0, Math.floor(progress * totalCount));
    partialCoilProgress = progress;
}

// ─── Camera orbit ─────────────────────────────────────────────────────────────
let orbitAngle = 0;
const BASE_CAM_POS = new THREE.Vector3(6, 4, 9);

// ─── Clock / Loop ─────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let totalTime = 0;

renderer.setAnimationLoop(() => {
    let dt = clock.getDelta();
    if (slowMotion && (phase === 'active' || phase === 'activate')) dt *= 0.25;
    totalTime += dt;

    controls.update();

    // ── Phase FSM ──
    if (phase === 'coilWrap') {
        phaseT += dt;
        const dur = 3.5;
        coilWrapProgress = Math.min(phaseT / dur, 1);
        updateCoilDraw(coilWrapProgress);

        // Animate copper glow flickering during wrap
        const coilM = coilMesh.material;
        coilM.emissiveIntensity = coilWrapProgress * 0.1 + Math.sin(totalTime * 12) * 0.05 * coilWrapProgress;

        if (coilWrapProgress >= 1) {
            phase = 'connect';
            phaseT = 0;
            leadLeft.visible = true;
            leadRight.visible = true;
            labelCoil.visible = true;
            setStatus('Connecting to power supply...');
        }
    }

    if (phase === 'connect') {
        phaseT += dt;
        if (phaseT > 1.5) {
            phase = 'activate';
            phaseT = 0;
            setStatus('⚡ Electromagnet activated! Magnetic field forming...');
            if (humGain) {
                humGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1.5);
            }
        }
    }

    if (phase === 'activate') {
        phaseT += dt;
        const dur = 2.5;
        magnetStrength = Math.min(phaseT / dur, 1);

        // Coil glow
        const coilM = coilMesh.material;
        coilM.emissiveIntensity = magnetStrength * 1.2;
        coilGlow.material.opacity = magnetStrength * 0.55;
        glowPointLight.intensity = magnetStrength * 3.5;

        // Field lines
        fieldLines.forEach((fl, i) => {
            fl.material.opacity = magnetStrength * (0.3 + 0.15 * Math.sin(totalTime * 1.5 + i));
        });

        labelCurrent.visible = magnetStrength > 0.3;
        labelField.visible = magnetStrength > 0.5;

        if (magnetStrength >= 1) {
            phase = 'active';
            phaseT = 0;
            btnDeactivate.disabled = false;
            btnDeactivate.style.opacity = '1';
            cameraOrbitActive = true;
            setStatus('⚡ ACTIVE — Nails attracted! Try Slow-Mo for nail capture');
        }
    }

    if (phase === 'active') {
        phaseT += dt;
        magnetStrength = 1;

        // Pulsing field
        const pulse = 0.3 + 0.12 * Math.sin(totalTime * 2.5);
        fieldLines.forEach((fl, i) => {
            fl.material.opacity = pulse + 0.08 * Math.sin(totalTime * 3 + i * 0.7);
        });
        coilGlow.material.opacity = 0.45 + 0.1 * Math.sin(totalTime * 4);
        glowPointLight.intensity = 3.0 + Math.sin(totalTime * 6) * 0.5;

        const coilM = coilMesh.material;
        coilM.emissiveIntensity = 1.0 + 0.2 * Math.sin(totalTime * 8);

        // Camera orbit
        if (cameraOrbitActive) {
            orbitAngle += dt * 0.22;
            const orbitR = 9;
            const cx = Math.sin(orbitAngle) * orbitR;
            const cz = Math.cos(orbitAngle) * orbitR;
            camera.position.lerp(new THREE.Vector3(cx, 3.5 + Math.sin(orbitAngle * 0.5) * 0.8, cz), 0.015);
        }
    }

    if (phase === 'deactivate') {
        phaseT += dt;
        const dur = 2.0;
        magnetStrength = Math.max(1 - phaseT / dur, 0);

        const coilM = coilMesh.material;
        coilM.emissiveIntensity = magnetStrength * 1.2;
        coilGlow.material.opacity = magnetStrength * 0.55;
        glowPointLight.intensity = magnetStrength * 3.5;
        fieldLines.forEach(fl => { fl.material.opacity = magnetStrength * 0.35; });

        if (magnetStrength <= 0) {
            phase = 'idle';
            cameraOrbitActive = false;
            labelCurrent.visible = false;
            labelField.visible = false;
            btnActivate.disabled = false;
            btnActivate.style.opacity = '1';
            setStatus('Deactivated. Gravity takes over. Click ACTIVATE or Reset.');
        }
    }

    // ── Nail physics ──
    nailsData.forEach(nd => {
        const g = nd.group;
        if (nd.attracted) {
            // Stay attached — slight wobble
            g.position.y = 0.22 + Math.sin(totalTime * 3 + nd.startX) * 0.004;
            return;
        }

        if (nd.falling) {
            nd.fallVY -= 9.8 * dt * 2;
            nd.fallY += nd.fallVY * dt;
            if (nd.fallY <= 0.025) {
                nd.fallY = 0.025;
                nd.falling = false;
                nd.fallVY = 0;
                nd.attracting = false;
                nd.attractT = 0;
                g.rotation.set(nd.restRotX, nd.restRotY, nd.restRotZ);
                playMetalContact();
            }
            g.position.y = nd.fallY;
            return;
        }

        if (magnetStrength > 0.1 && !nd.attracting) {
            const dx = g.position.x;
            const dz = g.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 3.0) {
                nd.attracting = true;
                nd.attractT = 0;
            }
        }

        if (magnetStrength <= 0.05 && nd.attracting) {
            nd.falling = true;
            nd.fallY = g.position.y;
            nd.fallVY = 0;
            nd.attracting = false;
        }

        if (nd.attracting && magnetStrength > 0.1) {
            const speed = (slowMotion ? 0.25 : 1.0) * magnetStrength;
            nd.attractT = Math.min(nd.attractT + dt * speed * 0.55, 1);

            const targetX = (Math.random() - 0.5) * 0.5;
            const targetY = 0.22;
            const targetZ = (Math.random() - 0.5) * 0.2;

            g.position.x = THREE.MathUtils.lerp(nd.startX, targetX, nd.attractT);
            g.position.y = THREE.MathUtils.lerp(nd.startY, targetY, nd.attractT * nd.attractT);
            g.position.z = THREE.MathUtils.lerp(nd.startZ, targetZ, nd.attractT);

            // Rotate nail to point toward rod
            const targetRotZ = Math.PI / 2 + Math.sin(nd.attractT * Math.PI) * 0.4;
            g.rotation.z = THREE.MathUtils.lerp(nd.restRotZ, targetRotZ, nd.attractT);

            if (nd.attractT >= 1) {
                nd.attracted = true;
                playMetalContact();
            }
        }
    });

    // ── Field line rotation animation ──
    fieldGroup.rotation.x = Math.sin(totalTime * 0.6) * 0.04;
    fieldLines.forEach((fl, i) => {
        fl.rotation.x = totalTime * 0.4 * (i % 2 === 0 ? 1 : -1) * 0.15;
    });

    renderer.render(scene, camera);
});

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});