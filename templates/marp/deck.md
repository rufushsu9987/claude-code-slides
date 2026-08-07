---
marp: true
theme: claude-code
size: 16:9
paginate: true
footer: "{{TITLE}}"
---

<!-- _class: editorial-cover -->

<span class="eyebrow">PRESENTATION / {{DATE}}</span>

# {{TITLE}}

Replace this sentence with the one promise your audience should remember.

<div class="prompt-line"><span>&gt;</span> {{TEMPLATE_NAME}} · 12 layout starters</div>

<!-- Open with the audience problem, then state the one promise this deck will prove. -->

---

<!-- _class: hero-statement -->

<span class="eyebrow">01 / THESIS</span>

<div class="hero-grid">
<div>

## The layout should change when the communication job changes.

Keep the visual language stable while varying composition, density, and eye path.

</div>
<div class="proof-rail">
<div><strong>16</strong><span>available archetypes</span></div>
<div><strong>8+</strong><span>unique layouts in ten pages</span></div>
<div><strong>0</strong><span>consecutive repeats</span></div>
</div>
</div>

<!-- State the governing principle before showing examples. -->

---

<!-- _class: before-after -->

<span class="eyebrow">02 / TRANSFORMATION</span>

## Move from repeated cards to content-aware composition.

<div class="before-after-grid">
<div class="state">
<span>BEFORE</span>
<strong>One structure for every page</strong>
<ul><li>Repeated split layout</li><li>Cards for unrelated content</li><li>Flat visual rhythm</li></ul>
</div>
<div class="delta">→</div>
<div class="state target">
<span>TARGET</span>
<strong>Layout selected by slide role</strong>
<ul><li>Architecture uses layers or flows</li><li>Evidence gets visual priority</li><li>Decisions end with a clear ask</li></ul>
</div>
</div>

<!-- Compare the current and target state using the same criteria. -->

---

<!-- _class: layered-architecture -->

<span class="eyebrow">03 / LAYERED ARCHITECTURE</span>

<div class="architecture-grid">
<div>

## Use layers when responsibility changes by boundary.

Label who owns each layer, what it exposes, and where policy is enforced.

<div class="annotation">↳ A boundary must explain a responsibility, not just draw a box.</div>

</div>
<div class="architecture-stack">
<div class="layer accent"><span>01</span><strong>Experience</strong><small>Product teams</small></div>
<div class="layer"><span>02</span><strong>Application services</strong><small>APIs · workflows</small></div>
<div class="layer"><span>03</span><strong>Platform controls</strong><small>Identity · policy · observability</small></div>
<div class="layer"><span>04</span><strong>Infrastructure</strong><small>Compute · network · data</small></div>
</div>
</div>

<!-- Walk from the audience-facing layer down to the operating foundation. -->

---

<!-- _class: flow-architecture -->

<span class="eyebrow">04 / FLOW ARCHITECTURE</span>

## Show what moves, who owns it, and why the next step exists.

<div class="flow">
<div class="node"><span>01</span><strong>Source</strong><small>Brief, data, code, or evidence</small></div>
<div class="arrow">→</div>
<div class="node accent"><span>02</span><strong>Argument</strong><small>One coherent narrative</small></div>
<div class="arrow">→</div>
<div class="node"><span>03</span><strong>Action</strong><small>A decision the room can make</small></div>
</div>

<!-- Replace the generic flow with the real request path, data flow, or decision model. -->

---

<!-- _class: metric-spotlight -->

<span class="eyebrow">05 / OUTCOME</span>

<div class="metric-stage">
<div class="metric-primary">
<span>LAYOUT DIVERSITY</span>
<strong>80%</strong>
<p>of a ten-slide deck should use a distinct composition before any layout repeats.</p>
</div>
<div class="metric-secondary">
<div><strong>≤20%</strong><span>card-based pages</span></div>
<div><strong>3–4</strong><span>slides between rhythm changes</span></div>
<div><strong>1</strong><span>dominant idea per page</span></div>
</div>
</div>

<!-- Replace these design-system metrics with verified evidence in a production deck. -->

---

<!-- _class: evidence-claim -->

<span class="eyebrow">06 / EVIDENCE</span>

<div class="evidence-grid">
<div class="chart">
<span class="chart-title">AUDIENCE RECALL / ILLUSTRATIVE</span>
<div class="bars">
<div><span>Repeated</span><i style="--bar:34%"></i><b>34</b></div>
<div><span>Mixed</span><i style="--bar:58%"></i><b>58</b></div>
<div class="accent"><span>Purposeful</span><i style="--bar:82%"></i><b>82</b></div>
</div>
<small>Replace illustrative data with a verified source and date.</small>
</div>
<div class="evidence-copy">
<span class="eyebrow">THE CLAIM</span>

## Evidence becomes memorable when the page gives it visual priority.

Keep explanation adjacent, but let the chart, screenshot, quote, or example remain the anchor.
</div>
</div>

<!-- This chart is illustrative and must be replaced with verified evidence. -->

---

<!-- _class: code-walkthrough -->

<span class="eyebrow">07 / BUILD</span>

<div class="code-grid">
<div>

## Use code to prove the workflow—not to decorate the page.

Crop to the lines the audience needs and pair them with the visible outcome.

<div class="annotation">↳ The command is evidence; the result is the story.</div>

</div>
<div class="terminal">
<div class="terminal-bar">~/project</div>
<pre><code><span class="prompt">$</span> codex-slides init "Architecture Review" \
  --format pptx \
  --template claude-editorial

<span class="success">✓ 12 layout starters created</span>
<span class="success">✓ editable PPTX source generated</span>
<span class="success">✓ validation passed</span></code></pre>
</div>
</div>

<!-- Use a live command only when the demo is reliable. -->

---

<!-- _class: comparison-matrix -->

<span class="eyebrow">08 / TRADE-OFF</span>

## Compare options on the criteria that determine the decision.

<div class="compare-table">
<div class="compare-row header"><span>Criterion</span><span>Repeated template</span><span>Content-aware system</span></div>
<div class="compare-row"><strong>Speed</strong><span>Fast first draft</span><span>Fast with reusable archetypes</span></div>
<div class="compare-row"><strong>Clarity</strong><span>One generic frame</span><span>Composition follows the message</span></div>
<div class="compare-row"><strong>Rhythm</strong><span>Flat across the deck</span><span class="recommended">Varied but visually consistent</span></div>
<div class="compare-row"><strong>Maintenance</strong><span>Many one-off fixes</span><span>Shared layout vocabulary</span></div>
</div>

<!-- Use the same criteria for both options before highlighting the recommendation. -->

---

<!-- _class: timeline -->

<span class="eyebrow">09 / ADOPTION</span>

## Roll out the layout system without rewriting the visual brand.

<div class="timeline-track">
<div><span>01</span><strong>Catalog</strong><small>Name the archetypes and their jobs.</small></div>
<div class="current"><span>02</span><strong>Scaffold</strong><small>Ship diverse starters in every format.</small></div>
<div><span>03</span><strong>Validate</strong><small>Check repetition and layout coverage.</small></div>
<div><span>04</span><strong>Learn</strong><small>Add patterns from real presentation work.</small></div>
</div>

<!-- Mark the current phase and describe changing capability, not just dates. -->

---

<!-- _class: risk-matrix -->

<span class="eyebrow">10 / RISK</span>

<div class="risk-grid">
<div>

## Variation without rules becomes noise.

<div class="risk-quadrants">
<div><span>Low impact</span><strong>Cosmetic drift</strong></div>
<div><span>High impact</span><strong>Unreadable density</strong></div>
<div><span>Low probability</span><strong>Export edge case</strong></div>
<div class="hot"><span>High probability</span><strong>Random layout choice</strong></div>
</div>
</div>
<div class="risk-list">
<div><span>01</span><strong>Novelty over meaning</strong><small>Mitigate with slide-role selection.</small></div>
<div><span>02</span><strong>Too many cards</strong><small>Cap card-based pages near 20%.</small></div>
<div><span>03</span><strong>Theme drift</strong><small>Keep shared tokens and page chrome.</small></div>
</div>
</div>

<!-- Name the mitigation and owner for real risks. -->

---

<!-- _class: closing-manifesto -->

<span class="eyebrow">THE DECISION</span>

## Keep the style.
## *Expand the vocabulary.*

Choose the layout by communication purpose, then let the design system keep the deck coherent.

<div class="prompt-line"><span>$</span> build with purpose</div>

<!-- Ask for one concrete action, then stop. -->
