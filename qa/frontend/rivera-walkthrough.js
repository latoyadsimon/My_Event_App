// =====================================================================
// The whole Rivera story, clicked end to end as every role (Phase 7).
// Run it with the Playwright MCP tool `browser_run_code_unsafe`
// (filename: qa/frontend/rivera-walkthrough.js) while `npm run dev` is up.
// It only uses the UI (no shortcuts), screenshots each milestone into
// qa/frontend/screens/walkthrough/, and returns a pass/fail log.
// =====================================================================
async (page) => {
  const BASE = 'http://localhost:5173'
  const DIR = 'qa/frontend/screens/walkthrough/'
  const log = []
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  const step = async (name, fn) => {
    try { await fn(); log.push(`✓ ${name}`) } catch (e) { log.push(`✗ ${name}: ${e.message.split('\n')[0]}`); throw e }
  }
  const shot = (name) => page.screenshot({ path: `${DIR}${String(log.length + 1).padStart(2, '0')}-${name}.png`, fullPage: true })
  const viewAs = async (value) => { await page.getByRole('combobox', { name: 'Viewing as' }).selectOption(value); await page.waitForTimeout(250) }
  const outbox = async (subject, button) => {
    await page.getByRole('link', { name: /^Outbox/ }).click()
    await page.getByRole('link', { name: subject }).first().click()
    await page.getByRole('button', { name: button }).click()
    await page.waitForTimeout(300)
  }
  const expectText = async (text) => { await page.getByText(text).first().waitFor({ timeout: 3000 }) }

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(BASE + '/')
  await page.waitForTimeout(800)

  try {
    await step('Nov 4: Ana opens the v2 proposal email (magic link, no password)', async () => {
      await outbox(/Your proposal \(v2\) is ready/, 'View your proposal')
      await expectText('$14,850.00')
      await shot('ana-proposal')
    })
    await step('Ana accepts, signs and pays the $4,455 deposit', async () => {
      await page.getByRole('button', { name: 'Accept proposal' }).click()
      await page.getByRole('checkbox', { name: /electronically/ }).check()
      await page.getByLabel('Type your full name').fill('Ana Rivera')
      await page.getByRole('button', { name: 'Sign contract' }).click()
      await page.getByRole('link', { name: 'Continue to payment' }).click()
      await page.getByLabel('Card number').fill('4242 4242 4242 4242')
      await page.getByLabel('Expiry').fill('08 / 28')
      await page.getByLabel('CVC').fill('123')
      await page.getByRole('button', { name: 'Pay $4,455.00' }).click()
      await expectText('Your date is locked!')
      await shot('ana-paid')
    })
    await step('LaToya countersigns from the Dashboard alert → Booked', async () => {
      await viewAs('planner')
      await page.getByRole('link', { name: 'Countersign' }).first().click()
      await page.getByRole('button', { name: 'Countersign' }).click()
      await expectText('Booked')
      await shot('countersigned')
      await page.getByRole('link', { name: 'Go to Event Hub →' }).click()
      await expectText('Next 3 deadlines')
    })
    await step('LaToya adds a guest and sends the invitation by text', async () => {
      await page.getByRole('link', { name: 'Guests', exact: true }).click()
      await page.getByRole('button', { name: '+ Add guest' }).click()
      await page.getByLabel('Name or household').fill('Lucia Rivera')
      await page.getByLabel('Email or mobile (for the invitation)').fill('(512) 555-0777')
      await page.getByLabel('Plus-ones').selectOption('1')
      await page.getByRole('button', { name: 'Add guest', exact: true }).click()
      await page.getByRole('link', { name: 'Invitations' }).click()
      await page.getByRole('button', { name: 'Send invitations' }).click()
      await expectText('Sent to 1 household')
      await shot('invitation-sent')
    })
    await step('Lucia (guest) opens the text, RSVPs for two with meals', async () => {
      await outbox(/You're invited: Rivera wedding/, 'Open invitation')
      await page.getByRole('link', { name: 'RSVP' }).first().click()
      await page.getByRole('radiogroup', { name: 'Lucia Rivera' }).getByRole('radio', { name: 'Attending', exact: true }).click()
      await page.getByLabel('Meal · Lucia').selectOption('Chicken')
      await page.getByRole('button', { name: '+ Add a guest' }).click()
      await page.getByRole('textbox', { name: 'Guest 1' }).fill('Sam Torres')
      await page.getByLabel('Meal · Sam Torres').selectOption('Vegetarian')
      await page.getByLabel('Allergies or dietary needs').fill('Sam: tree nuts')
      await page.getByRole('button', { name: 'Send RSVP' }).click()
      await expectText('You’re all set! See you there.')
      await shot('lucia-rsvp')
    })
    // From here on, only in-app links and the demo bar: a page reload would reset the demo.
    const openRivera = async (tab) => {
      await page.getByRole('link', { name: 'Events', exact: true }).first().click()
      await page.getByRole('link', { name: 'Rivera wedding' }).first().click()
      if (tab) await page.getByRole('link', { name: tab, exact: true }).click()
      await page.waitForTimeout(200)
    }
    await step('The planner sees 2 attending and asks Ana to approve the headcount', async () => {
      await viewAs('planner')
      await openRivera('Guests')
      await page.getByLabel('RSVPs').getByText('2', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Ask client to approve headcount' }).click()
      await shot('headcount-asked')
    })
    await step('Ana (portal now unlocked) approves the final headcount', async () => {
      await viewAs('client')
      const skip = page.getByRole('button', { name: 'Skip the tour' })
      await skip.waitFor({ timeout: 2000 }).then(() => skip.click()).catch(() => {})   // first visit: the tour
      await page.getByRole('link', { name: /Approve: Final headcount/ }).click()
      await page.getByRole('article', { name: /Final headcount/ }).getByRole('button', { name: 'Approve' }).click()
      await expectText('Approved. Thank you!')
      await shot('ana-approved')
    })
    await step('LaToya locks the headcount; vendors are told', async () => {
      await viewAs('planner')
      await openRivera('Guests')
      await page.getByRole('button', { name: /Lock final headcount/ }).click()
      await expectText('Headcount locked at')
      await shot('headcount-locked')
    })
    await step('Ana pays installment 2 ($5,940) from Payments', async () => {
      await viewAs('client')
      await page.getByRole('link', { name: 'Payments', exact: true }).first().click()
      await page.getByRole('link', { name: 'Pay $5,940.00 now' }).click()
      await page.getByLabel('Card number').fill('4242 4242 4242 4242')
      await page.getByLabel('Expiry').fill('08 / 28')
      await page.getByLabel('CVC').fill('123')
      await page.getByRole('button', { name: 'Pay $5,940.00' }).click()
      await expectText('Payment received')
    })
    await step('The planner\'s Money tab and invoice agree: $4,455 left', async () => {
      await viewAs('planner')
      await openRivera('Money')
      await expectText('$4,455.00')
      await shot('money')
    })
    await step('Jo (staff) joins from the team invite text with a phone code', async () => {
      await outbox(/Team invite/, 'Accept the invite')
      await page.getByRole('button', { name: 'Text me a code' }).click()
      await page.getByLabel('6-digit code').fill('123456')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.getByRole('heading', { name: 'Profile' }).waitFor()
      await shot('jo-profile')
    })
  } catch {
    // stop at the first failure; the log says where
  }
  return [...log, `console errors: ${errors.length}`, ...errors.slice(0, 5)].join('\n')
}
