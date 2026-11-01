import { parseCsv, parseGuestsCsv } from './csv'

describe('CSV import (PL-5.1)', () => {
  it('handles quotes, commas inside quotes and Windows line endings', () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3\r\n')).toEqual([['a', 'b, c', 'say "hi"'], ['1', '2', '3']])
  })

  it('matches column names loosely and keeps allergies', () => {
    const { rows, skipped } = parseGuestsCsv('Household,E-mail,+1,Group,Dietary\nRivera family,r@x.com,3,family;VIP,Nuts\n,,,,\nChen household,,2,,')
    expect(skipped).toBe(0)
    expect(rows).toEqual([
      { name: 'Rivera family', email: 'r@x.com', phone: '', plusOnes: 3, tags: ['family', 'VIP'], allergies: 'Nuts', notes: '' },
      { name: 'Chen household', email: '', phone: '', plusOnes: 2, tags: [], allergies: '', notes: '' },
    ])
  })

  it('explains a missing name column', () => {
    expect(parseGuestsCsv('email\na@b.com').error).toMatch(/Name/)
  })
})
