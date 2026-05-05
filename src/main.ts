import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { KEYBOARD_GRID, KEY_LABELS, NAV_ROWS, NUMPAD_ROWS, PRIMARY_ROWS, type KeyTone } from './keyboard/layout'
import { ScreenEngine } from './terminal/engine'
import keyboardSoundUrl from './assets/ncprime-keyboard-typing-one-short-1-292590.mp3'
import musicUrl from './assets/music.mp3'
import moonsysLogo from './assets/moonsyslogo.png'

const keyboardAudio = new Audio(keyboardSoundUrl)
keyboardAudio.volume = 0.3

function playKeySound() {
  const sound = keyboardAudio.cloneNode() as HTMLAudioElement
  sound.volume = 0.3
  sound.play().catch(() => {})
}

// Background music setup
const backgroundMusic = new Audio(musicUrl)
backgroundMusic.loop = true
let savedVolume: string | null = null
try {
  savedVolume = localStorage.getItem('musicVolume')
} catch (e) {
  console.warn('localStorage access failed:', e)
}
backgroundMusic.volume = savedVolume ? parseFloat(savedVolume) : 0.3

function setMusicVolume(volume: number) {
  // Clamp volume between 0 and 1
  volume = Math.max(0, Math.min(1, volume))
  backgroundMusic.volume = volume
  try {
    localStorage.setItem('musicVolume', String(volume))
  } catch (e) {
    console.warn('localStorage access failed:', e)
  }
  
  if (volume > 0 && backgroundMusic.paused) {
    backgroundMusic.play().catch(() => {})
  } else if (volume === 0 && !backgroundMusic.paused) {
    backgroundMusic.pause()
  }
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div id="loading-screen">
  <div class="loading-content">
    <img src="${moonsysLogo}" alt="MoonSys Logo" class="loading-logo" />
    <div class="loading-bar">
      <div class="loading-progress" id="loading-progress"></div>
    </div>
    <p class="loading-text">INITIALIZING SYSTEMS...</p>
  </div>
</div>
<canvas id="scene" aria-label="Interactive retro computer scene"></canvas>
<div class="vignette"></div>
<div class="grain"></div>
<div class="hud">
  <div class="brand">
    <img src="${moonsysLogo}" alt="MoonSys Logo" class="logo" />
    <p class="tagline">An abandoned lunar research station terminal. Type <span class="cmd">help</span> for commands or <span class="cmd">aria</span> to talk to the AI. Explore the file system to uncover what happened 847 days ago.</p>
    <div class="music-control">
      <label for="music-volume" class="music-label">MUSIC VOLUME</label>
      <input type="range" id="music-volume" class="music-slider" min="0" max="100" value="30" />
    </div>
  </div>
  <div class="controls">TYPE COMMANDS ON CRT | MOVE + CLICK TO DRIVE MOUSE</div>
</div>
<div id="tutorial-overlay" class="tutorial-overlay hidden">
  <div class="tutorial-content">
    <div class="tutorial-message"></div>
    <button class="tutorial-skip">SKIP TUTORIAL</button>
  </div>
  <div class="tutorial-pointer"></div>
</div>
`

// Loading tracking
let loadedModels = 0
const totalModels = 3
const loadingProgress = document.getElementById('loading-progress') as HTMLDivElement
const loadingScreen = document.getElementById('loading-screen') as HTMLDivElement

function updateLoadingProgress() {
  loadedModels++
  const progress = (loadedModels / totalModels) * 100
  if (loadingProgress) {
    loadingProgress.style.width = `${progress}%`
  }
  
  if (loadedModels === totalModels) {
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.opacity = '0'
        setTimeout(() => {
          loadingScreen.style.display = 'none'
          // Start music after loading screen fades
          if (backgroundMusic.volume > 0) {
            backgroundMusic.play().catch(() => {})
          }
        }, 500)
      }
    }, 3500) // 3.5 second minimum delay
  }
}

const canvas = document.querySelector<HTMLCanvasElement>('#scene')

if (!canvas) {
  throw new Error('Missing required DOM elements')
}
const modelAssetUrl = (fileName: string): string => `${import.meta.env.BASE_URL}models/${fileName}`

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.08

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x020304)
scene.fog = new THREE.Fog(0x020304, 20, 42)

const pmremGenerator = new THREE.PMREMGenerator(renderer)
const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.6).texture
scene.environment = environmentTexture
pmremGenerator.dispose()

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100)
const CAMERA_POS = new THREE.Vector3(0, 2.15, 17.7)
const CAMERA_TARGET = new THREE.Vector3(0, -1.1, 0)
camera.position.copy(CAMERA_POS)
camera.lookAt(CAMERA_TARGET)

// Initialize post-processing early so it's available for resize listener
const clock = new THREE.Clock()
const renderPass = new RenderPass(scene, camera)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.2, 1.02)
const composer = new EffectComposer(renderer)
composer.addPass(renderPass)
composer.addPass(bloomPass)

const ambient = new THREE.AmbientLight(0xa0b8ff, 0.42)
scene.add(ambient)

const hemi = new THREE.HemisphereLight(0x9ec9ff, 0x0a0f16, 0.36)
scene.add(hemi)

const keyLight = new THREE.DirectionalLight(0xd8e6ff, 0.95)
keyLight.position.set(7, 10, 6)
keyLight.castShadow = true
keyLight.shadow.mapSize.set(1024, 1024)
scene.add(keyLight)

const rim = new THREE.PointLight(0x6eb7ff, 1.35, 22)
rim.position.set(-8, 3, -8)
scene.add(rim)

const pcKeyLight = new THREE.SpotLight(0xb9dcff, 2.1, 30, Math.PI / 8, 0.42, 1.05)
pcKeyLight.position.set(14, 5.1, 2.8)
pcKeyLight.castShadow = true
pcKeyLight.shadow.mapSize.set(1024, 1024)
scene.add(pcKeyLight)
scene.add(pcKeyLight.target)

const pcRimLight = new THREE.PointLight(0x3fd6ff, 1.35, 18)
pcRimLight.position.set(12.5, 0.7, -6)
scene.add(pcRimLight)

const overheadLight = new THREE.SpotLight(0xe0ebff, 0.58, 34, Math.PI / 5, 0.64, 1.12)
overheadLight.position.set(0, 10.8, 3.2)
overheadLight.castShadow = true
overheadLight.shadow.mapSize.set(1024, 1024)
overheadLight.target.position.set(0, -1.4, 2.8)
scene.add(overheadLight)
scene.add(overheadLight.target)

const deskLampLight = new THREE.SpotLight(0xffe4bf, 0.3, 22, Math.PI / 5, 0.56, 1.25)
deskLampLight.position.set(-8.2, 4.7, 7.2)
deskLampLight.target.position.set(-0.2, -2.7, 4.4)
scene.add(deskLampLight)
scene.add(deskLampLight.target)

const pcSoftFill = new THREE.SpotLight(0x9ad7ff, 1.55, 20, Math.PI / 6, 0.7, 1.1)
pcSoftFill.position.set(11.8, 2.2, 2.3)
scene.add(pcSoftFill)
scene.add(pcSoftFill.target)

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(18, 80),
  new THREE.MeshStandardMaterial({ color: 0x0a0d11, roughness: 0.92, metalness: 0.1 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -4.05
floor.receiveShadow = true
scene.add(floor)

for (let i = 0; i < 3; i += 1) {
  const ring = new THREE.LineLoop(
    new THREE.CircleGeometry(7 + i * 3.4, 128),
    new THREE.LineBasicMaterial({ color: 0x27313d, transparent: true, opacity: 0.5 - i * 0.12 }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -3.98
  scene.add(ring)
}

const starsGeom = new THREE.BufferGeometry()
const stars = new Float32Array(1800)
for (let i = 0; i < stars.length; i += 3) {
  stars[i] = (Math.random() - 0.5) * 65
  stars[i + 1] = (Math.random() - 0.1) * 32
  stars[i + 2] = (Math.random() - 0.5) * 65
}
starsGeom.setAttribute('position', new THREE.BufferAttribute(stars, 3))
const starField = new THREE.Points(
  starsGeom,
  new THREE.PointsMaterial({ color: 0xe7f5ff, size: 0.07, transparent: true, opacity: 0.7 }),
)
scene.add(starField)

const moonAnchor = new THREE.Group()
moonAnchor.position.set(-15.5, 8.8, -24)
scene.add(moonAnchor)

const moonGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xa9c9ea, transparent: true, opacity: 0.2 })
const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(3.4, 32, 32), moonGlowMaterial)
moonAnchor.add(moonGlow)

const moonLight = new THREE.PointLight(0xc9ddff, 0.92, 42)
moonAnchor.add(moonLight)

const moonLoader = new GLTFLoader()
moonLoader.load(
  modelAssetUrl('luna_earths_companion.glb'),
  (gltf) => {
    const loadedMoon = gltf.scene

    loadedMoon.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = false
        node.receiveShadow = false

        if (Array.isArray(node.material)) {
          node.material.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = 1.35
              material.roughness = Math.min(1, material.roughness * 1.05)
            }
          })
        } else if (node.material instanceof THREE.MeshStandardMaterial) {
          node.material.envMapIntensity = 1.35
          node.material.roughness = Math.min(1, node.material.roughness * 1.05)
        }
      }
    })

    const bbox = new THREE.Box3().setFromObject(loadedMoon)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    bbox.getSize(size)
    bbox.getCenter(center)

    const targetDiameter = 5.2
    const scale = targetDiameter / Math.max(size.x, size.y, size.z, 0.001)
    loadedMoon.scale.setScalar(scale)
    loadedMoon.position.sub(center.multiplyScalar(scale))
    loadedMoon.rotation.y = Math.PI * 0.2

    moonAnchor.add(loadedMoon)
    updateLoadingProgress()
  },
  undefined,
  () => {
    const fallbackMoon = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 40, 40),
      new THREE.MeshStandardMaterial({
        color: 0xcdd4de,
        roughness: 0.95,
        metalness: 0.02,
        emissive: 0x4b5c74,
        emissiveIntensity: 0.18,
      }),
    )
    moonAnchor.add(fallbackMoon)
  },
)

const rig = new THREE.Group()
rig.position.y = -0.75
rig.rotation.set(0.02, 0, 0)
scene.add(rig)

const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xd9d7d0, roughness: 0.76, metalness: 0.08 })
const powerLedMaterial = new THREE.MeshStandardMaterial({
  color: 0x1b2735,
  emissive: 0x3fd6ff,
  emissiveIntensity: 0.8,
  roughness: 0.3,
  metalness: 0.2,
})

const monitorBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2733, roughness: 0.4, metalness: 0.32 })
const monitorTrimMaterial = new THREE.MeshStandardMaterial({ color: 0x0e141e, roughness: 0.45, metalness: 0.35 })
const pcBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x202833, roughness: 0.48, metalness: 0.26 })

const monitor = new THREE.Group()
monitor.position.set(0, 2.34, -0.82)
monitor.scale.setScalar(1.14)
rig.add(monitor)

const monitorBody = new THREE.Mesh(new THREE.BoxGeometry(9.4, 5.6, 0.55), monitorBodyMaterial)
monitorBody.castShadow = true
monitor.add(monitorBody)

const bezel = new THREE.Mesh(new THREE.BoxGeometry(8.85, 5.1, 0.1), monitorTrimMaterial)
bezel.position.set(0, 0, 0.29)
bezel.castShadow = true
monitor.add(bezel)

const monitorStand = new THREE.Group()
monitorStand.position.set(0, -3.3, -0.05)
monitor.add(monitorStand)

const standNeck = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.15, 0.52), monitorTrimMaterial)
standNeck.castShadow = true
monitorStand.add(standNeck)

const standFoot = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 0.24, 40), monitorTrimMaterial)
standFoot.position.set(0, -1.2, 0.7)
standFoot.castShadow = true
monitorStand.add(standFoot)

const screenCanvas = document.createElement('canvas')
screenCanvas.width = 1280
screenCanvas.height = 720
const screenContext = screenCanvas.getContext('2d')

if (!screenContext) {
  throw new Error('2D context unavailable')
}

const crtContext: CanvasRenderingContext2D = screenContext

const screenTexture = new THREE.CanvasTexture(screenCanvas)
screenTexture.colorSpace = THREE.SRGBColorSpace
screenTexture.minFilter = THREE.LinearFilter

const screen = new THREE.Mesh(
  new THREE.PlaneGeometry(8.7, 4.95),
  new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
)
screen.position.set(0, 0, 0.35)
screen.renderOrder = 2
monitor.add(screen)

const pcTower = new THREE.Group()
pcTower.position.set(10.95, -1.62, -3.2)
pcTower.rotation.y = -0.34
pcTower.scale.setScalar(1.1)
rig.add(pcTower)

pcKeyLight.target = pcTower

const pcModelWrap = new THREE.Group()
pcTower.add(pcModelWrap)

const pcAccentLight = new THREE.PointLight(0x56ddff, 1.45, 14)
pcAccentLight.position.set(-0.8, 1.1, 0.9)
pcTower.add(pcAccentLight)

const pcBaseShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.55, 28),
  new THREE.MeshBasicMaterial({ color: 0x050709, transparent: true, opacity: 0.42 }),
)
pcBaseShadow.rotation.x = -Math.PI / 2
pcBaseShadow.position.set(0, -3.45, 0)
pcTower.add(pcBaseShadow)

const gltfLoader = new GLTFLoader()

gltfLoader.load(
  modelAssetUrl('pc_model.glb'),
  (gltf) => {
    const loadedPc = gltf.scene
    const PC_MODEL_YAW = Math.PI * 0.86

    loadedPc.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true

        if (Array.isArray(node.material)) {
          node.material.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = 1.7
              material.roughness = Math.min(1, material.roughness * 0.92)
              material.metalness = Math.min(1, material.metalness * 0.95)
              material.color.multiplyScalar(1.1)
            }
          })
        } else if (node.material instanceof THREE.MeshStandardMaterial) {
          node.material.envMapIntensity = 1.7
          node.material.roughness = Math.min(1, node.material.roughness * 0.92)
          node.material.metalness = Math.min(1, node.material.metalness * 0.95)
          node.material.color.multiplyScalar(1.1)
        }
      }
    })

    const bbox = new THREE.Box3().setFromObject(loadedPc)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    bbox.getSize(size)
    bbox.getCenter(center)

    const targetHeight = 7.8
    const scale = targetHeight / Math.max(size.y, 0.001)
    loadedPc.scale.setScalar(scale)
    loadedPc.position.sub(center.multiplyScalar(scale))
    loadedPc.position.y += -3.22 + (size.y * scale) / 2
    loadedPc.rotation.y = PC_MODEL_YAW

    pcModelWrap.add(loadedPc)
    updateLoadingProgress()
  },
  undefined,
  (error) => {
    console.error('Failed to load PC GLB model:', error)

    const fallback = new THREE.Mesh(new THREE.BoxGeometry(3.3, 7.2, 6), pcBodyMaterial)
    fallback.castShadow = true
    fallback.position.y = -0.2
    pcModelWrap.add(fallback)
  },
)

pcSoftFill.target = pcTower

const keyboard = new THREE.Group()
keyboard.position.set(0, -3.06, 4.68)
keyboard.rotation.x = 0.08
keyboard.scale.setScalar(0.86)
rig.add(keyboard)

const keyboardShellMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1f2a, roughness: 0.52, metalness: 0.26 })
const keyboardDeckMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.45, metalness: 0.22 })

const keyboardBody = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.6, 5.35), keyboardShellMaterial)
keyboardBody.castShadow = true
keyboard.add(keyboardBody)

const keyboardDeck = new THREE.Mesh(new THREE.BoxGeometry(12.75, 0.08, 4.75), keyboardDeckMaterial)
keyboardDeck.position.set(0, 0.34, -0.08)
keyboard.add(keyboardDeck)

const keyboardLip = new THREE.Mesh(new THREE.BoxGeometry(13.25, 0.22, 0.3), keyboardDeckMaterial)
keyboardLip.position.set(0, 0.2, 2.48)
keyboard.add(keyboardLip)

const keyboardUnderglowMaterial = new THREE.MeshStandardMaterial({
  color: 0x0d131c,
  emissive: 0x3dc4ff,
  emissiveIntensity: 0.02,
  roughness: 0.4,
  metalness: 0.12,
})
const keyboardUnderglow = new THREE.Mesh(new THREE.BoxGeometry(12.25, 0.05, 0.08), keyboardUnderglowMaterial)
keyboardUnderglow.position.set(0, -0.2, 2.62)
keyboard.add(keyboardUnderglow)

const keyMaterial = new THREE.MeshStandardMaterial({ color: 0xb9c1cf, roughness: 0.62, metalness: 0.04 })
const accentKeyMaterial = new THREE.MeshStandardMaterial({ color: 0xc2915b, roughness: 0.58, metalness: 0.06 })
const coolKeyMaterial = new THREE.MeshStandardMaterial({ color: 0x2b5c99, roughness: 0.54, metalness: 0.08 })
const keyMap = new Map<string, THREE.Mesh[]>()
const allKeys: THREE.Mesh[] = []
const raycaster = new THREE.Raycaster()
const pointer2D = new THREE.Vector2()
const legendMaterialCache = new Map<string, THREE.MeshStandardMaterial>()

function sideMaterialForTone(tone: KeyTone): THREE.MeshStandardMaterial {
  if (tone === 'warm') return accentKeyMaterial
  if (tone === 'cool') return coolKeyMaterial
  return keyMaterial
}

function legendForCode(code: string): string {
  return KEY_LABELS[code] ?? code.replace('Key', '')
}

function topMaterialForLabel(label: string, tone: KeyTone): THREE.MeshStandardMaterial {
  const cacheKey = `${tone}:${label}`
  const existing = legendMaterialCache.get(cacheKey)
  if (existing) {
    return existing
  }

  const legendCanvas = document.createElement('canvas')
  legendCanvas.width = 256
  legendCanvas.height = 256
  const ctx = legendCanvas.getContext('2d')

  if (!ctx) {
    return sideMaterialForTone(tone)
  }

  const base = tone === 'warm' ? '#c99863' : tone === 'cool' ? '#2f67ac' : '#bcc5d3'
  const ink = tone === 'cool' ? '#f2f8ff' : '#1f2a38'

  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 6
  ctx.strokeRect(9, 9, 238, 238)

  ctx.fillStyle = ink
  ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = label.split('\n')
  if (lines.length === 1) {
    ctx.fillText(lines[0], 128, 132)
  } else {
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif'
    lines.forEach((line, index) => {
      ctx.fillText(line, 128, 106 + index * 54)
    })
  }

  const texture = new THREE.CanvasTexture(legendCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  texture.minFilter = THREE.LinearFilter

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.38,
    metalness: 0.08,
  })
  legendMaterialCache.set(cacheKey, material)
  return material
}

function createKey(
  code: string,
  x: number,
  z: number,
  width = 1,
  tone: KeyTone = 'normal',
): void {
  const keyWidth = width * 0.45
  const keyHeight = 0.16
  const keyDepth = 0.38
  const side = sideMaterialForTone(tone)
  const top = topMaterialForLabel(legendForCode(code), tone)
  const keyMaterials: THREE.Material[] = [side, side, top, side, side, side]
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth), keyMaterials)
  mesh.castShadow = true
  mesh.position.set(x + keyWidth / 2, 0.43, z)
  mesh.userData.restY = mesh.position.y
  mesh.userData.press = 0
  allKeys.push(mesh)

  const existing = keyMap.get(code) ?? []
  existing.push(mesh)
  keyMap.set(code, existing)
  keyboard.add(mesh)
}

PRIMARY_ROWS.forEach((row, rowIndex) => {
  let cursor = KEYBOARD_GRID.primaryStartX
  const rowZ = KEYBOARD_GRID.rowStart + rowIndex * KEYBOARD_GRID.rowDepth

  row.forEach((keyInfo) => {
    createKey(keyInfo.code, cursor, rowZ, keyInfo.width ?? 1, keyInfo.tone ?? 'normal')
    cursor += (keyInfo.width ?? 1) * KEYBOARD_GRID.unit + KEYBOARD_GRID.gap
  })
})

NAV_ROWS.forEach((row, rowIndex) => {
  const total = row.reduce((sum, key) => sum + (key.width ?? 1) * KEYBOARD_GRID.unit + KEYBOARD_GRID.gap, -KEYBOARD_GRID.gap)
  let cursor = KEYBOARD_GRID.navCenterX - total / 2
  const rowZ = KEYBOARD_GRID.rowStart + rowIndex * KEYBOARD_GRID.rowDepth

  row.forEach((keyInfo) => {
    createKey(keyInfo.code, cursor, rowZ, keyInfo.width ?? 1, keyInfo.tone ?? 'normal')
    cursor += (keyInfo.width ?? 1) * KEYBOARD_GRID.unit + KEYBOARD_GRID.gap
  })
})

NUMPAD_ROWS.forEach((row, rowIndex) => {
  const total = row.reduce((sum, key) => sum + (key.width ?? 1) * KEYBOARD_GRID.unit + KEYBOARD_GRID.gap, -KEYBOARD_GRID.gap)
  let cursor = KEYBOARD_GRID.numpadCenterX - total / 2
  const rowZ = KEYBOARD_GRID.rowStart + rowIndex * KEYBOARD_GRID.rowDepth

  row.forEach((keyInfo) => {
    const visualCode = keyInfo.code === 'NumpadAddGhost' ? 'NumpadAdd' : keyInfo.code === 'NumpadEnterGhost' ? 'NumpadEnter' : keyInfo.code
    createKey(visualCode, cursor, rowZ, keyInfo.width ?? 1, keyInfo.tone ?? 'normal')
    cursor += (keyInfo.width ?? 1) * KEYBOARD_GRID.unit + KEYBOARD_GRID.gap
  })
})

const mouse = new THREE.Group()
mouse.position.set(6.7, -2.96, 4.35)
rig.add(mouse)

const mouseModelWrap = new THREE.Group()
mouse.add(mouseModelWrap)

let mouseWheelPart: THREE.Object3D | null = null
const mouseButtonParts: THREE.Object3D[] = []
const mouseButtonBaseY = new WeakMap<THREE.Object3D, number>()

gltfLoader.load(
  modelAssetUrl('pc_mouse_type-r.glb'),
  (gltf) => {
    const loadedMouse = gltf.scene

    loadedMouse.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true

        if (Array.isArray(node.material)) {
          node.material.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = 1.25
              material.roughness = Math.min(1, material.roughness * 0.96)
            }
          })
        } else if (node.material instanceof THREE.MeshStandardMaterial) {
          node.material.envMapIntensity = 1.25
          node.material.roughness = Math.min(1, node.material.roughness * 0.96)
        }
      }

      const lowered = node.name.toLowerCase()
      if (lowered.includes('wheel') || lowered.includes('scroll')) {
        mouseWheelPart = node
      }
      if (lowered.includes('left') || lowered.includes('right') || lowered.includes('button') || lowered.includes('click')) {
        mouseButtonParts.push(node)
        mouseButtonBaseY.set(node, node.position.y)
      }
    })

    const bbox = new THREE.Box3().setFromObject(loadedMouse)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    bbox.getSize(size)
    bbox.getCenter(center)

    const targetLength = 1.95
    const scale = targetLength / Math.max(size.z, 0.001)
    loadedMouse.scale.setScalar(scale)
    loadedMouse.position.sub(center.multiplyScalar(scale))
    loadedMouse.position.y += (size.y * scale) / 2 + 0.02
    loadedMouse.rotation.y = Math.PI * 1.9
    loadedMouse.rotation.x = -0.02

    mouseModelWrap.add(loadedMouse)
    updateLoadingProgress()
  },
  undefined,
  () => {
    const fallbackBody = new THREE.Mesh(new THREE.SphereGeometry(0.63, 28, 20), shellMaterial)
    fallbackBody.scale.set(1.06, 0.62, 1.3)
    fallbackBody.castShadow = true
    fallbackBody.position.y = 0.42
    mouseModelWrap.add(fallbackBody)
  },
)

const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.85, metalness: 0.08 })

const mouseCableCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.5, -3.1, 4.9),
  new THREE.Vector3(2.3, -3.2, 5.6),
  new THREE.Vector3(4.1, -3.05, 5.05),
  new THREE.Vector3(6.0, -2.95, 4.35),
])
const mouseCable = new THREE.Mesh(new THREE.TubeGeometry(mouseCableCurve, 48, 0.04, 8, false), cableMaterial)
mouseCable.castShadow = true
rig.add(mouseCable)

const screenEngine = new ScreenEngine()

// Tutorial management
const tutorialOverlay = document.getElementById('tutorial-overlay') as HTMLDivElement
const tutorialMessage = document.querySelector('.tutorial-message') as HTMLDivElement
const tutorialSkip = document.querySelector('.tutorial-skip') as HTMLButtonElement

const tutorialMessages = [
  'Welcome! Press ENTER on the keyboard below to login.',
  'Type commands on your keyboard or click keys on the 3D keyboard. Try typing help!',
  'Great! Now press ENTER to run your command. Try "help" to see available commands.',
]

function updateTutorial(): void {
  const step = screenEngine.getTutorialStep()
  
  if (step >= 3 || step < 0) {
    tutorialOverlay.classList.add('hidden')
    return
  }
  
  tutorialOverlay.className = 'tutorial-overlay step-' + step
  tutorialMessage.textContent = tutorialMessages[step]
  tutorialOverlay.classList.remove('hidden')
}

if (tutorialSkip) {
  tutorialSkip.addEventListener('click', () => {
    screenEngine.skipTutorial()
    updateTutorial()
  })
}

let cursorOn = true
let mouseDown = false
let wheelTarget = 0
let wheelValue = 0
let pointerX = 0
let pointerY = 0

function drawScreen(): void {
  const ctx = crtContext
  const { width, height } = screenCanvas
  const safeX = 24
  const safeY = 24
  const safeW = width - safeX * 2
  const safeH = height - safeY * 2

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#cad8e2')
  gradient.addColorStop(0.5, '#9cc1d6')
  gradient.addColorStop(1, '#5f8ea8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.03)'
    ctx.fillRect(0, y, width, 2)
  }

  ctx.fillStyle = 'rgba(8, 16, 24, 0.98)'
  ctx.fillRect(safeX, safeY, safeW, safeH)

  const view = screenEngine.getViewModel()

  ctx.font = '26px "Courier New", monospace'
  ctx.fillStyle = '#9ce8ff'
  ctx.fillText(view.title, safeX + 24, safeY + 38)

  ctx.font = '19px "Courier New", monospace'
  ctx.fillStyle = '#7fd3ff'
  ctx.fillText(view.statusLabel, safeX + safeW - 238, safeY + 38)

  if (view.mode === 'browser') {
    const browserX = safeX + 20
    const browserY = safeY + 66
    const browserW = safeW - 40
    const browserH = safeH - 130

    ctx.fillStyle = 'rgba(8, 16, 26, 0.92)'
    ctx.fillRect(browserX, browserY, browserW, browserH)

    ctx.fillStyle = 'rgba(110, 170, 214, 0.3)'
    ctx.fillRect(browserX, browserY, browserW, 36)

    ctx.strokeStyle = 'rgba(150, 220, 255, 0.32)'
    ctx.strokeRect(browserX, browserY, browserW, browserH)

    ctx.fillStyle = '#cfeeff'
    ctx.font = '18px "Courier New", monospace'
    ctx.fillText(view.windowTitle, browserX + 14, browserY + 24)

    ctx.fillStyle = '#91d9ff'
    ctx.font = '16px "Courier New", monospace'
    ctx.fillText(view.windowPath, browserX + 14, browserY + 56)

    ctx.fillStyle = '#d7f9ff'
    ctx.font = '18px "Courier New", monospace'
    const browserTextStart = browserY + 86
    view.windowLines.forEach((line, i) => {
      ctx.fillText(line, browserX + 14, browserTextStart + i * 28)
    })

    ctx.fillStyle = '#ffd394'
    ctx.fillText(view.prompt, browserX + 14, browserY + browserH - 16)

    if (cursorOn) {
      const beforeCursor = `> ${view.prompt.slice(2, 2 + view.cursorIndex)}`
      const metrics = ctx.measureText(beforeCursor)
      ctx.fillRect(browserX + 16 + metrics.width, browserY + browserH - 31, 10, 16)
    }
  } else if (view.mode === 'login') {
    // Login screen rendering
    const centerX = width / 2
    const centerY = height / 2

    // Title
    ctx.font = '32px "Courier New", monospace'
    ctx.fillStyle = '#7fe0ff'
    ctx.textAlign = 'center'
    ctx.fillText('MOONSYS LOGIN', centerX, centerY - 100)

    // User profile box
    const boxW = 320
    const boxH = 120
    const boxX = centerX - boxW / 2
    const boxY = centerY - 40

    // Box background
    ctx.fillStyle = 'rgba(127, 224, 255, 0.08)'
    ctx.fillRect(boxX, boxY, boxW, boxH)

    // Box border with glow effect
    ctx.strokeStyle = cursorOn ? 'rgba(127, 224, 255, 0.9)' : 'rgba(127, 224, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(boxX, boxY, boxW, boxH)

    // User icon (simple circle)
    ctx.beginPath()
    ctx.arc(centerX, boxY + 45, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#7fe0ff'
    ctx.fill()

    // Username
    ctx.font = '24px "Courier New", monospace'
    ctx.fillStyle = '#e8f4ff'
    ctx.fillText('Admin', centerX, boxY + 90)

    // Instruction text
    ctx.font = '16px "Courier New", monospace'
    ctx.fillStyle = '#7fd3ff'
    ctx.fillText('Press ENTER to login', centerX, centerY + 120)

    ctx.textAlign = 'left'
  } else {
    const visible = [...view.lines, view.prompt]
    const textStartY = safeY + 72
    const lineHeight = 30
    ctx.font = '19px "Consolas", "Cascadia Code", "Courier New", monospace'
    ctx.fillStyle = '#e8f4ff'
    visible.forEach((line, i) => {
      ctx.fillText(line, safeX + 20, textStartY + i * lineHeight)
    })

    if (cursorOn) {
      const beforeCursor = `> ${view.prompt.slice(2, 2 + view.cursorIndex)}`
      const metrics = ctx.measureText(beforeCursor)
      ctx.fillRect(safeX + 22 + metrics.width, textStartY - 22 + (visible.length - 1) * lineHeight, 13, 20)
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.beginPath()
  ctx.ellipse(width / 2, height / 2, width * 0.5, height * 0.44, 0, 0, Math.PI * 2)
  ctx.fill()

  screenTexture.needsUpdate = true
  updateTutorial()
}

// Music volume slider
const musicSlider = document.getElementById('music-volume') as HTMLInputElement
if (musicSlider) {
  let savedVolume: string | null = null
  try {
    savedVolume = localStorage.getItem('musicVolume')
  } catch (e) {
    console.warn('localStorage access failed:', e)
  }
  const volumeValue = savedVolume ? parseFloat(savedVolume) : 0.3
  // Ensure volume is in 0-1 range, handle legacy values
  const normalizedVolume = volumeValue > 1 ? volumeValue / 100 : volumeValue
  musicSlider.value = String(Math.round(normalizedVolume * 100))
  backgroundMusic.volume = normalizedVolume
  
  // Update slider visual background
  function updateSliderBackground() {
    const value = parseFloat(musicSlider.value)
    const percentage = value
    musicSlider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, rgba(143, 151, 166, 0.3) ${percentage}%, rgba(143, 151, 166, 0.3) 100%)`
  }
  
  // Set initial background
  updateSliderBackground()
  
  musicSlider.addEventListener('input', (e) => {
    const volume = parseFloat((e.target as HTMLInputElement).value) / 100
    setMusicVolume(volume)
    updateSliderBackground()
  })
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault()
  }

  const keys = keyMap.get(event.code)
  if (keys) {
    keys.forEach((k) => {
      k.userData.press = 1
    })
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    playKeySound()
    screenEngine.moveCursorLeft()
    drawScreen()
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    playKeySound()
    screenEngine.moveCursorRight()
    drawScreen()
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    playKeySound()
    // If Shift is held, scroll content up instead of history
    if (event.shiftKey) {
      screenEngine.scrollUp()
    } else {
      screenEngine.historyPrev()
    }
    drawScreen()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    playKeySound()
    // If Shift is held, scroll content down instead of history
    if (event.shiftKey) {
      screenEngine.scrollDown()
    } else {
      screenEngine.historyNext()
    }
    drawScreen()
    return
  }

  if (event.key === 'PageUp') {
    event.preventDefault()
    playKeySound()
    screenEngine.scrollPageUp()
    drawScreen()
    return
  }

  if (event.key === 'PageDown') {
    event.preventDefault()
    playKeySound()
    screenEngine.scrollPageDown()
    drawScreen()
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    playKeySound()
    screenEngine.moveCursorHome()
    drawScreen()
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    playKeySound()
    screenEngine.moveCursorEnd()
    drawScreen()
    return
  }

  if (event.key === 'Backspace') {
    playKeySound()
    screenEngine.backspace()
    drawScreen()
    return
  }

  if (event.key === 'Delete') {
    playKeySound()
    screenEngine.delete()
    drawScreen()
    return
  }

  if (event.key === 'Enter') {
    if (event.repeat) return
    playKeySound()
    const view = screenEngine.getViewModel()
    if (view.mode === 'login') {
      screenEngine.handleLogin()
    } else {
      screenEngine.submit()
    }
    drawScreen()
    return
  }

  if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
    playKeySound()
    screenEngine.insertCharacter(event.key)
    drawScreen()
  }
})

window.addEventListener('keyup', (event) => {
  const keys = keyMap.get(event.code)
  if (!keys) return
  keys.forEach((k) => {
    k.userData.press = 0
  })
})

window.addEventListener('wheel', (event) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    // Scroll up (show older content)
    screenEngine.scrollUp()
  } else {
    // Scroll down (show newer content)
    screenEngine.scrollDown()
  }
  drawScreen()
}, { passive: false })

window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX / window.innerWidth - 0.5
  pointerY = event.clientY / window.innerHeight - 0.5
})

window.addEventListener('pointerdown', (event) => {
  mouseDown = true
  mouseButtonParts.forEach((part) => {
    const base = mouseButtonBaseY.get(part) ?? part.position.y
    part.position.y = base - 0.01
  })

  pointer2D.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer2D.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer2D, camera)
  const intersects = raycaster.intersectObjects(allKeys, false)

  if (intersects.length > 0) {
    const clickedKey = intersects[0].object as THREE.Mesh
    
    for (const [code, meshes] of keyMap.entries()) {
      if (meshes.includes(clickedKey)) {
        playKeySound()
        
        meshes.forEach((k) => {
          k.userData.press = 1
          setTimeout(() => {
            k.userData.press = 0
          }, 100)
        })

        const keyLabel = legendForCode(code)
        let char = ''

        if (code === 'Enter') {
          const view = screenEngine.getViewModel()
          if (view.mode === 'login') {
            screenEngine.handleLogin()
          } else {
            screenEngine.submit()
          }
        } else if (code === 'Backspace') {
          screenEngine.backspace()
        } else if (code === 'Delete') {
          screenEngine.delete()
        } else if (code === 'Space') {
          screenEngine.insertCharacter(' ')
        } else if (code === 'Tab') {
          screenEngine.insertCharacter('  ')
        } else if (code === 'ArrowUp') {
          screenEngine.historyPrev()
        } else if (code === 'ArrowDown') {
          screenEngine.historyNext()
        } else if (code === 'ArrowLeft') {
          screenEngine.moveCursorLeft()
        } else if (code === 'ArrowRight') {
          screenEngine.moveCursorRight()
        } else if (code === 'Home') {
          screenEngine.moveCursorHome()
        } else if (code === 'End') {
          screenEngine.moveCursorEnd()
        } else if (keyLabel.length === 1) {
          char = keyLabel
          screenEngine.insertCharacter(char)
        } else if (keyLabel.match(/^[0-9]$/)) {
          screenEngine.insertCharacter(keyLabel)
        } else {
          const specialKeys: Record<string, string> = {
            'Comma': ',',
            'Period': '.',
            'Slash': '/',
            'Semicolon': ';',
            'Quote': "'",
            'BracketLeft': '[',
            'BracketRight': ']',
            'Backslash': '\\',
            'Minus': '-',
            'Equal': '=',
            'Backquote': '`'
          }
          if (specialKeys[code]) {
            screenEngine.insertCharacter(specialKeys[code])
          }
        }
        
        drawScreen()
        break
      }
    }
  }
})

window.addEventListener('pointerup', () => {
  mouseDown = false
  mouseButtonParts.forEach((part) => {
    const base = mouseButtonBaseY.get(part) ?? part.position.y
    part.position.y = base
  })
})

window.addEventListener('wheel', (event) => {
  wheelTarget += event.deltaY * 0.0004
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.setSize(window.innerWidth, window.innerHeight)
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  bloomPass.setSize(window.innerWidth, window.innerHeight)
})

setInterval(() => {
  cursorOn = !cursorOn
  drawScreen()
}, 460)

drawScreen()

function tick(): void {
  const elapsed = clock.getElapsedTime()

  camera.position.copy(CAMERA_POS)
  camera.lookAt(CAMERA_TARGET)

  allKeys.forEach((key) => {
    const restY = Number(key.userData.restY)
    const press = Number(key.userData.press)
    const targetY = restY - press * 0.08
    key.position.y = THREE.MathUtils.lerp(key.position.y, targetY, 0.18)
  })

  const desiredMouseX = 6.35 + pointerX * 1.2
  const desiredMouseZ = 4.2 + pointerY * 0.9

  // Keep the mouse outside the keyboard footprint to prevent model clipping.
  const keyboardHalfWidth = (13.4 * 0.86) / 2
  const mouseClearance = 0.95
  const minSafeMouseX = keyboard.position.x + keyboardHalfWidth + mouseClearance

  mouse.position.x = THREE.MathUtils.lerp(mouse.position.x, Math.max(desiredMouseX, minSafeMouseX), 0.1)
  mouse.position.z = THREE.MathUtils.lerp(mouse.position.z, desiredMouseZ, 0.1)
  mouse.rotation.z = THREE.MathUtils.lerp(mouse.rotation.z, pointerX * -0.25, 0.1)
  mouse.rotation.x = THREE.MathUtils.lerp(mouse.rotation.x, (mouseDown ? 0.14 : 0.03) + pointerY * 0.12, 0.15)

  wheelValue = THREE.MathUtils.lerp(wheelValue, wheelTarget, 0.14)
  if (mouseWheelPart) {
    mouseWheelPart.rotation.x = wheelValue * 1.4
  }
  mouseModelWrap.rotation.y = wheelValue * 0.08

  const ledPulse = 0.45 + (Math.sin(elapsed * 2.2) * 0.5 + 0.5) * 0.95
  const moonPulse = 0.5 + (Math.sin(elapsed * 0.55 + 0.7) * 0.5 + 0.5) * 0.7

  moonAnchor.rotation.y += 0.0005
  moonGlow.scale.setScalar(1 + moonPulse * 0.08)
  moonGlowMaterial.opacity = 0.16 + moonPulse * 0.12
  moonLight.intensity = 0.78 + moonPulse * 0.82

  powerLedMaterial.emissiveIntensity = ledPulse
  pcAccentLight.intensity = 1.0 + (Math.sin(elapsed * 2.7 + 0.5) * 0.5 + 0.5) * 1.05
  pcRimLight.intensity = 1.25 + (Math.sin(elapsed * 2.4 + 1.8) * 0.5 + 0.5) * 0.95
  pcSoftFill.intensity = 1.0 + (Math.sin(elapsed * 1.8 + 0.9) * 0.5 + 0.5) * 0.32
  keyboardUnderglowMaterial.emissiveIntensity = 0.02
  starField.rotation.y += 0.0008
  starField.rotation.x = Math.sin(elapsed * 0.1) * 0.06

  composer.render()
  requestAnimationFrame(tick)
}

tick()
