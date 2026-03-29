'use client'

import { SQUARE_BODY_PROFILES, SQUARE_SPECS, type SquareSize } from '@/lib/square-profiles'

interface SquareProfileSVGProps {
  size: SquareSize
  bodyColor?: string
  scaleColor?: string
  linerColor?: string
  showDimensions?: boolean
  showHoles?: boolean
  className?: string
  opacity?: number
}

export function SquareProfileSVG({
  size,
  bodyColor = '#555555',
  scaleColor,
  linerColor,
  showDimensions = false,
  showHoles = true,
  className = '',
  opacity = 1,
}: SquareProfileSVGProps) {
  const profile = SQUARE_BODY_PROFILES[size]
  const specs = SQUARE_SPECS[size]
  if (!profile || !specs) return null

  const pad = showDimensions ? 25 : 8
  const vbX = -pad
  const vbY = -pad
  const vbW = profile.width + pad * 2
  const vbH = profile.height + pad * 2

  const sw = Math.max(0.4, profile.width * 0.005)
  const dimSw = sw * 0.6
  const fontSize = Math.max(4, profile.width * 0.035)

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      width="100%"
      className={className}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {scaleColor && (
        <g opacity={0.3}>
          {profile.lines.map((line, i) => (
            <line
              key={`scale-${i}`}
              x1={line.x1 - 1.5}
              y1={line.y1 - 1.5}
              x2={line.x2 - 1.5}
              y2={line.y2 - 1.5}
              stroke={scaleColor}
              strokeWidth={sw * 2.5}
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {linerColor && (
        <g opacity={0.5}>
          {profile.lines.map((line, i) => (
            <line
              key={`liner-${i}`}
              x1={line.x1 - 0.5}
              y1={line.y1 - 0.5}
              x2={line.x2 - 0.5}
              y2={line.y2 - 0.5}
              stroke={linerColor}
              strokeWidth={sw * 1.5}
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {profile.lines.map((line, i) => (
        <line
          key={`body-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={bodyColor}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ))}

      {showHoles &&
        profile.circles.map((circle, i) => (
          <circle
            key={`hole-${i}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="none"
            stroke={bodyColor}
            strokeWidth={sw * 0.7}
          />
        ))}

      {showDimensions && (
        <g fill={bodyColor} fontSize={fontSize} fontFamily="monospace" opacity={0.7}>
          <line
            x1={0}
            y1={profile.height + pad * 0.5}
            x2={profile.width}
            y2={profile.height + pad * 0.5}
            stroke={bodyColor}
            strokeWidth={dimSw}
            strokeDasharray={`${sw * 2} ${sw * 2}`}
          />
          <text
            x={profile.width / 2}
            y={profile.height + pad * 0.5 + fontSize * 1.4}
            textAnchor="middle"
          >
            {specs.width}mm
          </text>

          <line
            x1={-pad * 0.5}
            y1={0}
            x2={-pad * 0.5}
            y2={profile.height}
            stroke={bodyColor}
            strokeWidth={dimSw}
            strokeDasharray={`${sw * 2} ${sw * 2}`}
          />
          <text
            x={-pad * 0.5}
            y={profile.height / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${-pad * 0.5}, ${profile.height / 2})`}
            dy={-fontSize * 0.5}
          >
            {specs.height}mm
          </text>
        </g>
      )}
    </svg>
  )
}
