import { validateBusiness, validateSignUp, validateItem, dollarsToCents, centsToDollars, validateInvite } from './validate'

describe('form checks: plain-language messages that say how to fix it', () => {
  it('needs a business name and a real email', () => {
    expect(validateBusiness({ name: '', email: 'nope' })).toEqual({
      name: 'Please enter your business name.',
      email: 'Please enter a full email address, like hello@yourbusiness.com',
    })
    expect(validateBusiness({ name: 'Bella Events', email: 'hello@bellaevents.com' })).toEqual({})
  })

  it('accepts an empty custom domain, but not a broken one', () => {
    expect(validateBusiness({ name: 'B', email: 'a@b.co', customDomain: '' })).toEqual({})
    expect(validateBusiness({ name: 'B', email: 'a@b.co', customDomain: 'events.bella' })).toEqual({})
    expect(validateBusiness({ name: 'B', email: 'a@b.co', customDomain: 'http://bad domain' }).customDomain).toMatch(/like events\.yourbusiness\.com/)
  })

  it('asks for a password of 8+ characters only when signing up with email', () => {
    const base = { ownerName: 'Maya', businessName: 'MMP', email: 'maya@mmp.com' }
    expect(validateSignUp({ ...base, password: 'short' }, 'email').password).toMatch(/at least 8/)
    expect(validateSignUp({ ...base, password: '' }, 'google')).toEqual({})
  })

  it('reads prices the way people type them', () => {
    expect(dollarsToCents('$11,000')).toBe(1100000)
    expect(dollarsToCents('2.5')).toBe(250)
    expect(dollarsToCents('abc')).toBeNaN()
    expect(centsToDollars(250)).toBe('2.50')
    expect(centsToDollars(1100000)).toBe('11000.00')
  })

  it('checks a package or add-on', () => {
    expect(validateItem({ name: '', price: '-5' })).toEqual({ name: 'Please enter a name.', price: 'Please enter a price of $0 or more, like 1500.' })
    expect(validateItem({ name: 'Bronze', price: '5000' })).toEqual({})
  })

  it('checks an invite', () => {
    expect(validateInvite({ name: '', contact: 'x' })).toEqual({
      name: 'Please enter their name.',
      contact: 'Please enter an email address or a 10-digit phone number.',
    })
    expect(validateInvite({ name: 'Jo', contact: '512-555-0199' })).toEqual({})
    expect(validateInvite({ name: 'Jo', contact: 'jo@kim.com' })).toEqual({})
  })
})
