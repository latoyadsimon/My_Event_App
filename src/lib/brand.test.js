import { brandInk, darken } from './brand'
import { contrast } from '../styles/contrast'

describe('brand ink: the planner\'s color, made readable', () => {
  it('keeps a brand color that already passes with white text', () => {
    expect(brandInk('#A3336A')).toBe('#A3336A')
  })

  it('darkens a light brand color until white text passes 4.5:1', () => {
    const ink = brandInk('#F9C74F') // sunny yellow
    expect(ink).not.toBe('#F9C74F')
    expect(contrast(ink, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })

  it('falls back to deep plum for anything that is not a #RRGGBB color', () => {
    expect(brandInk('pink')).toBe('#2E1A3A')
  })

  it('darkens by mixing toward black', () => {
    expect(darken('#FFFFFF', 0.5)).toBe('#808080')
  })
})
