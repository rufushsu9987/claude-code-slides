/claude-code-slides:create-deck

請把目前這個 Repository（claude-code-slides）製作成一份介紹開源專案的繁體中文簡報，並把可產生旁白的講稿放在同一個輸出資料夾，供後續剪輯成約 90 秒的影片。

【交付格式】
- 必須產生可編輯的寬螢幕 PPTX，不要只給圖片。
- 另外產生一份 speaker notes 或 NARRATION.md；每一頁的旁白需是自然、精簡的繁體中文，總長度以約 75–100 秒為目標。
- 輸出資料夾固定為：`promo-deck/`（相對於 repository root）
- 可以在該資料夾內產生 deck.mjs、package.json、README.md、.pptx、NARRATION.md 及必要的本機素材。

【內容與受眾】
- 受眾：熟悉 Git、AI coding agent 或開發工具的開發者。
- 目標：讓觀眾理解這個專案解決什麼問題、如何以一套 Portable Core 同時支援 Codex 與 Claude Code、如何由主題/文件/URL/Repository 產生 HTML、Marp、PPTX，並知道如何安裝與開始使用。
- 只可使用 Repository 內已驗證的資訊：README.md、README.zh-TW.md、plugin.json、package.json、skills/*、references/*、bin/、lib/、examples/。若是推論請在講稿或備註標示「推論」；不要捏造使用者數、效能數據、客戶、官方關係或不存在的功能。
- 明確保留：這是獨立社群專案，與 Anthropic、OpenAI 均無官方關聯或背書。

【建議敘事，請用 claim-style 標題改寫】
1. 封面：Claude Code Slides — 把 Repository 變成可交付的故事型簡報
2. 現實/痛點：同一個內容需要在不同 Host 與不同輸出格式重複整理
3. 核心主張：Portable Core 把一套簡報工作流帶到多個 Agent Host
4. 架構：plugin.json、skills/*/SKILL.md、references/scripts，加上 Codex 與 Claude Code adapters
5. 工作流：topic / document / URL / repository → story → HTML / Marp / editable PPTX
6. Host 與格式：$create-deck、/claude-code-slides:create-deck，以及 review / speaker-notes / style 等能力
7. 可靠性：sync:skills、check:skills、validate、smoke、example check、tests 的驗證鏈
8. 開始使用：安裝方式、最小指令、格式選擇；用專案內真實指令
9. 結尾：MIT、社群專案、下一步是把自己的 Repository 交給 create-deck

【視覺系統】
- 採 Repository 自己的 warm terminal-editorial 方向：#F7F3EC 暖米白、#211F1B 炭黑、#D97757 陶土橘，少量 #5E8065 成功狀態；不要使用 Anthropic/Claude 官方 Logo 或複製官方 UI。
- Editorial serif 作為 claim headline，sans 作為內文，mono 作為命令與路徑。
- 每頁一個主要視覺焦點；多用可編輯的流程圖、架構區塊、命令列與驗證清單，不要做重複的三卡片牆。
- 16:9、投影可讀、繁中字型優先使用 macOS 可用的 PingFang TC / Noto Sans CJK TC / system fallback。
- 圖表、連線、節點都要保持可編輯；不要將整頁 flatten 成單一圖片。

【實作要求】
- 請先讀取並核對來源，再規劃頁面，最後產生檔案。
- 為每頁加入簡短 speaker notes，並在 NARRATION.md 以「頁碼｜畫面重點｜旁白」整理。
- 產生後執行 `node scripts/slides-cli.mjs check promo-deck`；若有 Critical 或 Major 問題請修正後再檢查。
- 在最後回報實際產出的檔名、頁數、驗證命令與結果；不要只回報計畫。
