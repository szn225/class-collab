"""One 24px / 1.65px round-stroke icon family, used by both mini-program modules."""
from pathlib import Path
import json,html
root=Path(__file__).resolve().parents[1];out=root/'miniprogram/assets/ui/icons';out.mkdir(parents=True,exist_ok=True)
icons={
'home':'<path d="m3.5 10 8.5-7 8.5 7M5.5 9v11h5v-6h3v6h5V9"/>',
'back':'<path d="m14.5 5-7 7 7 7"/>',
'chevron-left':'<path d="m14.5 6-6 6 6 6"/>','chevron-right':'<path d="m9.5 6 6 6-6 6"/>',
'chevron-up':'<path d="m6 14.5 6-6 6 6"/>','chevron-down':'<path d="m6 9.5 6 6 6-6"/>',
'person':'<circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 20v-2a6.5 6.5 0 0 1 13 0v2"/>',
'settings':'<path d="m10 3-.7 2.5-2 .9L5 5.7 3 9.3l1.8 1.8v1.8L3 14.7l2 3.6 2.3-.7 2 .9L10 21h4l.7-2.5 2-.9 2.3.7 2-3.6-1.8-1.8v-1.8L21 9.3l-2-3.6-2.3.7-2-.9L14 3Z"/><circle cx="12" cy="12" r="3.1"/>',
'paper':'<rect x="6" y="3.5" width="13.5" height="17" rx="2"/><path d="M3.5 7v11.5a2 2 0 0 0 2 2M9.5 8h6.5m-6.5 4h6.5m-6.5 4h4"/>',
'chart-line':'<path d="M4 4v16h16M7 15l4-5 4 2 4-6"/><circle cx="11" cy="10" r=".6"/>',
'chart-bar':'<path d="M4 4v16h16M8 16v-5m4 5V7m4 9V9"/>',
'add':'<path d="M12 5v14M5 12h14"/>','minus':'<path d="M5 12h14"/>',
'edit':'<path d="m14.5 5.5 4 4M4 20l4.5-1 12-12a1.8 1.8 0 0 0 0-2.5l-1-1a1.8 1.8 0 0 0-2.5 0L5 15.5Z"/>',
'task':'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 11h6m-6 4h6"/>',
'task-checked':'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m8.5 14 2.5 2.5 4.5-5"/>',
'book':'<path d="M12 5.5C9 3.5 5 3.5 3 4.5v15c2-1 6-1 9 1 3-2 7-2 9-1v-15c-2-1-6-1-9 1Zm0 0v15"/>',
'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.2 15.2 4.8 4.8"/>',
'filter':'<path d="M4 6h16M7 12h10m-7 6h4"/><circle cx="9" cy="6" r="1.5" fill="BACKGROUND"/><circle cx="15" cy="12" r="1.5" fill="BACKGROUND"/>',
'check':'<path d="m5 12 4.5 4.5L19 7"/>','check-circle':'<circle cx="12" cy="12" r="8.5"/><path d="m7.5 12 3 3 6-6"/>',
'info-circle':'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v6m0-10v.1"/>',
'error-circle':'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v6m0 4v.1"/>',
'arrow-up':'<path d="M12 20V4m-6 6 6-6 6 6"/>','arrow-down':'<path d="M12 4v16m-6-6 6 6 6-6"/>','arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
'refresh':'<path d="M20 5v5h-5M4 19v-5h5M5.2 8a7.5 7.5 0 0 1 12.5-2L20 10M4 14l2.3 4A7.5 7.5 0 0 0 18.8 16"/>',
'rollback':'<path d="M9 5 3 11l6 6m-6-6h11a6 6 0 0 1 0 12" transform="translate(0 -2)"/>',
'root-list':'<path d="M6 5v14M6 8h5m-5 8h5"/><rect x="11" y="5" width="9" height="6" rx="1.5"/><rect x="11" y="13" width="9" height="6" rx="1.5"/>',
'close':'<path d="m6 6 12 12M6 18 18 6"/>',
'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
'upload':'<path d="M12 15V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
'copy':'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
'calendar':'<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3v5m9-5v5m-13 2.5h17M8 14h.1m3.9 0h.1m3.9 0h.1M8 17h.1m3.9 0h.1"/>',
'ellipsis':'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
'photo':'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 16 5-4 4 4 4-5 5 5"/>',
'send':'<path d="m3 10 18-7-7 18-3-8-8-3Zm8 3L21 3"/>',
'share':'<path d="M12 15V3m-5 5 5-5 5 5M6 11H4v9h16v-9h-2"/>',
'lock':'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
'logout':'<path d="M10 4H4v16h6m4-12 4 4-4 4m-5-4h12"/>',
'members':'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
'history':'<path d="M4 5v5h5m-5 0a8 8 0 1 1 1 8m7-12v6l4 2"/>',
'pin':'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
'school':'<path d="m3 9 9-6 9 6M5 8v13h14V8M9 21v-5h6v5M9 11h.1m5.9 0h.1"/>'}
aliases={'setting':'settings','chart':'chart-line','chevron':'chevron-right','edit-1':'edit','book-filled':'book','location':'pin','location-filled':'pin','file-paste':'copy','task-filled':'task'}
colors={'default':'#65736B','accent':'#245D50','on-accent':'#FFFFFF','positive':'#126A32','negative':'#B91C1C'}
for name,body in icons.items():
 for tone,color in colors.items():
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="{color}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">{body.replace("BACKGROUND","none")}</g></svg>'
  (out/f'{name}-{tone}.svg').write_text(svg)
for alias,name in {**{n:n for n in icons},**aliases}.items():
 # Existing direct image references use the same new artwork.
 if (out.parent/f'{alias}.svg').exists():(out.parent/f'{alias}.svg').write_text((out/f'{name}-default.svg').read_text())
(out/'catalog.js').write_text('module.exports='+json.dumps({'names':list(icons),'aliases':aliases,'tones':list(colors)},ensure_ascii=False)+'\n')
docs=root/'docs/ui-icons-2.3.3';docs.mkdir(parents=True,exist_ok=True)
rows=[]
for i,(name,body) in enumerate(icons.items()):
 x=24+(i%6)*148;y=92+(i//6)*106
 rows.append(f'<g transform="translate({x+48} {y})" fill="none" stroke="#263B37" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">{body.replace("BACKGROUND","none")}</g><text x="{x+60}" y="{y+54}" fill="#65736B" font-size="13" text-anchor="middle">{html.escape(name)}</text>')
svg=f'<svg xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,PingFang SC,sans-serif" width="936" height="{130+((len(icons)+5)//6)*106}" viewBox="0 0 936 {130+((len(icons)+5)//6)*106}"><rect width="100%" height="100%" fill="white"/><text x="32" y="42" font-size="22" fill="#263B37">慧共创 · 统一线性图标 2.3.3</text>'+''.join(rows)+'</svg>'
(docs/'icon-sheet.svg').write_text(svg);(docs/'icon-sheet.html').write_text('<!doctype html><meta charset="utf-8"><title>慧共创图标</title>'+svg)
print(f'Generated {len(icons)} icons, {len(colors)} tones, same 24px grid / 1.65px stroke')
