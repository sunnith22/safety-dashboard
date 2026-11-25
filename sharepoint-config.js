// Configure your SharePoint Lists here (or click "SharePoint Link" in the dashboard UI).
window.SHAREPOINT_CONFIG = {
  // "demo"            -> Built-in FE-1 to FE-395 sample data
  // "sharepoint-rest" -> Direct SharePoint REST API (best when hosted on SharePoint Site Assets / SPFx)
  // "graph-msal"      -> Microsoft Graph API with Azure AD sign-in (for external server / http://localhost)
  mode: "demo",

  // Example: "https://tieiindia.sharepoint.com/sites/TIEI_Environment_Project"
  siteUrl: "",

  // Exact SharePoint List titles (from your Power BI model)
  masterListName: "Fire Extinguishers",
  auditListName: "FE Monthly Checking",

  // Auto-refresh interval in seconds (0 = manual refresh only)
  refreshSeconds: 60,

  // Only needed if mode === "graph-msal" (outside SharePoint)
  azureClientId: "",
  azureTenantId: "",
};
