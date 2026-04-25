'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  getBody,
  getScale,
  type SquareSize,
  type ScaleType,
  type ScaleVariant,
} from '@/lib/square-geometry'

interface SquarePreview3DProps {
  size: SquareSize
  scaleType: ScaleType
  scaleVariant: ScaleVariant
  bodyColor: string
  scaleColor: string
  linerColor: string
  scaleTextureUrl?: string | null
  linerThicknessMm: number
  bodyThicknessMm?: number
  scaleThicknessMm?: number
}

export default function SquarePreview3D({
  size,
  scaleType,
  scaleVariant,
  bodyColor,
  scaleColor,
  linerColor,
  scaleTextureUrl,
  linerThicknessMm,
  bodyThicknessMm = 3,
  scaleThicknessMm = 3,
}: SquarePreview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const body = getBody(size, scaleType)
    const scale = getScale(size, scaleType, scaleVariant)
    if (!body || !scale) return

    const buildShapeFromLines = (
      lines: { x1: number; y1: number; x2: number; y2: number }[]
    ): THREE.Shape => {
      const remaining = [...lines]
      const shape = new THREE.Shape()
      const first = remaining.shift()!
      shape.moveTo(first.x1, -first.y1)
      shape.lineTo(first.x2, -first.y2)
      let cx = first.x2
      let cy = first.y2
      const tol = 0.01
      while (remaining.length) {
        const idx = remaining.findIndex(
          (l) =>
            (Math.abs(l.x1 - cx) < tol && Math.abs(l.y1 - cy) < tol) ||
            (Math.abs(l.x2 - cx) < tol && Math.abs(l.y2 - cy) < tol)
        )
        if (idx === -1) break
        const next = remaining.splice(idx, 1)[0]
        const continuesAtStart =
          Math.abs(next.x1 - cx) < tol && Math.abs(next.y1 - cy) < tol
        const ex = continuesAtStart ? next.x2 : next.x1
        const ey = continuesAtStart ? next.y2 : next.y1
        shape.lineTo(ex, -ey)
        cx = ex
        cy = ey
      }
      return shape
    }

    const bodyShape = buildShapeFromLines(body.lines)
    body.circles.forEach((c) => {
      const hole = new THREE.Path()
      hole.absarc(c.cx, -c.cy, c.r, 0, Math.PI * 2, false)
      bodyShape.holes.push(hole)
    })

    const scaleShapeRaw = buildShapeFromLines(
      scale.lines.map((l) => ({
        x1: l.x1 + scale.bodyOffsetX,
        y1: l.y1 + scale.bodyOffsetY,
        x2: l.x2 + scale.bodyOffsetX,
        y2: l.y2 + scale.bodyOffsetY,
      }))
    )
    scale.circles.forEach((c) => {
      const hole = new THREE.Path()
      hole.absarc(c.cx + scale.bodyOffsetX, -(c.cy + scale.bodyOffsetY), c.r, 0, Math.PI * 2, false)
      scaleShapeRaw.holes.push(hole)
    })

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)

    const aspect = mount.clientWidth / mount.clientHeight
    const camera = new THREE.PerspectiveCamera(35, aspect, 1, 2000)

    const cx2 = body.width / 2
    const cy2 = body.height / 2
    const maxDim = Math.max(body.width, body.height)
    camera.position.set(cx2, -cy2 - maxDim * 0.4, maxDim * 1.1)
    camera.lookAt(cx2, -cy2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(cx2, -cy2, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = maxDim * 0.6
    controls.maxDistance = maxDim * 2.5
    controls.update()

    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(maxDim, -maxDim * 0.5, maxDim * 1.5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(-maxDim, -maxDim * 1.5, maxDim)
    scene.add(fill)

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: bodyThicknessMm,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 2,
      curveSegments: 24,
    })
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bodyColor),
      metalness: 0.9,
      roughness: 0.35,
    })
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
    bodyMesh.position.z = 0
    scene.add(bodyMesh)

    const linerGeo = new THREE.ExtrudeGeometry(scaleShapeRaw, {
      depth: linerThicknessMm,
      bevelEnabled: false,
      curveSegments: 24,
    })
    const linerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(linerColor),
      metalness: 0.85,
      roughness: 0.25,
    })
    const linerMesh = new THREE.Mesh(linerGeo, linerMat)
    linerMesh.position.z = bodyThicknessMm
    scene.add(linerMesh)

    const scaleGeo = new THREE.ExtrudeGeometry(scaleShapeRaw, {
      depth: scaleThicknessMm,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2,
      curveSegments: 24,
    })
    const scaleMatProps: THREE.MeshStandardMaterialParameters = {
      color: new THREE.Color(scaleColor),
      metalness: 0.05,
      roughness: 0.65,
    }
    if (scaleTextureUrl) {
      const tex = new THREE.TextureLoader().load(scaleTextureUrl)
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(0.04, 0.04)
      scaleMatProps.map = tex
      scaleMatProps.color = new THREE.Color('#ffffff')
    }
    const scaleMat = new THREE.MeshStandardMaterial(scaleMatProps)
    const scaleMesh = new THREE.Mesh(scaleGeo, scaleMat)
    scaleMesh.position.z = bodyThicknessMm + linerThicknessMm
    scene.add(scaleMesh)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      bodyGeo.dispose()
      bodyMat.dispose()
      linerGeo.dispose()
      linerMat.dispose()
      scaleGeo.dispose()
      scaleMat.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [size, scaleType, scaleVariant, bodyColor, scaleColor, linerColor, scaleTextureUrl, linerThicknessMm, bodyThicknessMm, scaleThicknessMm])

  return <div ref={mountRef} className="w-full h-[400px] rounded-lg overflow-hidden" />
}
