// The invitation designer's look (PL-5.5): music choices and the card's CSS variables.
import { DEFAULT_THEME_FOR_EVENT_TYPE, getTheme, themeToCssVars } from '../styles/themes'
import { inkOn, textOn } from './brand'

export const MUSIC = [['piano', 'Soft piano'], ['strings', 'String quartet'], ['acoustic', 'Acoustic guitar']]

/** CSS variables for the card: the chosen template, with the font and accent overrides. */
export function designVars(event, design) {
  const theme = getTheme(design.themeId ?? event.theme) ?? getTheme(DEFAULT_THEME_FOR_EVENT_TYPE[event.type])
  const vars = themeToCssVars(theme)
  if (design.font) vars['--theme-font-display'] = `'${design.font}', Georgia, serif`
  if (design.accent) {
    const ink = inkOn(design.accent, theme.colors.surface, 3)    // large display text: 3:1
    vars['--theme-accent'] = ink
    vars['--theme-on-accent'] = textOn(ink)
  }
  return vars
}

