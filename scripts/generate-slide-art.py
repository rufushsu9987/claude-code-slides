#!/usr/bin/env python3
"""Generate small, editable-friendly SVG illustrations for slide layouts.

The generator intentionally uses only Python's standard library. It produces
vector assets, not screenshots, so a deck can reveal or replace the surrounding
HTML, Marp, or PowerPoint elements independently.
"""

from __future__ import annotations

import argparse
import html
from pathlib import Path

WIDTH = 1200
HEIGHT = 700

COLORS = {
    "canvas": "#F7F3EC",
    "surface": "#FFFDF9",
    "ink": "#211F1B",
    "muted": "#6F6962",
    "border": "#D8D0C6",
    "accent": "#D97757",
    "accent_soft": "#F1D9CD",
    "success": "#7FB08A",
    "code": "#27241F",
}


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def attrs(**values: object) -> str:
    return " ".join(f'{key.replace("_", "-")}="{esc(value)}"' for key, value in values.items())


def text(value: str, x: float, y: float, size: float = 24, color: str = COLORS["ink"],
         weight: int = 400, anchor: str = "start", family: str = "Arial, sans-serif") -> str:
    text_attrs = attrs(
        x=x,
        y=y,
        fill=color,
        **{"font-size": size, "font-family": family, "font-weight": weight, "text-anchor": anchor},
    )
    return f'<text {text_attrs}>{esc(value)}</text>'


def rect(x: float, y: float, width: float, height: float, fill: str = COLORS["surface"],
         stroke: str = COLORS["border"], radius: float = 18, stroke_width: float = 2) -> str:
    return f'<rect {attrs(x=x, y=y, width=width, height=height, rx=radius, fill=fill, stroke=stroke, **{"stroke-width": stroke_width})}/>'


def line(x1: float, y1: float, x2: float, y2: float, stroke: str = COLORS["border"], width: float = 2,
         dash: str | None = None) -> str:
    extra = f' stroke-dasharray="{esc(dash)}"' if dash else ""
    return f'<line {attrs(x1=x1, y1=y1, x2=x2, y2=y2, stroke=stroke, **{"stroke-width": width})}{extra}/>'


def circle(cx: float, cy: float, radius: float, fill: str, stroke: str = "none", width: float = 0) -> str:
    return f'<circle {attrs(cx=cx, cy=cy, r=radius, fill=fill, stroke=stroke, **{"stroke-width": width})}/>'


def arrow(x1: float, y1: float, x2: float, y2: float, color: str = COLORS["accent"]) -> str:
    middle_x = x1 + (x2 - x1) * 0.78
    middle_y = y1 + (y2 - y1) * 0.78
    return (
        line(x1, y1, middle_x, middle_y, color, 5)
        + f'<path d="M {middle_x - 14} {middle_y - 18} L {x2} {y2} L {middle_x - 18} {middle_y + 8} Z" fill="{color}"/>'
    )


def heading(title: str, eyebrow: str, subtitle: str) -> str:
    return (
        text(eyebrow.upper(), 60, 54, 16, COLORS["accent"], 700, family="Arial, sans-serif")
        + text(title, 60, 102, 42, COLORS["ink"], 700, family="Georgia, serif")
        + text(subtitle, 60, 136, 20, COLORS["muted"], 400)
    )


def svg(title: str, description: str, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title desc">\n'
        f'  <title id="title">{esc(title)}</title>\n'
        f'  <desc id="desc">{esc(description)}</desc>\n'
        f'  <rect width="{WIDTH}" height="{HEIGHT}" fill="{COLORS["canvas"]}"/>\n'
        f'{body}\n</svg>\n'
    )


def infographic(title: str, subtitle: str) -> str:
    body = heading(title, "Infographic story", subtitle)
    panels = [(60, "PROBLEM", "Scattered inputs", COLORS["surface"]),
              (420, "METHOD", "Portable core", COLORS["accent_soft"]),
              (780, "RESULT", "Ready output", COLORS["surface"])]
    for x, label, caption, fill in panels:
        body += rect(x, 190, 300, 350, fill)
        body += text(label, x + 28, 232, 16, COLORS["accent"], 700)
        body += text(caption, x + 28, 510, 26, COLORS["ink"], 700)
    body += arrow(365, 365, 415, 365)
    body += arrow(725, 365, 775, 365)

    # Problem: deliberately generic source fragments.
    for index, (label, x, y, tilt) in enumerate([
        ("Brief", 105, 280, -5), ("Data", 185, 330, 4), ("Code", 135, 400, 2)
    ]):
        body += f'<g transform="rotate({tilt} {x + 45} {y + 35})">'
        body += rect(x, y, 150, 84, COLORS["surface"], COLORS["accent"], 12, 3)
        body += line(x + 22, y + 31, x + 125, y + 31, COLORS["border"], 3)
        body += line(x + 22, y + 52, x + 104, y + 52, COLORS["border"], 3)
        body += text(label, x + 22, y + 74, 16, COLORS["muted"], 700)
        body += "</g>"

    # Method: a person/phone-like central shape and three semantic capabilities.
    body += circle(570, 282, 38, COLORS["accent"])
    body += circle(570, 275, 13, COLORS["surface"])
    body += rect(522, 328, 96, 142, COLORS["surface"], COLORS["accent"], 18, 4)
    body += line(543, 360, 597, 360, COLORS["border"], 4)
    body += line(543, 390, 585, 390, COLORS["border"], 4)
    body += line(543, 420, 574, 420, COLORS["border"], 4)
    for index, label in enumerate(["Story", "Layout", "Verify"]):
        x = 455 + index * 105
        body += circle(x, 496, 7, COLORS["accent"])
        body += text(label, x, 520, 15, COLORS["ink"], 700, anchor="middle")

    # Result: simple delivery dashboard.
    body += rect(830, 260, 220, 176, COLORS["code"], COLORS["code"], 16, 0)
    body += text("DELIVERY", 855, 292, 14, COLORS["accent_soft"], 700)
    body += text("READY", 855, 340, 34, COLORS["surface"], 700)
    body += line(855, 365, 1020, 365, "#5C574F", 10)
    body += line(855, 365, 990, 365, COLORS["success"], 10)
    for index, label in enumerate(["SVG", "HTML", "PPTX"]):
        y = 475 + index * 26
        body += circle(855, y - 5, 7, COLORS["success"])
        body += text(label, 875, y, 16, COLORS["muted"], 700)
    return svg(title, "A problem, method, and result story for a presentation slide.", body)


def data_journey(title: str, subtitle: str) -> str:
    body = heading(title, "Data journey", subtitle)
    body += rect(60, 190, 300, 350, COLORS["accent_soft"], COLORS["accent"], 18, 2)
    body += text("CURRENT SIGNAL", 90, 235, 16, COLORS["accent"], 700)
    body += text("82%", 90, 350, 104, COLORS["accent"], 700, family="Georgia, serif")
    body += text("of the target reached", 94, 395, 24, COLORS["ink"], 700)
    body += text("Show one number first, then let the chart explain its movement.", 94, 458, 18, COLORS["muted"], 400)

    body += rect(420, 190, 720, 350, COLORS["surface"], COLORS["border"], 18, 2)
    body += text("PROGRESS OVER TIME", 455, 235, 16, COLORS["accent"], 700)
    chart_x, chart_y, chart_w, chart_h = 470, 290, 610, 170
    body += line(chart_x, chart_y + chart_h, chart_x + chart_w, chart_y + chart_h, COLORS["border"], 2)
    body += line(chart_x, chart_y, chart_x, chart_y + chart_h, COLORS["border"], 2)
    values = [35, 46, 52, 68, 82]
    points = []
    for index, value in enumerate(values):
        x = chart_x + index * (chart_w / (len(values) - 1))
        y = chart_y + chart_h - value / 100 * chart_h
        points.append((x, y))
        body += line(x, chart_y + chart_h, x, y, COLORS["accent_soft"], 10)
        body += circle(x, y, 9, COLORS["accent"] if index == len(values) - 1 else COLORS["muted"])
        body += text(f"Q{index + 1}", x, chart_y + chart_h + 34, 14, COLORS["muted"], 700, anchor="middle")
    body += "<polyline fill=\"none\" stroke=\"#D97757\" stroke-width=\"5\" points=\"" + " ".join(f"{x},{y}" for x, y in points) + "\"/>"
    body += text("trend", 1018, 284, 15, COLORS["muted"], 700)
    body += text("Evidence → interpretation → next action", 455, 505, 18, COLORS["ink"], 700)
    return svg(title, "A dominant metric connected to a simple progress trend.", body)


def decision_path(title: str, subtitle: str) -> str:
    body = heading(title, "Decision path", subtitle)
    body += text("START WITH THE SIGNAL", 60, 205, 16, COLORS["accent"], 700)
    body += rect(60, 250, 220, 112, COLORS["surface"], COLORS["border"], 16, 2)
    body += text("Signal", 88, 300, 28, COLORS["ink"], 700)
    body += text("What changed?", 88, 334, 18, COLORS["muted"], 400)
    body += arrow(282, 306, 390, 306)
    body += rect(390, 250, 250, 112, COLORS["accent_soft"], COLORS["accent"], 16, 2)
    body += text("Evaluate", 420, 300, 28, COLORS["ink"], 700)
    body += text("Which constraint matters?", 420, 334, 18, COLORS["muted"], 400)
    body += arrow(642, 306, 745, 236)
    body += arrow(642, 306, 745, 430)
    body += rect(760, 180, 330, 112, COLORS["surface"], COLORS["border"], 16, 2)
    body += text("Proceed", 790, 230, 28, COLORS["ink"], 700)
    body += text("Evidence supports the change", 790, 264, 18, COLORS["muted"], 400)
    body += rect(760, 375, 330, 112, COLORS["code"], COLORS["code"], 16, 0)
    body += text("Pause", 790, 425, 28, COLORS["surface"], 700)
    body += text("Missing evidence → collect first", 790, 459, 18, COLORS["accent_soft"], 400)
    body += line(60, 570, 1090, 570, COLORS["border"], 2)
    body += text("RECOMMENDATION", 60, 610, 16, COLORS["accent"], 700)
    body += text("Make the next action visible, not just the available options.", 60, 648, 24, COLORS["ink"], 700)
    return svg(title, "A decision path from signal to evaluation and recommendation.", body)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kind", choices=["infographic", "data-journey", "decision-path"], required=True)
    parser.add_argument("--output", required=True, help="Output SVG path")
    parser.add_argument("--title", default="Presentation visual")
    parser.add_argument("--subtitle", default="A reusable vector asset for a content-aware slide layout.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    renderers = {
        "infographic": infographic,
        "data-journey": data_journey,
        "decision-path": decision_path,
    }
    content = renderers[args.kind](args.title, args.subtitle)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
