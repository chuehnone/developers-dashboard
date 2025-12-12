# 實作計畫：將 Mock 資料改為真實 GitHub & Jira API 整合

## 使用者需求總結

- **GitHub**: 追蹤特定組織的所有 repositories（使用 Personal Access Token）
- **Jira**: 追蹤特定 Jira 專案的 sprints 和 tickets（使用 API Token）
- **認證方式**: 使用環境變數（.env.local）
- **目標**: 完全取代 `/services/mockData.ts` 中的三個函數，維持現有的 TypeScript 介面

## 技術架構決策

### API 選擇
- **GitHub**: 使用 **GraphQL API**（優於 REST）
  - 單次請求可獲取所有需要的資料（repos, PRs, commits, reviews）
  - 更高的 rate limit (5000 points/hour)
  - 更適合聚合組織範圍的資料

- **Jira**: 使用 **REST API**
  - Agile API endpoints (`/rest/agile/1.0/`) 用於 sprint 資料
  - Search API (`/rest/api/3/search`) 用於 JQL 查詢

### 服務層架構

```
services/
├── api/
│   ├── github/
│   │   ├── client.ts          # GraphQL 客戶端
│   │   ├── queries.ts         # GraphQL 查詢定義
│   │   ├── types.ts           # GitHub API 回應型別
│   │   └── transforms.ts      # API 回應 → App 型別轉換
│   ├── jira/
│   │   ├── client.ts          # Jira REST 客戶端
│   │   ├── endpoints.ts       # JQL 查詢建構器
│   │   ├── types.ts           # Jira API 回應型別
│   │   └── transforms.ts      # API 回應 → App 型別轉換
│   └── cache.ts               # localStorage 快取層
├── dashboardService.ts        # 主要協調器（取代 mockData.ts）
├── config.ts                  # 環境變數驗證
└── mockData.ts                # 保留作為備援
```

## 環境變數設定

需要在 `.env.local` 中設定：

```bash
# GitHub 設定
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VITE_GITHUB_ORG=your-organization-name
VITE_GITHUB_API_URL=https://api.github.com/graphql

# Jira 設定
VITE_JIRA_DOMAIN=your-company.atlassian.net
VITE_JIRA_EMAIL=your-email@company.com
VITE_JIRA_API_TOKEN=ATATTxxxxxxxxxxxxxxxxxx
VITE_JIRA_PROJECT_KEY=DEV
VITE_JIRA_BOARD_ID=123

# 選用功能開關
VITE_CACHE_TTL_MINUTES=15
VITE_FALLBACK_TO_MOCK=false
```

## 實作步驟

### 階段 1: 基礎設定與配置
**目標**: 建立環境變數系統和驗證機制

**任務**:
1. 建立 `/services/config.ts` - 環境變數載入與驗證
2. 建立 `/.env.local.example` - 範本檔案供使用者參考
3. 在 `App.tsx` 中加入配置驗證（啟動時檢查）
4. 顯示友善的錯誤訊息如果配置無效

**關鍵檔案**:
- `/services/config.ts` (新增)
- `/.env.local.example` (新增)
- `/App.tsx` (修改: 加入驗證邏輯)

---

### 階段 2: GitHub 服務層實作
**目標**: 建立 GitHub API 整合並轉換資料

**任務**:
1. 建立 `/services/api/github/client.ts` - GraphQL 客戶端
2. 建立 `/services/api/github/queries.ts` - 定義 GraphQL 查詢:
   - 組織的 Pull Requests（用於 cycle time 計算）
   - 開發者貢獻統計（每位開發者的 PRs、reviews）
   - 最近活動趨勢（7天的貢獻圖表）
3. 建立 `/services/api/github/types.ts` - GitHub API 回應型別
4. 建立 `/services/api/github/transforms.ts` - 資料轉換函數:
   - `mapGitHubUserToStats()` - PR 資料 → `GithubStats`
   - `calculateCycleTime()` - 計算 coding/pickup/review 時間
   - `aggregateOrgPullRequests()` - 聚合多個 repos 的資料

**資料對應**:
- **prsOpened/prsMerged**: 從 PR 狀態統計
- **avgCycleTimeHours**: first_commit 到 merged_at 的時間差（小時）
- **reviewCommentsGiven**: 從 pullRequestReviewContributions 統計
- **Cycle Time 分解**:
  - codingTime: first_commit 到 PR created
  - pickupTime: PR created 到 first_review
  - reviewTime: first_review 到 merged

**關鍵檔案**:
- `/services/api/github/client.ts` (新增)
- `/services/api/github/queries.ts` (新增)
- `/services/api/github/transforms.ts` (新增)

---

### 階段 3: Jira 服務層實作
**目標**: 建立 Jira API 整合並轉換資料

**任務**:
1. 建立 `/services/api/jira/client.ts` - Jira REST 客戶端（Basic Auth）
2. 建立 `/services/api/jira/endpoints.ts` - JQL 查詢建構:
   - Sprint 歷史查詢
   - 開發者票券查詢（按 assignee 過濾）
   - 活動票券查詢（當前 sprint）
3. 建立 `/services/api/jira/types.ts` - Jira API 回應型別
4. 建立 `/services/api/jira/transforms.ts` - 資料轉換函數:
   - `mapJiraIssuesToStats()` - Issues → `JiraStats`
   - `calculateSprintMetrics()` - Sprint 資料 → `SprintMetric[]`
   - `buildInvestmentProfile()` - 票券類型分布統計

**資料對應**:
- **velocity**: 狀態為 "Done" 的票券 story points 總和
- **activeTickets**: 狀態在 "To Do", "In Progress", "Review" 的票券數
- **bugsFixed**: issuetype = "Bug" 且狀態 = "Done" 的數量
- **featuresCompleted**: issuetype = "Story" 且狀態 = "Done" 的數量
- **techDebtTickets**: issuetype = "Technical Debt" 或 labels 包含 "tech-debt"

**注意事項**:
- Story points 欄位通常是 `customfield_10016`（可能因 Jira 實例而異）
- 需處理自訂欄位 ID 的差異（透過 `/rest/api/3/field` 查詢）

**關鍵檔案**:
- `/services/api/jira/client.ts` (新增)
- `/services/api/jira/endpoints.ts` (新增)
- `/services/api/jira/transforms.ts` (新增)

---

### 階段 4: 整合與資料聚合
**目標**: 建立主要服務協調器，合併 GitHub + Jira 資料

**任務**:
1. 建立 `/services/dashboardService.ts` - 取代 mockData.ts:
   - `fetchDashboardData(range)` - 合併 GitHub 和 Jira 資料
   - `fetchGithubAnalytics()` - 呼叫 GitHub API 並轉換
   - `fetchJiraAnalytics()` - 呼叫 Jira API 並轉換
2. 實作開發者身份對應邏輯:
   - 建立靜態映射檔案（如 `/services/developerMap.json`）
   - 或使用電子郵件推斷邏輯（GitHub username → Jira email）
3. 實作計算邏輯:
   - `calculateImpactScore()` - 基於 velocity, PRs, reviews 計算
   - `determineStatus()` - 根據活動票券推斷開發者狀態
   - `aggregateTimeRange()` - 根據 sprint/month/quarter 過濾資料

**Impact Score 公式**:
```typescript
velocityScore = velocity * 1.5 * multiplier
prScore = prsMerged * 5 * multiplier
reviewScore = reviewCommentsGiven * 0.5 * multiplier
bugFixScore = bugsFixed * 3 * multiplier
impactScore = min(100, round(sum of above))
```

**關鍵檔案**:
- `/services/dashboardService.ts` (新增，取代 mockData.ts)
- `/App.tsx` (修改: 更新 import 從 mockData 改為 dashboardService)

---

### 階段 5: 快取與效能優化
**目標**: 實作快取層以減少 API 呼叫

**任務**:
1. 建立 `/services/api/cache.ts` - localStorage 快取服務:
   - `get(key)` - 取得快取資料（檢查 TTL）
   - `set(key, data)` - 儲存快取資料
   - `clear()` - 清除所有快取
2. 在 dashboardService 中包裝 API 呼叫:
   ```typescript
   const cached = cache.get(key);
   if (cached) return cached;
   const fresh = await fetchFromAPI();
   cache.set(key, fresh);
   return fresh;
   ```
3. 在 UI 中加入「重新整理」按鈕（清除快取）
4. 實作 stale-while-revalidate 模式（顯示快取資料，背景更新）

**快取策略**:
- TTL: 15 分鐘（可透過 VITE_CACHE_TTL_MINUTES 設定）
- 快取鍵: `dashboard_metrics_{range}`, `dashboard_github`, `dashboard_jira`
- 錯誤時回退到快取資料（如果可用）

**關鍵檔案**:
- `/services/api/cache.ts` (新增)
- `/services/dashboardService.ts` (修改: 加入快取層)
- `/App.tsx` (修改: 加入重新整理按鈕)

---

### 階段 6: 錯誤處理與回退機制
**目標**: 優雅處理 API 失敗情況

**任務**:
1. 實作重試邏輯（exponential backoff）:
   - 最多重試 3 次
   - 延遲: 1s, 2s, 4s
2. 錯誤分類處理:
   - **認證錯誤**: 立即顯示錯誤訊息給使用者
   - **網路錯誤**: 重試，失敗後回退到快取或 mock
   - **Rate Limit**: 顯示警告，使用快取資料
3. 實作部分資料處理:
   - GitHub 成功但 Jira 失敗 → 顯示 GitHub 資料 + 警告
   - 使用預設值填充缺失資料（避免 UI 崩潰）
4. 在 UI 中顯示錯誤狀態:
   - Toast 通知（暫時性錯誤）
   - 警告標語（部分資料可用）
   - 錯誤頁面（嚴重失敗）

**回退機制**:
```typescript
try {
  return await fetchRealData();
} catch (error) {
  const cached = cache.get(key);
  if (cached) return { ...cached, _warning: 'Using cached data' };
  if (config.fallbackToMock) return fetchMockData();
  throw error;
}
```

**關鍵檔案**:
- `/services/dashboardService.ts` (修改: 加入錯誤處理)
- `/App.tsx` (修改: 加入錯誤 UI 狀態)

---

### 階段 7: 測試與驗證
**目標**: 確保資料正確性與處理邊緣情況

**測試檢查清單**:
- [ ] 環境變數正確設定（顯示友善錯誤訊息）
- [ ] GitHub token 有正確的權限（`repo:read`, `org:read`）
- [ ] Jira credentials 可正常登入
- [ ] 資料結構與 mock 相同（UI 不會損壞）
- [ ] Time range 過濾正確運作（sprint/month/quarter）
- [ ] Cycle time 計算準確（與 GitHub UI 比對）
- [ ] Velocity 計算準確（與 Jira 報表比對）
- [ ] 快取正確運作（頁面重新整理後保留）
- [ ] Rate limit 不會在初始載入時超過
- [ ] 錯誤狀態正確顯示
- [ ] Loading 狀態在 API 呼叫期間顯示
- [ ] 部分資料失敗時應用不會崩潰

**手動測試腳本**:
```typescript
// scripts/testApis.ts
import { GitHubClient } from './services/api/github/client';
import { JiraClient } from './services/api/jira/client';

async function testConnections() {
  // Test GitHub
  const github = new GitHubClient();
  try {
    const rateLimit = await github.getRateLimit();
    console.log('✓ GitHub Connected:', rateLimit);
  } catch (e) {
    console.error('✗ GitHub Failed:', e.message);
  }

  // Test Jira
  const jira = new JiraClient();
  try {
    const project = await jira.get('/api/3/project/DEV');
    console.log('✓ Jira Connected:', project.name);
  } catch (e) {
    console.error('✗ Jira Failed:', e.message);
  }
}
```

**關鍵檔案**:
- 所有服務檔案（驗證輸出）
- `/types.ts` (確保相容性)

---

### 階段 8: 文件更新
**目標**: 讓使用者能夠設定和部署

**任務**:
1. 建立 `/.env.local.example` - 環境變數範本
2. 更新 `/CLAUDE.md` - 記錄新架構
3. 加入 API token 設定指引:
   - GitHub PAT 建立步驟（權限: repo, org, user）
   - Jira API Token 建立步驟
   - 如何找到 Jira Board ID
4. 加入故障排除指南（常見錯誤與解決方案）

**關鍵檔案**:
- `/.env.local.example` (新增)
- `/CLAUDE.md` (修改)
- `/README.md` (可選修改)

---

## 關鍵資料對應細節

### GitHub → DeveloperMetric
- 從組織中所有 repos 的 PRs 聚合資料
- 使用 GitHub username 對應到開發者 ID
- Cycle time 從 PR timeline events 計算（READY_FOR_REVIEW, first review, merged）
- 活動趨勢從 contributions calendar API 取得

### Jira → DeveloperMetric
- 使用 JQL 查詢按 assignee 過濾: `assignee={email} AND project={key} AND updated>={date}`
- Story points 從自訂欄位取得（通常是 customfield_10016）
- Sprint 資料從 Agile API (`/rest/agile/1.0/board/{boardId}/sprint`) 取得
- 投資組合從票券類型分布計算

### Developer Identity Mapping
**建議使用靜態配置檔案** (適合小型團隊):
```json
// services/developerMap.json
{
  "alice-gh": {
    "name": "Alice Chen",
    "githubLogin": "alice-gh",
    "jiraEmail": "alice.chen@company.com",
    "jiraAccountId": "557058:a1b2c3d4",
    "role": "Fullstack"
  }
}
```

## 效能考量

- **懶載入**: 只在使用者導航到該頁面時才取得資料（GitHub 頁面 → GitHub API）
- **並行請求**: 使用 `Promise.all([github, jira])` 並行呼叫
- **分頁處理**: GitHub 每個 repo 取得前 100 個 PRs，Jira 每次查詢最多 200 個 issues
- **Rate Limit 監控**: 檢查回應標頭 `X-RateLimit-Remaining`，接近限制時顯示警告

## 安全性考量

- API tokens 只存在 `.env.local`（不提交到 git）
- `.env.local` 已在 `.gitignore` 中
- 使用環境變數前綴 `VITE_` 讓 Vite 暴露給前端
- 生產環境應考慮使用後端 proxy 隱藏 tokens（未來改進）

## 實作優先順序

1. **高優先**: 階段 1-4（基礎設定、GitHub、Jira、整合）
2. **中優先**: 階段 5-6（快取、錯誤處理）
3. **低優先**: 階段 7-8（測試、文件）

建議按順序實作，每個階段完成後測試再進行下一階段。

## 成功標準

- ✅ 可以在 Overview 頁面看到真實的開發者指標
- ✅ GitHub 頁面顯示真實的 PR 和 cycle time 資料
- ✅ Jira 頁面顯示真實的 sprint 和票券資料
- ✅ Time range 選擇器正確過濾資料
- ✅ 錯誤時顯示友善訊息（不會白屏）
- ✅ 快取正常運作（減少 API 呼叫）
- ✅ 資料準確性與來源系統一致
