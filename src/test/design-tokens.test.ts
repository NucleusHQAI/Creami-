import { describe, expect, it } from 'vitest'

import tailwindConfig from '../../tailwind.config'

type Rgb = {
  blue: number
  green: number
  red: number
}

function hexToRgb(hex: string): Rgb {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function relativeLuminance({ red, green, blue }: Rgb): number {
  const linearise = (channel: number) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * linearise(red) + 0.7152 * linearise(green) + 0.0722 * linearise(blue)
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(hexToRgb(foreground))
  const backgroundLuminance = relativeLuminance(hexToRgb(background))
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

describe('design colour tokens', () => {
  it('keeps berry text and buttons readable on the lightest surface', () => {
    const colours = tailwindConfig.theme.extend.colors

    expect(contrastRatio(colours.berry, colours.paper)).toBeGreaterThanOrEqual(4.5)
  })
})
