# Power BI Implementation Guide — Blinking Extinguisher + Click-to-Detail

If you also want this exact behavior inside your existing `.pbix` (`Fire Extinguishers`, `FE Monthly Checking`, `Calendar`), use the DAX measures and steps below.

---

## 1. Core DAX Measures

```dax
NOT OK Checkpoints =
CALCULATE(
    COUNTROWS('FE Monthly Checking'),
    'FE Monthly Checking'[status] = "NOT OK"
)

OK Checkpoints =
CALCULATE(
    COUNTROWS('FE Monthly Checking'),
    'FE Monthly Checking'[status] = "OK"
)

NOT OK Extinguishers =
CALCULATE(
    DISTINCTCOUNT('FE Monthly Checking'[FE_Id]),
    'FE Monthly Checking'[status] = "NOT OK"
)

HPT Overdue =
CALCULATE(
    DISTINCTCOUNT('FE Monthly Checking'[FE_Id]),
    'FE Monthly Checking'[Hpt due] < TODAY()
)
```

---

## 2. Blinking Red vs. Steady Green Extinguisher Card (HTML Content Visual)

1. In Power BI Desktop, click **Get more visuals** (`...`) → search and add **HTML Content** (by Daniel Marsh-Patrick, Microsoft AppSource).
2. Create this DAX measure and place it inside the **HTML Content** visual (filtered by `FE_Id`, or loop with `CONCATENATEX` for a full grid):

```dax
FE Blinking Tile HTML =
VAR CurrentFE = SELECTEDVALUE('Fire Extinguishers'[FE_Id])
VAR Loc = SELECTEDVALUE('Fire Extinguishers'[Location])
VAR FailCount = [NOT OK Checkpoints]
VAR IsBad = FailCount > 0
VAR BorderColor = IF(IsBad, "#dc2626", "#16a34a")
VAR BgColor = IF(IsBad, "#fff1f2", "#f0fdf4")
VAR StatusText = IF(IsBad, "NOT OK (" & FailCount & ")", "OK")
VAR AnimClass = IF(IsBad, "blink-card", "")
RETURN
"<style>
@keyframes pulseRed {
  0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
  50% { box-shadow: 0 0 0 7px rgba(220,38,38,0); }
}
.blink-card { animation: pulseRed 1.3s infinite; }
.fe-box {
  font-family: Segoe UI, sans-serif;
  background:" & BgColor & ";
  border: 2px solid " & BorderColor & ";
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}
</style>
<div class='fe-box " & AnimClass & "'>
  <div style='font-size:11px;font-weight:800;color:" & BorderColor & ";'>" & StatusText & "</div>
  <svg width='46' height='46' viewBox='0 0 64 64' fill='none'>
    <path d='M26 14H38M32 14V19M23 11L32 14L42 10' stroke='" & BorderColor & "' stroke-width='3' stroke-linecap='round'/>
    <path d='M40 16C46 16 49 20 49 28V40' stroke='" & BorderColor & "' stroke-width='3' stroke-linecap='round'/>
    <rect x='22' y='19' width='20' height='35' rx='7' fill='" & BgColor & "' stroke='" & BorderColor & "' stroke-width='3'/>
  </svg>
  <div style='font-size:16px;font-weight:900;color:#0f172a;'>" & CurrentFE & "</div>
  <div style='font-size:11px;color:#475569;'>" & Loc & "</div>
</div>"
```

---

## 3. Click `FE_Id` to Open the Checkpoint Detail Page

1. Create a second page named **`FE Detail`**.
2. Drag **`FE_Id`** into the **Drill through** box at the bottom of the Visualizations pane on `FE Detail`.
3. Power BI automatically adds a **Back (`←`)** button on `FE Detail`.
4. Add a table/matrix on `FE Detail` with `check_point`, `status`, `Remarks`, `Hpt done`, `Hpt due`, sorted with `NOT OK` at the top and conditional formatting (`NOT OK` = red, `OK` = green).
5. On Page 1, add a button labeled **"View FE Details"** with **Action → Type: Drill through → Destination: FE Detail** so clicking any extinguisher + clicking the button jumps straight into its checkpoints.
