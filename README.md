# Fire Extinguisher Safety Dashboard (`FE-1` to `FE-395`)

Visual safety & inspection monitor for tracking fire extinguisher compliance (`OK` vs `NOT OK`), HPT due dates, and checkpoint details.

## Key Features
* **Instant Exception Visibility:** Extinguishers with any `NOT OK` checkpoint blink in **red** and pin to the top of the grid; compliant units stay steady **green**.
* **Click-Through Detail View:** Click any `FE-ID` (`FE-1`–`FE-395`) to inspect individual check areas, remarks, YOM, and HPT due dates.
* **Multiple Views & Filters:** Extinguisher Grid, 3D Isometric Floor View, Audit Table, HPT Schedule, range filters (`1–100`, `101–200`, `201–300`, `301–395`), and instant search.
* **SharePoint & CSV Support:** Connects directly to SharePoint Lists (`Fire Extinguishers` + `FE Monthly Checking`) via `sharepoint-config.js` (`dashboard.aspx` in Site Assets or Microsoft Graph) and supports local CSV upload (`sample-data.csv`).

## Files
* `index.html` / `dashboard.aspx` — Main dashboard entry page (`dashboard.aspx` is ready for SharePoint Site Assets)
* `styles.css` — Dark HUD theme and blinking alert animations
* `app.js` — Dashboard state, 395-unit grid, 3D floor view, CSV parser, and SharePoint connectors
* `sharepoint-config.js` — SharePoint site URL, list names, and refresh settings
* `sample-data.csv` — Sample CSV matching the audit schema
* `SHAREPOINT_LINK_GUIDE.md` — Setup instructions for linking live SharePoint lists
* `POWERBI_DAX_GUIDE.md` — Optional DAX measures & blinking SVG visual for Power BI
