'use client'

import {
  getBody,
  getScale,
  SQUARE_SPECS,
  type SquareSize,
  type ScaleType,
  type ScaleVariant,
} from '@/lib/square-geometry'

interface SquareProfileSVGProps {
  size: SquareSize
  scaleType?: ScaleType
  scaleVariant?: ScaleVariant
  bodyColor?: string
  scaleColor?: string | null
  linerColor?: string | null
  linerThicknessMm?: number
  scaleTextureUrl?: string | null
  showDimensions?: boolean
  showHoles?: boolean
  className?: string
  opacity?: number
}

export function SquareProfileSVG({
  size,
  scaleType = 'full_scale',
  scaleVariant = 'narrow',
  bodyColor = '#888888',
  scaleColor = null,
  linerColor = null,
  linerThicknessMm = 1,
  scaleTextureUrl = null,
  showDimensions = false,
  showHoles = true,
  className = '',
  opacity = 1,
}: SquareProfileSVGProps) {
  const body = getBody(size, scaleType)
  const scale = getScale(size, scaleType, scaleVariant)
  const specs = SQUARE_SPECS[size]
  if (!body || !specs) return null

  const scaleMinX = scale ? scale.bodyOffsetX : 0
  const scaleMinY = scale ? scale.bodyOffsetY : 0
  const scaleMaxX = scale ? scale.bodyOffsetX + scale.width : 0
  const scaleMaxY = scale ? scale.bodyOffsetY + scale.height : 0

  const minX = Math.min(0, scaleMinX)
  const minY = Math.min(0, scaleMinY)
  const maxX = Math.max(body.width, scaleMaxX)
  const maxY = Math.max(body.height, scaleMaxY)
  const pad = showDimensions ? Math.max(12, body.width * 0.07) : 4

  const vbX = minX - pad
  const vbY = minY - pad
  const vbW = (maxX - minX) + pad * 2
  const vbH = (maxY - minY) + pad * 2

  const bodyStrokeWidth = Math.max(0.4, body.width * 0.005)
  const scaleStrokeWidth = bodyStrokeWidth * 0.7
  const fontSize = Math.max(4, body.width * 0.035)

  const linesToPath = (
    lines: { x1: number; y1: number; x2: number; y2: number }[],
    offsetX = 0,
    offsetY = 0
  ): string => {
    if (!lines.length) return ''
    const remaining = lines.map((l) => ({
      x1: l.x1 + offsetX, y1: l.y1 + offsetY,
      x2: l.x2 + offsetX, y2: l.y2 + offsetY,
    }))
    const tol = 0.05
    const parts: string[] = []
    while (remaining.length) {
      const start = remaining.shift()!
      let path = `M ${start.x1} ${start.y1} L ${start.x2} ${start.y2}`
      let cx = start.x2
      let cy = start.y2
      while (remaining.length) {
        const idx = remaining.findIndex(
          (l) =>
            (Math.abs(l.x1 - cx) < tol && Math.abs(l.y1 - cy) < tol) ||
            (Math.abs(l.x2 - cx) < tol && Math.abs(l.y2 - cy) < tol)
        )
        if (idx === -1) break
        const next = remaining.splice(idx, 1)[0]
        const reverse = !(Math.abs(next.x1 - cx) < tol && Math.abs(next.y1 - cy) < tol)
        const ex = reverse ? next.x1 : next.x2
        const ey = reverse ? next.y1 : next.y2
        path += ` L ${ex} ${ey}`
        cx = ex
        cy = ey
      }
      parts.push(path + ' Z')
    }
    return parts.join(' ')
  }

  const bodyPath = linesToPath(body.lines)
  const scalePath = scale ? linesToPath(scale.lines, scale.bodyOffsetX, scale.bodyOffsetY) : ''

  const patternId = `grain-${size}-${scaleType}-${scaleVariant}`
  const usePattern = !!scaleTextureUrl && !!scale && !!scaleColor
  const scaleBoxX = scale ? scale.bodyOffsetX : 0
  const scaleBoxY = scale ? scale.bodyOffsetY : 0
  const scaleBoxW = scale ? scale.width : 0
  const scaleBoxH = scale ? scale.height : 0

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      width="100%"
      className={className}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {usePattern && (
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            x={scaleBoxX}
            y={scaleBoxY}
            width={scaleBoxW}
            height={scaleBoxH}
            patternTransform={`rotate(90 ${scaleBoxX + scaleBoxW / 2} ${scaleBoxY + scaleBoxH / 2})`}
          >
            <image
              href={scaleTextureUrl ?? ''}
              x={scaleBoxX}
              y={scaleBoxY}
              width={scaleBoxW}
              height={scaleBoxH}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>
      )}

      {/* Body fill */}
      <path
        d={bodyPath}
        fill={bodyColor}
        fillOpacity={0.12}
        stroke={bodyColor}
        strokeWidth={bodyStrokeWidth}
        strokeLinejoin="round"
      />

      {/* Liner — behind scale */}
      {scale && linerColor && scaleColor && (
        <path
          d={scalePath}
          fill={linerColor}
          fillOpacity={0.85}
          stroke={linerColor}
          strokeWidth={scaleStrokeWidth * (linerThicknessMm >= 2.5 ? 1.6 : 1.2)}
          strokeLinejoin="round"
        />
      )}

      {/* Scale — on top of liner, slightly inset so a sliver of liner shows */}
      {scale && scaleColor && (
        <g
          style={{
            transform: 'scale(0.97)',
            transformOrigin: `${scale.bodyOffsetX + scale.width / 2}px ${scale.bodyOffsetY + scale.height / 2}px`,
          }}
        >
          <path
            d={scalePath}
            fill={usePattern ? `url(#${patternId})` : scaleColor}
            fillOpacity={usePattern ? 1 : 0.95}
            stroke={scaleColor}
            strokeWidth={scaleStrokeWidth}
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Body outline on top so the L-edges read clearly */}
      <path
        d={bodyPath}
        fill="none"
        stroke={bodyColor}
        strokeWidth={bodyStrokeWidth}
        strokeLinejoin="round"
      />

      {/* Pin holes */}
      {showHoles &&
        body.circles.map((c, i) => (
          <circle
            key={`body-hole-${i}`}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill="#0d0d0d"
            stroke={bodyColor}
            strokeWidth={bodyStrokeWidth * 0.5}
          />
        ))}

      {/* Scale-only countersinks */}
      {showHoles &&
        scale &&
        scaleColor &&
        scale.circles
          .filter((sc) => {
            return !body.circles.some(
              (bc) =>
                Math.abs(bc.cx - (sc.cx + scale.bodyOffsetX)) < 0.5 &&
                Math.abs(bc.cy - (sc.cy + scale.bodyOffsetY)) < 0.5
            )
          })
          .map((c, i) => (
            <circle
              key={`scale-hole-${i}`}
              cx={c.cx + scale.bodyOffsetX}
              cy={c.cy + scale.bodyOffsetY}
              r={c.r * 0.7}
              fill={linerColor || '#222'}
              opacity={0.6}
            />
          ))}

      {/* Dimensions */}
      {showDimensions && (
        <g fill={bodyColor} fontSize={fontSize} fontFamily="monospace" opacity={0.7}>
          <line
            x1={0}
            y1={body.height + pad * 0.5}
            x2={body.width}
            y2={body.height + pad * 0.5}
            stroke={bodyColor}
            strokeWidth={bodyStrokeWidth * 0.6}
            strokeDasharray={`${bodyStrokeWidth * 2} ${bodyStrokeWidth * 2}`}
          />
          <text
            x={body.width / 2}
            y={body.height + pad * 0.5 + fontSize * 1.4}
            textAnchor="middle"
          >
            {specs.width}mm
          </text>

          <line
            x1={-pad * 0.5}
            y1={0}
            x2={-pad * 0.5}
            y2={body.height}
            stroke={bodyColor}
            strokeWidth={bodyStrokeWidth * 0.6}
            strokeDasharray={`${bodyStrokeWidth * 2} ${bodyStrokeWidth * 2}`}
          />
          <text
            x={-pad * 0.5}
            y={body.height / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${-pad * 0.5}, ${body.height / 2})`}
            dy={-fontSize * 0.5}
          >
            {specs.height}mm
          </text>
        </g>
      )}
    </svg>
  )
}
