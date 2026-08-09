#!/usr/bin/env python3
"""Generate deterministic, presentation-ready SVG illustrations.

The generator uses only Python's standard library.  It deliberately separates
*visual storytelling* from slide chrome: every output is a portable SVG asset
that can be embedded in HTML, Marp, or PowerPoint while titles, notes, and layout
markers remain editable in the host deck.

Visual Grammar v2 adds two complementary rendering modes:

- ``sketch``: editorial hand-drawn geometry inspired by workshop diagrams.
- ``clean``: precise single-stroke geometry for formal architecture decks.

Both modes are deterministic for a given seed and never depend on local files,
web fonts, JavaScript, or raster images.
"""

from __future__ import annotations

import argparse
import html
import math
import random
import re
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Sequence

WIDTH = 1200
HEIGHT = 700

DEFAULT_COLORS = {
    "canvas": "#F7F3EC",
    "surface": "#FFFDF9",
    "ink": "#211F1B",
    "muted": "#6F6962",
    "border": "#D8D0C6",
    "accent": "#D97757",
    "accent_soft": "#F1D9CD",
    "success": "#6B9D77",
    "warning": "#A56A32",
    "code": "#27241F",
    "code_text": "#F8F3EA",
}

COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def attrs(**values: object) -> str:
    rendered: list[str] = []
    for key, value in values.items():
        if value is None:
            continue
        rendered.append(f'{key.replace("_", "-")}="{esc(value)}"')
    return " ".join(rendered)


@dataclass(frozen=True)
class Palette:
    canvas: str
    surface: str
    ink: str
    muted: str
    border: str
    accent: str
    accent_soft: str
    success: str
    warning: str
    code: str
    code_text: str

    @classmethod
    def from_mapping(cls, mapping: dict[str, str]) -> "Palette":
        return cls(**mapping)


class Drawing:
    """Small SVG scene graph with deterministic rough-stroke helpers."""

    def __init__(self, *, style: str, seed: int, palette: Palette, transparent: bool = False,
                 show_caption: bool = True, content: dict[str, object] | None = None) -> None:
        self.style = style
        self.rng = random.Random(seed)
        self.palette = palette
        self.transparent = transparent
        self.show_caption = show_caption
        self.content = content or {}
        self.parts: list[str] = []

    def add(self, markup: str) -> None:
        self.parts.append(markup)

    def group(self, body: str, *, transform: str | None = None, opacity: float | None = None,
              role: str | None = None, label: str | None = None) -> str:
        group_attrs = attrs(transform=transform, opacity=opacity, role=role, aria_label=label)
        return f"<g {group_attrs}>{body}</g>"

    def _jitter(self, amount: float) -> float:
        return self.rng.uniform(-amount, amount)

    def path(self, d: str, *, fill: str = "none", stroke: str | None = None,
             width: float = 2.4, dash: str | None = None, opacity: float = 1,
             linecap: str = "round", linejoin: str = "round") -> str:
        path_attrs = attrs(
            d=d,
            fill=fill,
            stroke=stroke or self.palette.ink,
            opacity=opacity,
            stroke_width=width,
            stroke_dasharray=dash,
            stroke_linecap=linecap,
            stroke_linejoin=linejoin,
        )
        return f'<path {path_attrs}/>'

    def line(self, x1: float, y1: float, x2: float, y2: float, *, stroke: str | None = None,
             width: float = 2.4, dash: str | None = None, opacity: float = 1,
             roughness: float = 1.6) -> str:
        color = stroke or self.palette.ink
        if self.style == "clean" or roughness <= 0:
            line_attrs = attrs(
                x1=x1,
                y1=y1,
                x2=x2,
                y2=y2,
                stroke=color,
                stroke_width=width,
                stroke_dasharray=dash,
                opacity=opacity,
                stroke_linecap="round",
            )
            return f'<line {line_attrs}/>'
        # Two slightly different strokes create a hand-drawn line while remaining
        # simple, portable SVG (no filters or external rough.js dependency).
        a = roughness
        first_attrs = attrs(
            x1=x1 + self._jitter(a),
            y1=y1 + self._jitter(a),
            x2=x2 + self._jitter(a),
            y2=y2 + self._jitter(a),
            stroke=color,
            stroke_width=width,
            stroke_dasharray=dash,
            opacity=opacity,
            stroke_linecap="round",
        )
        second_attrs = attrs(
            x1=x1 + self._jitter(a),
            y1=y1 + self._jitter(a),
            x2=x2 + self._jitter(a),
            y2=y2 + self._jitter(a),
            stroke=color,
            stroke_width=max(0.8, width * 0.45),
            stroke_dasharray=dash,
            opacity=opacity * 0.54,
            stroke_linecap="round",
        )
        return f'<line {first_attrs}/><line {second_attrs}/>'

    def rect(self, x: float, y: float, width: float, height: float, *, fill: str | None = None,
             stroke: str | None = None, radius: float = 16, stroke_width: float = 2.2,
             roughness: float = 2.1, opacity: float = 1) -> str:
        fill_color = fill if fill is not None else self.palette.surface
        stroke_color = stroke if stroke is not None else self.palette.ink
        if self.style == "clean" or roughness <= 0:
            rect_attrs = attrs(
                x=x,
                y=y,
                width=width,
                height=height,
                rx=radius,
                fill=fill_color,
                stroke=stroke_color,
                stroke_width=stroke_width,
                opacity=opacity,
            )
            return f'<rect {rect_attrs}/>'
        a = roughness
        first_attrs = attrs(
            x=x + self._jitter(a),
            y=y + self._jitter(a),
            width=width + self._jitter(a),
            height=height + self._jitter(a),
            rx=radius,
            fill=fill_color,
            stroke=stroke_color,
            stroke_width=stroke_width,
            opacity=opacity,
        )
        second_attrs = attrs(
            x=x + self._jitter(a),
            y=y + self._jitter(a),
            width=width + self._jitter(a),
            height=height + self._jitter(a),
            rx=radius + self._jitter(1.5),
            fill="none",
            stroke=stroke_color,
            stroke_width=max(0.8, stroke_width * 0.42),
            opacity=opacity * 0.42,
        )
        return f'<rect {first_attrs}/><rect {second_attrs}/>'

    def circle(self, cx: float, cy: float, radius: float, *, fill: str = "none",
               stroke: str | None = None, width: float = 2.2, roughness: float = 1.8,
               opacity: float = 1) -> str:
        color = stroke if stroke is not None else self.palette.ink
        if self.style == "clean" or roughness <= 0:
            circle_attrs = attrs(
                cx=cx,
                cy=cy,
                r=radius,
                fill=fill,
                stroke=color,
                stroke_width=width,
                opacity=opacity,
            )
            return f'<circle {circle_attrs}/>'
        a = roughness
        first_attrs = attrs(
            cx=cx + self._jitter(a),
            cy=cy + self._jitter(a),
            rx=radius + self._jitter(a),
            ry=radius + self._jitter(a),
            fill=fill,
            stroke=color,
            stroke_width=width,
            opacity=opacity,
        )
        second_attrs = attrs(
            cx=cx + self._jitter(a),
            cy=cy + self._jitter(a),
            rx=radius + self._jitter(a),
            ry=radius + self._jitter(a),
            fill="none",
            stroke=color,
            stroke_width=max(0.8, width * 0.42),
            opacity=opacity * 0.42,
        )
        return f'<ellipse {first_attrs}/><ellipse {second_attrs}/>'

    def text(self, value: str, x: float, y: float, *, size: float = 24,
             color: str | None = None, weight: int = 400, anchor: str = "start",
             family: str = "Inter, Arial, sans-serif", letter_spacing: float | None = None,
             italic: bool = False, opacity: float = 1) -> str:
        text_attrs = attrs(
            x=x,
            y=y,
            fill=color or self.palette.ink,
            font_size=size,
            font_family=family,
            font_weight=weight,
            text_anchor=anchor,
            letter_spacing=letter_spacing,
            font_style="italic" if italic else None,
            opacity=opacity,
        )
        return f'<text {text_attrs}>{esc(value)}</text>'

    def multiline(self, value: str, x: float, y: float, *, width: float,
                  size: float = 24, line_height: float = 1.24, color: str | None = None,
                  weight: int = 400, anchor: str = "start",
                  family: str = "Inter, Arial, sans-serif", max_lines: int | None = None) -> str:
        # Approximate 0.55em average glyph width. This is deterministic and works
        # well for short presentation labels without measuring installed fonts.
        chars = max(5, int(width / (size * 0.55)))
        lines = textwrap.wrap(value, width=chars, break_long_words=False, break_on_hyphens=False) or [""]
        if max_lines is not None and len(lines) > max_lines:
            lines = lines[:max_lines]
            lines[-1] = lines[-1].rstrip(".,;: ") + "…"
        text_attrs = attrs(
            x=x,
            y=y,
            fill=color or self.palette.ink,
            font_size=size,
            font_family=family,
            font_weight=weight,
            text_anchor=anchor,
        )
        tspans = "".join(
            f'<tspan {attrs(x=x, dy=0 if index == 0 else size * line_height)}>{esc(line)}</tspan>'
            for index, line in enumerate(lines)
        )
        return f"<text {text_attrs}>{tspans}</text>"

    def arrow(self, x1: float, y1: float, x2: float, y2: float, *, color: str | None = None,
              width: float = 3.5, curve: float = 0, label: str | None = None,
              label_offset: tuple[float, float] = (0, -12), dash: str | None = None) -> str:
        stroke = color or self.palette.accent
        if abs(curve) < 0.01:
            line_markup = self.line(x1, y1, x2, y2, stroke=stroke, width=width, dash=dash, roughness=1.5)
            angle = math.atan2(y2 - y1, x2 - x1)
        else:
            mx = (x1 + x2) / 2
            my = (y1 + y2) / 2
            dx = x2 - x1
            dy = y2 - y1
            length = max(1.0, math.hypot(dx, dy))
            nx, ny = -dy / length, dx / length
            cx, cy = mx + nx * curve, my + ny * curve
            d = f"M {x1:.1f} {y1:.1f} Q {cx:.1f} {cy:.1f} {x2:.1f} {y2:.1f}"
            line_markup = self.path(d, stroke=stroke, width=width, dash=dash)
            angle = math.atan2(y2 - cy, x2 - cx)
        head = 14 + width
        wing = 8 + width * 0.6
        ax = x2 - math.cos(angle) * head
        ay = y2 - math.sin(angle) * head
        left_x = ax + math.cos(angle + math.pi / 2) * wing
        left_y = ay + math.sin(angle + math.pi / 2) * wing
        right_x = ax + math.cos(angle - math.pi / 2) * wing
        right_y = ay + math.sin(angle - math.pi / 2) * wing
        head_markup = self.path(
            f"M {left_x:.1f} {left_y:.1f} L {x2:.1f} {y2:.1f} L {right_x:.1f} {right_y:.1f}",
            stroke=stroke,
            width=width,
        )
        label_markup = ""
        if label:
            lx = (x1 + x2) / 2 + label_offset[0]
            ly = (y1 + y2) / 2 + label_offset[1]
            label_markup = self.text(label, lx, ly, size=14, color=self.palette.muted,
                                     weight=700, anchor="middle", family="SFMono-Regular, Consolas, monospace")
        return line_markup + head_markup + label_markup

    def pill(self, label: str, x: float, y: float, width: float, *, fill: str | None = None,
             stroke: str | None = None, text_color: str | None = None, size: float = 16) -> str:
        body = self.rect(x, y, width, 38, fill=fill or self.palette.surface,
                         stroke=stroke or self.palette.ink, radius=19, stroke_width=2)
        body += self.text(label, x + width / 2, y + 25, size=size,
                          color=text_color or self.palette.ink, weight=700, anchor="middle",
                          family="SFMono-Regular, Consolas, monospace")
        return body

    def document(self, x: float, y: float, width: float, height: float, *, label: str,
                 angle: float = 0, accent: bool = False) -> str:
        p = self.palette
        body = self.rect(x, y, width, height, fill=p.surface,
                         stroke=p.accent if accent else p.ink, radius=5,
                         stroke_width=2.4, roughness=1.6)
        fold = 20
        body += self.path(
            f"M {x + width - fold} {y} L {x + width} {y + fold} L {x + width - fold} {y + fold} Z",
            fill=p.canvas,
            stroke=p.accent if accent else p.ink,
            width=1.8,
        )
        body += self.line(x + 18, y + 30, x + width - 32, y + 30, stroke=p.border, width=3, roughness=0.8)
        body += self.line(x + 18, y + 49, x + width - 45, y + 49, stroke=p.border, width=3, roughness=0.8)
        body += self.text(label, x + 18, y + height - 16, size=14, color=p.muted, weight=700,
                          family="SFMono-Regular, Consolas, monospace")
        return self.group(body, transform=f"rotate({angle} {x + width / 2} {y + height / 2})")

    def check_icon(self, cx: float, cy: float, radius: float = 25, *, label: str | None = None) -> str:
        p = self.palette
        body = self.circle(cx, cy, radius, fill=p.surface, stroke=p.ink, width=2.8)
        body += self.path(
            f"M {cx - radius * 0.48:.1f} {cy:.1f} L {cx - radius * 0.12:.1f} {cy + radius * 0.38:.1f} "
            f"L {cx + radius * 0.56:.1f} {cy - radius * 0.42:.1f}",
            stroke=p.ink,
            width=4.2,
        )
        if label:
            body += self.text(label, cx, cy + radius + 28, size=15, color=p.ink, weight=700,
                              anchor="middle", family="SFMono-Regular, Consolas, monospace")
        return body

    def bot_icon(self, cx: float, cy: float, *, label: str | None = None) -> str:
        p = self.palette
        body = self.rect(cx - 38, cy - 32, 76, 64, fill=p.surface, stroke=p.ink,
                         radius=18, stroke_width=2.5)
        body += self.line(cx, cy - 32, cx, cy - 50, stroke=p.ink, width=2.3)
        body += self.circle(cx, cy - 54, 4, fill=p.accent, stroke=p.accent, width=0, roughness=0)
        body += self.circle(cx - 16, cy - 5, 5, fill=p.ink, stroke=p.ink, width=0, roughness=0)
        body += self.circle(cx + 16, cy - 5, 5, fill=p.ink, stroke=p.ink, width=0, roughness=0)
        body += self.path(f"M {cx - 15} {cy + 13} Q {cx} {cy + 24} {cx + 15} {cy + 13}", stroke=p.ink, width=2.2)
        if label:
            body += self.text(label, cx, cy + 60, size=15, color=p.ink, weight=700,
                              anchor="middle", family="SFMono-Regular, Consolas, monospace")
        return body

    def person(self, cx: float, top: float, *, scale: float = 1, phone: bool = True) -> str:
        p = self.palette
        head_y = top + 47 * scale
        body = self.circle(cx, head_y, 35 * scale, fill=p.surface, stroke=p.ink, width=2.8)
        body += self.circle(cx - 12 * scale, head_y - 6 * scale, 3.2 * scale,
                            fill=p.ink, stroke=p.ink, width=0, roughness=0)
        body += self.circle(cx + 12 * scale, head_y - 6 * scale, 3.2 * scale,
                            fill=p.ink, stroke=p.ink, width=0, roughness=0)
        body += self.path(
            f"M {cx - 14 * scale:.1f} {head_y + 10 * scale:.1f} Q {cx:.1f} {head_y + 22 * scale:.1f} "
            f"{cx + 14 * scale:.1f} {head_y + 10 * scale:.1f}",
            stroke=p.ink,
            width=2.2 * scale,
        )
        neck_y = head_y + 38 * scale
        hip_y = neck_y + 115 * scale
        body += self.line(cx, neck_y, cx, hip_y, stroke=p.ink, width=3 * scale)
        body += self.line(cx, neck_y + 30 * scale, cx - 58 * scale, neck_y + 62 * scale,
                          stroke=p.ink, width=3 * scale)
        right_hand_x = cx + 55 * scale
        right_hand_y = neck_y + 48 * scale
        body += self.line(cx, neck_y + 30 * scale, right_hand_x, right_hand_y,
                          stroke=p.ink, width=3 * scale)
        body += self.line(cx, hip_y, cx - 42 * scale, hip_y + 92 * scale,
                          stroke=p.ink, width=3 * scale)
        body += self.line(cx, hip_y, cx + 44 * scale, hip_y + 92 * scale,
                          stroke=p.ink, width=3 * scale)
        if phone:
            phone_x = right_hand_x + 3 * scale
            phone_y = right_hand_y - 8 * scale
            body += self.group(
                self.rect(phone_x, phone_y, 45 * scale, 78 * scale, fill=p.surface,
                          stroke=p.ink, radius=8 * scale, stroke_width=2.5 * scale)
                + self.circle(phone_x + 22.5 * scale, phone_y + 64 * scale, 3 * scale,
                              fill=p.ink, stroke=p.ink, width=0, roughness=0),
                transform=f"rotate(8 {phone_x + 22.5 * scale} {phone_y + 39 * scale})",
            )
        return body

    def star(self, cx: float, cy: float, outer: float, inner: float, *, fill: str | None = None,
             stroke: str | None = None) -> str:
        points: list[str] = []
        for index in range(10):
            radius = outer if index % 2 == 0 else inner
            angle = -math.pi / 2 + index * math.pi / 5
            points.append(f"{cx + math.cos(angle) * radius:.1f},{cy + math.sin(angle) * radius:.1f}")
        return f'<polygon {attrs(points=" ".join(points), fill=fill or self.palette.surface, stroke=stroke or self.palette.ink, stroke_width=2.5, stroke_linejoin="round")}/>'

    def label(self, value: str, x: float, y: float, *, color: str | None = None,
              anchor: str = "start") -> str:
        return self.text(value.upper(), x, y, size=14, color=color or self.palette.accent,
                         weight=700, anchor=anchor, letter_spacing=1.8,
                         family="SFMono-Regular, Consolas, monospace")

    def render(self, title: str, description: str) -> str:
        background = "" if self.transparent else f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{self.palette.canvas}"/>'
        defs = (
            "<defs>"
            f'<pattern id="paper-grid" width="40" height="40" patternUnits="userSpaceOnUse">'
            f'<path d="M 40 0 L 0 0 0 40" fill="none" stroke="{self.palette.ink}" stroke-width="0.7" opacity="0.035"/>'
            "</pattern>"
            "</defs>"
        )
        grid = "" if self.transparent else '<rect width="1200" height="700" fill="url(#paper-grid)"/>'
        body = "\n".join(self.parts)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
            f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title desc">\n'
            f'  <title id="title">{esc(title)}</title>\n'
            f'  <desc id="desc">{esc(description)}</desc>\n'
            f'  {defs}\n  {background}\n  {grid}\n{body}\n</svg>\n'
        )


def _caption(d: Drawing, title: str, subtitle: str, *, number: str) -> str:
    if not d.show_caption:
        return ""
    p = d.palette
    body = d.label(number, 42, 42)
    body += d.text(title, 42, 78, size=26, color=p.ink, weight=700,
                   family="Georgia, Iowan Old Style, serif")
    if subtitle:
        body += d.text(subtitle, 42, 104, size=14, color=p.muted, weight=400)
    return body


def agent_journey(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    """Chaos → human-directed agent workflow → tangible operational outcome."""
    p = d.palette
    d.add(_caption(d, title, subtitle, number="VISUAL STORY / AGENT JOURNEY"))

    # Left: chaotic source material. A single containment frame lets the irregular
    # document pile remain the visual anchor rather than becoming three cards.
    d.add(d.rect(34, 132, 312, 500, fill=p.surface, stroke=p.ink, radius=28, stroke_width=2.8))
    d.add(d.label("Input chaos", 64, 170, color=p.ink))
    d.add(d.text("Scattered context", 64, 202, size=23, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    d.add(d.document(76, 282, 148, 196, label="brief.md", angle=-7))
    d.add(d.document(164, 248, 132, 210, label="notes.pdf", angle=6, accent=True))
    d.add(d.document(116, 360, 145, 178, label="final_v7", angle=1))
    d.add(d.path("M 70 536 Q 102 516 129 538 Q 165 514 195 538 Q 229 516 286 540",
                 stroke=p.ink, width=3.0))
    d.add(d.pill("9,708 files", 92, 548, 196, fill=p.canvas, stroke=p.ink, size=17))

    # Middle: open space, a person, and two small tool signals. The absence of a
    # surrounding card intentionally changes the eye rhythm.
    d.add(d.check_icon(430, 214, radius=30, label="GitHub"))
    d.add(d.bot_icon(432, 375, label="AI agent"))
    d.add(d.arrow(475, 293, 525, 293, color=p.accent, width=3.6, curve=-8))
    d.add(d.person(616, 218, scale=1.05, phone=True))
    d.add(d.label("Human in control", 610, 584, anchor="middle"))
    d.add(d.text("No diagramming expertise required", 610, 611, size=16, color=p.muted,
                 anchor="middle", weight=500))
    d.add(d.arrow(710, 304, 774, 304, color=p.accent, width=4.0, curve=6, label="publish"))

    # Right: the result is concrete UI, not a generic "result" card.
    d.add(d.rect(778, 132, 388, 500, fill=p.surface, stroke=p.ink, radius=28, stroke_width=2.8))
    d.add(d.rect(804, 158, 336, 70, fill=p.canvas, stroke=p.ink, radius=18, stroke_width=2.3))
    d.add(d.text("WORK QUEST", 830, 201, size=17, weight=700,
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.text("LV. 12", 1104, 201, size=16, weight=700, anchor="end",
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.label("Today's progress", 812, 268, color=p.ink))
    d.add(d.rect(812, 288, 316, 38, fill=p.canvas, stroke=p.ink, radius=19, stroke_width=2.2))
    d.add(d.rect(819, 295, 222, 24, fill=p.accent, stroke=p.accent, radius=12,
                 stroke_width=0, roughness=0))
    task_y = [358, 428]
    task_text = ["Organize client release", "Next: review architecture"]
    for index, y in enumerate(task_y):
        d.add(d.rect(812, y, 316, 58, fill=p.surface if index == 0 else p.canvas,
                     stroke=p.ink, radius=15, stroke_width=2.1))
        d.add(d.circle(838, y + 29, 12, fill=p.surface, stroke=p.ink, width=2.1))
        if index == 0:
            d.add(d.path(f"M 830 {y + 29} L 836 {y + 35} L 847 {y + 20}", stroke=p.accent, width=3.2))
        d.add(d.text(task_text[index], 864, y + 36, size=16, weight=700 if index == 0 else 500))
    d.add(d.star(1089, 552, 48, 22, fill=p.accent_soft, stroke=p.ink))
    d.add(d.text("+XP", 1089, 560, size=18, weight=800, anchor="middle",
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.label("Outcome", 812, 548))
    d.add(d.text("Visible progress", 812, 578, size=24, weight=700,
                 family="Georgia, Iowan Old Style, serif"))

    return title, "A left-to-right story from chaotic files through a human-directed AI workflow to a concrete progress dashboard."


def infographic(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    return agent_journey(d, title, subtitle)


def data_journey(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    d.add(_caption(d, title, subtitle, number="DATA STORY / STATE + MOVEMENT"))
    # Oversized metric and chart share one baseline, avoiding the common card +
    # chart split. A single annotation connects evidence to action.
    d.add(d.label("Current signal", 56, 182))
    d.add(d.text("82%", 48, 352, size=154, color=p.accent, weight=600,
                 family="Georgia, Iowan Old Style, serif"))
    d.add(d.multiline("of the target reached", 58, 396, width=290, size=24, weight=700,
                      family="Georgia, Iowan Old Style, serif", max_lines=2))
    d.add(d.text("Definition · source · date", 58, 474, size=15, color=p.muted,
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.arrow(326, 382, 390, 382, color=p.accent, width=3.3))

    x0, y0, width, height = 410, 190, 720, 330
    d.add(d.label("Progress over time", x0, y0 - 18, color=p.ink))
    # Minimal axes and guide lines.
    for tick in [0, 25, 50, 75, 100]:
        y = y0 + height - tick / 100 * height
        d.add(d.line(x0, y, x0 + width, y, stroke=p.border, width=1.2, roughness=0.5,
                     dash="5 9" if tick not in (0, 100) else None))
        d.add(d.text(str(tick), x0 - 16, y + 5, size=12, color=p.muted, anchor="end",
                     family="SFMono-Regular, Consolas, monospace"))
    values = [28, 34, 46, 51, 68, 82]
    points: list[tuple[float, float]] = []
    for index, value in enumerate(values):
        x = x0 + index * width / (len(values) - 1)
        y = y0 + height - value / 100 * height
        points.append((x, y))
        d.add(d.line(x, y0 + height, x, y, stroke=p.accent_soft, width=8, roughness=0.7))
        d.add(d.circle(x, y, 8 if index < len(values) - 1 else 12,
                       fill=p.surface if index < len(values) - 1 else p.accent,
                       stroke=p.accent if index == len(values) - 1 else p.muted,
                       width=2.0, roughness=1.0))
        d.add(d.text(f"Q{index + 1}", x, y0 + height + 34, size=13, color=p.muted,
                     weight=700, anchor="middle", family="SFMono-Regular, Consolas, monospace"))
    path_d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points)
    d.add(d.path(path_d, stroke=p.accent, width=4.8))
    d.add(d.pill("+14 pts", 980, 204, 126, fill=p.accent_soft, stroke=p.accent,
                 text_color=p.ink, size=15))
    d.add(d.path("M 412 574 Q 605 552 792 574 Q 955 596 1125 566", stroke=p.ink, width=2.1))
    d.add(d.label("Decision", 410, 618))
    d.add(d.text("Fund the next bottleneck—not the loudest request.", 410, 650, size=25, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    return title, "A dominant metric, a clear trend, and one decision implication on a shared visual baseline."


def decision_path(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    d.add(_caption(d, title, subtitle, number="DECISION / CRITERIA → ACTION"))
    d.add(d.label("Signal", 70, 190, color=p.ink))
    d.add(d.circle(132, 304, 74, fill=p.surface, stroke=p.ink, width=2.8))
    d.add(d.text("Δ", 132, 326, size=58, color=p.accent, weight=700, anchor="middle",
                 family="Georgia, Iowan Old Style, serif"))
    d.add(d.text("What changed?", 132, 408, size=17, color=p.muted, anchor="middle", weight=600))
    d.add(d.arrow(210, 304, 360, 304, color=p.accent, width=3.8, label="evaluate"))

    # Diamond acts as the singular decision point; no surrounding card.
    cx, cy, w, h = 472, 304, 120, 104
    diamond = f"M {cx} {cy - h / 2} L {cx + w / 2} {cy} L {cx} {cy + h / 2} L {cx - w / 2} {cy} Z"
    d.add(d.path(diamond, fill=p.accent_soft, stroke=p.accent, width=3.0))
    d.add(d.text("CRITERIA", cx, cy - 6, size=14, color=p.ink, weight=700, anchor="middle",
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.text("met?", cx, cy + 20, size=16, color=p.ink, weight=700, anchor="middle"))

    d.add(d.arrow(534, 282, 700, 206, color=p.success, width=3.8, curve=-18, label="yes"))
    d.add(d.arrow(534, 326, 700, 430, color=p.muted, width=3.0, curve=18, label="not yet"))

    # Recommended path receives a broad, almost underlined surface rather than a
    # generic card. The alternate path remains lighter.
    d.add(d.rect(714, 144, 410, 164, fill=p.accent_soft, stroke=p.accent, radius=24, stroke_width=2.8))
    d.add(d.label("Proceed", 746, 182))
    d.add(d.text("Ship the guarded change", 746, 226, size=30, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    d.add(d.text("Owner · rollback · success metric", 746, 264, size=16, color=p.muted,
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.check_icon(1081, 178, radius=20))

    d.add(d.rect(714, 370, 410, 150, fill=p.surface, stroke=p.border, radius=24, stroke_width=2.2))
    d.add(d.label("Pause", 746, 408, color=p.muted))
    d.add(d.text("Collect the missing evidence", 746, 450, size=28, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    d.add(d.text("Define the smallest test and review date", 746, 488, size=16, color=p.muted))

    d.add(d.path("M 74 585 Q 340 550 584 584 Q 844 618 1128 578", stroke=p.ink, width=2.2))
    d.add(d.label("Recommendation", 70, 624))
    d.add(d.text("Make the next action, owner, and timing visible.", 70, 660, size=27, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    return title, "A single decision point branches into a highlighted recommendation and a lighter evidence-gathering path."


def system_map(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    d.add(_caption(d, title, subtitle, number="SYSTEM / HUB + BOUNDARIES"))
    # Trust boundary is a large dashed shape; nodes sit inside/outside it so the
    # audience can immediately see ownership and exposure.
    d.add(d.rect(300, 150, 620, 438, fill="none", stroke=p.accent, radius=58,
                 stroke_width=2.4, roughness=1.2, opacity=0.92))
    d.add(d.path("M 320 172 H 900", stroke=p.accent, width=2.2, dash="10 10", opacity=0.75))
    d.add(d.label("Trusted platform boundary", 328, 198))

    # Central hub.
    d.add(d.circle(610, 360, 92, fill=p.code, stroke=p.code, width=0, roughness=0))
    d.add(d.text("AGENT", 610, 348, size=16, color=p.accent_soft, weight=700, anchor="middle",
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.text("control plane", 610, 382, size=23, color=p.code_text, weight=700, anchor="middle",
                 family="Georgia, Iowan Old Style, serif"))
    d.add(d.circle(610, 360, 108, fill="none", stroke=p.accent, width=2.1, roughness=1.0,
                   opacity=0.65))

    nodes = [
        (385, 278, "IDENTITY", "OIDC / policy", True),
        (397, 470, "TOOLS", "GitHub / CI", False),
        (820, 278, "CONTEXT", "RAG / files", False),
        (812, 470, "OBSERVE", "logs / traces", True),
    ]
    for x, y, label, detail, accent in nodes:
        d.add(d.circle(x, y, 54, fill=p.accent_soft if accent else p.surface,
                       stroke=p.accent if accent else p.ink, width=2.3))
        d.add(d.text(label, x, y - 4, size=13, color=p.ink, weight=700, anchor="middle",
                     family="SFMono-Regular, Consolas, monospace"))
        d.add(d.text(detail, x, y + 21, size=13, color=p.muted, anchor="middle"))
        d.add(d.arrow(x + (34 if x < 610 else -34), y,
                      534 if x < 610 else 686, 360 + (y - 360) * 0.18,
                      color=p.accent if accent else p.muted, width=2.4,
                      curve=-14 if y < 360 else 14))

    # External actors make the boundary meaningful.
    d.add(d.circle(126, 268, 50, fill=p.surface, stroke=p.ink, width=2.4))
    d.add(d.text("USER", 126, 274, size=14, weight=700, anchor="middle",
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.arrow(180, 268, 300, 268, color=p.accent, width=3.1, label="request"))
    d.add(d.circle(1070, 456, 52, fill=p.surface, stroke=p.ink, width=2.4))
    d.add(d.text("MODEL", 1070, 462, size=14, weight=700, anchor="middle",
                 family="SFMono-Regular, Consolas, monospace"))
    d.add(d.arrow(920, 456, 1012, 456, color=p.muted, width=2.6, label="gateway"))

    d.add(d.label("Read the map", 58, 594))
    d.add(d.text("Who can call what—and where policy is enforced.", 58, 636, size=28, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    return title, "A hub-and-boundary system map that distinguishes external actors, trusted services, and policy-enforced connections."


def operating_loop(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    content = d.content
    caption = str(content.get("caption") or "OPERATING MODEL / CLOSED LOOP")
    d.add(_caption(d, title, subtitle, number=caption))

    default_steps = [
        ("OBSERVE", "signals"),
        ("DECIDE", "policy"),
        ("ACT", "workflow"),
        ("LEARN", "feedback"),
    ]
    raw_steps = content.get("steps")
    if isinstance(raw_steps, list) and raw_steps:
        step_pairs = [(str(item[0]), str(item[1])) for item in raw_steps]
    else:
        step_pairs = default_steps

    raw_rail = content.get("rail")
    if isinstance(raw_rail, list) and raw_rail:
        rail_pairs = [(str(item[0]), str(item[1])) for item in raw_rail]
    elif content.get("kind") == "operating-loop":
        rail_pairs = [
            ("Metric", "One measurable result"),
            ("Cadence", "Daily signal · weekly review"),
            ("Guardrail", "Stop conditions + owner"),
        ]
    else:
        rail_pairs = []

    has_rail = bool(rail_pairs)
    cx, cy, radius = (570 if has_rail else 600), 350, 198
    positions: list[tuple[float, float]] = []
    for index, (label, detail) in enumerate(step_pairs):
        angle = math.radians([-90, 0, 90, 180][index])
        x = cx + math.cos(angle) * radius
        y = cy + math.sin(angle) * radius
        positions.append((x, y))
        accent = index in (1, 3)
        d.add(d.circle(x, y, 64, fill=p.accent_soft if accent else p.surface,
                       stroke=p.accent if accent else p.ink, width=2.5))
        label_size = 15 if len(label) <= 10 else 12
        d.add(d.text(label, x, y - 2, size=label_size, color=p.ink, weight=800,
                     anchor="middle", family="SFMono-Regular, Consolas, monospace"))
        d.add(d.multiline(detail, x, y + 24, width=108, size=13, color=p.muted,
                          anchor="middle", max_lines=2))

    # Connect tangent points so arrows do not cross node labels.
    for index, (x1, y1) in enumerate(positions):
        x2, y2 = positions[(index + 1) % len(positions)]
        dx, dy = x2 - x1, y2 - y1
        length = max(1.0, math.hypot(dx, dy))
        ux, uy = dx / length, dy / length
        d.add(d.arrow(
            x1 + ux * 72,
            y1 + uy * 72,
            x2 - ux * 72,
            y2 - uy * 72,
            color=p.accent if index % 2 == 0 else p.muted,
            width=3.0,
            curve=52,
        ))

    center_eyebrow = str(content.get("center_eyebrow") or "North star")
    center_label = str(content.get("center_label") or "Outcome")
    d.add(d.circle(cx, cy, 90, fill=p.code, stroke=p.code, width=0, roughness=0))
    d.add(d.label(center_eyebrow, cx, cy - 24, color=p.accent_soft, anchor="middle"))
    d.add(d.multiline(
        center_label,
        cx,
        cy + 20,
        width=150,
        size=29 if len(center_label) <= 14 else 21,
        color=p.code_text,
        weight=700,
        anchor="middle",
        family="Georgia, Iowan Old Style, serif",
        max_lines=2,
    ))

    if has_rail:
        d.add(d.line(910, 170, 910, 552, stroke=p.border, width=2.0))
        rail_y = {1: [310], 2: [250, 410]}.get(len(rail_pairs), [205, 324, 443])
        for index, ((heading, detail), y) in enumerate(zip(rail_pairs, rail_y), start=1):
            d.add(d.text(f"{index:02d}", 942, y, size=14, color=p.accent, weight=700,
                         family="SFMono-Regular, Consolas, monospace"))
            d.add(d.text(heading, 986, y, size=20, color=p.ink, weight=700,
                         family="Georgia, Iowan Old Style, serif"))
            d.add(d.multiline(detail, 942, y + 31, width=208, size=14,
                              color=p.muted, max_lines=2))

    takeaway = str(content.get("takeaway") or "").strip()
    if takeaway:
        d.add(d.label("Takeaway", 54, 614))
        d.add(d.multiline(takeaway, 54, 650, width=1080, size=23, weight=700,
                          family="Georgia, Iowan Old Style, serif", max_lines=2))

    return title, "A configurable four-stage mechanism loop around a central outcome, with optional proof details and one takeaway."


def swimlane_process(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    d.add(_caption(d, title, subtitle, number="PROCESS / SWIMLANE HANDOFFS"))
    lanes = [
        (150, "USER", p.surface),
        (300, "AGENT", p.accent_soft),
        (450, "PLATFORM", p.surface),
    ]
    for y, label, fill in lanes:
        d.add(d.rect(48, y, 1104, 116, fill=fill, stroke=p.border, radius=18, stroke_width=1.8, roughness=1.0))
        d.add(d.label(label, 72, y + 30, color=p.ink))
    events = [
        (190, 150, "Ask", "goal + context"),
        (390, 300, "Plan", "story + tools"),
        (590, 450, "Execute", "APIs + checks"),
        (790, 300, "Review", "evidence + risk"),
        (990, 150, "Approve", "ship / revise"),
    ]
    previous: tuple[float, float] | None = None
    for index, (x, lane_y, heading, detail) in enumerate(events):
        cy = lane_y + 70
        accent = index in (1, 3)
        d.add(d.circle(x, cy, 32, fill=p.accent if accent else p.surface,
                       stroke=p.accent if accent else p.ink, width=2.3))
        d.add(d.text(str(index + 1), x, cy + 6, size=16,
                     color=p.surface if accent else p.ink, weight=800, anchor="middle",
                     family="SFMono-Regular, Consolas, monospace"))
        d.add(d.text(heading, x + 46, cy - 2, size=18, weight=700,
                     family="Georgia, Iowan Old Style, serif"))
        d.add(d.text(detail, x + 46, cy + 24, size=13, color=p.muted))
        if previous:
            d.add(d.arrow(previous[0] + 36, previous[1], x - 36, cy,
                          color=p.accent if index % 2 else p.muted, width=2.8,
                          curve=-24 if cy < previous[1] else 24))
        previous = (x, cy)
    d.add(d.pill("human checkpoint", 730, 588, 190, fill=p.canvas, stroke=p.accent,
                 text_color=p.ink, size=14))
    d.add(d.arrow(825, 566, 825, 486, color=p.accent, width=2.6, dash="5 6"))
    d.add(d.text("Name every handoff, owner, and failure path.", 48, 660, size=25, weight=700,
                 family="Georgia, Iowan Old Style, serif"))
    return title, "A three-lane process showing how responsibility moves between a user, an AI agent, and the platform, including a human checkpoint."


def roadmap_horizon(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    d.add(_caption(d, title, subtitle, number="ROADMAP / NOW → NEXT → LATER"))
    # A perspective road changes the visual grammar from ordinary milestone cards.
    d.add(d.path("M 104 574 C 340 524 690 522 1102 210", stroke=p.ink, width=4.0))
    d.add(d.path("M 104 638 C 390 578 750 570 1142 248", stroke=p.ink, width=4.0))
    d.add(d.path("M 104 606 C 360 550 720 548 1122 229", stroke=p.border, width=2.0, dash="13 15"))
    milestones = [
        (218, 562, "NOW", "Catalog", "Name the reusable patterns"),
        (555, 494, "NEXT", "Scaffold", "Ship editable starters"),
        (862, 346, "LATER", "Learn", "Add patterns from real decks"),
    ]
    for index, (x, y, horizon, heading, detail) in enumerate(milestones):
        accent = index == 0
        d.add(d.circle(x, y, 26, fill=p.accent if accent else p.surface,
                       stroke=p.accent if accent else p.ink, width=2.4))
        d.add(d.text(str(index + 1), x, y + 6, size=14,
                     color=p.surface if accent else p.ink, weight=800, anchor="middle",
                     family="SFMono-Regular, Consolas, monospace"))
        box_y = y - 138
        d.add(d.label(horizon, x - 82, box_y, color=p.accent if accent else p.muted))
        d.add(d.text(heading, x - 82, box_y + 42, size=28, weight=700,
                     family="Georgia, Iowan Old Style, serif"))
        d.add(d.multiline(detail, x - 82, box_y + 74, width=205, size=15, color=p.muted, max_lines=2))
        d.add(d.line(x, box_y + 98, x, y - 30, stroke=p.border, width=1.8, dash="5 7"))
    d.add(d.star(1101, 189, 34, 16, fill=p.accent_soft, stroke=p.ink))
    d.add(d.label("Target", 1101, 199, color=p.ink, anchor="middle"))
    d.add(d.text("Roadmaps should show changing capability—not only dates.", 54, 146, size=27,
                 weight=700, family="Georgia, Iowan Old Style, serif"))
    return title, "A perspective roadmap that separates now, next, and later while showing the capability change at each milestone."


def architecture_boundary(d: Drawing, title: str, subtitle: str) -> tuple[str, str]:
    p = d.palette
    d.add(_caption(d, title, subtitle, number="ARCHITECTURE / CONTROL + DATA PLANES"))
    # Two horizontal planes and a vertical trust boundary create a composition
    # unlike a conventional four-card architecture diagram.
    d.add(d.label("Control plane", 70, 178, color=p.ink))
    d.add(d.rect(58, 198, 1084, 160, fill=p.accent_soft, stroke=p.accent, radius=24,
                 stroke_width=2.2, roughness=1.0))
    d.add(d.label("Data plane", 70, 410, color=p.ink))
    d.add(d.rect(58, 430, 1084, 160, fill=p.surface, stroke=p.ink, radius=24,
                 stroke_width=2.2, roughness=1.0))
    d.add(d.line(834, 174, 834, 616, stroke=p.warning, width=2.5, dash="9 9"))
    d.add(d.label("External trust boundary", 856, 196, color=p.warning))
    controls = [
        (128, "Identity"), (350, "Policy"), (572, "Orchestrator"), (948, "Model gateway")
    ]
    for x, label in controls:
        d.add(d.circle(x, 278, 42, fill=p.surface, stroke=p.ink, width=2.0))
        d.add(d.text(label, x, 284, size=14, weight=700, anchor="middle"))
    data = [
        (128, "Request"), (350, "Retriever"), (572, "Tool runner"), (948, "Provider")
    ]
    for x, label in data:
        d.add(d.rect(x - 65, 474, 130, 68, fill=p.canvas, stroke=p.ink, radius=14, stroke_width=2.0))
        d.add(d.text(label, x, 515, size=14, weight=700, anchor="middle"))
    for row_y in [278, 508]:
        for x1, x2 in [(174, 304), (396, 526), (618, 900)]:
            d.add(d.arrow(x1, row_y, x2, row_y, color=p.accent if row_y == 278 else p.muted, width=2.6))
    for x in [128, 350, 572, 948]:
        d.add(d.arrow(x, 322, x, 472, color=p.border, width=2.0, dash="5 7"))
    d.add(d.text("Show where identity, policy, data, and failure paths cross boundaries.", 58, 650,
                 size=25, weight=700, family="Georgia, Iowan Old Style, serif"))
    return title, "A two-plane architecture visual separating control and data paths with an explicit external trust boundary."


RENDERERS: dict[str, Callable[[Drawing, str, str], tuple[str, str]]] = {
    "infographic": infographic,
    "mechanism-loop": operating_loop,
    "agent-journey": agent_journey,
    "data-journey": data_journey,
    "decision-path": decision_path,
    "system-map": system_map,
    "operating-loop": operating_loop,
    "swimlane-process": swimlane_process,
    "roadmap-horizon": roadmap_horizon,
    "architecture-boundary": architecture_boundary,
}


def valid_hex(value: str) -> str:
    if not COLOR_RE.match(value):
        raise argparse.ArgumentTypeError("expected a six-digit hex color such as #D97757")
    return value.upper()


def parse_pairs(values: Sequence[str], option: str) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for raw in values:
        label, separator, detail = raw.partition("|")
        label = label.strip()
        detail = detail.strip() if separator else ""
        if not label:
            raise ValueError(f"{option} requires a non-empty label")
        pairs.append((label, detail))
    return pairs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--kind", choices=sorted(RENDERERS), help="Built-in visual story to render")
    parser.add_argument("--output", help="Output SVG path")
    parser.add_argument("--title", default="Presentation visual")
    parser.add_argument("--subtitle", default="A reusable vector asset for a content-aware slide layout.")
    parser.add_argument("--center-eyebrow", help="Small label inside a mechanism or operating loop")
    parser.add_argument("--center-label", help="Primary outcome inside a mechanism or operating loop")
    parser.add_argument("--step", action="append", default=[], metavar="LABEL|DETAIL",
                        help="Repeat exactly four times to define a mechanism loop")
    parser.add_argument("--rail", action="append", default=[], metavar="HEADING|DETAIL",
                        help="Optional proof rail item; repeat up to three times")
    parser.add_argument("--takeaway", help="One sentence shown below a configurable loop")
    parser.add_argument("--style", choices=["sketch", "clean"], default="sketch")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic rough-stroke seed")
    parser.add_argument("--accent", type=valid_hex, default=DEFAULT_COLORS["accent"],
                        help="Accent color, for example #D97757")
    parser.add_argument("--canvas", type=valid_hex, default=DEFAULT_COLORS["canvas"],
                        help="Canvas color, for example #F7F3EC")
    parser.add_argument("--transparent", action="store_true", help="Omit the canvas background")
    parser.add_argument("--hide-caption", action="store_true",
                        help="Keep title metadata but omit the visible caption rail")
    parser.add_argument("--list-kinds", action="store_true", help="Print available drawing kinds and exit")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.list_kinds:
        print("\n".join(sorted(RENDERERS)))
        return 0
    if not args.kind or not args.output:
        parser.error("--kind and --output are required unless --list-kinds is used")

    try:
        steps = parse_pairs(args.step, "--step")
        rail = parse_pairs(args.rail, "--rail")
    except ValueError as error:
        parser.error(str(error))
    if steps and len(steps) != 4:
        parser.error("--step must be provided exactly four times")
    if args.kind == "mechanism-loop" and len(steps) != 4:
        parser.error("mechanism-loop requires exactly four --step LABEL|DETAIL values")
    if args.kind == "mechanism-loop" and not args.center_label:
        parser.error("mechanism-loop requires --center-label")
    if len(rail) > 3:
        parser.error("--rail may be provided at most three times")

    content = {
        "kind": args.kind,
        "center_eyebrow": args.center_eyebrow,
        "center_label": args.center_label,
        "steps": steps,
        "rail": rail,
        "takeaway": args.takeaway,
    }

    colors = dict(DEFAULT_COLORS)
    colors["accent"] = args.accent
    colors["canvas"] = args.canvas
    # Keep the soft accent deterministic but avoid pretending to blend arbitrary
    # colors. The bundled terracotta gets its designed tint; custom colors use a
    # neutral surface so contrast remains safe.
    if args.accent.upper() != DEFAULT_COLORS["accent"]:
        colors["accent_soft"] = colors["surface"]
    drawing = Drawing(
        style=args.style,
        seed=args.seed,
        palette=Palette.from_mapping(colors),
        transparent=args.transparent,
        show_caption=not args.hide_caption,
        content=content,
    )
    accessible_title, description = RENDERERS[args.kind](drawing, args.title, args.subtitle)
    content = drawing.render(accessible_title, description)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
