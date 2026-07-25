import { describe, expect, it } from 'vitest'
import { parseStandardMethod } from '@/features/reference/lib/parseStandardMethod'

// The current literal default from the latest settings migration — kept inline
// so this test catches a drift between the migration and the parser without
// needing a database.
const DEFAULT_STANDARD_METHOD =
  'Blend the base and flavour additions until completely smooth. Top up the base mixture to your freezer fill line. Freeze flat for at least 24 hours with the surface level. Process on LITE ICE CREAM. If powdery, add 15 to 30ml milk and RE-SPIN. Make a narrow hole to the bottom, add the mix-ins and run MIX-IN once.'

describe('parseStandardMethod', () => {
  it('splits the seeded default into exactly five labelled steps', () => {
    const steps = parseStandardMethod(DEFAULT_STANDARD_METHOD)

    expect(steps.map((step) => step.label)).toEqual([
      'Blend',
      'Fill',
      'Freeze',
      'Process',
      'Mix-in',
    ])
  })

  it('merges the two Process sentences into one step', () => {
    const steps = parseStandardMethod(DEFAULT_STANDARD_METHOD)
    const process = steps.find((step) => step.label === 'Process')

    expect(process?.text).toBe(
      'Process on LITE ICE CREAM. If powdery, add 15 to 30ml milk and RE-SPIN.',
    )
  })

  it('never throws on empty text', () => {
    expect(parseStandardMethod('')).toEqual([])
  })

  it('falls back to a single unlabelled step when no sentence names a recognised step', () => {
    // Unrecognised sentences continue the previous group rather than each
    // starting a new one — there is nothing to tell them apart by.
    expect(parseStandardMethod('Do the thing. Then another thing.')).toEqual([
      { label: 'Step 1', text: 'Do the thing. Then another thing.' },
    ])
  })

  it('starts a new step once a sentence is recognised again after unlabelled text', () => {
    expect(parseStandardMethod('Do the thing. Blend it well.')).toEqual([
      { label: 'Step 1', text: 'Do the thing.' },
      { label: 'Blend', text: 'Blend it well.' },
    ])
  })
})
