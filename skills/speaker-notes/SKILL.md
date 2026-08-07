---
name: speaker-notes
description: Write or improve speaker notes for an existing presentation, including time budgets, opening language, slide transitions, demo cues, caveats, likely audience questions, and concise answers.
---

# Create speaker notes

Use the current user request as the brief. Read the complete deck, source citations, and existing notes before writing. Infer the thesis, audience expertise, intended decision, language, duration, and delivery context.

For every slide provide:

- target time
- one-sentence purpose
- a natural talk track that adds value instead of reading the slide
- transition into the next page
- pronunciation, click, animation, or demo cues where useful
- caveats and source reminders for factual claims

Write notes in the format native to the deck when practical:

- HTML: `<aside class="notes">…</aside>` inside each slide.
- Marp: presenter-note comments supported by the existing workflow, or a clearly mapped `speaker-notes.md` when portability is uncertain.
- PptxGenJS: `slide.addNotes('…')`.
- Other formats: preserve their established notes convention.

At the end provide:

- total estimated time
- optional cuts for a shorter version
- three likely audience questions
- concise, evidence-aware answers
- one recovery line for returning to the main story after a deep question

Keep notes conversational, scannable, and easy to deliver. Do not script every word unless the user asks for a verbatim speech.
