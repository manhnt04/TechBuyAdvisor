import * as THREE from 'three';

export interface RgbColorPalette {
  name: string;
  primary: string;    // Fan ring / ambient
  secondary: string;  // Core / hub / accents
  accent: string;     // Cable / highlights
  temperature: number; // Point light intensity factor
}

export const RGB_PRESETS: Record<string, RgbColorPalette> = {
  sunset: {
    name: 'Sunset Amber (Ảnh mẫu)',
    primary: '#ff7733',
    secondary: '#ff3366',
    accent: '#00eeff',
    temperature: 1.4,
  },
  glacier: {
    name: 'Glacier Ice Blue',
    primary: '#00d0ff',
    secondary: '#ffffff',
    accent: '#0077ff',
    temperature: 1.2,
  },
  cyberpunk: {
    name: 'Cyberpunk Neon',
    primary: '#ff007f',
    secondary: '#00f0ff',
    accent: '#ffe600',
    temperature: 1.5,
  },
  rainbow: {
    name: 'Rainbow Spectrum',
    primary: '#ff0055',
    secondary: '#00ffcc',
    accent: '#ffff00',
    temperature: 1.3,
  },
  stealth: {
    name: 'Pure White (Stealth)',
    primary: '#ffffff',
    secondary: '#e2e8f0',
    accent: '#cbd5e1',
    temperature: 0.8,
  },
};

export interface PcModelInstance {
  group: THREE.Group;
  glassPanel: THREE.Mesh;
  fanBlades: THREE.Group[];
  rgbMaterials: THREE.Material[];
  rgbLights: THREE.PointLight[];
  lcdTexture: THREE.CanvasTexture;
  update: (delta: number, elapsed: number, options?: { fanSpeed?: number; preset?: string }) => void;
  setGlassVisibility: (visible: boolean) => void;
  setLightingPreset: (presetKey: string) => void;
  componentGroups: {
    case: THREE.Group;
    motherboard: THREE.Group;
    gpu: THREE.Group;
    aio: THREE.Group;
    ram: THREE.Group;
    fans: THREE.Group;
    cables: THREE.Group;
  };
}

/**
 * Procedural Canvas Texture for Motherboard silkscreen & Dragon / Tribal emblem
 */
function createMotherboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 512, 512);

    // Diagonal futuristic stripes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    for (let i = -512; i < 1024; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 512, 512);
      ctx.stroke();
    }

    // Circuit lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    for (let j = 0; j < 12; j++) {
      const y = 80 + j * 32;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(200, y);
      ctx.lineTo(240, y + 20);
      ctx.lineTo(400, y + 20);
      ctx.stroke();

      // Solder point
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(400, y + 20, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // MSI / Gaming Badge Area
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(60, 60, 200, 120);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, 200, 120);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('MSI MAG', 80, 130);

    // Golden / Amber dragon insignia
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(380, 150, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(380, 150, 28, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Canvas Texture for GPU Shroud (iGame Ultra white with iridescent foil)
 */
function createGpuShroudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);

    // Holographic gradient band
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#a5f3fc');
    grad.addColorStop(0.3, '#c084fc');
    grad.addColorStop(0.6, '#fbcfe8');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 20, 472, 50);

    // Diagonal accents
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(80 + i * 45, 120);
      ctx.lineTo(100 + i * 45, 120);
      ctx.lineTo(80 + i * 45, 190);
      ctx.lineTo(60 + i * 45, 190);
      ctx.fill();
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('iGAME ULTRA', 40, 56);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('GEFORCE RTX', 360, 56);
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Canvas for AIO Waterblock LCD Display
 */
function createLcdDisplay(): {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  function draw(time: number) {
    if (!ctx) return;
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, 256, 256);

    // Digital circular ring
    ctx.strokeStyle = '#00d8ff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 105, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary pulsing arc
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 92, time * 1.5, time * 1.5 + Math.PI * 1.2);
    ctx.stroke();

    // Central Snowflake graphic (matching reference photo!)
    ctx.save();
    ctx.translate(128, 120);
    ctx.rotate(time * 0.4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 48);
      // branches
      ctx.moveTo(0, 24);
      ctx.lineTo(12, 34);
      ctx.moveTo(0, 24);
      ctx.lineTo(-12, 34);
      ctx.moveTo(0, 38);
      ctx.lineTo(8, 44);
      ctx.moveTo(0, 38);
      ctx.lineTo(-8, 44);
      ctx.stroke();
    }
    ctx.restore();

    // Telemetry text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    const cpuTemp = Math.round(42 + Math.sin(time * 0.8) * 3);
    ctx.fillText(`${cpuTemp}°C`, 128, 205);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('LIQUID COOLING', 128, 224);
  }

  draw(0);
  const texture = new THREE.CanvasTexture(canvas);

  return {
    texture,
    update: (time: number) => {
      draw(time);
      texture.needsUpdate = true;
    },
  };
}

/**
 * Main procedural builder factory for the PC Model
 */
export function createPcModel(): PcModelInstance {
  const root = new THREE.Group();
  root.name = 'PC_Gaming_Rig';

  // Shared Materials
  const whiteMetalMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.28,
    metalness: 0.12,
  });

  const darkInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.3,
  });

  const aluminumFinMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.4,
    metalness: 0.7,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.9,
  });

  const blackPcbMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Physical Glass Material (realistic transmission and reflections)
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.92,
    opacity: 1,
    transparent: true,
    roughness: 0.04,
    ior: 1.52,
    reflectivity: 0.6,
    thickness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });

  // Dynamic RGB Materials
  const activePreset = RGB_PRESETS.sunset;
  const fanRingRgbMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(activePreset.primary),
  });
  const fanHubRgbMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(activePreset.secondary),
  });
  const strimerRgbMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(activePreset.secondary),
  });
  const ramRgbMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(activePreset.primary),
  });

  const rgbMaterials: THREE.Material[] = [
    fanRingRgbMat,
    fanHubRgbMat,
    strimerRgbMat,
    ramRgbMat,
  ];

  const rgbLights: THREE.PointLight[] = [];
  const fanBlades: THREE.Group[] = [];

  // Component groups for organization and raycasting/focus
  const caseGroup = new THREE.Group();
  caseGroup.name = 'Case';
  const moboGroup = new THREE.Group();
  moboGroup.name = 'Motherboard';
  const gpuGroup = new THREE.Group();
  gpuGroup.name = 'Graphics_Card';
  const aioGroup = new THREE.Group();
  aioGroup.name = 'AIO_Cooler';
  const ramGroup = new THREE.Group();
  ramGroup.name = 'RAM';
  const fansGroup = new THREE.Group();
  fansGroup.name = 'Fans';
  const cablesGroup = new THREE.Group();
  cablesGroup.name = 'Cables';

  // -------------------------------------------------------------
  // 1. CASE CHASSIS & EXTERIOR (Dual-Chamber Panoramic Style)
  // Overall Dimensions: Width: 2.8, Height: 4.4, Depth: 4.2
  // -------------------------------------------------------------
  const caseWidth = 2.8;
  const caseHeight = 4.4;
  const caseDepth = 4.2;

  // Base Pedestal / Bottom Chin with diamond beveled front
  const baseGeom = new THREE.BoxGeometry(caseWidth, 0.45, caseDepth);
  const baseMesh = new THREE.Mesh(baseGeom, whiteMetalMat);
  baseMesh.position.set(0, 0.225, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  caseGroup.add(baseMesh);

  // Front Chamfered Console / I/O Panel (Reference photo chin)
  const chinShape = new THREE.Shape();
  chinShape.moveTo(-0.9, 0);
  chinShape.lineTo(0.9, 0);
  chinShape.lineTo(0.7, 0.35);
  chinShape.lineTo(-0.7, 0.35);
  chinShape.closePath();
  const chinGeom = new THREE.ExtrudeGeometry(chinShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 });
  const chinMesh = new THREE.Mesh(chinGeom, whiteMetalMat);
  chinMesh.position.set(0, 0.05, caseDepth / 2 - 0.05);
  caseGroup.add(chinMesh);

  // Front I/O Ports on Chin
  const powerBtnGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  powerBtnGeom.rotateX(Math.PI / 2);
  const powerBtnMesh = new THREE.Mesh(powerBtnGeom, chromeMat);
  powerBtnMesh.position.set(0.4, 0.22, caseDepth / 2 + 0.24);
  caseGroup.add(powerBtnMesh);

  // USB Ports (2x USB-A red accents like modern boards, 1x USB-C)
  for (let i = 0; i < 2; i++) {
    const usbGeom = new THREE.BoxGeometry(0.04, 0.07, 0.02);
    const usbMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const usbMesh = new THREE.Mesh(usbGeom, usbMat);
    usbMesh.position.set(0.1 + i * 0.08, 0.22, caseDepth / 2 + 0.24);
    caseGroup.add(usbMesh);
  }
  const typeCGeom = new THREE.CapsuleGeometry(0.018, 0.05, 4, 8);
  typeCGeom.rotateZ(Math.PI / 2);
  const typeCMesh = new THREE.Mesh(typeCGeom, chromeMat);
  typeCMesh.position.set(-0.06, 0.22, caseDepth / 2 + 0.24);
  caseGroup.add(typeCMesh);

  // 4 Angular Feet
  const footGeom = new THREE.BoxGeometry(0.45, 0.25, 0.5);
  const footPositions = [
    [-caseWidth / 2 + 0.3, 0.05, -caseDepth / 2 + 0.4],
    [caseWidth / 2 - 0.3, 0.05, -caseDepth / 2 + 0.4],
    [-caseWidth / 2 + 0.3, 0.05, caseDepth / 2 - 0.4],
    [caseWidth / 2 - 0.3, 0.05, caseDepth / 2 - 0.4],
  ];
  footPositions.forEach(([x, y, z]) => {
    const foot = new THREE.Mesh(footGeom, whiteMetalMat);
    foot.position.set(x, y, z);
    caseGroup.add(foot);
  });

  // Top Radiator Roof / Ceiling Frame
  const roofGeom = new THREE.BoxGeometry(caseWidth, 0.3, caseDepth);
  const roofMesh = new THREE.Mesh(roofGeom, whiteMetalMat);
  roofMesh.position.set(0, caseHeight - 0.15, 0);
  caseGroup.add(roofMesh);

  // Rear Wall with angled ventilation louvers/slots
  const rearWallGeom = new THREE.BoxGeometry(caseWidth, caseHeight - 0.6, 0.1);
  const rearWall = new THREE.Mesh(rearWallGeom, whiteMetalMat);
  rearWall.position.set(0, caseHeight / 2, -caseDepth / 2 + 0.05);
  caseGroup.add(rearWall);

  // Diagonal ventilation cutouts on rear
  for (let i = 0; i < 7; i++) {
    const slotGeom = new THREE.BoxGeometry(0.5, 0.04, 0.12);
    slotGeom.rotateZ(Math.PI / 4);
    const slotMesh = new THREE.Mesh(slotGeom, darkInteriorMat);
    slotMesh.position.set(-0.8, 2.0 + i * 0.18, -caseDepth / 2 + 0.06);
    caseGroup.add(slotMesh);
  }

  // Right Side Panel (Solid White Metal with mesh vents for side fans)
  const rightSideGeom = new THREE.BoxGeometry(0.1, caseHeight - 0.6, caseDepth - 0.1);
  const rightSideMesh = new THREE.Mesh(rightSideGeom, whiteMetalMat);
  rightSideMesh.position.set(caseWidth / 2 - 0.05, caseHeight / 2, 0);
  caseGroup.add(rightSideMesh);

  // Corner Pillars (Slim aesthetic white frame)
  const pillarGeom = new THREE.BoxGeometry(0.08, caseHeight - 0.6, 0.08);
  const pillarFrontRight = new THREE.Mesh(pillarGeom, whiteMetalMat);
  pillarFrontRight.position.set(caseWidth / 2 - 0.05, caseHeight / 2, caseDepth / 2 - 0.05);
  caseGroup.add(pillarFrontRight);

  // Main Interior Motherboard Tray (Divider between dual chambers)
  const trayGeom = new THREE.BoxGeometry(0.06, caseHeight - 0.8, caseDepth - 0.6);
  const trayMesh = new THREE.Mesh(trayGeom, whiteMetalMat);
  trayMesh.position.set(0.4, caseHeight / 2, -0.1);
  caseGroup.add(trayMesh);

  // -------------------------------------------------------------
  // 2. TEMPERED GLASS PANELS (Panoramic Front + Left Side)
  // -------------------------------------------------------------
  // Left Side Glass (The entire visible window)
  const glassWidth = caseDepth - 0.2;
  const glassHeight = caseHeight - 0.65;
  const sideGlassGeom = new THREE.BoxGeometry(0.04, glassHeight, glassWidth);
  const sideGlass = new THREE.Mesh(sideGlassGeom, glassMaterial);
  sideGlass.position.set(-caseWidth / 2 + 0.03, caseHeight / 2 + 0.02, 0);
  sideGlass.name = 'Tempered_Glass_Side';
  caseGroup.add(sideGlass);

  // Front Glass Panel
  const frontGlassWidth = caseWidth - 0.2;
  const frontGlassGeom = new THREE.BoxGeometry(frontGlassWidth, glassHeight, 0.04);
  const frontGlass = new THREE.Mesh(frontGlassGeom, glassMaterial);
  frontGlass.position.set(0.05, caseHeight / 2 + 0.02, caseDepth / 2 - 0.03);
  frontGlass.name = 'Tempered_Glass_Front';
  caseGroup.add(frontGlass);

  // Glass Thumb Screws (Chrome cylinders)
  const screwGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16);
  screwGeom.rotateZ(Math.PI / 2);
  [
    [-caseWidth / 2 + 0.02, caseHeight - 0.45, -caseDepth / 2 + 0.2],
    [-caseWidth / 2 + 0.02, 0.55, -caseDepth / 2 + 0.2],
  ].forEach(([x, y, z]) => {
    const screw = new THREE.Mesh(screwGeom, chromeMat);
    screw.position.set(x, y, z);
    caseGroup.add(screw);
  });

  // -------------------------------------------------------------
  // 3. MOTHERBOARD & PLATFORM
  // -------------------------------------------------------------
  // PCB (standard ATX form factor inside)
  const moboWidth = 2.4;
  const moboHeight = 2.4;
  const moboPcbGeom = new THREE.BoxGeometry(0.04, moboHeight, moboWidth);
  const moboPcb = new THREE.Mesh(moboPcbGeom, blackPcbMat);
  moboPcb.position.set(0.35, 2.6, -0.2);
  moboGroup.add(moboPcb);

  // Heatsinks (Silver & White Aluminum VRM covers with texture)
  const moboTex = createMotherboardTexture();
  const moboHeatsinkMat = new THREE.MeshStandardMaterial({
    map: moboTex,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Top VRM heatsink
  const vrmTopGeom = new THREE.BoxGeometry(0.18, 0.35, 1.2);
  const vrmTop = new THREE.Mesh(vrmTopGeom, moboHeatsinkMat);
  vrmTop.position.set(0.25, 3.6, -0.4);
  moboGroup.add(vrmTop);

  // Left Rear I/O Shroud with MSI Dragon Logo
  const vrmLeftGeom = new THREE.BoxGeometry(0.22, 1.1, 0.4);
  const vrmLeft = new THREE.Mesh(vrmLeftGeom, moboHeatsinkMat);
  vrmLeft.position.set(0.23, 3.05, -1.2);
  moboGroup.add(vrmLeft);

  // M.2 Armor heatsink (silver shield)
  const m2Geom = new THREE.BoxGeometry(0.12, 0.18, 1.0);
  const m2Mesh = new THREE.Mesh(m2Geom, aluminumFinMat);
  m2Mesh.position.set(0.26, 2.2, -0.1);
  moboGroup.add(m2Mesh);

  // -------------------------------------------------------------
  // 4. DDR5 RAM MODULES (2x White sticks with ARGB Diffusers)
  // -------------------------------------------------------------
  for (let r = 0; r < 2; r++) {
    const ramStick = new THREE.Group();
    const ramZ = -0.05 + r * 0.12;

    // Metal heatspreader
    const ramBodyGeom = new THREE.BoxGeometry(0.1, 0.55, 0.05);
    const ramBody = new THREE.Mesh(ramBodyGeom, whiteMetalMat);
    ramBody.position.set(0.26, 3.1, ramZ);
    ramStick.add(ramBody);

    // Frosted ARGB lightbar on top
    const ramLightGeom = new THREE.BoxGeometry(0.11, 0.08, 0.055);
    const ramLight = new THREE.Mesh(ramLightGeom, ramRgbMat);
    ramLight.position.set(0.26, 3.4, ramZ);
    ramStick.add(ramLight);

    ramGroup.add(ramStick);
  }

  // -------------------------------------------------------------
  // 5. 360mm AIO LIQUID COOLER (Top Radiator + Tubes + LCD Pump Block)
  // -------------------------------------------------------------
  // Top 360mm Radiator
  const radGeom = new THREE.BoxGeometry(1.2, 0.28, 3.4);
  const radMesh = new THREE.Mesh(radGeom, whiteMetalMat);
  radMesh.position.set(-0.3, caseHeight - 0.42, 0.1);
  aioGroup.add(radMesh);

  // CPU Water Block / Pump Head
  const pumpHead = new THREE.Group();
  pumpHead.position.set(0.2, 2.9, -0.45);

  const blockBodyGeom = new THREE.BoxGeometry(0.26, 0.65, 0.65);
  const blockBody = new THREE.Mesh(blockBodyGeom, whiteMetalMat);
  pumpHead.add(blockBody);

  // Silver chamfered bezel
  const bezelGeom = new THREE.BoxGeometry(0.28, 0.55, 0.55);
  const bezel = new THREE.Mesh(bezelGeom, chromeMat);
  pumpHead.add(bezel);

  // LCD Display Screen
  const lcd = createLcdDisplay();
  const lcdGeom = new THREE.PlaneGeometry(0.5, 0.5);
  const lcdMat = new THREE.MeshBasicMaterial({
    map: lcd.texture,
  });
  const lcdMesh = new THREE.Mesh(lcdGeom, lcdMat);
  lcdMesh.rotateY(-Math.PI / 2);
  lcdMesh.position.set(-0.145, 0, 0);
  pumpHead.add(lcdMesh);

  // Tube Connectors / Swivel Fittings on Pump Head
  const fittingGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 16);
  fittingGeom.rotateZ(Math.PI / 2);
  const fitting1 = new THREE.Mesh(fittingGeom, chromeMat);
  fitting1.position.set(0, 0.22, 0.2);
  pumpHead.add(fitting1);

  const fitting2 = new THREE.Mesh(fittingGeom, chromeMat);
  fitting2.position.set(0, 0.08, 0.26);
  pumpHead.add(fitting2);

  aioGroup.add(pumpHead);

  // Curved Liquid Cooling Tubes (Spline CatmullRomCurve3)
  // Tube 1: Pump to Radiator Front Fitting
  const tube1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 3.12, -0.25),
    new THREE.Vector3(-0.3, 3.3, 0.3),
    new THREE.Vector3(-0.2, 3.7, 1.1),
    new THREE.Vector3(-0.3, caseHeight - 0.58, 1.4),
  ]);
  const tubeGeom1 = new THREE.TubeGeometry(tube1Curve, 40, 0.05, 12, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.5,
    metalness: 0.1,
  });
  const tube1Mesh = new THREE.Mesh(tubeGeom1, tubeMat);
  aioGroup.add(tube1Mesh);

  // Tube 2: Pump to Radiator
  const tube2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 2.98, -0.19),
    new THREE.Vector3(-0.25, 3.15, 0.35),
    new THREE.Vector3(-0.15, 3.55, 1.05),
    new THREE.Vector3(-0.3, caseHeight - 0.58, 1.55),
  ]);
  const tubeGeom2 = new THREE.TubeGeometry(tube2Curve, 40, 0.05, 12, false);
  const tube2Mesh = new THREE.Mesh(tubeGeom2, tubeMat);
  aioGroup.add(tube2Mesh);

  // -------------------------------------------------------------
  // 6. VERTICAL MOUNTED GPU (iGame Ultra White 3-Fan Graphics Card)
  // -------------------------------------------------------------
  const gpuInstance = new THREE.Group();
  gpuInstance.position.set(-0.45, 1.6, 0.05);

  // PCIe Vertical Riser Bracket (White sheet metal base)
  const riserGeom = new THREE.BoxGeometry(0.3, 0.1, 2.8);
  const riserMesh = new THREE.Mesh(riserGeom, whiteMetalMat);
  riserMesh.position.set(0, -0.5, 0);
  gpuInstance.add(riserMesh);

  // Golden PCIe connector slot
  const pcieSlotGeom = new THREE.BoxGeometry(0.08, 0.04, 1.8);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.3 });
  const pcieSlot = new THREE.Mesh(pcieSlotGeom, goldMat);
  pcieSlot.position.set(0, -0.42, 0);
  gpuInstance.add(pcieSlot);

  // Aluminum Heatsink Fin Array (inside the shroud)
  const gpuFinGeom = new THREE.BoxGeometry(0.24, 0.9, 2.7);
  const gpuFinMesh = new THREE.Mesh(gpuFinGeom, aluminumFinMat);
  gpuInstance.add(gpuFinMesh);

  // Copper Heatpipes emerging from the side
  const heatpipeGeom = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 12);
  heatpipeGeom.rotateX(Math.PI / 2);
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 });
  const heatpipe1 = new THREE.Mesh(heatpipeGeom, copperMat);
  heatpipe1.position.set(0.1, 0.25, 0);
  gpuInstance.add(heatpipe1);

  // White GPU Shroud with iridescent branding
  const gpuShroudTex = createGpuShroudTexture();
  const gpuShroudMat = new THREE.MeshStandardMaterial({
    map: gpuShroudTex,
    roughness: 0.3,
    metalness: 0.15,
  });
  const shroudGeom = new THREE.BoxGeometry(0.28, 1.05, 2.85);
  const shroudMesh = new THREE.Mesh(shroudGeom, gpuShroudMat);
  gpuInstance.add(shroudMesh);

  // 3 Axial GPU Fans (White blades with blue holographic center badge)
  const gpuFanPositions = [-0.85, 0, 0.85];
  gpuFanPositions.forEach((z) => {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(-0.15, 0, z);

    // Fan cutout ring
    const ringGeom = new THREE.TorusGeometry(0.38, 0.015, 8, 32);
    ringGeom.rotateY(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeom, chromeMat);
    fanGroup.add(ringMesh);

    // Hub
    const hubGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
    hubGeom.rotateZ(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
    const hubMesh = new THREE.Mesh(hubGeom, hubMat);
    fanGroup.add(hubMesh);

    // 9 curved white blades
    const bladesGroup = new THREE.Group();
    for (let b = 0; b < 9; b++) {
      const bladeGeom = new THREE.BoxGeometry(0.01, 0.26, 0.08);
      bladeGeom.rotateX(0.35); // aerodynamic tilt
      const bladeMesh = new THREE.Mesh(bladeGeom, whiteMetalMat);
      bladeMesh.position.set(0, 0.24, 0);

      const pivot = new THREE.Group();
      pivot.rotation.x = (b * Math.PI * 2) / 9;
      pivot.add(bladeMesh);
      bladesGroup.add(pivot);
    }
    fanGroup.add(bladesGroup);
    fanBlades.push(bladesGroup);

    gpuInstance.add(fanGroup);
  });

  gpuGroup.add(gpuInstance);

  // -------------------------------------------------------------
  // 7. ARGB STRIMER CABLES (24-Pin Rainbow/Glow Motherboard Cable)
  // -------------------------------------------------------------
  const strimerCables = new THREE.Group();
  // 8 illuminated fiber-optic neon ribs
  for (let c = 0; c < 8; c++) {
    const zOffset = 0.05 + c * 0.05;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 2.7, zOffset),
      new THREE.Vector3(-0.1, 2.6, zOffset + 0.1),
      new THREE.Vector3(-0.4, 2.3, zOffset + 0.05),
      new THREE.Vector3(-0.35, 1.8, zOffset - 0.1),
    ]);
    const strimerGeom = new THREE.TubeGeometry(curve, 32, 0.018, 8, false);
    const strimerMesh = new THREE.Mesh(strimerGeom, strimerRgbMat);
    strimerCables.add(strimerMesh);
  }
  cablesGroup.add(strimerCables);

  // -------------------------------------------------------------
  // 8. ARGB CASE FANS (10 Fans Total: 3 Side, 3 Top, 1 Rear, 3 Bottom)
  // -------------------------------------------------------------
  function buildFan(pos: THREE.Vector3, rot: THREE.Euler, size = 0.9): THREE.Group {
    const fan = new THREE.Group();
    fan.position.copy(pos);
    fan.rotation.copy(rot);

    // Square Outer Housing (White)
    const frameGeom = new THREE.BoxGeometry(size, size, 0.2);
    const frame = new THREE.Mesh(frameGeom, whiteMetalMat);
    fan.add(frame);

    // Glowing ARGB Outer Halo Ring
    const haloGeom = new THREE.TorusGeometry(size * 0.42, 0.045, 12, 32);
    const halo = new THREE.Mesh(haloGeom, fanRingRgbMat);
    fan.add(halo);

    // Center ARGB Hub
    const hubGeom = new THREE.CylinderGeometry(size * 0.16, size * 0.16, 0.16, 24);
    hubGeom.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeom, fanHubRgbMat);
    fan.add(hub);

    // Spinning Blades
    const rotor = new THREE.Group();
    const bladeCount = 9;
    for (let i = 0; i < bladeCount; i++) {
      const bGeom = new THREE.BoxGeometry(0.06, size * 0.28, 0.02);
      bGeom.rotateZ(0.4); // Aerodynamic pitch
      const blade = new THREE.Mesh(bGeom, whiteMetalMat);
      blade.position.set(0, size * 0.24, 0);

      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (i * Math.PI * 2) / bladeCount;
      bladePivot.add(blade);
      rotor.add(bladePivot);
    }
    fan.add(rotor);
    fanBlades.push(rotor);

    return fan;
  }

  // 3 Side Intake Fans (Mounted on the right side inner wall, facing viewer)
  for (let s = 0; s < 3; s++) {
    const yPos = 1.35 + s * 1.05;
    const sideFan = buildFan(new THREE.Vector3(0.5, yPos, 0.9), new THREE.Euler(0, -Math.PI / 2, 0), 0.95);
    fansGroup.add(sideFan);

    // Add local warm point light simulating ARGB radiance
    const sideLight = new THREE.PointLight(new THREE.Color(activePreset.primary), 1.2, 2.5);
    sideLight.position.set(0.1, yPos, 0.9);
    rgbLights.push(sideLight);
    fansGroup.add(sideLight);
  }

  // 3 Top Radiator Exhaust Fans
  for (let t = 0; t < 3; t++) {
    const zPos = -0.9 + t * 1.0;
    const topFan = buildFan(new THREE.Vector3(-0.3, caseHeight - 0.65, zPos), new THREE.Euler(Math.PI / 2, 0, 0), 0.95);
    fansGroup.add(topFan);

    const topLight = new THREE.PointLight(new THREE.Color(activePreset.secondary), 0.9, 2.0);
    topLight.position.set(-0.3, caseHeight - 0.85, zPos);
    rgbLights.push(topLight);
    fansGroup.add(topLight);
  }

  // 1 Rear Exhaust Fan
  const rearFan = buildFan(new THREE.Vector3(-0.3, 3.2, -caseDepth / 2 + 0.35), new THREE.Euler(0, 0, 0), 0.95);
  fansGroup.add(rearFan);
  const rearLight = new THREE.PointLight(new THREE.Color(activePreset.primary), 1.4, 2.2);
  rearLight.position.set(-0.3, 3.2, -caseDepth / 2 + 0.65);
  rgbLights.push(rearLight);
  fansGroup.add(rearLight);

  // 3 Bottom Intake Fans
  for (let b = 0; b < 3; b++) {
    const zPos = -0.9 + b * 1.0;
    const btmFan = buildFan(new THREE.Vector3(-0.2, 0.65, zPos), new THREE.Euler(-Math.PI / 2, 0, 0), 0.9);
    fansGroup.add(btmFan);
  }

  // Assemble all groups into root
  root.add(caseGroup);
  root.add(moboGroup);
  root.add(gpuGroup);
  root.add(aioGroup);
  root.add(ramGroup);
  root.add(fansGroup);
  root.add(cablesGroup);

  // Center model origin at center of the PC
  root.position.y = -caseHeight / 2 + 0.2;

  // Helper methods
  function setGlassVisibility(visible: boolean) {
    sideGlass.visible = visible;
    frontGlass.visible = visible;
  }

  function setLightingPreset(presetKey: string) {
    const p = RGB_PRESETS[presetKey] || RGB_PRESETS.sunset;
    const prim = new THREE.Color(p.primary);
    const sec = new THREE.Color(p.secondary);
    const acc = new THREE.Color(p.accent);

    fanRingRgbMat.color.copy(prim);
    fanHubRgbMat.color.copy(sec);
    strimerRgbMat.color.copy(sec);
    ramRgbMat.color.copy(acc);

    rgbLights.forEach((light, idx) => {
      light.color.copy(idx % 2 === 0 ? prim : sec);
      light.intensity = p.temperature * 1.2;
    });
  }

  return {
    group: root,
    glassPanel: sideGlass,
    fanBlades,
    rgbMaterials,
    rgbLights,
    lcdTexture: lcd.texture,
    setGlassVisibility,
    setLightingPreset,
    componentGroups: {
      case: caseGroup,
      motherboard: moboGroup,
      gpu: gpuGroup,
      aio: aioGroup,
      ram: ramGroup,
      fans: fansGroup,
      cables: cablesGroup,
    },
    update: (delta: number, elapsed: number, options?: { fanSpeed?: number; preset?: string }) => {
      const speed = options?.fanSpeed ?? 1.0;

      // Rotate fan blades
      const rotAngle = delta * speed * 15;
      fanBlades.forEach((bladeGroup) => {
        bladeGroup.rotation.z += rotAngle;
      });

      // Update LCD animation
      lcd.update(elapsed);

      // Wave mode dynamic rainbow cycling
      if (options?.preset === 'rainbow') {
        const hue = (elapsed * 0.15) % 1;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.55);
        fanRingRgbMat.color.copy(color);
        fanHubRgbMat.color.setHSL((hue + 0.3) % 1, 0.9, 0.55);
        strimerRgbMat.color.setHSL((hue + 0.6) % 1, 0.9, 0.55);
        ramRgbMat.color.copy(color);
        rgbLights.forEach((light, i) => {
          light.color.setHSL((hue + i * 0.1) % 1, 0.9, 0.55);
        });
      }
    },
  };
}
