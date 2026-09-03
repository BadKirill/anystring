const GAUGE_RANGE_CENTS = 50
const NEEDLE_MAX_DEGREES = 60

interface TunerGaugeProps {
  cents: number | null

  targetLabel: string | null
  inTune: boolean

  chromatic?: boolean
}

function needleAngle(cents: number | null): number {
  if (cents === null) {
    return 0
  }
  const clamped = Math.max(-GAUGE_RANGE_CENTS, Math.min(GAUGE_RANGE_CENTS, cents))
  return (clamped / GAUGE_RANGE_CENTS) * NEEDLE_MAX_DEGREES
}

function tickMarks(): { angle: number; major: boolean }[] {
  const ticks: { angle: number; major: boolean }[] = []
  for (let cents = -GAUGE_RANGE_CENTS; cents <= GAUGE_RANGE_CENTS; cents += 10) {
    ticks.push({ angle: needleAngle(cents), major: cents % 50 === 0 })
  }
  return ticks
}

function GaugeTicks() {
  return tickMarks().map(({ angle: tick, major }) => (
    <line
      key={tick}
      x1="100"
      y1="24"
      x2="100"
      y2={major ? 34 : 30}
      stroke="var(--muted)"
      strokeWidth={major ? 2 : 1}
      transform={`rotate(${String(tick)} 100 100)`}
    />
  ))
}

function ChromaticFlatSharpMarks() {
  return (
    <>
      <text
        x="36"
        y="108"
        textAnchor="middle"
        fill="var(--muted)"
        fontSize="18"
        fontWeight="600"
      >
        ♭
      </text>
      <text
        x="164"
        y="108"
        textAnchor="middle"
        fill="var(--muted)"
        fontSize="18"
        fontWeight="600"
      >
        #
      </text>
    </>
  )
}

export function TunerGauge({
  cents,
  targetLabel,
  inTune,
  chromatic = false,
}: TunerGaugeProps) {
  const angle = needleAngle(cents)
  const active = cents !== null
  const color = inTune ? 'var(--in-tune)' : active ? 'var(--accent)' : 'var(--muted)'

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 120" role="img" aria-label="Tuning gauge">
        <path
          d="M 30 100 A 80 80 0 0 1 170 100"
          fill="none"
          stroke="var(--gauge-arc)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <GaugeTicks />
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transform: `rotate(${String(angle)}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 120ms ease-out, stroke 120ms',
            opacity: active ? 1 : 0.4,
          }}
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        {chromatic ? <ChromaticFlatSharpMarks /> : null}
      </svg>
      <div className={`gauge-note${inTune ? ' gauge-note-in-tune' : ''}`}>
        {targetLabel ?? '—'}
      </div>
    </div>
  )
}
