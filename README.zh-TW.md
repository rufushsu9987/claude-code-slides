# Claude Code Slides for Codex

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

這是一個 **Codex 簡報 Plugin**，可以把主題、需求文件、URL 或 Repository 內容轉成故事線清楚、視覺一致、可直接播放或交付的簡報。

名稱代表內建的視覺方向：暖米白、炭黑文字、節制的陶土橘、Editorial 標題與功能性的 Terminal 細節。這是獨立社群專案，與 Anthropic、OpenAI 均無官方關聯或背書。

![Claude Code 風格簡報範例](./docs/images/hero.svg)

## 主要能力

| Skill | 用途 |
| --- | --- |
| `$create-deck` | 建立完整 HTML、Marp 或可編輯 PowerPoint 簡報 |
| `$review-deck` | 檢查或修正故事線、密度、資訊層級、無障礙、資產與匯出品質 |
| `$speaker-notes` | 加入時間分配、自然講稿、轉場、Demo 提示、限制與可能問答 |
| `$claude-code-style` | 套用暖色 Terminal Editorial 視覺系統 |
| `$deck-architect` | 規劃受眾旅程、核心論點、證據與頁面順序 |
| `$visual-director` | 規劃版面、架構圖、資料視覺化與視覺一致性 |
| `$deck-reviewer` | 執行交付前的獨立審查 |

另外包含零依賴 Node.js CLI，用於建立模板與執行可重複的確定性檢查。

## 安裝到 Codex

先加入 Repository Marketplace：

```bash
codex plugin marketplace add rufushsu9987/claude-code-slides --ref main
```

啟動 Codex，開啟 Plugin Browser，安裝 **Claude Code Slides**：

```text
/plugins
```

安裝後開啟新的 Codex Session，再直接呼叫 Skill：

```text
$create-deck 根據 docs/architecture.md，為雲端工程師製作 12 分鐘繁體中文架構審查簡報，使用 HTML。
```

也可以只描述需求，讓 Codex 根據 Skill 的 `description` 自動選擇適合的工作流程。

## 直接從 Repository 開發或測試

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run check
codex
```

Repository 已提供 `.agents/skills/` Forwarder。只要從此 Repository 內啟動 Codex，七個 Skills 就會自動被掃描；可用 `/skills` 查看。

## 支援格式

| 格式 | 適用情境 | 產出 |
| --- | --- | --- |
| **HTML** | 現場分享、高視覺品質、離線播放、網頁分享、列印 PDF | `index.html`、`theme.css`、`slides.js`、`README.md` |
| **Marp** | Markdown Review、Git Diff、文件型簡報、快速輸出 PDF | `deck.md`、`theme.css`、`README.md` |
| **PPTX** | 可編輯 Office 交付、企業協作、PowerPoint 相容 | `deck.mjs`、`package.json`、`README.md`、產生的 `.pptx` |

未指定格式時，預設採 HTML。

## 使用範例

```text
$create-deck 把此 Repository 製作成 10 頁企業架構審查簡報，聽眾是雲端工程師，使用繁體中文與 HTML。

$review-deck 檢查 slides/enterprise-ai-platform，修正 Critical 與 Major 問題，保留現有品牌規範。

$speaker-notes 加入 15 分鐘繁體中文講稿、Demo 提示與可能問答。

$visual-director 為這份資安架構簡報規劃 Claude Code 風格視覺，但不要複製官方產品介面。
```

## CLI

Skills 會透過 Plugin Root 的絕對路徑呼叫 CLI，因此不需要全域安裝。手動使用：

```bash
node bin/codex-slides.mjs init "企業 AI 平台" --format html
node bin/codex-slides.mjs init "季度營運回顧" --format marp
node bin/codex-slides.mjs init "主管提案" --format pptx
node bin/codex-slides.mjs check examples/ai-platform
node bin/codex-slides.mjs doctor
```

執行 `npm link` 後可縮短為：

```bash
codex-slides init "企業 AI 平台" --format html
codex-slides check examples/ai-platform --json
```

舊的 `claude-slides` 指令仍保留為相容別名。

## HTML 播放快捷鍵

| 按鍵 | 功能 |
| --- | --- |
| `→`、`↓`、`Space`、`PageDown` | 下一頁 |
| `←`、`↑`、`PageUp` | 上一頁／最後一頁 |
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
```

檢查項目包含：

- 遺漏投影片、資產、必要檔案或未替換模板 Token
- 重複 HTML ID、缺少有效 Alt Text
- 缺少標題、Speaker Notes、列印規則、Reduced Motion、鍵盤操作或 URL 狀態
- Marp Frontmatter、Theme 或資產路徑錯誤
- PptxGenJS 缺少寬螢幕版型、輸出、投影片建立或 Package Dependency
- Codex Plugin、Marketplace、Skill Metadata 或殘留 Claude 專屬 Runtime Token

## 專案結構

```text
.codex-plugin/        Codex Plugin Manifest
.agents/plugins/      Repository Marketplace
.agents/skills/       Repository-scoped Skill Forwarder
skills/               Codex 工作流程與視覺指引
references/           故事線、風格、格式與審查規範
bin/ + lib/           codex-slides CLI
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
- 不使用 Anthropic Logo、複製官方介面或暗示官方關聯

使用者提供的企業 Brand System 永遠優先。

## 授權

MIT
