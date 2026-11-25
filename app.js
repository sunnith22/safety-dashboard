// Optional location overrides: once you share your 395 locations,
// they can be plugged in here or uploaded via CSV.
const LOCATION_OVERRIDES = {
  "FE-1": { location: "Engine - Production Office", zone: "Production", type: "CO2", capacity: "2kg", yom: 2014, cylinderBody: "184071" },
  "FE-2": { location: "Engine Office - EM-2 Meeting Room", zone: "Engine Office", type: "CO2", capacity: "2kg", yom: 2015, cylinderBody: "184006" },
  "FE-3": { location: "Reception Meeting Room Toilet No-10", zone: "Reception", type: "CO2", capacity: "2kg", yom: 2015, cylinderBody: "184093" },
  "FE-4": { location: "Reception Entrance", zone: "Reception", type: "ABC", capacity: "4kg", yom: 2019, cylinderBody: "184081" },
  "FE-5": { location: "Engine Office Corridor - Near Pantry", zone: "Engine Office", type: "CO2", capacity: "2kg", yom: 2015, cylinderBody: "183966" },
  "FE-6": { location: "Assembly Bay 1", zone: "Production", type: "ABC", capacity: "6kg", yom: 2021, cylinderBody: "210442" },
  "FE-7": { location: "Main Electrical Panel Room", zone: "Utilities", type: "CO2", capacity: "4.5kg", yom: 2018, cylinderBody: "194510" },
  "FE-8": { location: "Store Room", zone: "Utilities", type: "CO2", capacity: "4.5kg", yom: 2022, cylinderBody: "221804" },
};

const SAMPLE_ISSUES = {
  "FE-1": [
    { checkPoint: "Physical appearance for corrosion", remarks: "Surface rust observed near valve neck" },
    { checkPoint: "Weight of the extinguisher", remarks: "Below minimum tare weight" },
  ],
  "FE-4": [
    { checkPoint: "Availability of visual control board", remarks: "Inspection board / tag missing" },
  ],
  "FE-7": [
    { checkPoint: "Access & mounting height", remarks: "Blocked by spare cable drum" },
    { checkPoint: "Safety pin & tamper seal", remarks: "Tamper seal broken" },
  ],
  "FE-58": [
    { checkPoint: "Pressure gauge indicator", remarks: "Gauge needle in red zone" },
  ],
  "FE-142": [
    { checkPoint: "Discharge horn & hose", remarks: "Hose crack detected" },
  ],
  "FE-264": [
    { checkPoint: "Safety pin & tamper seal", remarks: "Seal missing" },
  ],
  "FE-319": [
    { checkPoint: "Weight of the extinguisher", remarks: "Refill / re-weigh required" },
  ],
};

const STANDARD_CHECKPOINTS = [
  { checkPoint: "Physical appearance for corrosion", okRemark: "Clean cylinder body" },
  { checkPoint: "Weight of the extinguisher", okRemark: "Within tare range" },
  { checkPoint: "Availability of visual control board", okRemark: "Board visible & readable" },
  { checkPoint: "Safety pin & tamper seal", okRemark: "Intact & sealed" },
  { checkPoint: "Discharge horn & hose", okRemark: "No cracks or blockage" },
  { checkPoint: "Access & mounting height", okRemark: "Path completely clear" },
];

function buildDefaultRecords() {
  const specs = [
    { type: "CO2", capacity: "2kg" },
    { type: "ABC", capacity: "4kg" },
    { type: "ABC", capacity: "6kg" },
    { type: "CO2", capacity: "4.5kg" },
  ];
  const records = [];

  for (let n = 1; n <= 395; n++) {
    const feId = `FE-${n}`;
    const ov = LOCATION_OVERRIDES[feId];
    const spec = specs[(n - 1) % specs.length];
    const location = ov?.location || "Location Pending";
    const zone = ov?.zone || "Plant Floor";
    const type = ov?.type || spec.type;
    const capacity = ov?.capacity || spec.capacity;
    const yom = ov?.yom || (2015 + (n % 9));
    const cylinderBody = ov?.cylinderBody || String(184000 + n);
    const hptDone = n % 12 === 0 ? "2023-09-15" : "2024-06-10";
    const hptDue = n % 12 === 0 ? "2026-09-15" : "2027-06-10";
    const inspectionDate = "2026-11-21";

    const issueList = SAMPLE_ISSUES[feId] || [];
    const issueMap = new Map(issueList.map((i) => [i.checkPoint, i.remarks]));

    // Ensure every custom issue checkpoint is included even if not in STANDARD_CHECKPOINTS
    for (const extra of issueList) {
      if (!STANDARD_CHECKPOINTS.some((s) => s.checkPoint === extra.checkPoint)) {
        records.push({
          feId, feNum: n, location, zone, type, capacity, yom, cylinderBody,
          checkPoint: extra.checkPoint, status: "NOT OK",
          hptDone, hptDue, inspectionDate, remarks: extra.remarks,
        });
      }
    }

    for (const cp of STANDARD_CHECKPOINTS) {
      const failRemark = issueMap.get(cp.checkPoint);
      records.push({
        feId, feNum: n, location, zone, type, capacity, yom, cylinderBody,
        checkPoint: cp.checkPoint,
        status: failRemark ? "NOT OK" : "OK",
        hptDone, hptDue, inspectionDate,
        remarks: failRemark || cp.okRemark,
      });
    }
  }

  // Include one historical older entry on FE-1 to demonstrate "Latest Audit Only" toggle
  records.push({
    feId: "FE-1", feNum: 1,
    location: "Engine - Production Office", zone: "Production",
    type: "CO2", capacity: "2kg", yom: 2014, cylinderBody: "184071",
    checkPoint: "Availability of visual control board", status: "NOT OK",
    hptDone: "2024-03-24", hptDue: "2027-03-27", inspectionDate: "2026-10-21",
    remarks: "Fixed during Nov audit",
  });

  return records;
}

const RANGES = [
  { key: "ALL", label: "All (1–395)", min: 1, max: 9999 },
  { key: "1-100", label: "FE 1–100", min: 1, max: 100 },
  { key: "101-200", label: "FE 101–200", min: 101, max: 200 },
  { key: "201-300", label: "FE 201–300", min: 201, max: 300 },
  { key: "301-395", label: "FE 301–395", min: 301, max: 395 },
];

const state = {
  records: buildDefaultRecords(),
  activeView: "grid", // "grid" | "map" | "table" | "hpt"
  selectedFeId: null,
  statusFilter: "ALL", // "ALL" | "NOT_OK" | "OK" | "HPT_DUE"
  rangeKey: "ALL",
  search: "",
  latestOnly: true,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeStatus(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s.includes("NOT OK") || s === "NOT_OK" || s === "FAIL" || s === "FAILED") return "NOT OK";
  return "OK";
}

function parseFeNum(feId) {
  const m = String(feId || "").match(/\d+/);
  return m ? Number(m[0]) : 999999;
}

function inferZone(location) {
  const loc = String(location || "").toLowerCase();
  if (loc.includes("production") || loc.includes("assembly") || loc.includes("bay")) return "Production";
  if (loc.includes("engine office") || loc.includes("corridor") || loc.includes("pantry")) return "Engine Office";
  if (loc.includes("reception") || loc.includes("toilet") || loc.includes("entrance")) return "Reception";
  if (loc.includes("electrical") || loc.includes("panel") || loc.includes("store")) return "Utilities";
  return "Plant Floor";
}

function parseDateValue(str) {
  if (!str) return null;
  const s = String(str).trim();
  // Parse date-only YYYY-MM-DD as local midnight to avoid UTC timezone day-shift
  const isoDateOnly = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateOnly) {
    return new Date(Number(isoDateOnly[1]), Number(isoDateOnly[2]) - 1, Number(isoDateOnly[3]));
  }
  // Support DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateDayKey(str) {
  const d = parseDateValue(str);
  if (!d) return 0;
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function formatDate(str) {
  const d = parseDateValue(str);
  if (!d) return str || "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(dateStr) {
  const target = parseDateValue(dateStr);
  if (!target) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function getScopedRecords() {
  let rows = state.records;
  if (state.latestOnly) {
    // Compare by calendar day (not exact ms) so multiple checkpoints submitted
    // seconds apart during the same inspection stay grouped together.
    const latestDayByFe = new Map();
    for (const r of rows) {
      const dayKey = getDateDayKey(r.inspectionDate);
      if (!latestDayByFe.has(r.feId) || dayKey > latestDayByFe.get(r.feId)) {
        latestDayByFe.set(r.feId, dayKey);
      }
    }
    rows = rows.filter((r) => getDateDayKey(r.inspectionDate) === latestDayByFe.get(r.feId));
  }
  return rows;
}

function groupByExtinguisher(records) {
  const map = new Map();
  for (const r of records) {
    if (!map.has(r.feId)) {
      map.set(r.feId, {
        feId: r.feId,
        feNum: r.feNum ?? parseFeNum(r.feId),
        location: r.location,
        zone: r.zone || inferZone(r.location),
        type: r.type,
        capacity: r.capacity,
        yom: r.yom,
        cylinderBody: r.cylinderBody,
        hptDone: r.hptDone,
        hptDue: r.hptDue,
        lastAudit: r.inspectionDate,
        checks: [],
      });
    }
    const item = map.get(r.feId);
    const curDate = parseDateValue(r.inspectionDate)?.getTime() ?? 0;
    const prevDate = parseDateValue(item.lastAudit)?.getTime() ?? 0;
    if (curDate > prevDate) item.lastAudit = r.inspectionDate;
    item.checks.push(r);
  }

  return Array.from(map.values()).map((fe) => {
    const failCount = fe.checks.filter((c) => normalizeStatus(c.status) === "NOT OK").length;
    const totalChecks = fe.checks.length;
    const passPct = totalChecks ? Math.round(((totalChecks - failCount) / totalChecks) * 100) : 100;
    const hptDays = daysUntil(fe.hptDue);
    return {
      ...fe,
      failCount,
      okCount: totalChecks - failCount,
      passPct,
      isNotOk: failCount > 0,
      hptDays,
    };
  });
}

function getFilteredExtinguishers() {
  const allFes = groupByExtinguisher(getScopedRecords());
  const range = RANGES.find((r) => r.key === state.rangeKey) || RANGES[0];
  const q = state.search.trim().toLowerCase();

  return allFes
    .filter((fe) => {
      if (fe.feNum < range.min || fe.feNum > range.max) return false;
      if (state.statusFilter === "NOT_OK" && !fe.isNotOk) return false;
      if (state.statusFilter === "OK" && fe.isNotOk) return false;
      if (state.statusFilter === "HPT_DUE" && !(fe.hptDays !== null && fe.hptDays <= 60)) return false;
      if (q && !`${fe.feId} ${fe.location} ${fe.type} ${fe.cylinderBody}`.toLowerCase().includes(q)) return false;
      return true;
    })
    // Pin NOT OK blinking units first, then numeric FE-1..FE-395
    .sort((a, b) => Number(b.isNotOk) - Number(a.isNotOk) || a.feNum - b.feNum);
}

function extinguisherSvg(isNotOk, size = 40) {
  const stroke = isNotOk ? "#ef4444" : "#22c55e";
  const fill = isNotOk ? "rgba(239,68,68,0.28)" : "rgba(34,197,94,0.22)";
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M26 14H38M32 14V19M23 11L32 14L42 10" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M40 16C46 16 49 20 49 28V40" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M46 40L52 44H46V40Z" fill="${stroke}"/>
      <rect x="22" y="19" width="20" height="35" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="3.2"/>
      <line x1="26" y1="30" x2="38" y2="30" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
}

function renderStatusPills() {
  const allFes = groupByExtinguisher(getScopedRecords());
  const bad = allFes.filter((f) => f.isNotOk).length;
  const ok = allFes.length - bad;
  const hpt = allFes.filter((f) => f.hptDays !== null && f.hptDays <= 60).length;

  const pills = [
    { key: "ALL", cls: "", label: `All (${allFes.length})`, dot: "" },
    { key: "NOT_OK", cls: "red", label: `NOT OK (${bad})`, dot: "dot-red blink-dot" },
    { key: "OK", cls: "green", label: `OK (${ok})`, dot: "dot-green" },
    { key: "HPT_DUE", cls: "", label: `HPT Due (${hpt})`, dot: "" },
  ];

  document.getElementById("statusPills").innerHTML = pills
    .map((p) => {
      const ring = state.statusFilter === p.key ? "active-ring" : "";
      const dotHtml = p.dot ? `<span class="dot ${p.dot}"></span>` : "";
      return `<button type="button" class="pill-btn ${p.cls} ${ring}" data-status-pill="${p.key}">${dotHtml}${escapeHtml(p.label)}</button>`;
    })
    .join("");

  document.querySelectorAll("[data-status-pill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.statusPill;
      state.statusFilter = state.statusFilter === k ? "ALL" : k;
      render();
    });
  });
}

function renderRangeTabs() {
  const allFes = groupByExtinguisher(getScopedRecords());
  document.getElementById("rangeTabs").innerHTML = RANGES.map((r) => {
    const badInRange = allFes.filter((f) => f.feNum >= r.min && f.feNum <= r.max && f.isNotOk).length;
    const active = state.rangeKey === r.key ? "active" : "";
    const alertCls = badInRange > 0 ? "has-alert" : "";
    const badge = badInRange > 0 ? ` <span class="badge badge-red">${badInRange}</span>` : "";
    return `<button type="button" class="range-btn ${active} ${alertCls}" data-range="${r.key}">${escapeHtml(r.label)}${badge}</button>`;
  }).join("");

  document.querySelectorAll("[data-range]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.rangeKey = btn.dataset.range;
      render();
    });
  });
}

function renderGrid() {
  const list = getFilteredExtinguishers();
  document.getElementById("gridShowingText").textContent = `(${list.length} shown — NOT OK pinned at top)`;

  const container = document.getElementById("feGrid");
  if (list.length === 0) {
    container.innerHTML = `<div class="muted">No extinguishers match the current filter.</div>`;
    return;
  }

  container.innerHTML = list
    .map((fe) => {
      const badge = fe.isNotOk
        ? `<span class="badge badge-red">NOT OK (${fe.failCount})</span>`
        : `<span class="badge badge-green">OK</span>`;
      return `
        <div class="fe-card ${fe.isNotOk ? "not-ok" : ""}" data-fe-open="${escapeHtml(fe.feId)}" role="button" tabindex="0">
          <div class="fe-top">
            <span class="muted">${escapeHtml(fe.type)}</span>
            ${badge}
          </div>
          ${extinguisherSvg(fe.isNotOk, 38)}
          <div class="fe-id">${escapeHtml(fe.feId)}</div>
          <div class="fe-loc" title="${escapeHtml(fe.location)}">${escapeHtml(fe.location)}</div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("[data-fe-open]").forEach((el) => {
    const open = () => openDetail(el.dataset.feOpen);
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

function isoPt(x, y, z = 0) {
  const ox = 460;
  const oy = 90;
  return [Math.round((ox + (x - y) * 0.86) * 10) / 10, Math.round((oy + (x + y) * 0.45 - z) * 10) / 10];
}

function renderIsoMap() {
  const list = getFilteredExtinguishers();
  const sample = list.slice(0, 24);
  document.getElementById("mapNote").textContent = list.length > 24
    ? `Showing top 24 of ${list.length} units (filter by range or NOT OK for focused view)`
    : `Showing ${sample.length} unit(s) on floor`;

  const floorPts = [isoPt(0, 0), isoPt(420, 0), isoPt(420, 340), isoPt(0, 340)];
  let gridLines = "";
  for (let x = 0; x <= 420; x += 70) {
    const a = isoPt(x, 0), b = isoPt(x, 340);
    gridLines += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="rgba(74,222,128,0.12)" stroke-width="1"/>`;
  }
  for (let y = 0; y <= 340; y += 68) {
    const a = isoPt(0, y), b = isoPt(420, y);
    gridLines += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="rgba(74,222,128,0.12)" stroke-width="1"/>`;
  }

  // Place up to 24 units in a clean 6x4 isometric floor grid
  const markers = sample.map((fe, idx) => {
    const col = idx % 6;
    const row = Math.floor(idx / 6);
    const x = 35 + col * 68;
    const y = 42 + row * 82;
    const [sx, sy] = isoPt(x, y, 0);
    const bad = fe.isNotOk;
    const stroke = bad ? "#ef4444" : "#22c55e";
    const fill = bad ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.18)";
    const padPts = [isoPt(x - 18, y - 18), isoPt(x + 18, y - 18), isoPt(x + 18, y + 18), isoPt(x - 18, y + 18)];

    return `
      <g class="iso-node" data-fe-open="${escapeHtml(fe.feId)}" role="button" tabindex="0">
        <polygon points="${padPts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>
        ${bad ? `<polygon class="iso-pulse-ring" points="${padPts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#ff5b5b" stroke-width="2.4"/>` : ""}
        <g transform="translate(${sx}, ${sy})">
          <rect x="-6" y="-26" width="12" height="22" rx="4" fill="${stroke}" stroke="#061210" stroke-width="1.2"/>
          <path d="M-7,-30 L0,-28 L7,-32" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="round"/>
        </g>
        <g transform="translate(${sx - 30}, ${sy - 56})">
          <rect width="60" height="20" rx="6" fill="rgba(10,16,15,0.92)" stroke="${stroke}" stroke-width="1.2"/>
          <text x="30" y="13.5" text-anchor="middle" fill="${bad ? "#fca5a5" : "#86efac"}" font-size="10" font-weight="800">${escapeHtml(fe.feId)}</text>
        </g>
      </g>
    `;
  }).join("");

  document.getElementById("isoStage").innerHTML = `
    <svg class="iso-svg" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
      <polygon points="${floorPts.map((p) => p.join(",")).join(" ")}" fill="rgba(13,24,22,0.85)" stroke="rgba(74,222,128,0.35)" stroke-width="1.8"/>
      ${gridLines}
      ${markers}
    </svg>
  `;

  document.querySelectorAll("#isoStage [data-fe-open]").forEach((node) => {
    node.addEventListener("click", () => openDetail(node.dataset.feOpen));
  });
}

function renderAuditTable() {
  const fes = getFilteredExtinguishers();
  const feIds = new Set(fes.map((f) => f.feId));
  const rows = getScopedRecords()
    .filter((r) => feIds.has(r.feId))
    .sort((a, b) => (normalizeStatus(a.status) === "NOT OK" ? 0 : 1) - (normalizeStatus(b.status) === "NOT OK" ? 0 : 1) || (a.feNum ?? parseFeNum(a.feId)) - (b.feNum ?? parseFeNum(b.feId)));

  const displayRows = rows.slice(0, 400);
  document.getElementById("tableCountNote").textContent = `Showing ${displayRows.length} of ${rows.length} checkpoint rows (NOT OK pinned at top)`;

  document.getElementById("auditTableBody").innerHTML = displayRows.length
    ? displayRows
        .map((r) => {
          const bad = normalizeStatus(r.status) === "NOT OK";
          return `
            <tr class="clickable ${bad ? "row-bad" : ""}" data-fe-open="${escapeHtml(r.feId)}">
              <td><span class="badge ${bad ? "badge-red" : "badge-green"}">${bad ? "NOT OK" : "OK"}</span></td>
              <td><strong>${escapeHtml(r.feId)}</strong></td>
              <td>${escapeHtml(r.location)}</td>
              <td>${escapeHtml(r.type)} ${escapeHtml(r.capacity)}</td>
              <td>${escapeHtml(r.yom || "—")}</td>
              <td>${escapeHtml(r.checkPoint)}</td>
              <td>${escapeHtml(formatDate(r.hptDone))}</td>
              <td>${escapeHtml(formatDate(r.hptDue))}</td>
              <td>${escapeHtml(formatDate(r.inspectionDate))}</td>
              <td>${escapeHtml(r.remarks || "—")}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="10" class="muted">No matching records.</td></tr>`;

  document.querySelectorAll("#auditTableBody [data-fe-open]").forEach((row) => {
    row.addEventListener("click", () => openDetail(row.dataset.feOpen));
  });
}

function renderHptTable() {
  const list = getFilteredExtinguishers().sort((a, b) => (a.hptDays ?? 99999) - (b.hptDays ?? 99999));
  const currentYear = new Date().getFullYear();

  document.getElementById("hptTableBody").innerHTML = list
    .map((fe) => {
      const d = fe.hptDays;
      const age = fe.yom ? currentYear - Number(fe.yom) : null;
      let badge = `<span class="badge badge-green">OK</span>`;
      let rowCls = "";
      if (d !== null && d < 0) {
        badge = `<span class="badge badge-red">OVERDUE</span>`;
        rowCls = "row-bad";
      } else if (d !== null && d <= 60) {
        badge = `<span class="badge badge-amber">DUE SOON</span>`;
      }
      const daysTxt = d === null ? "—" : d < 0 ? `${Math.abs(d)} days overdue` : `${d} days`;
      return `
        <tr class="clickable ${rowCls}" data-fe-open="${escapeHtml(fe.feId)}">
          <td>${badge}</td>
          <td><strong>${escapeHtml(fe.feId)}</strong></td>
          <td>${escapeHtml(fe.location)}</td>
          <td>${escapeHtml(fe.type)} ${escapeHtml(fe.capacity)}</td>
          <td>${escapeHtml(fe.yom || "—")} ${age !== null ? `(${age} yrs)` : ""}</td>
          <td>${escapeHtml(formatDate(fe.hptDone))}</td>
          <td>${escapeHtml(formatDate(fe.hptDue))}</td>
          <td>${escapeHtml(daysTxt)}</td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll("#hptTableBody [data-fe-open]").forEach((row) => {
    row.addEventListener("click", () => openDetail(row.dataset.feOpen));
  });
}

function openDetail(feId) {
  const allFes = groupByExtinguisher(getScopedRecords());
  const fe = allFes.find((f) => f.feId === feId);
  if (!fe) return;
  state.selectedFeId = feId;

  document.getElementById("detailOverallBadge").innerHTML = fe.isNotOk
    ? `<span class="badge badge-red" style="font-size:12px;padding:5px 12px">${escapeHtml(fe.feId)} STATUS: NOT OK (${fe.failCount} Failed)</span>`
    : `<span class="badge badge-green" style="font-size:12px;padding:5px 12px">${escapeHtml(fe.feId)} STATUS: ALL CHECKS OK</span>`;

  document.getElementById("detailAssetHeader").innerHTML = `
    ${extinguisherSvg(fe.isNotOk, 50)}
    <div>
      <h2 id="detailTitle">${escapeHtml(fe.feId)} — ${escapeHtml(fe.location)}</h2>
      <div class="meta-row">
        <span><strong>Type:</strong> ${escapeHtml(fe.type)} (${escapeHtml(fe.capacity)})</span>
        <span><strong>YOM:</strong> ${escapeHtml(fe.yom || "—")}</span>
        <span><strong>Cylinder:</strong> ${escapeHtml(fe.cylinderBody || "—")}</span>
        <span><strong>Hpt Due:</strong> ${escapeHtml(formatDate(fe.hptDue))}</span>
        <span><strong>Last Audit:</strong> ${escapeHtml(formatDate(fe.lastAudit))}</span>
      </div>
    </div>
  `;

  document.getElementById("detailCheckCounts").innerHTML = `
    <span style="color:var(--red-bright)">● ${fe.failCount} NOT OK</span>
    <span style="color:var(--green-bright)">● ${fe.okCount} OK</span>
  `;

  const sorted = [...fe.checks].sort((a, b) => (normalizeStatus(a.status) === "NOT OK" ? 0 : 1) - (normalizeStatus(b.status) === "NOT OK" ? 0 : 1));
  document.getElementById("detailCheckpointGrid").innerHTML = sorted
    .map((c) => {
      const bad = normalizeStatus(c.status) === "NOT OK";
      return `
        <div class="check-card ${bad ? "bad" : "good"}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="badge ${bad ? "badge-red" : "badge-green"}">${bad ? "NOT OK" : "OK"}</span>
            <span class="dot ${bad ? "dot-red blink-dot" : "dot-green"}"></span>
          </div>
          <div class="check-area">${escapeHtml(c.checkPoint)}</div>
          <div class="check-remark">Remarks: ${escapeHtml(c.remarks || "No remarks")}</div>
        </div>
      `;
    })
    .join("");

  document.getElementById("detailModalBackdrop").classList.remove("hidden");
}

function closeDetail() {
  document.getElementById("detailModalBackdrop").classList.add("hidden");
  state.selectedFeId = null;
}

function render() {
  renderStatusPills();
  renderRangeTabs();

  document.querySelectorAll(".view-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === state.activeView);
  });

  document.getElementById("gridView").classList.toggle("hidden", state.activeView !== "grid");
  document.getElementById("mapView").classList.toggle("hidden", state.activeView !== "map");
  document.getElementById("tableView").classList.toggle("hidden", state.activeView !== "table");
  document.getElementById("hptView").classList.toggle("hidden", state.activeView !== "hpt");

  if (state.activeView === "grid") renderGrid();
  if (state.activeView === "map") renderIsoMap();
  if (state.activeView === "table") renderAuditTable();
  if (state.activeView === "hpt") renderHptTable();
}

// RFC-4180 compliant CSV parser handling quotes, escaped quotes (""), and CRLF/LF
function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const findCol = (aliases) => headers.findIndex((h) => aliases.includes(h));

  const idx = {
    feId: findCol(["feid", "feidno", "extinguisherid", "id"]),
    location: findCol(["location", "area", "zone"]),
    type: findCol(["typeoffireextinguisher", "fetype", "type"]),
    capacity: findCol(["capacity", "cap"]),
    yom: findCol(["yearofmanufacturing", "yearofmfg", "yom"]),
    cylinderBody: findCol(["cylinderbody", "cylinderno", "serialno"]),
    checkPoint: findCol(["checkpoint", "checkarea", "item"]),
    status: findCol(["status", "result", "condition"]),
    hptDone: findCol(["hptdone", "lasthpt"]),
    hptDue: findCol(["hptdue", "nexthpt"]),
    inspectionDate: findCol(["inspectiondate", "lastauditdate", "auditdate", "date"]),
    remarks: findCol(["remarks", "remark", "notes", "comment"]),
  };

  return rows.slice(1).map((cols) => {
    const feId = cols[idx.feId] || "UNKNOWN";
    const location = cols[idx.location] || "Location Pending";
    return {
      feId,
      feNum: parseFeNum(feId),
      location,
      zone: inferZone(location),
      type: cols[idx.type] || "CO2",
      capacity: cols[idx.capacity] || "",
      yom: cols[idx.yom] || "",
      cylinderBody: cols[idx.cylinderBody] || "",
      checkPoint: cols[idx.checkPoint] || "General Inspection",
      status: normalizeStatus(cols[idx.status]),
      hptDone: cols[idx.hptDone] || "",
      hptDue: cols[idx.hptDue] || "",
      inspectionDate: cols[idx.inspectionDate] || "",
      remarks: cols[idx.remarks] || "",
    };
  });
}

// Event Wiring
document.getElementById("searchInput").addEventListener("input", (e) => {
  state.search = e.target.value;
  render();
});

document.getElementById("latestOnlyToggle").addEventListener("change", (e) => {
  state.latestOnly = e.target.checked;
  render();
});

document.getElementById("closeDetailBtn").addEventListener("click", closeDetail);
document.getElementById("detailModalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "detailModalBackdrop") closeDetail();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetail();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  state.statusFilter = "ALL";
  state.rangeKey = "ALL";
  state.search = "";
  state.latestOnly = true;
  document.getElementById("searchInput").value = "";
  document.getElementById("latestOnlyToggle").checked = true;
  closeDetail();
  render();
});

document.querySelectorAll(".view-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeView = btn.dataset.view;
    render();
  });
});

  document.getElementById("csvInput").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseCsv(String(reader.result || ""));
    if (parsed.length > 0) {
      state.records = parsed;
      state.statusFilter = "ALL";
      state.rangeKey = "ALL";
      state.search = "";
      document.getElementById("searchInput").value = "";
      setSourceBadge("CSV LOADED", "live");
      closeDetail();
      render();
    } else {
      alert("Could not parse rows from CSV. Please check column headers.");
    }
  };
  reader.readAsText(file);
});

// ============================================================================
// SharePoint Live Data Connector (REST API + Microsoft Graph + List Join)
// ============================================================================
const SP_STORAGE_KEY = "fe_sp_config_v1";
const SP_BASE_SNAPSHOT_KEY = "fe_sp_config_base_v1";
let spRefreshTimer = null;
let msalInstance = null;
let lastSpError = "";

function normalizeSiteUrl(rawUrl) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  // If user pasted a list/view URL, trim before /Lists/ or /_layouts/
  return trimmed
    .replace(/\/Lists\/.*$/i, "")
    .replace(/\/_layouts\/.*$/i, "")
    .replace(/\/SiteAssets\/.*$/i, "")
    .replace(/\/+$/, "");
}

function getBaseSpConfig() {
  return (typeof window !== "undefined" && window.SHAREPOINT_CONFIG) || {
    mode: "demo",
    siteUrl: "",
    masterListName: "Fire Extinguishers",
    auditListName: "FE Monthly Checking",
    refreshSeconds: 60,
    azureClientId: "",
    azureTenantId: "",
  };
}

function getEffectiveSpConfig() {
  const base = getBaseSpConfig();
  const baseJson = JSON.stringify(base);
  let saved = {};
  try {
    if (typeof localStorage !== "undefined") {
      const prevBaseJson = localStorage.getItem(SP_BASE_SNAPSHOT_KEY);
      if (prevBaseJson !== baseJson) {
        // sharepoint-config.js was edited (or first run with snapshot tracking); prefer file config
        localStorage.removeItem(SP_STORAGE_KEY);
        localStorage.setItem(SP_BASE_SNAPSHOT_KEY, baseJson);
      } else {
        saved = JSON.parse(localStorage.getItem(SP_STORAGE_KEY) || "{}");
      }
    }
  } catch (_) {}
  const cfg = { ...base, ...saved };
  cfg.siteUrl = normalizeSiteUrl(cfg.siteUrl);
  if (!cfg.siteUrl && typeof window !== "undefined" && window._spPageContextInfo?.webAbsoluteUrl) {
    cfg.siteUrl = normalizeSiteUrl(window._spPageContextInfo.webAbsoluteUrl);
    if (cfg.mode === "demo") cfg.mode = "sharepoint-rest";
  }
  return cfg;
}

function saveSpConfig(cfg) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SP_BASE_SNAPSHOT_KEY, JSON.stringify(getBaseSpConfig()));
      localStorage.setItem(SP_STORAGE_KEY, JSON.stringify(cfg));
    }
  } catch (_) {}
}

function setSourceBadge(label, tone = "", tooltip = "") {
  const badge = document.getElementById("dataSourceBadge");
  if (!badge) return;
  badge.textContent = label;
  badge.className = `source-badge ${tone}`.trim();
  badge.title = tooltip || "";
  if (badge.style) badge.style.cursor = tone === "err" ? "pointer" : "";
}

function unwrapSpValue(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(unwrapSpValue).filter(Boolean).join(", ");
  if (typeof v === "object") {
    if (Array.isArray(v.results)) return v.results.map(unwrapSpValue).filter(Boolean).join(", ");
    if ("Title" in v) return String(v.Title ?? "");
    if ("Value" in v) return String(v.Value ?? "");
    if ("LookupValue" in v) return String(v.LookupValue ?? "");
    if ("Description" in v) return String(v.Description ?? v.Url ?? "");
    if ("Url" in v) return String(v.Url ?? "");
    return "";
  }
  return String(v);
}

function normalizeSpKey(key) {
  return String(key || "")
    .replace(/_x([0-9a-f]{4})_/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickSpField(raw, aliases) {
  const normalizedMap = new Map();
  for (const [k, val] of Object.entries(raw || {})) {
    const nk = normalizeSpKey(k);
    if (!normalizedMap.has(nk) && val !== null && val !== undefined && val !== "") {
      const unwrapped = unwrapSpValue(val).trim();
      if (unwrapped !== "") normalizedMap.set(nk, unwrapped);
    }
  }
  for (const alias of aliases) {
    if (normalizedMap.has(alias)) return normalizedMap.get(alias);
  }
  return "";
}

function normalizeFeKey(feId) {
  return String(feId || "").trim().toUpperCase();
}

function joinSharePointLists(masterItems, auditItems) {
  const masterMap = new Map();
  const masterBySpId = new Map();

  for (const raw of masterItems) {
    const feId = pickSpField(raw, ["feid", "feidno", "extinguisherid", "title"]);
    if (!feId) continue;
    const entry = {
      feId: feId.trim(),
      location: pickSpField(raw, ["location", "area", "zone"]) || "Location Pending",
      type: pickSpField(raw, ["typeoffireextinguisher", "fetype", "type"]) || "CO2",
      capacity: pickSpField(raw, ["capacity", "cap"]),
      yom: pickSpField(raw, ["yearofmanufacturing", "yearofmfg", "yom"]),
      cylinderBody: pickSpField(raw, ["cylinderbody", "cylinderno", "serialno"]),
      hptDone: pickSpField(raw, ["hptdone", "lasthpt"]),
      hptDue: pickSpField(raw, ["hptdue", "nexthpt"]),
    };
    masterMap.set(normalizeFeKey(entry.feId), entry);
    const spItemId = raw.Id ?? raw.ID ?? raw.id;
    if (spItemId !== undefined && spItemId !== null && spItemId !== "") {
      masterBySpId.set(String(spItemId), entry);
    }
  }

  const joined = [];
  const seenAuditIds = new Set();

  for (const raw of auditItems) {
    let feId = pickSpField(raw, ["feid", "feidno", "extinguisherid", "title"]);
    let master = feId ? masterMap.get(normalizeFeKey(feId)) : null;

    // Fallback: if FE_Id in audit list is a SharePoint Lookup column, REST returns *Id (numeric item ID)
    if (!master) {
      const lookupItemId = pickSpField(raw, ["feidid", "feidnoid", "extinguisheridid"]);
      if (lookupItemId && masterBySpId.has(lookupItemId)) {
        master = masterBySpId.get(lookupItemId);
        if (!feId) feId = master.feId;
      }
    }

    if (!feId) continue;
    master = master || {};
    seenAuditIds.add(normalizeFeKey(master.feId || feId));

    const location = pickSpField(raw, ["location", "area", "zone"]) || master.location || "Location Pending";
    const resolvedFeId = master.feId || feId.trim();
    joined.push({
      feId: resolvedFeId,
      feNum: parseFeNum(resolvedFeId),
      location,
      zone: inferZone(location),
      type: pickSpField(raw, ["typeoffireextinguisher", "fetype", "type"]) || master.type || "CO2",
      capacity: pickSpField(raw, ["capacity", "cap"]) || master.capacity || "",
      yom: pickSpField(raw, ["yearofmanufacturing", "yearofmfg", "yom"]) || master.yom || "",
      cylinderBody: pickSpField(raw, ["cylinderbody", "cylinderno", "serialno"]) || master.cylinderBody || "",
      checkPoint: pickSpField(raw, ["checkpoint", "checkarea", "item"]) || "General Inspection",
      status: normalizeStatus(pickSpField(raw, ["status", "result", "condition"])),
      hptDone: pickSpField(raw, ["hptdone", "lasthpt"]) || master.hptDone || "",
      hptDue: pickSpField(raw, ["hptdue", "nexthpt"]) || master.hptDue || "",
      inspectionDate: pickSpField(raw, ["inspectiondate", "lastauditdate", "auditdate", "date", "modified", "created"]),
      remarks: pickSpField(raw, ["remarks", "remark", "notes", "comment"]),
    });
  }

  // Keep master extinguishers even if they have no checking rows yet
  for (const [key, m] of masterMap.entries()) {
    if (!seenAuditIds.has(key)) {
      joined.push({
        feId: m.feId,
        feNum: parseFeNum(m.feId),
        location: m.location,
        zone: inferZone(m.location),
        type: m.type,
        capacity: m.capacity,
        yom: m.yom,
        cylinderBody: m.cylinderBody,
        checkPoint: "Monthly Audit Status",
        status: "OK",
        hptDone: m.hptDone,
        hptDue: m.hptDue,
        inspectionDate: "",
        remarks: "No audit record submitted yet",
      });
    }
  }

  return joined;
}

function escapeODataString(str) {
  return String(str || "").replace(/'/g, "''");
}

async function resolveSharePointListTitle(baseUrl, listNameOrUrlSegment) {
  const endpoint = `${baseUrl}/_api/web/lists?$select=Title,RootFolder/ServerRelativeUrl&$expand=RootFolder`;
  const resp = await fetch(endpoint, {
    credentials: "include",
    headers: { Accept: "application/json;odata=nometadata" },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const lists = data.value || data.d?.results || [];
  const target = String(listNameOrUrlSegment || "").trim().toLowerCase();
  let decodedTarget = target;
  try {
    decodedTarget = decodeURIComponent(target);
  } catch (_) {}
  const match = lists.find((l) => {
    const title = String(l.Title || "").trim().toLowerCase();
    const folderUrl = String(l.RootFolder?.ServerRelativeUrl || "").toLowerCase();
    const folderSeg = folderUrl.split("/").filter(Boolean).pop() || "";
    return title === target || title === decodedTarget || folderSeg === target || folderSeg === decodedTarget;
  });
  return match ? match.Title : null;
}

async function fetchAllSharePointRest(siteUrl, listName) {
  const base = normalizeSiteUrl(siteUrl);
  const makeItemsUrl = (title) =>
    `${base}/_api/web/lists/getbytitle('${encodeURIComponent(escapeODataString(title))}')/items?$top=5000`;

  let nextUrl = makeItemsUrl(listName);
  const all = [];
  let retriedByFolder = false;

  while (nextUrl) {
    const resp = await fetch(nextUrl, {
      credentials: "include",
      headers: { Accept: "application/json;odata=nometadata" },
    });
    if (resp.status === 404 && !retriedByFolder) {
      retriedByFolder = true;
      const resolvedTitle = await resolveSharePointListTitle(base, listName);
      if (resolvedTitle && resolvedTitle !== listName) {
        nextUrl = makeItemsUrl(resolvedTitle);
        continue;
      }
    }
    if (!resp.ok) {
      throw new Error(`SharePoint REST error (${resp.status}) on "${listName}"`);
    }
    const data = await resp.json();
    const items = data.value || data.d?.results || [];
    all.push(...items);
    nextUrl = data["odata.nextLink"] || data["@odata.nextLink"] || data.d?.__next || null;
  }
  return all;
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Microsoft MSAL library."));
    document.head.appendChild(s);
  });
}

async function acquireGraphToken(cfg) {
  if (window.location.protocol === "file:") {
    throw new Error("Microsoft Graph sign-in requires http://localhost or https:// (not file://).");
  }
  if (!cfg.azureClientId || !cfg.azureTenantId) {
    throw new Error("Azure Client ID and Tenant ID are required for Microsoft Graph mode.");
  }
  await loadScriptOnce("https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js");
  if (!msalInstance) {
    msalInstance = new window.msal.PublicClientApplication({
      auth: {
        clientId: cfg.azureClientId,
        authority: `https://login.microsoftonline.com/${cfg.azureTenantId}`,
        redirectUri: window.location.origin + window.location.pathname,
      },
      cache: { cacheLocation: "localStorage" },
    });
    if (typeof msalInstance.initialize === "function") await msalInstance.initialize();
  }
  const scopes = ["Sites.Read.All"];
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const res = await msalInstance.acquireTokenSilent({ scopes, account: accounts[0] });
      return res.accessToken;
    } catch (_) {}
  }
  const res = await msalInstance.acquireTokenPopup({ scopes });
  return res.accessToken;
}

async function fetchAllGraphList(siteUrl, listName, token) {
  const u = new URL(siteUrl);
  const sitePath = u.pathname.replace(/\/+$/, "");
  const siteEndpoint = `https://graph.microsoft.com/v1.0/sites/${u.hostname}:${sitePath}`;
  const siteResp = await fetch(siteEndpoint, { headers: { Authorization: `Bearer ${token}` } });
  if (!siteResp.ok) throw new Error(`Graph site lookup failed (${siteResp.status})`);
  const siteData = await siteResp.json();

  let nextUrl = `https://graph.microsoft.com/v1.0/sites/${siteData.id}/lists/${encodeURIComponent(listName)}/items?expand=fields&$top=999`;
  const all = [];
  while (nextUrl) {
    const resp = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`Graph list error (${resp.status}) on "${listName}"`);
    const data = await resp.json();
    for (const item of data.value || []) {
      all.push(item.fields || item);
    }
    nextUrl = data["@odata.nextLink"] || null;
  }
  return all;
}

async function syncSharePointData(cfg) {
  const statusEl = document.getElementById("spStatusMsg");
  const syncBtn = document.getElementById("syncNowBtn");
  lastSpError = "";

  if (cfg.mode === "demo") {
    state.records = buildDefaultRecords();
    setSourceBadge("DEMO DATA");
    syncBtn?.classList.add("hidden");
    clearInterval(spRefreshTimer);
    render();
    return;
  }

  const siteUrl = normalizeSiteUrl(cfg.siteUrl);
  if (!siteUrl) {
    throw new Error("Please enter your SharePoint Site URL.");
  }
  if (!cfg.auditListName) {
    throw new Error("Please enter the Monthly Audit List Name.");
  }

  if (cfg.mode === "sharepoint-rest" && typeof window !== "undefined") {
    const proto = window.location?.protocol;
    let siteOrigin = "";
    try {
      siteOrigin = new URL(siteUrl).origin;
    } catch (_) {
      throw new Error(`Invalid SharePoint Site URL: "${siteUrl}"`);
    }
    if (proto === "file:" || (window.location?.origin && window.location.origin !== siteOrigin)) {
      throw new Error(
        `sharepoint-rest cannot call ${siteOrigin} from ${proto === "file:" ? "file://" : window.location.origin} (blocked by browser CORS/auth). Upload dashboard.aspx to SharePoint Site Assets, or switch mode to "graph-msal" with Azure Client ID & Tenant ID.`
      );
    }
  }

  syncBtn?.classList.remove("hidden");
  setSourceBadge("SYNCING...", "");
  if (statusEl) {
    statusEl.className = "sp-msg";
    statusEl.textContent = "Connecting to SharePoint...";
  }

  let masterItems = [];
  let auditItems = [];

  if (cfg.mode === "sharepoint-rest") {
    [masterItems, auditItems] = await Promise.all([
      cfg.masterListName ? fetchAllSharePointRest(siteUrl, cfg.masterListName) : Promise.resolve([]),
      fetchAllSharePointRest(siteUrl, cfg.auditListName),
    ]);
  } else if (cfg.mode === "graph-msal") {
    const token = await acquireGraphToken(cfg);
    [masterItems, auditItems] = await Promise.all([
      cfg.masterListName ? fetchAllGraphList(siteUrl, cfg.masterListName, token) : Promise.resolve([]),
      fetchAllGraphList(siteUrl, cfg.auditListName, token),
    ]);
  }

  const joined = joinSharePointLists(masterItems, auditItems);
  if (joined.length === 0) {
    throw new Error("Connected, but 0 records were returned. Verify your list names and FE_Id column.");
  }

  state.records = joined;
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  setSourceBadge(`SHAREPOINT LIVE • ${nowStr}`, "live");
  if (statusEl) {
    statusEl.className = "sp-msg ok";
    statusEl.textContent = `Synced ${joined.length} rows from SharePoint!`;
  }
  render();
}

function scheduleAutoRefresh(cfg) {
  clearInterval(spRefreshTimer);
  const sec = Number(cfg.refreshSeconds || 0);
  if (cfg.mode !== "demo" && sec > 0) {
    spRefreshTimer = setInterval(() => {
      syncSharePointData(cfg).catch((err) => {
        lastSpError = err.message;
        setSourceBadge("SHAREPOINT ERROR", "err", err.message);
        console.error(err);
      });
    }, sec * 1000);
  }
}

function openSpModal() {
  const cfg = getEffectiveSpConfig();
  document.getElementById("spMode").value = cfg.mode;
  document.getElementById("spSiteUrl").value = cfg.siteUrl || "";
  document.getElementById("spMasterList").value = cfg.masterListName || "Fire Extinguishers";
  document.getElementById("spAuditList").value = cfg.auditListName || "FE Monthly Checking";
  document.getElementById("spClientId").value = cfg.azureClientId || "";
  document.getElementById("spTenantId").value = cfg.azureTenantId || "";
  document.getElementById("spRefreshSec").value = String(cfg.refreshSeconds ?? 60);
  document.getElementById("graphFields").classList.toggle("hidden", cfg.mode !== "graph-msal");
  const statusEl = document.getElementById("spStatusMsg");
  statusEl.className = lastSpError ? "sp-msg err" : "sp-msg";
  statusEl.textContent = lastSpError || "";
  document.getElementById("spModalBackdrop").classList.remove("hidden");
}

function closeSpModal() {
  document.getElementById("spModalBackdrop").classList.add("hidden");
}

document.getElementById("spSetupBtn").addEventListener("click", openSpModal);
document.getElementById("dataSourceBadge").addEventListener("click", () => {
  if (lastSpError) openSpModal();
});
document.getElementById("closeSpModalBtn").addEventListener("click", closeSpModal);
document.getElementById("spModalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "spModalBackdrop") closeSpModal();
});
document.getElementById("spMode").addEventListener("change", (e) => {
  document.getElementById("graphFields").classList.toggle("hidden", e.target.value !== "graph-msal");
});

document.getElementById("spUseDemoBtn").addEventListener("click", () => {
  const cfg = { ...getEffectiveSpConfig(), mode: "demo" };
  saveSpConfig(cfg);
  syncSharePointData(cfg);
  closeSpModal();
});

document.getElementById("syncNowBtn").addEventListener("click", () => {
  const cfg = getEffectiveSpConfig();
  syncSharePointData(cfg).catch((err) => {
    lastSpError = err.message;
    setSourceBadge("SHAREPOINT ERROR", "err", err.message);
    alert(err.message);
  });
});

document.getElementById("spForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cfg = {
    mode: document.getElementById("spMode").value,
    siteUrl: normalizeSiteUrl(document.getElementById("spSiteUrl").value),
    masterListName: document.getElementById("spMasterList").value.trim(),
    auditListName: document.getElementById("spAuditList").value.trim(),
    azureClientId: document.getElementById("spClientId").value.trim(),
    azureTenantId: document.getElementById("spTenantId").value.trim(),
    refreshSeconds: Number(document.getElementById("spRefreshSec").value || 0),
  };
  saveSpConfig(cfg);
  try {
    await syncSharePointData(cfg);
    scheduleAutoRefresh(cfg);
    if (cfg.mode === "demo") closeSpModal();
  } catch (err) {
    lastSpError = err.message;
    setSourceBadge("SHAREPOINT ERROR", "err", err.message);
    const statusEl = document.getElementById("spStatusMsg");
    statusEl.className = "sp-msg err";
    statusEl.textContent = err.message;
  }
});

// Boot
const initialCfg = getEffectiveSpConfig();
if (initialCfg.mode !== "demo" && initialCfg.siteUrl) {
  syncSharePointData(initialCfg)
    .then(() => scheduleAutoRefresh(initialCfg))
    .catch((err) => {
      lastSpError = err.message;
      const isFile = typeof window !== "undefined" && window.location?.protocol === "file:";
      setSourceBadge(isFile ? "LOCAL PREVIEW (DEMO)" : "SHAREPOINT ERROR", isFile ? "" : "err", err.message);
      console.warn("SharePoint sync skipped/failed:", err.message);
      render();
    });
} else {
  render();
}
