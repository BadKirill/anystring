export function synthesizePluck(
  frequency: number,
  sampleRate: number,
  durationS: number,
): Float32Array {
  const periodSamples = Math.max(2, Math.round(sampleRate / frequency))
  const totalSamples = Math.floor(sampleRate * durationS)
  const output = new Float32Array(totalSamples)
  const line = new Float32Array(periodSamples)

  seedDelayLine(line, frequency, sampleRate)

  const damping = dampingFor(frequency)
  let pos = 0

  for (let i = 0; i < totalSamples; i += 1) {
    const nextPos = (pos + 1) % periodSamples
    const sample = line[pos]
    const neighbor = line[nextPos]
    if (sample === undefined || neighbor === undefined) {
      break
    }
    const filtered = (sample + neighbor) * 0.5 * damping
    line[pos] = filtered
    output[i] = filtered
    pos = nextPos
  }

  return output
}

function seedDelayLine(line: Float32Array, frequency: number, sampleRate: number): void {
  for (let i = 0; i < line.length; i += 1) {
    const t = i / sampleRate
    const pick = Math.exp(-t * 900)
    const fundamental = Math.sin(2 * Math.PI * frequency * t)
    line[i] = ((Math.random() * 2 - 1) * 0.35 + fundamental * 0.65) * pick
  }
}

function dampingFor(frequency: number): number {
  if (frequency < 80) {
    return 0.9997
  }
  if (frequency < 150) {
    return 0.9993
  }
  return 0.9988
}

export function normalizePluck(samples: Float32Array, targetPeak = 0.85): Float32Array {
  let peak = 0
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample))
  }
  if (peak < 1e-6) {
    return samples
  }
  const scale = targetPeak / peak
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i]
    out[i] = sample === undefined ? 0 : sample * scale
  }
  return out
}
