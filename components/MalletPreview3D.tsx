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

    let head: THREE.Mesh
    if (style === 'square') {
      const geo = new THREE.BoxGeometry(0.8, 0.5, 0.8)
      const mat = new THREE.MeshStandardMaterial({ color: headColorHex })
      head = new THREE.Mesh(geo, mat)
    } else {
      const geo = new THREE.CylinderGeometry(0.4, 0.45, 0.5, 24)
      const mat = new THREE.MeshStandardMaterial({ color: headColorHex })
      head = new THREE.Mesh(geo, mat)
    }
    head.position.y = 0.9
    scene.add(head)

    const transitionGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24)
    const transitionMat = new THREE.MeshStandardMaterial({ color: transitionColorHex })
    const transition = new THREE.Mesh(transitionGeo, transitionMat)
    transition.position.y = 0.55
    scene.add(transition)

    const handleGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.7, 16)
    const handleMat = new THREE.MeshStandardMaterial({ color: handleColorHex })
    const handle = new THREE.Mesh(handleGeo, handleMat)
    handle.position.y = 0.15
    scene.add(handle)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(2, 3, 2)
    scene.add(dir)

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
