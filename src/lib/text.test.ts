import { describe, expect, it } from 'vitest'
import { splitIntoSteps } from '@/lib/text'

describe('splitIntoSteps', () => {
  it('splits on sentence boundaries and restores the trailing period', () => {
    const text = 'Blend until smooth. Fill to the line. Freeze for 24 hours.'
    expect(splitIntoSteps(text)).toEqual([
      'Blend until smooth.',
      'Fill to the line.',
      'Freeze for 24 hours.',
    ])
  })

  it('drops empty fragments', () => {
    expect(splitIntoSteps('One step only.')).toEqual(['One step only.'])
  })
})
