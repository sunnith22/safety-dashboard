<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TIEIndia — Fire Extinguisher Monitor (FE-1 to FE-395)</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app-wrap">
    <div class="bg-grid" aria-hidden="true"></div>

    <!-- Clean Top Header -->
    <header class="top-bar glass-card">
      <div class="brand-area">
        <div class="logo-mark">FE</div>
        <div>
          <h1>TIEIndia — Fire Extinguisher Monitor <span class="count-tag">FE-1 to FE-395</span></h1>
          <p class="sub">Blinking <strong>RED</strong> = NOT OK &nbsp;•&nbsp; Steady <strong>GREEN</strong> = OK &nbsp;•&nbsp; Click any <strong>FE-ID</strong> to see failed check areas</p>
        </div>
      </div>

      <!-- Clickable Status Pills -->
      <div class="status-pills" id="statusPills"></div>

      <div class="top-actions">
        <input type="search" id="searchInput" class="hud-input" placeholder="Search FE-ID (e.g. FE-142) or location..." />
        <button type="button" id="spSetupBtn" class="hud-btn hud-btn-blue">SharePoint Link</button>
        <button type="button" id="syncNowBtn" class="hud-btn hidden">Sync Now</button>
        <label class="hud-btn hud-btn-green">
          Upload CSV
          <input type="file" id="csvInput" accept=".csv" hidden />
        </label>
        <button type="button" id="resetBtn" class="hud-btn">Reset</button>
      </div>
    </header>

    <!-- Range, Data Source Badge & View Toolbar -->
    <section class="toolbar glass-card">
      <div class="range-tabs" id="rangeTabs" aria-label="Extinguisher ID range filter"></div>

      <div class="toolbar-right">
        <span id="dataSourceBadge" class="source-badge">DEMO DATA</span>
        <div class="view-tabs" role="tablist" aria-label="Dashboard views">
          <button type="button" class="view-tab active" data-view="grid">Extinguisher Grid</button>
          <button type="button" class="view-tab" data-view="map">3D Floor View</button>
          <button type="button" class="view-tab" data-view="table">Audit Table</button>
          <button type="button" class="view-tab" data-view="hpt">HPT Schedule</button>
        </div>
      </div>
    </section>

    <!-- VIEW 1: Main Fire Extinguisher Grid (FE-1 to FE-395) -->
    <main class="main-panel glass-card">
      <section id="gridView">
        <div class="panel-head">
          <h2>Fire Extinguishers <span id="gridShowingText" class="muted"></span></h2>
          <label class="hud-toggle">
            <input type="checkbox" id="latestOnlyToggle" checked />
            <span>Latest Audit Only</span>
          </label>
        </div>
        <div id="feGrid" class="fe-grid"></div>
      </section>

      <!-- VIEW 2: 3D Isometric Zone View -->
      <section id="mapView" class="hidden">
        <div class="panel-head">
          <h2>3D Isometric Floor View <span class="muted">(Showing active range / alerts)</span></h2>
          <span class="muted" id="mapNote"></span>
        </div>
        <div id="isoStage" class="iso-stage"></div>
      </section>

      <!-- VIEW 3: Audit Details Table -->
      <section id="tableView" class="hidden">
        <div class="panel-head">
          <h2>Audit Details — Checkpoints</h2>
          <span class="muted" id="tableCountNote"></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>FE_Id</th>
                <th>Location</th>
                <th>Type / Cap</th>
                <th>YOM</th>
                <th>Check Point</th>
                <th>Hpt Done</th>
                <th>Hpt Due</th>
                <th>Inspection Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody id="auditTableBody"></tbody>
          </table>
        </div>
      </section>

      <!-- VIEW 4: HPT Schedule -->
      <section id="hptView" class="hidden">
        <div class="panel-head">
          <h2>HPT &amp; Cylinder Age Schedule</h2>
          <span class="muted">Overdue &amp; upcoming hydro-tests</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>HPT Status</th>
                <th>FE_Id</th>
                <th>Location</th>
                <th>Type / Cap</th>
                <th>YOM (Age)</th>
                <th>Hpt Done</th>
                <th>Hpt Due</th>
                <th>Days Remaining</th>
              </tr>
            </thead>
            <tbody id="hptTableBody"></tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Slide-Over Detail Inspector (Click any FE-ID) -->
    <div id="detailModalBackdrop" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
      <div class="detail-drawer glass-card">
        <div class="drawer-top">
          <button type="button" id="closeDetailBtn" class="hud-btn">← Back to Extinguishers</button>
          <div id="detailOverallBadge"></div>
        </div>
        <div id="detailAssetHeader" class="drawer-asset"></div>
        <div class="drawer-checks-head">
          <h3>Checkpoint Breakdown — Which Area Is NOT OK vs OK</h3>
          <div id="detailCheckCounts" class="check-counts"></div>
        </div>
        <div id="detailCheckpointGrid" class="drawer-check-grid"></div>
      </div>
    </div>

    <!-- SharePoint Connection Settings Modal -->
    <div id="spModalBackdrop" class="center-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="spModalTitle">
      <div class="sp-modal glass-card">
        <div class="drawer-top">
          <h2 id="spModalTitle">Link Live SharePoint Lists</h2>
          <button type="button" id="closeSpModalBtn" class="hud-btn">Close</button>
        </div>
        <p class="sub">Joins your <strong>Fire Extinguishers</strong> master list and <strong>FE Monthly Checking</strong> audit list by <code>FE_Id</code>.</p>

        <form id="spForm" class="sp-form">
          <div class="form-row">
            <label for="spMode">Connection Mode</label>
            <select id="spMode" class="hud-input full-w">
              <option value="demo">Demo Data (Built-in FE-1 to FE-395)</option>
              <option value="sharepoint-rest">Inside SharePoint (Direct REST API — Recommended)</option>
              <option value="graph-msal">Outside SharePoint (Microsoft Graph + Azure AD)</option>
            </select>
          </div>

          <div class="form-row">
            <label for="spSiteUrl">SharePoint Site URL</label>
            <input type="url" id="spSiteUrl" class="hud-input full-w" placeholder="https://yourcompany.sharepoint.com/sites/Safety" />
          </div>

          <div class="form-two">
            <div class="form-row">
              <label for="spMasterList">Master List Name</label>
              <input type="text" id="spMasterList" class="hud-input full-w" placeholder="Fire Extinguishers" />
            </div>
            <div class="form-row">
              <label for="spAuditList">Monthly Audit List Name</label>
              <input type="text" id="spAuditList" class="hud-input full-w" placeholder="FE Monthly Checking" />
            </div>
          </div>

          <div id="graphFields" class="form-two hidden">
            <div class="form-row">
              <label for="spClientId">Azure App Client ID</label>
              <input type="text" id="spClientId" class="hud-input full-w" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
            <div class="form-row">
              <label for="spTenantId">Azure Tenant ID</label>
              <input type="text" id="spTenantId" class="hud-input full-w" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
          </div>

          <div class="form-row">
            <label for="spRefreshSec">Auto-Refresh Interval (seconds, 0 = off)</label>
            <input type="number" id="spRefreshSec" class="hud-input full-w" min="0" max="3600" value="60" />
          </div>

          <div id="spStatusMsg" class="sp-msg"></div>

          <div class="sp-actions">
            <button type="submit" class="hud-btn hud-btn-green">Save &amp; Sync Live</button>
            <button type="button" id="spUseDemoBtn" class="hud-btn">Switch to Demo Data</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script src="sharepoint-config.js"></script>
  <script src="app.js"></script>
</body>
</html>
