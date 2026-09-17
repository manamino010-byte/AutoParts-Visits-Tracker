import fs from 'fs';

let content = fs.readFileSync('client/src/pages/ManagerDashboard.tsx', 'utf8');

const panelButton = `
        {/* ── زرار لوحة المتابعة — لمدير المنطقة فقط ──────────────────────────── */}
        {!isBranchManager && (
          <a
            href="/panel"
            className="fade-up"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              margin: "0 24px 16px", padding: "14px 18px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(30,34,40,0.9) 100%)",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 16, textDecoration: "none", color: "#fff",
              position: "relative", zIndex: 1, cursor: "pointer",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#818cf8", fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#c7d2fe", margin: 0 }}>لوحة متابعة الفريق</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>تابع مديري الفروع وزياراتهم</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(255,255,255,0.3)" }}>chevron_left</span>
          </a>
        )}
`;

// Insert the button after </header> and before the active visit card
const insertPoint = `        </header>\r\n\r\n        {/* ── 🟢`;
const replacement = `        </header>\n` + panelButton + `\n        {/* ── 🟢`;

if (content.includes(insertPoint)) {
  content = content.replace(insertPoint, replacement);
  fs.writeFileSync('client/src/pages/ManagerDashboard.tsx', content);
  console.log('SUCCESS: Panel button added');
} else {
  console.log('ERROR: Insert point not found');
  // Try unix line endings
  const insertPoint2 = `        </header>\n\n        {/* ── 🟢`;
  if (content.includes(insertPoint2)) {
    content = content.replace(insertPoint2, `        </header>\n` + panelButton + `\n        {/* ── 🟢`);
    fs.writeFileSync('client/src/pages/ManagerDashboard.tsx', content);
    console.log('SUCCESS (unix): Panel button added');
  } else {
    console.log('ERROR: Neither insert point found');
    console.log('Searching for nearby text...');
    const idx = content.indexOf('</header>');
    if (idx >= 0) {
      console.log('Found </header> at index', idx);
      console.log('Context:', JSON.stringify(content.substring(idx, idx + 100)));
    }
  }
}
