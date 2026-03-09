'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface MalletPreview3DProps {
  headColor: string
  handleColor: string
  transitionColor: string
  style: 'turned' | 'square'
}

const NEUTRAL = '#555555'

function buildTurnedHead(): THREE.LatheGeometry {
  // Mushroom-cap profile. Points go bottom→top as (radius, y).
  // Bottom sits at y=0, top at y=1. We scale via the group.
  const pts: THREE.Vector2[] = []
  // Bottom chamfer
  pts.push(new THREE.Vector2(0.00, 0.00))
  pts.push(new THREE.Vector2(0.42, 0.00))
  pts.push(new THREE.Vector2(0.44, 0.02))
  // Concave swell outward
  pts.push(new THREE.Vector2(0.50, 0.15))
  pts.push(new THREE.Vector2(0.52, 0.30))
  // Maintain max radius through striking zone
  pts.push(new THREE.Vector2(0.52, 0.55))
  pts.push(new THREE.Vector2(0.51, 0.70))
  // Dome inward at top
  pts.push(new THREE.Vector2(0.48, 0.85))
  pts.push(new THREE.Vector2(0.44, 0.95))
  // Top chamfer
  pts.push(new THREE.Vector2(0.42, 1.00))
  pts.push(new THREE.Vector2(0.00, 1.00))
  return new THREE.LatheGeometry(pts, 32)
}

function buildSquareHead(): THREE.BufferGeometry {
  // Rounded-rect cross-section extruded upward with bevel
  const w = 0.48
  const d = 0.48
  const r = 0.04
  const hw = w / 2
  const hd = d / 2
  const shape = new THREE.Shape()
  shape.moveTo(-hw + r, -hd)
  shape.lineTo(hw - r, -hd)
  shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(hw, hd - r)
  shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-hw + r, hd)
  shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-hw, -hd + r)
  shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.0,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  })
  // Extrude goes along Z by default; rotate so it goes along Y
  geo.rotateX(-Math.PI / 2)
  // Center it: extrude puts bottom at z=0 → after rotate bottom at y=0, top at y=1
  return geo
}

function buildHandle(): THREE.LatheGeometry {
  // Tapered handle: wide at top (transition end), belly at ~1/3 from bottom, rounded end.
  // Points go bottom→top as (radius, y). Bottom at y=0, top at y=1. Scaled via group.
  const pts: THREE.Vector2[] = []
  // Rounded bottom cap
  pts.push(new THREE.Vector2(0.00, 0.00))
  pts.push(new THREE.Vector2(0.08, 0.01))
  pts.push(new THREE.Vector2(0.14, 0.03))
  // Taper up
  pts.push(new THREE.Vector2(0.17, 0.10))
  pts.push(new THREE.Vector2(0.19, 0.20))
  // Belly / swell ~1/3 from bottom
  pts.push(new THREE.Vector2(0.20, 0.30))
  pts.push(new THREE.Vector2(0.19, 0.40))
  // Continue taper wider toward transition
  pts.push(new THREE.Vector2(0.20, 0.55))
  pts.push(new THREE.Vector2(0.22, 0.70))
  pts.push(new THREE.Vector2(0.24, 0.85))
  // Top meets transition ring
  pts.push(new THREE.Vector2(0.26, 1.00))
  return new THREE.LatheGeometry(pts, 24)
}

export function MalletPreview3D({ headColor, handleColor, transitionColor, style }: MalletPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.background = null

    const w = container.clientWidth
    const h = container.clientHeight
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const headHex = headColor || NEUTRAL
    const handleHex = handleColor || NEUTRAL
    const transitionHex = transitionColor || NEUTRAL

    const woodMat = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.0 })
    const brassMat = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.85 })

    // ---- Sizes (world units) ----
    const handleH = 1.4
    const transH = 0.05
    const headH = 0.9
    const transR = 0.28 // outer radius of brass ring

    // ---- Build handle ----
    const handleGeo = buildHandle()
    handleGeo.scale(1, handleH, 1) // stretch Y from [0,1] to [0, handleH]
    const handleMesh = new THREE.Mesh(handleGeo, woodMat(handleHex))
    handleMesh.position.y = 0 // bottom at y=0
    scene.add(handleMesh)

    // ---- Build transition ring ----
    const transGeo = new THREE.CylinderGeometry(transR, transR, transH, 32)
    const transMesh = new THREE.Mesh(transGeo, brassMat(transitionHex))
    transMesh.position.y = handleH + transH / 2 // sits on top of handle
    scene.add(transMesh)

    // ---- Build head ----
    let headMesh: THREE.Mesh
    if (style === 'square') {
      const headGeo = buildSquareHead()
      headGeo.scale(1, headH, 1) // stretch Y
      headMesh = new THREE.Mesh(headGeo, woodMat(headHex))
    } else {
      const headGeo = buildTurnedHead()
      headGeo.scale(1, headH, 1)
      headMesh = new THREE.Mesh(headGeo, woodMat(headHex))
    }
    headMesh.position.y = handleH + transH // bottom of head sits on top of transition
    scene.add(headMesh)

    // ---- Center the whole mallet vertically around origin ----
    const totalH = handleH + transH + headH
    const offset = -totalH / 2
    handleMesh.position.y += offset
    transMesh.position.y += offset
    headMesh.position.y += offset

    // ---- Camera ----
    camera.position.set(1.8, 0.6, 1.8)
    camera.lookAt(0, 0, 0)

    // ---- Lighting ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9)
    keyLight.position.set(2, 3, 2)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3)
    fillLight.position.set(-2, 0, 1)
    scene.add(fillLight)
    const rimLight = new THREE.DirectionalLight(0xddeeff, 0.2)
    rimLight.position.set(0, -2, -1)
    scene.add(rimLight)

    // ---- Controls ----
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0, 0)

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!container) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [headColor, handleColor, transitionColor, style])

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#1A1A1A] rounded-lg overflow-hidden aspect-[3/2] md:aspect-[4/3]"
    />
  )
}
