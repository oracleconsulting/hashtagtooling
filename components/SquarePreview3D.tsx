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
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const initialPosRef = useRef<THREE.Vector3 | null>(null)
  const initialTargetRef = useRef<THREE.Vector3 | null>(null)

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

    // ─── Scene ────────────────────────────────────────────────────────
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

    // ─── Controls ─────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(cx2, -cy2, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.enablePan = false
    controls.rotateSpeed = 0.7
    controls.zoomSpeed = 0.6
    controls.minDistance = maxDim * 0.9
    controls.maxDistance = maxDim * 2.2
    controls.minPolarAngle = Math.PI * 0.15
    controls.maxPolarAngle = Math.PI * 0.85
    controls.update()

    const initialCameraPos = camera.position.clone()
    const initialTarget = controls.target.clone()
    cameraRef.current = camera
    controlsRef.current = controls
    initialPosRef.current = initialCameraPos
    initialTargetRef.current = initialTarget

    // ─── Lights ───────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(maxDim, -maxDim * 0.5, maxDim * 1.5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(-maxDim, -maxDim * 1.5, maxDim)
    scene.add(fill)

    // ─── Body (centred at z=0) ────────────────────────────────────────
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
    bodyMesh.position.z = -bodyThicknessMm / 2
    scene.add(bodyMesh)

    // ─── Front liner ──────────────────────────────────────────────────
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
    linerMesh.position.z = bodyThicknessMm / 2
    scene.add(linerMesh)

    // ─── Front scale ──────────────────────────────────────────────────
    const scaleGeo = new THREE.ExtrudeGeometry(scaleShapeRaw, {
      depth: scaleThicknessMm,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2,
      curveSegments: 24,
    })

    // Remap UVs so grain image spans the full scale face, rotated 90° for lengthwise grain
    const remapScaleUVs = (geom: THREE.BufferGeometry) => {
      const pos = geom.attributes.position
      const uv = geom.attributes.uv
      if (!pos || !uv) return
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
      const w = maxX - minX
      const h = maxY - minY
      if (w === 0 || h === 0) return
      for (let i = 0; i < uv.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const nu = (x - minX) / w
        const nv = (y - minY) / h
        uv.setXY(i, nv, 1 - nu)
      }
      uv.needsUpdate = true
    }
    remapScaleUVs(scaleGeo)

    const scaleMatProps: THREE.MeshStandardMaterialParameters = {
      color: new THREE.Color(scaleColor),
      metalness: 0.05,
      roughness: 0.65,
    }
    if (scaleTextureUrl) {
      const tex = new THREE.TextureLoader().load(scaleTextureUrl, (loaded) => {
        const imgW = loaded.image.width
        const imgH = loaded.image.height
        if (!imgW || !imgH) return
        const photoAspect = imgW / imgH
        const scaleAspect = scale.height / scale.width
        if (photoAspect > scaleAspect) {
          const repeatX = scaleAspect / photoAspect
          loaded.repeat.x = repeatX
          loaded.offset.x = (1 - repeatX) / 2
        } else {
          const repeatY = photoAspect / scaleAspect
          loaded.repeat.y = repeatY
          loaded.offset.y = (1 - repeatY) / 2
        }
        loaded.needsUpdate = true
      })
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.colorSpace = THREE.SRGBColorSpace
      scaleMatProps.map = tex
      scaleMatProps.color = new THREE.Color('#ffffff')
    }
    const scaleMat = new THREE.MeshStandardMaterial(scaleMatProps)
    const scaleMesh = new THREE.Mesh(scaleGeo, scaleMat)
    scaleMesh.position.z = bodyThicknessMm / 2 + linerThicknessMm
    scene.add(scaleMesh)

    // ─── Back-side liner + scale (mirrored sandwich) ──────────────────
    const backLinerGeo = linerGeo.clone()
    const backLinerMesh = new THREE.Mesh(backLinerGeo, linerMat)
    backLinerMesh.position.z = -bodyThicknessMm / 2 - linerThicknessMm
    backLinerMesh.rotation.y = Math.PI
    backLinerMesh.scale.x = -1
    scene.add(backLinerMesh)

    const backScaleGeo = scaleGeo.clone()
    const backScaleMat = scaleMat.clone()
    if (backScaleMat.map) {
      backScaleMat.map = backScaleMat.map.clone()
      backScaleMat.map.needsUpdate = true
      backScaleMat.map.repeat.x = -Math.abs(backScaleMat.map.repeat.x)
      backScaleMat.map.offset.x = 1 - backScaleMat.map.offset.x
    }
    const backScaleMesh = new THREE.Mesh(backScaleGeo, backScaleMat)
    backScaleMesh.position.z = -bodyThicknessMm / 2 - linerThicknessMm - scaleThicknessMm
    backScaleMesh.rotation.y = Math.PI
    backScaleMesh.scale.x = -1
    scene.add(backScaleMesh)

    // ─── Animation loop ───────────────────────────────────────────────
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
      backLinerGeo.dispose()
      backScaleGeo.dispose()
      backScaleMat.dispose()
      if (backScaleMat.map) backScaleMat.map.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      cameraRef.current = null
      controlsRef.current = null
    }
  }, [size, scaleType, scaleVariant, bodyColor, scaleColor, linerColor, scaleTextureUrl, linerThicknessMm, bodyThicknessMm, scaleThicknessMm])

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-zinc-950">
      <div ref={mountRef} className="absolute inset-0" />
      <button
        onClick={() => {
          const c = cameraRef.current
          const k = controlsRef.current
          if (!c || !k || !initialPosRef.current || !initialTargetRef.current) return
          c.position.copy(initialPosRef.current)
          k.target.copy(initialTargetRef.current)
          k.update()
        }}
        className="absolute bottom-3 right-3 px-3 py-1.5 text-xs bg-black/70 hover:bg-black/90 text-white rounded-md backdrop-blur-sm border border-white/10 transition-colors"
      >
        Reset view
      </button>
    </div>
  )
}
