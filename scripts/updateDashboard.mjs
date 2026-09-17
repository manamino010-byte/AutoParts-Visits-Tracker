import fs from 'fs';
let content = fs.readFileSync('client/src/pages/ManagerDashboard.tsx', 'utf8');

const importContent = `
  // Area manager: fetch subordinate branch managers
  const { data: subordinates } = trpc.manager.getSubordinateBranchManagers.useQuery(undefined, {
    enabled: !isBranchManager,
    staleTime: 30_000,
  });
`;

content = content.replace(
  '  const { data: branches = [] } = trpc.manager.getMyBranches.useQuery(undefined, { staleTime: 5 * 60 * 1000 });',
  '  const { data: branches = [] } = trpc.manager.getMyBranches.useQuery(undefined, { staleTime: 5 * 60 * 1000 });\n' + importContent
);

const uiContent = `
        {/* ── فريق العمل بالمنطقة (لمدير المنطقة فقط) ───────────────────────── */}
        {!isBranchManager && subordinates && subordinates.length > 0 && (
          <div className="fade-up" style={{ animationDelay: '0.4s', padding: '24px 24px 0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                فريق العمل بالمنطقة
              </h3>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {subordinates.length} مديري فروع
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subordinates.map((sub: any) => (
                <div key={sub.managerId} style={{
                  background: 'rgba(30, 34, 40, 0.6)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'rgba(255,255,255,0.1)',
                      backgroundImage: sub.photoUrl ? \`url(\${SERVER_BASE_URL}\${sub.photoUrl})\` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {!sub.photoUrl && <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.5)' }}>person</span>}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 14, height: 14, borderRadius: '50%',
                      background: sub.activeVisit ? '#34d399' : '#9ca3af',
                      border: '2px solid #1e2228'
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>
                      {sub.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {sub.branchName}
                    </p>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 12,
                      background: sub.activeVisit ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.1)',
                      color: sub.activeVisit ? '#34d399' : 'rgba(255,255,255,0.6)'
                    }}>
                      {sub.activeVisit ? 'متواجد بالفرع' : 'غير متواجد'}
                    </span>
                    {sub.activeVisit && (
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                        منذ {formatDuration(now - new Date(sub.activeVisit.checkInAt).getTime())}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
`;

content = content.replace(
  '        </div>\r\n      </div>\r\n    </>\r\n  );\r\n}',
  '        </div>\n' + uiContent + '\n      </div>\n    </>\n  );\n}'
);

content = content.replace(
  '        </div>\n      </div>\n    </>\n  );\n}',
  '        </div>\n' + uiContent + '\n      </div>\n    </>\n  );\n}'
);

fs.writeFileSync('client/src/pages/ManagerDashboard.tsx', content);
console.log('Successfully updated ManagerDashboard');
