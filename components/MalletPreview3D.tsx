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

// Proportions: head 40%, transition 3%, handle 57% of total height
const TOTAL_HEIGHT = 1.2
const HEAD_HEIGHT = TOTAL_HEIGHT * 0.4
const TRANSITION_HEIGHT = TOTAL_HEIGHT * 0.03
const HANDLE_HEIGHT = TOTAL_HEIGHT * 0.57

function createTurnedHeadGeometry(): THREE.LatheGeometry {
  // Profile: mushroom cap — concave curve at bottom, dome at top. (radius, y) bottom-to-top.
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.4, 0), // bottom at transition
    new THREE.Vector2(0.44, 0.05), // gentle curve out
    new THREE.Vector2(0.48, 0.14), // max radius ~35% up
    new THREE.Vector2(0.48, 0.26), // maintain through middle
    new THREE.Vector2(0.46, 0.34), // dome inward
    new THREE.Vector2(0.44, HEAD_HEIGHT), // subtle chamfer at top
  ]
  return new THREE.LatheGeometry(points, 24)
}

function createSquareHeadGeometry(): THREE.ExtrudeGeometry {
  // Slightly taller than wide (striking face), chamfered corners via rounded rect
  const halfW = 0.24
  const halfD = 0.24
  const r = 0.03
  const shape = new THREE.Shape()
  shape.moveTo(-halfW + r, -halfD)
  shape.lineTo(halfW - r, -halfD)
  shape.absarc(halfW - r, -halfD + r, r, -Math.PI / 2, 0)
  shape.lineTo(halfW, halfD - r)
  shape.absarc(halfW - r, halfD - r, r, 0, Math.PI / 2)
  shape.lineTo(-halfW + r, halfD)
  shape.absarc(-halfW + r, halfD - r, r, Math.PI / 2, Math.PI)
  shape.lineTo(-halfW, -halfD + r)
  shape.absarc(-halfW + r, -halfD + r, r, Math.PI, (Math.PI * 3) / 2)
  const extrudeSettings = { depth: HEAD_HEIGHT, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, HEAD_HEIGHT / 2, 0)
  return geo
}

function createHandleGeometry(): THREE.LatheGeometry {
  // Taper with subtle belly at 2/3 down (from top), rounded bottom. Profile bottom-to-top.
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.08, 0), // rounded bottom end
    new THREE.Vector2(0.22, HANDLE_HEIGHT * 0.06),
    new THREE.Vector2(0.26, HANDLE_HEIGHT * 0.15),
    new THREE.Vector2(0.28, HANDLE_HEIGHT * 0.25), // swell at ~75% from top
    new THREE.Vector2(0.32, HANDLE_HEIGHT * 0.55),
    new THREE.Vector2(0.35, HANDLE_HEIGHT), // top at transition
  ]
  return new THREE.LatheGeometry(points, 24)
}

export function MalletPreview3D({ headColor, handleColor, transitionColor, style }: MalletPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = null

    const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 100)
    camera.position.set(2, 1.5, 2)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(renderer.domElement)

    const headColorHex = headColor || NEUTRAL
    const handleColorHex = handleColor || NEUTRAL
    const transitionColorHex = transitionColor || NEUTRAL

    const woodMat = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0 })
    const metalMat = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.8 })

    let head: THREE.Mesh
    if (style === 'square') {
      const geo = createSquareHeadGeometry()
      head = new THREE.Mesh(geo, woodMat(headColorHex))
      head.position.y = TRANSITION_HEIGHT + HANDLE_HEIGHT + HEAD_HEIGHT / 2
    } else {
      const geo = createTurnedHeadGeometry()
      head = new THREE.Mesh(geo, woodMat(headColorHex))
      head.position.y = TRANSITION_HEIGHT + HANDLE_HEIGHT + HEAD_HEIGHT / 2
    }
    scene.add(head)

    const ringShape = new THREE.Shape().absarc(0, 0, 0.4, 0, Math.PI * 2)
    ringShape.holes.push(new THREE.Path().absarc(0, 0, 0.34, 0, Math.PI * 2))
    const transitionGeo = new THREE.ExtrudeGeometry(ringShape, { depth: TRANSITION_HEIGHT, bevelEnabled: false })
    transitionGeo.rotateX(-Math.PI / 2)
    transitionGeo.translate(0, TRANSITION_HEIGHT / 2, 0)
    const transition = new THREE.Mesh(transitionGeo, metalMat(transitionColorHex))
    transition.position.y = HANDLE_HEIGHT + TRANSITION_HEIGHT / 2
    scene.add(transition)

    const handleGeo = createHandleGeometry()
    const handle = new THREE.Mesh(handleGeo, woodMat(handleColorHex))
    handle.position.y = HANDLE_HEIGHT / 2
    scene.add(handle)

    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(2, 3, 2)
    scene.add(dir)
    const rim = new THREE.DirectionalLight(0xffeedd, 0.25)
    rim.position.set(-1.5, -1, 1)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
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
