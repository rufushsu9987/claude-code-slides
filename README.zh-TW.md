# Claude Code Slides

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![Agent Plugins](https://img.shields.io/badge/Agent%20Plugins-1.0.0-211f1b.svg)](https://agent-plugins.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

**支援 Codex、Claude Code 與 Agent Plugins 相容客戶端的 Agent-first 簡報工作流程。**

可將主題、文件、URL 或程式碼 Repository 轉成故事線完整的 HTML、Marp 或可編輯 PowerPoint。Plugin 會規劃敘事、選擇視覺主題與內容導向版型、建立檔案、驗證輸出、獨立審查，並可補上 Speaker Notes。

[English](./README.md) · [主題與版型說明](./docs/templates.md)

![Claude Code Slides example](./docs/images/hero.svg)

## 與一般 AI 簡報工具的差異

Claude Code Slides 不是一次性地把文件切成十頁，而是封裝一套可重複的工作流程：

```text
來源內容
  → 受眾與目標決策
  → 故事線架構
  → 視覺主題 + 語意版型序列
  → HTML / Marp / 可編輯 PPTX
  → 確定性驗證
  → 獨立審查
  → 講稿與 Q&A
```

Portable Core 遵循 Agent Plugins 1.0.0 與 Agent Skills 慣例，並保留 Codex 與 Claude Code 的原生安裝與呼叫體驗。

## 7 種視覺主題，28 種內容導向版型

**主題 Theme** 負責色彩、字體、背景與元件風格；**版型 Layout Archetype** 負責資訊架構、視線移動與主要視覺重心。

預設主題已改為 `claude-editorial`。舊名稱 `terminal-editorial` 仍可繼續使用，會自動解析到同一主題。

| 主題 | 適用情境 |
| --- | --- |
| `claude-editorial` | 技術分享、架構審查、AI 與開發工具 |
| `executive-brief` | 主管報告、策略提案、季度回顧 |
| `cloud-architecture` | 基礎設施、平台工程、資安邊界 |
| `data-story` | 分析、研究結果、數據比較 |
| `product-launch` | 產品 Demo、發布、Roadmap |
| `dark-terminal` | Live Demo、程式碼導讀、工程深度分享 |
| `incident-review` | Postmortem、事件時間軸、根因與改善 |

版型系統包含 28 種 Archetypes，例如：

```text
editorial-cover
hero-statement
before-after
layered-architecture
flow-architecture
metric-spotlight
evidence-claim
infographic-story
data-journey
code-walkthrough
comparison-matrix
decision-path
timeline
risk-matrix
closing-manifesto
```

新的 Starter Deck 會直接展示 **20 種不同版型與 geometry**，不再只用 3–4 種排版反覆換內容。10 頁以上的簡報預設遵循：

- 至少使用 8 種不同版型。
- 不連續重複相同版型。
- 卡片或節點卡頁面控制在約 20% 以內。
- 每 3–4 頁安排一次明顯的視覺節奏變化。
- 敘事、證據、架構、流程、風險與決策頁交錯安排。

查看目前主題與版型：

```bash
codex-slides templates
codex-slides layouts
codex-slides layouts --family system --json
```

建立簡報：

```bash
codex-slides init "季度策略回顧" \
  --format pptx \
  --template executive-brief
```

沒有指定 `--template` 時，預設使用 `claude-editorial`。

每份產出都會包含 `template.json`，記錄主題、相容別名、色票、字體、版型規則、Starter Sequence 與輸出格式。


## Python 輔助繪圖

需要小型圖解時，可以使用只依賴 Python 標準函式庫的 SVG 產生器：

```bash
python3 scripts/generate-slide-art.py \
  --kind infographic \
  --title "從分散輸入到可交付簡報" \
  --output slides/example/assets/infographic-story.svg
```

目前提供 10 種經測試的 reference kinds，涵蓋 journey、boundary、path、loop、roadmap、swimlane 與 system map。它們是範例與快速 fallback，不是封閉目錄；內容需要不同語意模型時，Agent 應建立 deck-local plan、Python generator 與 SVG。輸出可嵌入 HTML／Marp，也可以作為 PPTX 的圖形資產；投影片本身的標題、文案、講稿與 Layout marker 仍保持可編輯。

## Skills

| 能力 | Codex | Claude Code |
| --- | --- | --- |
| 建立簡報 | `$create-deck` | `/claude-code-slides:create-deck` |
| 審查與修正 | `$review-deck` | `/claude-code-slides:review-deck` |
| 產生講稿 | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| 套用視覺系統 | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| 規劃故事線 | `$deck-architect` | Skill 或 `deck-architect` Subagent |
| 規劃視覺 | `$visual-director` | Skill 或 `visual-director` Subagent |
| 獨立審查 | `$deck-reviewer` | Skill 或 `deck-reviewer` Subagent |
| 建立繪圖 | `$diagram-design` | `/claude-code-slides:diagram-design` |

## 安裝到 Codex

```bash
codex plugin marketplace add \
  https://github.com/rufushsu9987/claude-code-slides.git \
  --ref main

codex plugin add claude-code-slides@rufus-slides
```

`main` 是 Preview channel；需要可重現安裝時，請改用已發布的 `claude-code-slides--vX.Y.Z` tag。

重新開啟 Codex Session 後：

```text
$create-deck

請分析目前 Repository，製作 10 頁繁體中文架構審查簡報。
使用可編輯 PPTX 與預設 claude-editorial 主題。
至少使用 8 種不同版型，內容包含資料流、信任邊界、部署、維運、風險與下一步。
```

更新既有 Git Marketplace：

```bash
codex plugin marketplace upgrade rufus-slides
codex plugin add claude-code-slides@rufus-slides
```

重新安裝後請開啟新的 Codex thread，讓新版 Skills 被載入。

若 Codex 顯示 Marketplace 不是 Git 類型，請移除後使用上方完整 GitHub URL 重新加入。

## 安裝到 Claude Code

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

接著使用：

```text
/claude-code-slides:create-deck

請把 docs/architecture.md 製作成 12 分鐘架構審查簡報。
使用可編輯 PPTX、預設 claude-editorial 主題與多樣化版型序列。
```

更新既有 Claude Code 安裝：

```bash
claude plugin marketplace update rufus-slides
claude plugin update claude-code-slides@rufus-slides
```

更新後請建立新 Session，或執行 `/reload-plugins`。

## Diagram Design 繪圖模板

內建的 `diagram-design` Skill 提供 27 種可獨立使用的 editorial diagram，包括架構圖、流程圖、序列圖、狀態圖、ER、時間軸、泳道、象限、迴圈、圖表、資料流與資安矩陣，也支援 Mermaid 與 draw.io 重繪。可用 `$diagram-design` 或 `/claude-code-slides:diagram-design` 呼叫；要放進簡報時，指定 `slide-16x9`，並把投影片標題、來源註記與講稿保留在 SVG 外部以維持可編輯性。

模板與參考資料位於 [`skills/diagram-design/`](./skills/diagram-design/)，以 MIT 授權 vendored 自 [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design)；請參考 [`ATTRIBUTION.md`](./skills/diagram-design/ATTRIBUTION.md) 與 [`THIRD_PARTY_LICENSES.md`](./skills/diagram-design/THIRD_PARTY_LICENSES.md)。

## 輸出格式

| 格式 | 適合情境 | 產出 |
| --- | --- | --- |
| HTML | 現場分享、高視覺品質、離線播放、網頁分享 | `index.html`、`theme.css`、`slides.js` |
| Marp | Markdown Review、Git Diff、快速輸出 HTML/PDF | `deck.md`、`theme.css` |
| PPTX | 可編輯 Microsoft PowerPoint 與企業交付 | `deck.mjs`、產生的 `.pptx` |

PPTX 使用可編輯文字與圖形，不會把每一頁壓成單張圖片。

三種格式都保留可審查的版型標記：

- HTML：`data-layout="..."`
- Marp：`<!-- _class: ... -->`
- PPTX：`LAYOUT_SEQUENCE`

## CLI

以下命令假設 Repository checkout 已執行 `npm link`。一般 Plugin 使用不需要全域安裝 CLI；Skills 會透過 skill-local wrapper 呼叫內建工具。未 link 的開發 checkout 可將 `codex-slides` 改成 `node bin/codex-slides.mjs`。

```bash
codex-slides templates
codex-slides layouts
codex-slides init "AI Platform" --format html --lang zh-TW
codex-slides init "Cloud Review" --format pptx --template cloud-architecture
codex-slides check slides/cloud-review --format pptx --strict
codex-slides doctor
```

`claude-slides` 提供相同介面。

`--lang` 接受 Node.js `Intl` 可正規化的語言地區標籤，並寫入 HTML、Marp、PPTX 與 `template.json`。
替換 Starter Copy 後，`--strict` 會把任何剩餘 Warning 視為檢查失敗；當同一目錄有多種 Deck 且缺少
`template.json` 時，可用 `--format html|marp|pptx` 明確指定。

## 專案架構

```text
plugin.json                 Agent Plugins portable manifest
skills/                     Portable Agent Skills
references/layout-system.md 版型設計與防重複規則
references/python-svg-plan.md 視覺規劃 Canonical Template
templates/catalog.json      視覺主題目錄
templates/layouts.json      版型 Archetype 目錄
.codex-plugin/              Codex Adapter
.agents/plugins/            Codex Marketplace
.agents/skills/             自動產生的 Repository-scoped Codex Discovery
.claude-plugin/             Claude Code Manifest 與 Marketplace
agents/                     Claude Code Subagents
bin/ + lib/                 中立核心與 Host CLI Alias
templates/                  HTML、Marp、PptxGenJS Base
```

## 開發與驗證

開發環境需要 Node.js 18.3 以上；選用 Agent-authored SVG generator 與執行其測試時，需要 Python 3.10 以上。

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run sync:skills
npm run sync:metadata
npm run check
```

測試會建立每一種主題的 HTML、Marp 與 PPTX，驗證 28 種版型目錄、20 種 Starter Layout／geometry、10 種 SVG reference kinds、精確同步與可獨立執行的 Portable Skill Resources、兩個原生 Plugin Adapter 與範例簡報。

## 獨立性聲明

這是獨立的開源社群專案，與 Anthropic、OpenAI 均無官方關聯或背書。名稱只描述內建的開發者工具風格，不包含官方 Logo 或專有產品介面。

## License

MIT
