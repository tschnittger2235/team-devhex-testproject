## 0 Purpose (what Phase-1 must do)

- **Visualize** spending and allow **CRUD** on transactions.
    
- **Persist** data between sessions.
    
- **Inputs:** CSV import **or** manual entry (amount + category; date auto from local clock).
    
- **Outputs:**
    
    - **Distribution view:** Pie chart of spend by category for the **selected month**.
        
    - **Trend view:** Line graph of daily total spend across the selected month.
        
- **Traceability:** Every charted value must be drill-downable to the exact source row (CSV vs manual).
    

---

## 1 Scope & Non-Goals

- **In scope:** Expenses only (no income, refunds, or transfers). Positive amounts only.
    
- **Out of scope (Phase-1):** Authentication, bank connections, multi-currency, budgets, recurring rules, AI categorization, mobile layout (desktop-only for now).
    


---

## 2 Data Model

```
type Transaction = {
  id: string;             // stable UUID
  source: 'csv'|'manual';
  createdAt: string;      // ISO timestamp of import/entry (for audit)
  date: string;           // ISO timestamp derived from "HH:MM MM/DD/YYYY" in local TZ
  amount: number;         // positive expense, in smallest unit precision = 0.01
  category: CategoryKey;  // one of predefined keys or 'uncategorized'
  description?: string;   // optional merchant/memo
  raw?: Record<string, any>; // raw CSV row for traceability
};
```
### 2.2 Categories (predefined, single-label)

`bills, household, investments, leisure, food, transportation, savings, healthcare, subscriptions, groceries, misc, uncategorized`

---

## 3 CSV Import

### 3.1 Accepted schema (Phase-1 strict)

- **Required columns (case-insensitive):**
    
    - `time` (format: `HH:MM`)
        
    - `date` (format: `MM/DD/YYYY`)
        
    - `amount` (positive number; treated as expense)
        
    - `category` (must match predefined list; else → `uncategorized`)
        
- **Optional columns:** `description`
    

> If the CSV has extra columns, ignore them; retain the full raw row in `raw`.

### 3.2 Parsing rules

- **Date/Time:** Combine `time` + `date`, parse in **local timezone**, store as ISO.
    
- **Amount:** Must parse to `> 0`. Non-numeric → **skip** (Phase-1 policy).
    
- **Malformed rows:** **Skipped silently** (as you specified) but reported in the **import summary** (counts only) so users aren’t gaslit.
    

### 3.3 Deduplication on merge

- On import, **merge** with existing data using a dedup hash:
    
    `dedupKey = normalize(description) + '|' + category + '|' + amount.toFixed(2) + '|' + roundToMinute(date)`
    
    If a matching key exists, **skip** the incoming row.
    

### 3.4 Import summary (UI)

- Total rows, parsed rows, skipped rows (with reason counts), duplicates skipped.
    

---

## 4 Manual Entry

- **Fields shown:** `amount`, `category`, optional `description`.
    
- **Date:** Auto-set from **local clock** at submit; not editable in Phase-1.
    
- **Validation:** `amount > 0`, `category` required.
    
- **CRUD:** Edit/Delete from the transaction table; edits update charts live.
    

---

## 5 Persistence

- **IndexedDB**: all `Transaction` records.
    
- **localStorage**: UI prefs (selected month, selected chart view, theme, last import summary).
    
- **Export/Reset:**
    
    - Export **JSON** of canonical transactions.
        
    - “Delete all data” action clears DB + prefs with confirm dialog.
        

---

## 6 Reporting & Visualization

### 6.1 Period

- **Monthly only** (calendar month). UI uses a month picker (`YYYY-MM`).
    

### 6.2 Views

- **Pie (distribution):** Spend by category for the month.
    
    - Display **value + percentage** on legend/tooltip.
        
    - Categories under **3%** are aggregated as **“Other”** (clickable to drill down).
        
- **Line (trend):** Daily total spend.
    
    - X: days of month, Y: total spend/day.
        
    - Clicking a point filters the table to that day.
        

### 6.3 Drill-down behavior

- Clicking a **pie slice** → filters table to that category.
    
- Clicking a **line point** → filters table to that date.
    
- **Breadcrumbs** show active filters; clear to reset.
    

### 6.4 Transparency

- A **transactions table** is always available below charts, reflecting current filters, with pagination and a total sum that matches the chart.
    

---

## 7 Web Component API (`<money-tracker>`)

### 7.1 Attributes

- `view="pie|line"` (default `pie`)
    
- `period="YYYY-MM"` (required to render)
    
- `theme="light|dark"` (optional; reflects colors)
    

### 7.2 Properties (JS)

- `.transactions: Transaction[]` (get/set; setting re-renders)
    
- `.categories: string[]` (get; fixed for Phase-1)
    
- `.filters: { category?: string; date?: string }` (get/set)
    
- `.importCsv(file: File): Promise<ImportSummary>`
    
- `.createTransaction(input: { amount: number; category: string; description?: string }): Transaction`
    
- `.updateTransaction(id: string, patch: Partial<Transaction>): Transaction`
    
- `.deleteTransaction(id: string): void`
    
- `.export(): Promise<Blob>` // JSON
    
- `.reset(): Promise<void>`
    

### 7.3 Events

- `moneytracker:imported` `{ summary }`
    
- `moneytracker:error` `{ code, message }`
    
- `moneytracker:changed` `{ reason: 'create'|'update'|'delete'|'filter' }`
    

### 7.4 Styling/Theming

- **CSS Parts:** `toolbar`, `chart`, `table`, `badge`, `summary`, `empty`
    
- **Slots:**
    
    - `uploader` (custom upload button)
        
    - `toolbar` (custom controls/actions)
        

---

## 8 UX & Accessibility

### 8.1 Desktop-only layout

- Left: controls (month picker, view toggle, uploader).
    
- Right: chart.
    
- Below: transaction table with running total.
    

### 8.2 States

- **Empty:** “Please enter data” + upload CTA + manual entry form.
    
- **Feedback:** Inline success/error messages; non-blocking import summary banner.
    
- **Masking for demos:** toggle to mask `amount` and `description`.
    

### 8.3 A11y (Phase-1 baseline)

- Keyboard-operable controls and table.
    
- Chart has a “Show as table” toggle to an accessible data table.
    

---

## 9 Libraries & Packaging

- **Parsing:** PapaParse (bundled locally).
    
- **Charts:** ECharts (bundled offline), or equivalent; single vendor-pinned version.
    
- **Build:** Component is **standalone** (no build tools required to use); distributed as ES module + IIFE bundle.
    

---

## 10 Performance Budgets (defaults, since you left them open)

- Target CSV: up to **50k rows / ~20–30 MB**.
    
- Parse + initial render: **≤ 800 ms** on a mid-range laptop.
    
- Show a **progress indicator** for files > 5 MB or > 10k rows.
    
- Memory: keep only the current month in working arrays; lazy-aggregate for charts.
    

---

## 11 Testing

- **Unit tests:**
    
    - parsing (date/amount), dedup, category mapping, reducers (per-day/per-category totals).
        
- **Integration tests:**
    
    - import → render → click slice → table filtered & sums match.
        
    - CRUD updates reflect immediately in charts.
        
- **E2E tests:**
    
    - CSV import (happy path + malformed rows), manual entry, export/reset.
        
- **Golden datasets:** bundle 3 samples: small (10 rows), medium (1k), large (25k) with known totals.
    

---

## 12 Acceptance Criteria (Phase-1 “done means done”)

1. Importing a valid CSV produces a chart and a table for the selected month; **table total equals chart total (±$0.01)**.
    
2. Manual entries immediately affect both chart and table for the current month.
    
3. Click a **pie slice** or **line point** filters the table accordingly; clearing filters restores totals.
    
4. Merge import skips duplicates via the specified hash without altering existing records.
    
5. Export/Reset work as described; after Reset, the component returns to the **empty state**.
    
6. Skipped row counts are shown in the import summary; no blocking errors for partial bad data.
    
7. All data persists across reloads.
    
8. Desktop layout is usable at 1280×800; keyboard navigation works for controls and table.