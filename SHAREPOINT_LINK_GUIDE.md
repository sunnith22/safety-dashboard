# How to Link Your Live SharePoint Lists

This dashboard is ready to read directly from your two SharePoint lists (**`Fire Extinguishers`** and **`FE Monthly Checking`**) and join them by **`FE_Id`**.

---

## Option A: Run Inside SharePoint *(Easiest — No Azure App Registration Needed)*

If you host the dashboard on the same SharePoint site where your lists live, your Microsoft 365 login handles authentication automatically.

1. Open `sharepoint-config.js` (or click **SharePoint Link** inside the dashboard UI) and set:
   ```js
   mode: "sharepoint-rest",
   siteUrl: "https://yourcompany.sharepoint.com/sites/YourSiteName",
   masterListName: "Fire Extinguishers",
   auditListName: "FE Monthly Checking",
   refreshSeconds: 60
   ```
2. Rename a copy of `index.html` to `dashboard.aspx` (keep `styles.css`, `sharepoint-config.js`, `app.js` alongside it).
3. Upload `dashboard.aspx`, `styles.css`, `sharepoint-config.js`, and `app.js` into **Site Assets** (or a Document Library) on your SharePoint site.
4. Open `dashboard.aspx` in your browser — it will automatically fetch live SharePoint items and refresh every 60 seconds.

*(Note: If your IT policy blocks `.aspx` files in Site Assets, wrap these files inside a SharePoint Framework (SPFx) web part or use Option B below.)*

---

## Option B: Run Outside SharePoint *(Local Server / Internal Web App)*

If you open the dashboard from `http://localhost` or an internal server (not `file://`), use **Microsoft Graph + Azure AD**:

1. Ask your Microsoft 365 / Entra ID admin to create an **App Registration** (Single-page application redirect URI: your dashboard URL, e.g. `http://localhost:8080/index.html`) with delegated permission **`Sites.Read.All`**.
2. Click **SharePoint Link** in the top bar (or edit `sharepoint-config.js`):
   - **Connection Mode:** `Outside SharePoint (Microsoft Graph + Azure AD)`
   - **SharePoint Site URL:** `https://yourcompany.sharepoint.com/sites/YourSiteName`
   - **Master List Name:** `Fire Extinguishers`
   - **Monthly Audit List Name:** `FE Monthly Checking`
   - **Azure App Client ID** & **Azure Tenant ID**
3. Click **Save & Sync Live** and sign in with your Microsoft 365 account.

---

## Supported SharePoint Column Names
The connector automatically matches your Power Apps / SharePoint columns (including SharePoint `_x0020_` internal spaces and Choice/Lookup objects):
* `FE_Id` / `FE-ID NO.` / `Title`
* `Location`
* `Type of Fire Extinguisher` / `FE-TYPE`
* `Capacity`
* `Year of Manufacturing` / `Year of MFG`
* `Cylinder body`
* `check_point`
* `status` (`OK` / `NOT OK`)
* `Hpt done`, `Hpt due`
* `Inspection Date` / `Last Audit Date` / `Created`
* `Remarks`
