// Writes documentation/HOW_TO.md from src/data/howTo.js (the same words as
// the in-app Help page). Run: npm run docs:howto
// Screenshots live in documentation/how_to/<shot>.png.
import { writeFileSync, existsSync } from 'node:fs'
import { HOW_TO, HOW_TO_INTRO, HOW_TO_TIPS } from '../src/data/howTo.js'

const root = new URL('../', import.meta.url)
const lines = [
  `# ${HOW_TO_INTRO.title}`,
  '',
  '> Generated from `src/data/howTo.js` by `npm run docs:howto`. The in-app **Help** page (`/help`) shows the same guide, with a "Show me" button on every step. Edit the words there, then re-run the script.',
  '',
  HOW_TO_INTRO.lead,
  '',
  '## About this demo',
  '',
  ...HOW_TO_INTRO.demo.map((d) => `- ${d}`),
  '',
  '## Contents',
  '',
  ...HOW_TO.map((s, i) => `${i + 1}. [${s.title}](#${s.id}) · *${s.role}*`),
  `${HOW_TO.length + 1}. [Tips](#tips)`,
  '',
]

for (const section of HOW_TO) {
  lines.push(`<a id="${section.id}"></a>`, '', `## ${section.title}`, '', `*${section.role}.* ${section.intro}`, '')
  section.steps.forEach((step, i) => {
    lines.push(`### ${i + 1}. ${step.title}`, '', step.text, '')
    if (step.show) lines.push(`**Try it:** open \`${step.show.to}\`${step.show.role !== 'planner' || step.show.memberId ? ` (viewing as ${step.show.memberId ?? step.show.clientId ?? step.show.role})` : ''}, or use **Show me** on the Help page.`, '')
    if (step.shot) {
      const file = `how_to/${step.shot}.png`
      if (!existsSync(new URL(`documentation/${file}`, root))) throw new Error(`Missing screenshot: documentation/${file}`)
      lines.push(`![${step.title}](${file})`, '')
    }
  })
}

lines.push('<a id="tips"></a>', '', '## Tips', '', ...HOW_TO_TIPS.map((t) => `- ${t}`), '')
writeFileSync(new URL('documentation/HOW_TO.md', root), lines.join('\n'))
console.log(`Wrote documentation/HOW_TO.md (${HOW_TO.length} sections, ${HOW_TO.reduce((n, s) => n + s.steps.length, 0)} steps)`)
