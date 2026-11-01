import { parseCsv, parseGuestsCsv } from './csv'

describe('CSV import (PL-5.1)', () => {
  it('handles quotes, commas inside quotes and Windows line endings', () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3\r\n')).toEqual([['a', 'b, c', 'say "hi"'], ['1', '2', '3']])
  })

  it('matches column names loosely and keeps allergies', () => {
    const { rows, problems } = parseGuestsCsv('Household,E-mail,+1,Group,Dietary\nRivera family,r@x.com,3,family;VIP,Nuts\n,,,,\nChen household,,2,,')
    expect(problems).toEqual([])
    expect(rows).toEqual([
      { name: 'Rivera family', email: 'r@x.com', phone: '', plusOnes: 3, tags: ['family', 'VIP'], allergies: 'Nuts', notes: '' },
      { name: 'Chen household', email: '', phone: '', plusOnes: 2, tags: [], allergies: '', notes: '' },
    ])
  })

  it('flags rows to fix: no name, or an email that looks wrong (CL-3.4)', () => {
    const { rows, problems } = parseGuestsCsv('Name,Email\nAna,ana@gmail.com\n,orphan@x.com\nBob,bob@gmail')
    expect(rows.map((r) => r.name)).toEqual(['Ana'])
    expect(problems.map((p) => [p.line, p.reason])).toEqual([[3, 'Missing name'], [4, 'Email looks wrong']])
  })

  it('explains a missing name column', () => {
    expect(parseGuestsCsv('email\na@b.com').error).toMatch(/Name/)
  })
})
