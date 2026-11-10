from pathlib import Path
import html,base64,json
out=Path(__file__).resolve().parent;out.mkdir(exist_ok=True)
C={'bg':'#FAFAF7','ink':'#263B37','muted':'#65736B','line':'#E2E8E2','green':'#245D50','blue':'#55758D','sand':'#946B42','purple':'#756683','paleBlue':'#EDF2F7','paleSand':'#F7F0E6','paleGreen':'#EDF3EE','palePurple':'#F0EDF5'}
P=[]
def r(x,y,w,h,fill='white',rad=0,stroke=None):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rad}" fill="{C.get(fill,fill)}"'+(f' stroke="{C.get(stroke,stroke)}"' if stroke else '')+'/>'
def t(x,y,s,z=14,col='ink',weight=400):return f'<text x="{x}" y="{y}" font-family="Noto Sans SC" font-size="{z}" font-weight="{weight}" fill="{C.get(col,col)}">{html.escape(str(s))}</text>'
def line(x,y,x2,y2,col='line',width=1):return f'<path d="M{x} {y}L{x2} {y2}" stroke="{C.get(col,col)}" stroke-width="{width}" fill="none"/>'
def icon(name,x,y,col='green',size=24):
 paths={'home':'M3 10 12 3 21 10M5 9v11h5v-6h4v6h5V9','back':'m14 5-7 7 7 7','arrow':'m9 5 7 7-7 7','paper':'M7 3h11a2 2 0 0 1 2 2v15H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v17M10 8h6M10 12h6M10 16h4','chart':'M4 4v16h16M7 15l4-5 4 2 5-7','task':'M8 4h8M8 3v4h8V3M7 5H5v16h14V5h-2M8 12l2 2 5-5M8 18h7','school':'m3 9 9-5 9 5M5 10v10h14V10M9 20v-6h6v6M12 4V2','user':'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21v-2a7 7 0 0 1 14 0v2','photo':'M3 4h18v16H3ZM3 15l5-5 6 6 3-3 4 4M16 8h.01','plus':'M12 5v14M5 12h14','share':'M8 12h10M14 8l4 4-4 4M11 4H4v16h7','settings':'M4 7h16M4 17h16M8 4v6M16 14v6','search':'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6','lock':'M6 10h12v11H6ZM8 10V6a4 4 0 1 1 8 0v4','dots':'M5 12h.01M12 12h.01M19 12h.01','check':'m5 12 4 4L20 5','cloud':'M7 18H6a4 4 0 0 1-1-8 7 7 0 0 1 13-2 5 5 0 0 1 0 10h-1M12 21V11m-4 4 4-4 4 4','coin':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 8h6M9 12h6M12 8v9','image':'M3 4h18v16H3ZM4 17l5-6 5 4 3-3 3 5M16 8h.01'}
 return f'<g transform="translate({x} {y}) scale({size/24})" fill="none" stroke="{C.get(col,col)}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="{paths.get(name,paths["paper"])}"/></g>'
def button(y,label,kind='green',x=24,w=342):return r(x,y,w,48,kind,10, 'line' if kind=='white' else None)+t(x+w/2,y+30,label,15,'white' if kind=='green' else 'green',500).replace(f'x="{x+w/2}"',f'x="{x+w/2}" text-anchor="middle"')
def field(y,label,value,required=False):return t(24,y+27,label+(' *' if required else ''),13,'muted')+t(366,y+27,value,14).replace('x="366"','x="366" text-anchor="end"')+line(24,y+44,366,y+44)
def row(y,title,sub='',ic=None,right='›'):
 a=icon(ic,24,y+12,size=20) if ic else ''
 x=56 if ic else 24
 return a+t(x,y+27,title,14,weight=500)+(t(x,y+49,sub,12,'muted') if sub else '')+t(366,y+30,right,14,'muted').replace('x="366"','x="366" text-anchor="end"')+line(24,y+66,366,y+66)
def tabs(active='成绩'):
 a=r(0,760,390,84,'white')+line(0,760,390,760)
 for i,(lab,ic) in enumerate([('成绩','chart'),('录入','plus'),('复盘','task'),('参照','school')]):
  x=46+i*98;a+=icon(ic,x-10,772,'green' if lab==active else 'muted',22)+t(x,816,lab,12,'green' if lab==active else 'muted').replace(f'x="{x}"',f'x="{x}" text-anchor="middle"')
 return a
asset='data:image/png;base64,'+base64.b64encode((out/'assets/records-decoration.png').read_bytes()).decode()
def deco(x,y,w=100):return f'<image x="{x}" y="{y}" width="{w}" height="{w}" href="{asset}"/>'
def phone(name,title,body,back=False,footer='',home=True):
 idx=len(P);x=48+(idx%4)*438;y=180+(idx//4)*920
 h=r(0,0,390,844,'bg',20)+t(24,28,'9:41',13,weight=600)+line(320,17,333,17,'ink',2)+r(344,14,22,10,'bg',2,'ink')+r(347,17,15,4,'ink',1)
 h+=r(0,44,390,52,'white')+line(0,96,390,96)
 if back:h+=icon('back',18,57)
 if home:h+=icon('home',52 if back else 20,57)
 h+=t(195,78,title,17,weight=600).replace('x="195"','x="195" text-anchor="middle"')+r(294,54,80,30,'white',15,'line')+t(307,74,'•••',16)+line(337,60,337,78)+f'<circle cx="356" cy="69" r="6" fill="none" stroke="{C["ink"]}" stroke-width="1.6"/>'
 h+=body+footer+r(129,831,132,4,'ink',2)
 P.append((name,f'<g id="{html.escape(name)}" transform="translate({x} {y})">'+t(0,-16,name,14,'ink',600)+h+'</g>'))
# 01 首页。无营销标语、最近使用或编造的通知。
b=t(24,138,'工具',13,'muted')+r(24,160,342,174,'paleSand',16)+t(44,203,'活动文章共创',22,weight=600)+t(44,234,'收集文字照片，整理活动文章',13,'muted')+t(44,299,'进入共创',14,'green',500)+icon('arrow',323,281,size=18)+deco(256,169,94)
b+=r(24,354,342,174,'paleBlue',16)+t(44,397,'成绩追踪助手',22,weight=600)+t(44,429,'成绩记录、位次参照与复盘',13,'muted')+t(44,493,'查看成绩',14,'green',500)+icon('chart',290,382,'blue',42)+icon('arrow',323,477,size=18)
b+=row(576,'我的账号',ic='user')
phone('01 首页｜双产品入口','慧共创',b,home=False)
# 02 活动列表
b=t(24,139,'共创活动',20,weight=600)+t(313,139,'＋ 创建',13,'green',500)+r(24,165,342,40,'paleGreen',9)+t(41,191,'全部　　收集中　　暂停收集　　已归档',12,'muted')
b+=r(24,225,342,155,'white',14,'line')+t(40,254,'收集中',12,'green')+t(40,287,'校园运动会',18,weight=600)+t(40,316,'发起人 · 6 位成员 · 12 份资料',12,'muted')+line(40,334,350,334)+t(40,360,'文章：草稿',12,'blue')+icon('arrow',326,341,size=20)+button(415,'邀请码加入','white')
phone('02 共创活动｜列表','活动共创',b,footer='',home=True)
# 03 录入
b=field(109,'考试名称','期中考试',True)+field(153,'考试日期','2026-11-06')+field(197,'考试类型','全市统考　⌄')+field(241,'全市位次','5,560',True)+t(24,321,'各科成绩',15,weight=600)+t(366,321,'选填',12,'muted').replace('x="366"','x="366" text-anchor="end"')
for i,(n,v) in enumerate(zip(['语文','数学','英语','物理','化学','道德与法治','历史'],['105','112','88','','','',''])):
 y=338+i*47;b+=t(24,y+26,n,14)+r(263,y+3,78,34,'white',7,'line')+t(302,y+26,v or '输入',15,'green' if v else 'muted',500).replace('x="302"','x="302" text-anchor="middle"')+t(351,y+26,'分',12,'muted')+line(24,y+44,366,y+44)
b+=t(24,706,'其他信息',13,'muted')+t(349,706,'⌄',14,'muted')
phone('03 录入｜七科固定行','录入成绩',b,True,button(768,'保存成绩'))
# 04 dashboard
b=t(24,132,'学生 1',13,'muted')+t(326,132,'管理',13,'green')+r(24,151,342,150,'paleBlue',14)+t(42,182,'期中考试 · 全市统考',14,weight=500)+t(42,247,'5,560',40,'ink',600)+t(42,278,'全市位次',12,'muted')+t(232,247,'提升 360 位',13,'green',500)
for i,(lab,name,val,col) in enumerate([('冲','四大本部','约 4,212 位','paleSand'),('稳','四大新校区','约 7,250 位','paleGreen'),('保','明德周南','约 11,389 位','paleBlue')]):
 x=24+i*118;b+=r(x,321,106,92,col,10)+t(x+12,346,lab,12,'muted')+t(x+12,373,name,13,weight=500)+t(x+12,397,val,11,'muted')
b+=t(24,438,'位次参照，不代表录取结果',12,'muted')+t(24,477,'位次趋势',15,weight=600)
for yy,tx in [(505,'5,000'),(544,'6,000'),(583,'7,000')]:b+=line(64,yy,366,yy)+t(24,yy+4,tx,10,'muted')
pts=[(75,575),(165,553),(255,537),(354,523)];b+=f'<polyline points="'+ ' '.join(f'{x},{y}'for x,y in pts)+f'" fill="none" stroke="{C["blue"]}" stroke-width="2.2"/>'
for (x,y),date in zip(pts,['09/12','09/26','10/16','11/06']):b+=f'<circle cx="{x}" cy="{y}" r="3" fill="{C["blue"]}"/>'+t(x-12,608,date,10,'muted')
b+=row(628,'期中考试','11月06日',right='5,560 ›')+row(696,'十月考试','10月16日',right='5,920 ›')
phone('04 成绩｜同口径位次','成绩',b,footer=tabs())
# 05 详情 实际为得分率，不编造较上次科目增分
b=t(24,137,'期中考试',22,weight=600)+t(24,163,'11月06日 · 全市统考',12,'muted')+r(24,187,342,87,'paleBlue',12)+t(42,234,'5,560',30,weight=600)+t(42,258,'全市位次',12,'muted')+t(242,238,'提升360位',14,'green')+t(24,312,'分科表现',16,weight=600)+t(322,312,'得分率',12,'muted')
for i,(n,v,rate)in enumerate([('语文','105','87.5%'),('数学','112','93.3%'),('英语','88','88.0%'),('物理','未录入','—'),('化学','未录入','—'),('道德与法治','未录入','—'),('历史','未录入','—')]):
 y=328+i*48;b+=t(24,y+29,n,14)+t(233,y+29,v,15,'ink' if v!='未录入' else 'muted')+t(366,y+29,rate,12,'blue').replace('x="366"','x="366" text-anchor="end"')+line(24,y+47,366,y+47)
b+=t(24,706,'失分归因',13,'muted')+t(343,706,'⌄',14,'muted')
phone('05 详情｜成绩与得分率','考试详情',b,True,button(768,'去复盘'))
# 06 plan
b=t(24,136,'复盘清单',20,weight=600)+r(24,161,342,44,'palePurple',10)+t(42,189,'全部　　进行中　　已完成',13,'purple')
for i,(n,sub,tag)in enumerate([('订正阅读理解错题','知识点 · 英语','待复检'),('重做二次函数错题','知识点 · 数学','进行中')]):
 y=233+i*132;b+=r(24,y,342,112,'white',12,'line')+r(40,y+21,19,19,'white',5,'line')+t(73,y+36,n,15,weight=500)+t(73,y+63,sub,12,'muted')+t(73,y+89,tag,12,'purple')
b+=row(534,'查看对应考试',ic='paper')
phone('06 复盘｜完成与复检','复盘',b,footer=tabs('复盘'))
# 07 admission actualdatasetrows
b=r(24,116,342,40,'white',9,'line')+icon('search',36,125,'muted',20)+t(65,142,'搜索学校',13,'muted')+r(24,173,342,42,'paleBlue',10)+t(38,200,'录取线　　指标生对照　　规则要点',13,'blue')+t(24,246,'2026 参照数据',12,'muted')+t(294,246,'筛选 ⌄',12,'green')
for i,(n,s,v)in enumerate([('长郡中学','597 分','前2500*'),('雅礼中学','594 分','前3500'),('湖南师大附中','592 分','4212'),('长沙市一中','592 分','4212')]):
 y=266+i*102;b+=t(24,y+25,n,16,weight=500)+t(24,y+52,'第一批次 · '+s,12,'muted')+t(366,y+52,v+' 位',12,'blue').replace('x="366"','x="366" text-anchor="end"')+line(24,y+86,366,y+86)
b+=t(24,717,'* 部分高分位次参照2025年数据',11,'muted')
phone('07 参照｜实际学校与录取线','学校参照',b,footer=tabs('参照'))
# 08 settings
b=''.join(row(125+i*84,a,b,ic=c)for i,(a,b,c)in enumerate([('数据备份','导出 / 导入 JSON','cloud'),('所在学校','国防科大附属中学','school'),('参照数据','2026.CS.1','paper'),('数据说明','','paper')]))
phone('08 设置｜按需展开','成绩设置',b,True)
# 09 account
b=r(24,119,342,92,'paleGreen',12)+icon('user',40,139,size=30)+t(85,152,'用户 1',18,weight=600)+t(85,183,'账号设置 ›',13,'green')+row(240,'当前学生','学生 1',ic='user')
for i,(a,b,c)in enumerate([('学生管理','','user'),('云端同步','未开启','cloud'),('导入本机游客记录','','paper'),('共创点数','余额 12 点','coin'),('数据与隐私','','lock')]):b+=row(322+i*75,a,b,ic=c)
phone('09 我的｜统一账号与两个业务空间','我的',b,True)
# 10 login
b=icon('lock',24,151,'green',34)+t(24,221,'登录慧共创',25,weight=600)+r(24,367,19,19,'white',4,'line')+t(54,382,'已阅读并同意隐私说明',13,'muted')+button(418,'微信登录')+t(167,512,'暂不登录',14,'green')
phone('10 登录｜自主选择','登录',b,True)
# 11 materials stream
b=t(24,130,'校园运动会',20,weight=600)+t(24,156,'收集中 · 发起人',12,'green')+r(24,176,342,38,'paleSand',8)+t(38,200,'活动公告',13,'sand')+t(322,200,'成员 ›',12,'green')
b+=r(24,239,294,122,'white',12,'line')+t(40,265,'成员 A',12,'muted')+t(40,294,'接力赛最后一棒完成交接。',14)+t(40,337,'10:24',11,'muted')
b+=r(72,387,294,147,'paleBlue',12)+t(88,413,'我',12,'blue')+r(88,429,74,60,'#DAE4EC',8)+icon('photo',113,447,'blue',24)+t(177,452,'终点合影',14)+t(88,515,'撤回',12,'green')
b+=r(0,626,390,94,'white')+r(24,642,290,48,'bg',10,'line')+t(38,671,'补充活动文字…',13,'muted')+icon('photo',331,653,'blue',24)
b+=r(24,725,342,52,'white')
for i,label in enumerate(['资料','素材','文章','管理']):b+=t(43+i*88,756,label,13,'green' if i==0 else 'muted')
phone('11 共创｜成员资料流','活动资料',b,True)
#12 selection
b=t(24,132,'素材整理',20,weight=600)+r(24,158,342,42,'paleSand',9)+t(38,185,'全部　　文字　　图片',13,'sand')
for i,(tx,st)in enumerate([('接力赛过程记录','自动选择'),('终点合影','指定采用'),('重复的合影照片','指定排除')]):
 y=222+i*137;b+=r(24,y,342,119,'white',12,'line')+r(40,y+18,18,18,'white',4,'line')+t(72,y+35,tx,14,weight=500)+t(40,y+77,st,12,'green')+icon('dots',324,y+58,'muted',22)
b+=button(698,'生成草稿')
phone('12 共创｜指定采用与排除','素材整理',b,True)
#13 generation / quote
b=t(24,133,'生成草稿',22,weight=600)+field(162,'文章长度','约 800 字　⌄')+field(211,'行文风格','自然温暖　⌄')+field(260,'选材方式','智能选材　⌄')+r(24,350,342,162,'paleSand',12)+t(42,384,'费用确认',16,weight=600)+t(42,418,'预计消耗',13,'muted')+t(293,418,'5 点',20,'sand',600)+t(42,455,'发起人可用点数',13,'muted')+t(308,455,'12 点',14)
phone('13 共创｜参数与必要费用确认','生成草稿',b,True,button(768,'确认生成'))
#14 editor
b=field(109,'文章标题','校园运动会')+t(24,188,'正文',13,'muted')+r(24,208,342,283,'white',12,'line')+t(40,243,'接力棒在跑道上传递。',15)+t(40,277,'大家用文字和照片，记录下',15)+t(40,311,'运动场上的精彩时刻。',15)+r(24,513,342,62,'paleSand',10)+t(40,549,'配图与图片说明',14)+icon('arrow',328,532,'sand',20)+row(594,'历史版本',ic='paper')+t(24,700,'定稿前需核对活动事实和使用资料',12,'muted')
phone('14 共创｜正文编辑与版本','编辑文章',b,True,button(768,'保存修改'))
#15 share final
b=t(24,138,'校园运动会',22,weight=600)+r(24,163,56,26,'paleGreen',7)+t(36,181,'已定稿',12,'green')+row(224,'核对采用资料',ic='paper')+row(310,'复制文章内容',ic='paper')+row(396,'公开分享链接','已开启，可主动关闭',ic='share')+row(482,'记录公众号发布链接',ic='share')+row(568,'关闭公开分享',ic='lock')
phone('15 共创｜复制与可撤销分享','文章与分享',b,True)
#16 activity permissions
b=t(24,135,'校园运动会',22,weight=600)+row(176,'活动信息','名称与说明',ic='paper')+row(259,'活动公告',ic='paper')+row(342,'成员与协作者','AI 点数消费授权单独管理',ic='user')+row(425,'邀请成员','邀请码 / 二维码 / 微信分享',ic='share')+row(508,'收集状态','收集中',ic='settings')+row(591,'点数明细','仅有权限时可用',ic='coin')
phone('16 共创｜成员与收集管理','活动管理',b,True)
#17 indicator
b=r(24,118,342,42,'paleBlue',9)+t(37,145,'录取线　　指标生对照　　规则要点',13,'blue')+row(180,'本校','国防科大附属中学',ic='school')+r(24,281,342,39,'paleGreen',9)+t(39,307,'四大本部　四大新校区　其他',12,'green')+r(24,350,342,170,'white',12,'line')+t(40,383,'雅礼中学',18,weight=600)+t(40,420,'指标计划',13,'muted')+t(303,420,'11 人',18,'blue')+t(40,458,'本校指标总数',13,'muted')+t(303,458,'56 人',14)+t(40,498,'2026 第一层次最低控制线：563 分',12,'muted')
phone('17 参照｜指标生对照','学校参照',b,footer=tabs('参照'))
#18 rules
b=r(24,118,342,42,'paleBlue',9)+t(37,145,'录取线　　指标生对照　　规则要点',13,'blue')+row(182,'指标生是校内竞争',right='＋')+row(267,'最低控制线不等于录取线',right='＋')+row(352,'不同年度使用各自参照数据',right='＋')
phone('18 参照｜按需阅读规则','学校参照',b,footer=tabs('参照'))
# Operational AI states follow existing backend status/feature guards.
b=t(24,139,'生成中',24,weight=600)+r(24,183,342,116,'paleSand',12)+icon('paper',43,205,'sand',30)+t(92,223,'校园运动会',16,weight=500)+t(92,254,'草稿生成任务',13,'muted')+t(24,354,'已提交　→　生成中　→　完成',14,'green')+row(418,'任务费用','已确认：5 点',ic='coin')
phone('19 共创｜任务状态','生成进度',b,True,button(768,'返回活动资料','white'))
b=icon('lock',24,158,'sand',36)+t(24,235,'AI 生成暂不可用',22,weight=600)+t(24,276,'可以继续收集和整理活动资料。',14,'muted')
phone('20 共创｜AI 未开启状态','生成草稿',b,True,button(768,'返回活动资料','white'))
# Build board and per-screen SVG files. Native text and vector source; only decoration is raster.
H=180+((len(P)+3)//4)*920
head=r(0,0,1824,H,'#F0F2ED')+t(48,64,'慧共创 2.3｜功能核对与视觉精修',32,weight=600)+t(48,103,'界面能力对照当前代码与确认需求；页面内数字仅为状态排版示例，不代表真实用户。',14,'muted')
for i,(color,label) in enumerate([('green','主操作'),('blue','成绩'),('sand','共创'),('purple','复盘')]):head+=r(48+i*170,127,18,18,color,5)+t(75+i*170,141,label,12,'muted')
board='<svg xmlns="http://www.w3.org/2000/svg" width="1824" height="'+str(H)+'" viewBox="0 0 1824 '+str(H)+'">'+head+''.join(s for _,s in P)+'</svg>'
(out/'hui-ui-2.3-board.svg').write_text(board)
# same grouped source in browser review, with no network dependencies
(out/'review.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>慧共创 2.3 功能核对稿</title><style>body{margin:0;background:#f0f2ed}svg{display:block;width:100%;height:auto}</style>'+board+'</html>')
print(json.dumps({'screens':len(P),'svgBytes':len(board.encode()),'path':str(out/'hui-ui-2.3-board.svg')},ensure_ascii=False))

(out/'screens').mkdir(exist_ok=True)
for idx,(name,g) in enumerate(P):
 x=48+(idx%4)*438;y=180+(idx//4)*920
 (out/'screens'/f'{idx+1:02d}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="{x} {y} 390 844">'+g+'</svg>')
