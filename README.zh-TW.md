# Claude Code Slides

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![Agent Plugins](https://img.shields.io/badge/Agent%20Plugins-1.0.0-211f1b.svg)](https://agent-plugins.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

**支援 Codex、Claude Code 與 Agent Plugins 相容客戶端的 Agent-first 簡報工作流程。**

可將主題、文件、URL 或程式碼 Repository 轉成故事線完整的 HTML、Marp 與可編輯 PowerPoint。Plugin 會協助規劃故事線、選擇專業模板、建立檔案、執行驗證、審查交付品質，並產生 Speaker Notes。

[English](./README.md) · [模板總覽](./docs/templates.md)

![Claude Code Slides 範例](./docs/images/hero.svg)

## 和一般 AI 簡報工具的差異

Claude Code Slides 不是一次性地把文件切成十頁，而是一套可重複執行的流程：

```text
來源資料
  → 受眾與決策目標
  → 故事線規劃
  → 視覺方向與模板
  → HTML / Marp / 可編輯 PPTX
  → 確定性檢查
  → 獨立審查
  → 講稿與 Q&A
```

核心遵循 Agent Plugins 1.0 與 Agent Skills 慣例，並保留 Codex、Claude Code 的原生安裝與呼叫方式。

## 內建 7 種專業模板

所有模板都支援 HTML、Marp 與 PPTX。

| Template | 適用情境 |
| --- | --- |
| `terminal-editorial` | 技術分享、架構審查、AI 與開發工具 |
| `executive-brief` | 主管報告、策略提案、季度回顧 |
| `cloud-architecture` | 雲端架構、平台工程、資安邊界 |
| `data-story` | 數據分析、研究結果、指標與比較 |
| `product-launch` | 產品展示、發布、Roadmap 與功能敘事 |
| `dark-terminal` | 現場 Demo、程式碼導讀、工程深度分享 |
| `incident-review` | 事故檢討、影響時間線、根因與改善措施 |

查看或篩選模板：

```bash
codex-slides templates
codex-slides templates --format pptx --json
```

指定模板建立簡報：

```bash
codex-slides init "季度策略回顧" \
  --format pptx \
  --template executive-brief
```

每份輸出都會包含 `template.json`，保留模板、色彩、字體、視覺 Pattern 與格式資訊，方便重現與後續維護。

## Skills

| 能力 | Codex | Claude Code |
| --- | --- | --- |
| 建立簡報 | `$create-deck` | `/claude-code-slides:create-deck` |
| 審查與改善 | `$review-deck` | `/claude-code-slides:review-deck` |
| 產生講稿 | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| 套用視覺系統 | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| 規劃故事線 | `$deck-architect` | Skill 或 `deck-architect` Subagent |
| 規劃視覺 | `$visual-director` | Skill 或 `visual-director` Subagent |
| 獨立品質審查 | `$deck-reviewer` | Skill 或 `deck-reviewer` Subagent |

## 安裝到 Codex

```bash
codex plugin marketplace add \
  https://github.com/rufushsu9987/claude-code-slides.git \
  --ref main

codex plugin add claude-code-slides@rufus-slides
```

重新開啟 Codex Session 後執行：

```text
$create-deck

請分析目前 Repository，製作 10 頁繁體中文架構審查簡報。
使用可編輯 PPTX 與 cloud-architecture 模板。
內容包含資料流、信任邊界、部署、維運、風險與下一步。
```

更新既有 Git Marketplace：

```bash
codex plugin marketplace upgrade rufus-slides
```

若 Codex 顯示 Marketplace 不是 Git 類型，請先移除，再使用上面的完整 GitHub URL 重新加入。

## 安裝到 Claude Code

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

接著執行：

```text
/claude-code-slides:create-deck

請將 docs/architecture.md 製作成 12 分鐘架構審查簡報。
使用可編輯 PPTX 與 executive-brief 模板。
```

更新後請開啟新 Session，或執行 `/reload-plugins`。

## 輸出格式

| 格式 | 適用情境 | 產出 |
| --- | --- | --- |
| HTML | 現場分享、高視覺品質、離線播放與瀏覽器分享 | `index.html`、`theme.css`、`slides.js` |
| Marp | Markdown Review、Git Diff、快速產生 HTML/PDF | `deck.md`、`theme.css` |
| PPTX | 可編輯 Microsoft PowerPoint 與企業交付 | `deck.mjs`、產生的 `.pptx` |

PPTX 以可編輯文字與圖形為主，不會把整頁投影片壓平成圖片。

## CLI

```bash
codex-slides templates
codex-slides init "AI 平台" --format html --template terminal-editorial
codex-slides init "雲端架構審查" --format pptx --template cloud-architecture
codex-slides check slides/雲端架構審查
codex-slides doctor
```

`claude-slides` 提供相同介面。

## 專案架構

```text
plugin.json                 Agent Plugins 可攜式 Manifest
skills/                     Portable Agent Skills
templates/catalog.json      專業模板目錄
.codex-plugin/              Codex Adapter
.agents/plugins/            Codex Marketplace
.agents/skills/             Codex Repository Skill Discovery
.claude-plugin/             Claude Code Manifest 與 Marketplace
agents/                     Claude Code Subagents
bin/ + lib/                 零依賴 Scaffold 與驗證 CLI
templates/                  HTML、Marp、PptxGenJS 基礎模板
```

## 開發與驗證

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run sync:skills
npm run check
```

測試會將每一種模板分別產生為 HTML、Marp 與 PPTX，並驗證 Portable / Native Manifest、Skill Resources 與範例簡報。

## 獨立專案聲明

這是獨立的開源社群專案，與 Anthropic、OpenAI 均無官方關聯或背書。名稱描述的是內建的開發工具風格簡報方向，不包含官方 Logo 或專有產品介面。

## 授權

MIT
