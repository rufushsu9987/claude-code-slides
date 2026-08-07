# Claude Code Slides — Agent Plugins + Codex + Claude Code

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![Agent Plugins 1.0](https://img.shields.io/badge/Agent%20Plugins-1.0.0-211f1b.svg)](https://agent-plugins.org/specification)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

這是一個可攜式簡報 Plugin，可把主題、需求文件、URL 或 Repository 內容轉成故事線清楚、視覺一致、可直接播放或交付的 **HTML、Marp 與可編輯 PowerPoint 簡報**。

Portable Core 採用 Agent Plugins 1.0.0 套件結構與 Agent Skills 慣例；Codex 與 Claude Code Adapter 則保留各平台原生的安裝、搜尋與呼叫體驗。

> 這是獨立社群專案，與 Anthropic、OpenAI 均無官方關聯或背書。

![Claude Code 風格簡報範例](./docs/images/hero.svg)

## Portable Core

根目錄 Manifest 使用：

```text
https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
```

可攜式元件位於固定位置：

```text
plugin.json
skills/*/SKILL.md
```

本專案目前沒有提供 MCP Server，因此刻意不建立 `mcp.json`。

每個 Skill 僅引用自身 `references/` 與 `scripts/` 下的資源。根目錄 `references/` 保留為主要編輯來源，透過以下指令同步：

```bash
npm run sync:skills
npm run check:skills
```

Agent Plugins 1.0.0 目前仍是 Working Draft，因此 Codex 與 Claude Code 的 Native Adapter 會繼續保留。

## 一套工作流程，支援多個 Host

| 能力 | Portable Skill | Codex | Claude Code |
| --- | --- | --- | --- |
| 建立簡報 | `create-deck` | `$create-deck` | `/claude-code-slides:create-deck` |
| 審查與修正 | `review-deck` | `$review-deck` | `/claude-code-slides:review-deck` |
| 產生講稿 | `speaker-notes` | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| 套用視覺風格 | `claude-code-style` | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| 故事線規劃 | `deck-architect` | `$deck-architect` | Skill 或 `deck-architect` Subagent |
| 視覺指導 | `visual-director` | `$visual-director` | Skill 或 `visual-director` Subagent |
| 獨立審查 | `deck-reviewer` | `$deck-reviewer` | Skill 或 `deck-reviewer` Subagent |

## 安裝到 Codex

請使用完整 Git URL，讓 Codex 建立可更新的 Git Marketplace：

```bash
codex plugin marketplace add https://github.com/rufushsu9987/claude-code-slides.git --ref main
codex plugin marketplace upgrade rufus-slides
codex plugin add claude-code-slides@rufus-slides
```

安裝完成後重新開啟 Codex Session：

```text
$create-deck 請把目前 Repository 製作成 12 分鐘繁體中文架構審查簡報，使用 PPTX。
```

若舊 Snapshot 導致 `/plugins` 顯示 `no matches`：

```bash
codex plugin marketplace remove rufus-slides
rm -rf "$HOME/.codex/.tmp/marketplaces/rufus-slides"
codex plugin marketplace add https://github.com/rufushsu9987/claude-code-slides.git --ref main
codex plugin list --marketplace rufus-slides --available --json
codex plugin add claude-code-slides@rufus-slides
```

## 安裝到 Claude Code

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

或在 Claude Code 裡執行：

```text
/plugin marketplace add rufushsu9987/claude-code-slides
/plugin install claude-code-slides@rufus-slides
/reload-plugins
```

使用範例：

```text
/claude-code-slides:create-deck 請把目前 Repository 製作成 12 分鐘繁體中文架構審查簡報，使用 PPTX。
```

更新既有安裝：

```bash
claude plugin marketplace update rufus-slides
claude plugin update claude-code-slides@rufus-slides
```

## 在其他 Agent Plugins Client 使用

將 Repository Root 當作 Agent Plugin 目錄載入。支援 Skills 的相容 Client 會讀取 `plugin.json`，並掃描每個 `skills/*/SKILL.md` 直接子目錄。

安裝、更新、權限、啟用狀態與介面由各 Client 管理。

## 支援格式

| 格式 | 適用情境 | 產出 |
| --- | --- | --- |
| **HTML** | 現場分享、高視覺品質、離線播放、網頁分享、列印 PDF | `index.html`、`theme.css`、`slides.js`、`README.md` |
| **Marp** | Markdown Review、Git Diff、文件型簡報、快速輸出 PDF | `deck.md`、`theme.css`、`README.md` |
| **PPTX** | 可編輯 Office 交付、企業協作、PowerPoint 相容 | `deck.mjs`、`package.json`、`README.md`、產生的 `.pptx` |

未指定格式時，預設採 HTML。

## 使用範例

```text
$create-deck 把此 Repository 製作成 10 頁企業架構審查簡報，使用繁體中文與 PPTX。

$review-deck 檢查 slides/enterprise-ai-platform，修正 Critical 與 Major 問題並保留品牌規範。

$speaker-notes 加入 15 分鐘繁體中文講稿、Demo 提示與可能問答。
```

Claude Code 對應指令使用 `/claude-code-slides:<skill>` Namespace。

## CLI

Skill 內的 `scripts/slides-cli.mjs` Wrapper 會自行找到 Plugin 內建 CLI，不需要先全域安裝。

```bash
node bin/codex-slides.mjs init "企業 AI 平台" --format html
node bin/codex-slides.mjs init "季度營運回顧" --format marp
node bin/codex-slides.mjs init "主管提案" --format pptx
node bin/codex-slides.mjs check examples/ai-platform
node bin/codex-slides.mjs doctor
```

執行 `npm link` 後：

```bash
codex-slides init "企業 AI 平台" --format pptx
claude-slides check examples/ai-platform --json
```

## 開發與驗證

```bash
npm ci
npm run sync:skills
npm run check
```

驗證範圍包含 Agent Plugins v1 封閉式 Root Manifest、跨平台版本同步、`skills/` 固定掃描結構、Skill-relative Resources、同步狀態、Codex Marketplace、Claude Code Adapter，以及 HTML、Marp、PPTX Regression Test。

額外平台驗證：

```bash
claude plugin validate .
claude --plugin-dir .
codex
```

## 專案結構

```text
plugin.json                         Agent Plugins 1.0 Portable Manifest
skills/                             Portable Agent Skills
references/                         共用 Reference 主要編輯來源
scripts/sync-skill-resources.mjs    Skill Resource 同步工具

.codex-plugin/                      Codex Native Adapter
.agents/plugins/                    Codex Marketplace
.agents/skills/                     Codex Repository Forwarder

.claude-plugin/                     Claude Code Native Adapter 與 Marketplace
agents/                             Claude Code Subagents

bin/ + lib/                         零依賴簡報 CLI
templates/                          HTML、Marp、PptxGenJS Template
examples/                           可執行範例
```

## 視覺方向

- 暖米白底色與炭黑文字
- 陶土橘只用於重點
- Editorial Serif 標題、易讀 Sans 內文、精準 Mono 標籤
- Terminal 元素只用於呈現工作流程、程式碼或證據
- 直接標示、有效幾何與充足留白
- 不使用 Anthropic Logo、複製官方介面或暗示官方關聯

使用者提供的企業 Brand System 永遠優先。

## 授權

MIT
