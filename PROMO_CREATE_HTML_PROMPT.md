$claude-code-slides:create-deck

請把目前 Repository（claude-code-slides）製作成一份繁體中文 HTML 簡報，作為後續 narrated video 的唯一視覺來源。這次不要產生 PPTX，請使用 HTML 格式。

【輸出】
- 固定輸出資料夾：`promo-html/`（相對於 repository root）
- 必須產生：index.html、theme.css、slides.js、README.md、NARRATION.md。
- HTML 必須是本機可直接開啟或用簡單 local server 播放的固定 16:9 deck。
- 必須支援鍵盤方向鍵、PageUp/PageDown、Home/End、Space、點擊與基本觸控／滑動導覽；URL hash 要能表示目前頁面；提供可離線開啟的 speaker notes；包含 print CSS 與 prefers-reduced-motion。
- 不使用必要的 CDN、外部圖片或遠端字型；exact Chinese text、code、commands、labels 都以 HTML 原生文字呈現。

【內容】
- 受眾：熟悉 Git、AI coding agent 或開發工具的開發者。
- 目標：介紹 claude-code-slides 是什麼、Portable Core 如何同時支援 Codex 與 Claude Code、如何把主題／文件／URL／Repository 轉成 HTML／Marp／PPTX，以及如何安裝、驗證與開始使用。
- 只使用 Repository 內已核對的 README.md、README.zh-TW.md、plugin.json、package.json、skills/、references/、bin/、lib/、examples/。不要捏造用戶數、效能、客戶、官方關係或不存在的功能。
- 必須保留：這是獨立社群專案，與 Anthropic、OpenAI 均無官方關聯或背書；MIT License。

【9 頁敘事】
1. 封面：Claude Code Slides — 把 Repository 變成可交付的故事型簡報
2. 現實：同一個內容要跨兩個 Host 與三種輸出格式整理
3. 主張：Portable Core 把同一套簡報工作流帶到多個 Agent Host
4. 架構：plugin.json、skills/*/SKILL.md、references/scripts 與 Codex／Claude Code adapters
5. 工作流：topic／document／URL／repository → story → HTML／Marp／editable PPTX
6. 能力：create-deck、review-deck、speaker-notes、style、deck-architect、visual-director、deck-reviewer
7. 可靠性：sync:skills、check:skills、validate、smoke、example check、tests；可展示本機 npm run check 的實際驗證結果
8. 開始使用：Claude Code marketplace、Codex Git marketplace、最小呼叫指令與格式選擇
9. 結尾：MIT、獨立社群專案，把自己的 Repository 交給 create-deck

【視覺】
- 使用 Repository 自己的 warm terminal-editorial system：暖米白 #F7F3EC、炭黑 #211F1B、陶土橘 #D97757、少量成功綠 #5E8065。
- Editorial claim headline、sans 內文、mono commands/path；每頁一個主視覺焦點。
- 用流程圖、架構節點、Host×format 矩陣、terminal shell、verification checklist，不要重複三卡片牆。
- 不使用 Anthropic／Claude 官方 logo、官方 UI 截圖或暗示官方關聯。

【旁白】
- 產生 NARRATION.md，以「頁碼｜畫面重點｜旁白」整理 75–100 秒的繁體中文講稿，每頁一段。
- 旁白只陳述已核對的內容；若使用「重複整理成本」或「共享 Skill 降低維護」等推論，明確說是推論。

【驗證】
- 執行：`node skills/create-deck/scripts/slides-cli.mjs check promo-html`
- 如果使用不同的 working directory，請先切換到 repository root，再執行上述指令。
- 檢查 HTML 導覽、hash、notes、print CSS、本機資源、16:9 viewport 與 accessibility。
- 修正 Critical/Major 後再檢查，最後回報實際檔名與結果。
