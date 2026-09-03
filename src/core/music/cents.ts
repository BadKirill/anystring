const CENTS_PER_OCTAVE = 1200

export function centsBetween(actualFrequency: number, targetFrequency: number): number {
  return CENTS_PER_OCTAVE * Math.log2(actualFrequency / targetFrequency)
}
