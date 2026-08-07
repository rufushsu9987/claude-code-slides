# Claude Code Slides

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

這是一個面向實務交付的 Claude Code 簡報 Plugin，可把主題、需求文件、URL 或 Repository 內容轉成**故事線清楚、視覺一致、可直接播放或交付的簡報**。

它包含敘事規劃、視覺指導、HTML／Marp／PowerPoint 模板、Speaker Notes 與可重複執行的品質檢查。內建風格採暖米白、炭黑、陶土橘與終端機細節，但不複製 Anthropic 品牌，也不宣稱官方關聯。

![Claude Code Slides 範例簡報](./docs/images/hero.svg)

**把簡報當成程式碼來完成：**先規劃論點，再產生可編輯成果、執行驗證，最後在 Claude Code 中持續修正。

## 安裝

從 Terminal 執行：

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

或在 Claude Code 中執行：

```text
/plugin marketplace add rufushsu9987/claude-code-slides
/plugin install claude-code-slides@rufus-slides
/reload-plugins
```

本機開發：

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
claude --plugin-dir ./claude-code-slides
```

## 主要能力

| 介面 | 用途 |
| --- | --- |
| `/claude-code-slides:create-deck` | 從主題或來源資料建立 HTML、Marp 或可編輯 PowerPoint 簡報 |
| `/claude-code-slides:review-deck` | 檢查或修正故事線、密度、資訊層級、無障礙、資產與匯出品質 |
| `/claude-code-slides:speaker-notes` | 產生逐頁時間、自然講稿、轉場、Demo 提示、限制與可能問答 |
| `claude-code-style` | 由 Claude 自動載入的背景視覺系統 |
| `deck-architect` | 規劃受眾旅程、核心論點、證據與頁面順序的 Subagent |
| `visual-director` | 規劃版面、圖表、架構圖與視覺一致性的 Subagent |
| `deck-reviewer` | 交付前的獨立審查 Subagent |
| `claude-slides` | 建立模板與執行確定性檢查的零依賴 CLI |

## 建立簡報

```text
/claude-code-slides:create-deck 根據 docs/architecture.md，為雲端工程師製作 12 分鐘繁體中文架構審查簡報 --format html
```

執行流程：

1. 讀取來源資料，區分可驗證事實與假設。
2. 確定受眾承諾、核心論點、希望促成的決策與頁數預算。
3. 視需要由專門 Subagents 分別規劃敘事與視覺。
4. 產生指定格式及本機資產。
5. 加入 Speaker Notes、轉場與 Demo 提示。
6. 執行確定性檢查及獨立簡報審查。
7. 修正高可信度問題後再交付。

## 支援格式

| 格式 | 適用情境 | 產出 |
| --- | --- | --- |
| **HTML** | 現場分享、高視覺品質、離線播放、網頁分享、列印 PDF | `index.html`、`theme.css`、`slides.js`、`README.md` |
| **Marp** | Markdown Review、Git Diff、文件型簡報、快速輸出 PDF | `deck.md`、`theme.css`、`README.md` |
| **PPTX** | 可編輯 Office 交付、企業協作、PowerPoint 相容 | `deck.mjs`、`package.json`、`README.md`、產生的 `.pptx` |

未指定格式時，預設採 HTML。

## CLI

Plugin 啟用後，Claude Code 的 Bash Tool 可直接使用 `claude-slides`：

```bash
claude-slides init "企業 AI 平台" --format html
claude-slides init "季度營運回顧" --format marp
claude-slides init "主管提案" --format pptx
claude-slides check slides/企業-ai-平台 --json
claude-slides doctor
```

在 Repository 本機也可執行：

```bash
node bin/claude-slides.mjs init "企業 AI 平台" --format html
node bin/claude-slides.mjs check examples/ai-platform
```

## HTML 播放快捷鍵

| 按鍵 | 功能 |
| --- | --- |
| `→`、`↓`、`Space`、`PageDown` | 下一頁 |
| `←`、`↑`、`PageUp` | 上一頁 |
| `Home` / `End` | 第一頁 / 最後一頁 |
| `N` | 顯示或隱藏 Speaker Notes |
| `F` | 全螢幕 |
| `P` | 列印或輸出 PDF |
| 滑動／點擊 | 觸控或滑鼠導覽 |

HTML 以 1920 × 1080 畫布等比例縮放，使用 URL Hash 保留目前頁面，支援 Reduced Motion，列印時一頁一張投影片。

## 審查與修正

```text
/claude-code-slides:review-deck slides/enterprise-ai-platform --fix
```

檢查項目包含：

- 遺漏投影片、資產、必要檔案或未替換模板 Token
- 重複 HTML ID、缺少有效 Alt Text
- 缺少標題、Speaker Notes、列印規則、Reduced Motion、鍵盤操作或 URL 狀態
- Marp Frontmatter、Theme 或資產路徑錯誤
- PptxGenJS 缺少寬螢幕版型、輸出、投影片建立或 Package Dependency

## 範例

完整範例位於 [`examples/ai-platform`](./examples/ai-platform/)：

```bash
python3 -m http.server 8000 --directory examples/ai-platform
# 開啟 http://localhost:8000

node bin/claude-slides.mjs check examples/ai-platform
```

## 視覺方向

- 暖米白底色與炭黑文字
- 陶土橘只用於重點
- Editorial Serif 標題、易讀 Sans 內文、精準 Mono 標籤
- 終端機元素只用於呈現工作流程、程式碼或證據
- 直接標示、有效幾何與充足留白
- 不使用 Anthropic Logo、複製官方介面或暗示官方關聯

使用者提供的企業 Brand System 永遠優先。

## 開發與驗證

```bash
npm test
npm run check
claude plugin validate .
claude --plugin-dir .
```

## 授權

MIT
