// Phase 14: the invitation designer.
import { reducer, initialState } from './reducer'
import { getEvent } from './selectors'
import { designOf } from '../data/seedPlanning'
import { designVars } from '../lib/invitationDesign'
import { contrast } from '../styles/contrast'

const run = (state, ...actions) => actions.reduce(reducer, state)

describe('invitation designer (PL-5.5)', () => {
  it('older events get the default design; changes are kept', () => {
    expect(designOf(getEvent(initialState(), 'acme'))).toMatchObject({ themeId: null, layout: 'classic', envelope: false })
    const s = run(initialState(), { type: 'invitation/design', eventId: 'acme', changes: { themeId: 'winter-wonderland', envelope: true, music: 'strings' } })
    expect(designOf(getEvent(s, 'acme'))).toMatchObject({ themeId: 'winter-wonderland', envelope: true, music: 'strings' })
  })

  it('a picked accent is adjusted until it reads on the card', () => {
    const vars = designVars({ theme: 'elegant-wedding', type: 'wedding' }, { ...designOf({}), accent: '#FFF3B0' })   // pale yellow on a light card
    expect(contrast(vars['--theme-accent'], vars['--theme-surface'])).toBeGreaterThanOrEqual(3)
    expect(contrast(vars['--theme-on-accent'], vars['--theme-accent'])).toBeGreaterThanOrEqual(4.5)
  })

  it('saves the design as the planner’s template and applies it elsewhere (keeping that event’s photo)', () => {
    let s = run(initialState(),
      { type: 'invitation/design', eventId: 'acme', changes: { themeId: 'gala-night', font: 'Bebas Neue', photo: 'blob:acme' } },
      { type: 'invitation/saveTemplate', eventId: 'acme', name: 'Corporate gold' })
    const tpl = s.business.inviteTemplates.at(-1)
    expect(tpl).toMatchObject({ name: 'Corporate gold', design: { themeId: 'gala-night', font: 'Bebas Neue', photo: null } })
    s = run(s, { type: 'invitation/design', eventId: 'patel', changes: { photo: 'blob:patel' } }, { type: 'invitation/applyTemplate', eventId: 'patel', templateId: tpl.id })
    expect(designOf(getEvent(s, 'patel'))).toMatchObject({ themeId: 'gala-night', photo: 'blob:patel' })
  })
})
