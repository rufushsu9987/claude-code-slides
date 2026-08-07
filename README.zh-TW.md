# Claude Code Slides — Codex + Claude Code

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

這是一個同時支援 **Codex 與 Claude Code** 的簡報 Plugin，可把主題、需求文件、URL 或 Repository 內容轉成故事線清楚、視覺一致、可直接播放或交付的 HTML、Marp 與可編輯 PowerPoint 簡報。

內建視覺方向採暖米白、炭黑文字、節制的陶土橘、Editorial 標題與功能性的 Terminal 細節。這是獨立社群專案，與 Anthropic、OpenAI 均無官方關聯或背書。

![Claude Code 風格簡報範例](./docs/images/hero.svg)

## 一套工作流程，支援兩個 Agent 平台

核心工作流程只維護在根目錄 `skills/` 一份，Codex 與 Claude Code 分別透過原生 Plugin 機制載入。

| 能力 | Codex | Claude Code |
| --- | --- | --- |
| 建立簡報 | `$create-deck` | `/claude-code-slides:create-deck` |
| 審查與修正 | `$review-deck` | `/claude-code-slides:review-deck` |
| 產生講稿 | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| 套用視覺風格 | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| 故事線規劃 | `$deck-architect` | Skill 或 `deck-architect` Subagent |
| 視覺指導 | `$visual-director` | Skill 或 `visual-director` Subagent |
| 獨立審查 | `$deck-reviewer` | Skill 或 `deck-reviewer` Subagent |

另外包含零依賴 Node.js CLI，用於建立模板與執行可重複的確定性檢查。

## 安裝到 Codex

加入或更新 Repository Marketplace，接著安裝 Plugin：

```bash
codex plugin marketplace add rufushsu9987/claude-code-slides --ref main
codex plugin marketplace upgrade rufus-slides
codex plugin add claude-code-slides@rufus-slides
```

也可以啟動 Codex、開啟 `/plugins`，選擇 **Rufus Slides**，再安裝 **Claude Code Slides**。安裝後請開啟新的 Codex Session。

```text
$create-deck 根據 docs/architecture.md，為雲端工程師製作 12 分鐘繁體中文架構審查簡報，使用 HTML。
```

### Codex Marketplace 顯示 no matches

先更新並檢查本機 Marketplace Snapshot：

```bash
codex plugin marketplace upgrade rufus-slides
codex plugin list --marketplace rufus-slides --available --json
codex plugin add claude-code-slides@rufus-slides
```

若仍讀到舊 Snapshot：

```bash
codex plugin marketplace remove rufus-slides
codex plugin marketplace add rufushsu9987/claude-code-slides --ref main
codex plugin add claude-code-slides@rufus-slides
```

## 安裝到 Claude Code

加入 Marketplace 並安裝 Plugin：

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

也可以直接在 Claude Code 內執行：

```text
/plugin marketplace add rufushsu9987/claude-code-slides
/plugin install claude-code-slides@rufus-slides
/reload-plugins
```

呼叫 Namespaced Skill：

```text
/claude-code-slides:create-deck 根據 docs/architecture.md，為雲端工程師製作 12 分鐘繁體中文架構審查簡報，使用 HTML。
```

Claude Code 也會在 `/agents` 自動發現三個 Subagents，並可將故事線規劃、視覺指導與交付前審查交給它們。

更新既有安裝：

```bash
claude plugin marketplace update rufus-slides
claude plugin update claude-code-slides@rufus-slides
```

## 直接從 Repository 開發或測試

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run check
```

Codex Repository 模式：

```bash
codex
# 使用 /skills 查看
```

Claude Code 本機 Plugin 模式：

```bash
claude plugin validate .
claude --plugin-dir .
```

Codex 會讀取 `.agents/skills/`；Claude Code 會載入 `.claude-plugin/`、根目錄 `skills/`、`agents/` 與 `bin/`。

## 支援格式

| 格式 | 適用情境 | 產出 |
| --- | --- | --- |
| **HTML** | 現場分享、高視覺品質、離線播放、網頁分享、列印 PDF | `index.html`、`theme.css`、`slides.js`、`README.md` |
| **Marp** | Markdown Review、Git Diff、文件型簡報、快速輸出 PDF | `deck.md`、`theme.css`、`README.md` |
| **PPTX** | 可編輯 Office 交付、企業協作、PowerPoint 相容 | `deck.mjs`、`package.json`、`README.md`、產生的 `.pptx` |

未指定格式時，預設採 HTML。

## 使用範例

Codex：

```text
$create-deck 把此 Repository 製作成 10 頁企業架構審查簡報，聽眾是雲端工程師，使用繁體中文與 HTML。

$review-deck 檢查 slides/enterprise-ai-platform，修正 Critical 與 Major 問題，保留現有品牌規範。

$speaker-notes 加入 15 分鐘繁體中文講稿、Demo 提示與可能問答。
```

Claude Code：

```text
/claude-code-slides:create-deck 把此 Repository 製作成 10 頁企業架構審查簡報，使用繁體中文與 HTML。

/claude-code-slides:review-deck 檢查 slides/enterprise-ai-platform，修正 Critical 與 Major 問題。

/claude-code-slides:speaker-notes 加入 15 分鐘繁體中文講稿、Demo 提示與可能問答。
```

## CLI

Skills 會透過 Plugin Root 的絕對路徑呼叫 CLI，因此不需要全域安裝。

```bash
node bin/codex-slides.mjs init "企業 AI 平台" --format html
node bin/codex-slides.mjs init "季度營運回顧" --format marp
node bin/codex-slides.mjs init "主管提案" --format pptx
node bin/codex-slides.mjs check examples/ai-platform
node bin/codex-slides.mjs doctor
```

執行 `npm link` 後，兩個別名都可使用：

```bash
codex-slides init "企業 AI 平台" --format html
claude-slides check examples/ai-platform --json
```

`doctor` 會檢查 Node.js、Codex CLI、Claude Code CLI 與 `npx`。

## HTML 播放快捷鍵

| 按鍵 | 功能 |
| --- | --- |
| `→`、`↓`、`Space`、`PageDown` | 下一頁 |
| `←`、`↑`、`PageUp` | 上一頁 |
| `Home` / `End` | 第一頁／最後一頁 |
| `N` | 顯示或隱藏 Speaker Notes |
| `F` | 全螢幕 |
| `P` | 列印或輸出 PDF |
| 滑動／點擊 | 觸控或滑鼠導覽 |

HTML 以 1920 × 1080 畫布等比例縮放，使用 URL Hash 保留目前頁面，支援 Reduced Motion，列印時一頁一張投影片。

## 驗證

```bash
npm run check
node bin/codex-slides.mjs check examples/ai-platform
claude plugin validate .
```

檢查項目包含：

- Codex、Claude Code、Package 與 Marketplace 版本同步
- 共用 Skill Metadata、Codex Forwarder 與 Claude Code Subagent
- 遺漏投影片、資產、必要檔案或未替換模板 Token
- 重複 HTML ID、Alt Text、鍵盤操作、URL Hash、列印規則與 Reduced Motion
- Marp Frontmatter、Theme 與資產路徑
- PptxGenJS 寬螢幕版型、輸出、Dependency 與可編輯性

## 專案結構

```text
.codex-plugin/        Codex Plugin Manifest
.agents/plugins/      Codex Repository Marketplace
.agents/skills/       Codex Repository-scoped Skill Forwarder
.claude-plugin/       Claude Code Plugin Manifest 與 Marketplace
skills/               雙平台共用工作流程
agents/               Claude Code Subagents
references/           故事線、風格、格式與審查規範
bin/ + lib/           codex-slides 與 claude-slides CLI
templates/            HTML、Marp、PptxGenJS 模板
examples/             可執行範例
scripts/ + test/      驗證與 Regression Tests
```

## 視覺方向

- 暖米白底色與炭黑文字
- 陶土橘只用於重點
- Editorial Serif 標題、易讀 Sans 內文、精準 Mono 標籤
- Terminal 元素只用於呈現工作流程、程式碼或證據
- 直接標示、有效幾何與充足留白
- 不使用 Anthropic 或 OpenAI Logo、複製官方介面或暗示官方關聯

使用者提供的企業 Brand System 永遠優先。

## 授權

MIT
