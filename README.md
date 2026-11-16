# 通勤好行 Commute Hub

以繁體中文呈現的員工交通車報名、掃碼搭乘、補登審核與扣薪結算試用系統。原生 JavaScript 前端、Cloudflare Worker API、D1／SQLite 儲存。

## 功能

- 月度報名每人每月限一條路線；林楊線限選林口／南崁其中一類，共用 8 人名額。提供路線／站點／車輛管理、按月生效的單趟票價與封頂。
- 所有車輛共用固定上車 QR Code。有報名者依當月報名計費；未報名者每次選路線，不自動新增報名。
- 台灣時間 12:00 前上班、12:00 起下班；每人每天各方向一次。掃碼與有效補登一起檢查重複。
- 已有當月報名者不能再報其他路線，前端與伺服器共同檢查；既有多線歷史資料保留，掃碼時須從已報名項目選擇本趟路線。
- 補登申請、審核人與歷程、逐筆搭乘紀錄、每月各路線／類別分別封頂。
- 員工姓名／工號搜尋、個別或全部同仁扣薪 Excel 匯出，匯出不強制鎖定。
- 公司行事曆 Excel 匯入、辨識預覽與管理員確認，也可手動設定。
- 依班表推估的站點亮燈圖（非 GPS）；公告可限制管理端可見。

## 本機執行

需要 Node.js 22.13 以上（使用內建 node:sqlite），建議 Node.js 24 LTS。

```sh
npm ci
npm test
node tests/flows.cjs
npm run build
node scripts/preview.mjs
```

開啟 http://localhost:4173 。可用 `PORT=4174 node scripts/preview.mjs` 更換埠號。本機資料存在被 Git 忽略的 `qa/preview.sqlite`；雲端使用 D1，重新部署不會重設既有資料。

## 試用身分與資料

這是公開試用版，入口只填姓名／工號，不是正式身分驗證。不要填入真實員工或薪資資料；正式部署需接公司登入，於伺服器驗證同仁身分及管理角色。前端選擇角色不構成權限隔離。

儲存庫只包含範例路線與測試資料；未包含正式網站資料庫、上車 token、員工紀錄或操作手冊截圖。管理端「路線與班表 → 共用上車碼」會為該部署產生並持續沿用共用碼。原車輛專用碼不再適用。QR 圖片在本機辨識，不上傳相機畫面。

## 架構與部署

- `public/`：頁面與共用計費規則。
- `server/`：API、掃碼流程、扣薪 Excel。
- `db/`、`drizzle/`：資料表與版本化遷移。
- `tests/`：規則、API、競態與前端流程測試。
- `scripts/build.mjs`：打包成 `dist/server/index.js` Worker。

部署時由自己的 Cloudflare／Sites 專案設定 `DB` D1 binding，套用 `drizzle/*.sql` 遷移。`.openai/hosting.json` 為通用建置設定，未包含既有網站 project ID；使用 Sites 時請綁定自己的專案。正式資料由指定操作 API 寫入，採 revision 條件更新避免舊版本覆蓋。

## 持續更新

此 GitHub 儲存庫是公開程式碼來源。每次修改可使用正常 Git 流程更新同一個網址：

```sh
git add .
git commit -m "Describe the change"
git push origin main
```

GitHub Actions 每次 push／PR 會跑測試與建置。推送 GitHub 不會自動部署既有試用網站；網站發布另行執行，以保留既有網址及雲端資料。

## 授權

本專案採 MIT License，第三方套件保留各自授權，見 `THIRD_PARTY_NOTICES.md`。
