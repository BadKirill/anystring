const WINDOW_SIZE = 8192
const POST_INTERVAL_FRAMES = 4096

class CaptureProcessor extends AudioWorkletProcessor {
  private readonly ring = new Float32Array(WINDOW_SIZE)
  private writeIndex = 0
  private framesSincePost = 0
  private filled = 0

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0]
    if (!channel) {
      return true
    }
    this.append(channel)
    this.framesSincePost += channel.length
    if (this.framesSincePost >= POST_INTERVAL_FRAMES && this.filled >= WINDOW_SIZE) {
      this.framesSincePost = 0
      this.port.postMessage(this.snapshot())
    }
    return true
  }

  private append(samples: Float32Array): void {
    for (const sample of samples) {
      this.ring[this.writeIndex] = sample
      this.writeIndex = (this.writeIndex + 1) % WINDOW_SIZE
    }
    this.filled = Math.min(this.filled + samples.length, WINDOW_SIZE)
  }

  private snapshot(): Float32Array {
    const out = new Float32Array(WINDOW_SIZE)
    const tail = WINDOW_SIZE - this.writeIndex
    out.set(this.ring.subarray(this.writeIndex), 0)
    out.set(this.ring.subarray(0, this.writeIndex), tail)
    return out
  }
}

registerProcessor('capture-processor', CaptureProcessor)
