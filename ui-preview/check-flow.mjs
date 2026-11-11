// 在 ego-browser nodejs 中运行；使用已打开的验收空间。
const t=await taskSpace(4);const p=t.page('p1');await p.reload();
const results=await p.evaluate(()=>{
 const out=[];const check=(name,ok)=>{out.push({name,ok});if(!ok)throw new Error(name)};
 $('#consent').checked=true;loginMobile();$('#myName').value='林晓';finishLogin();check('登录并填写姓名',demo.signed&&demo.screen==='home');
 nav('create');check('创建只包含名称与说明',$('.flow-body').querySelectorAll('input,textarea').length===2);$('#simpleName').value='完整流程测试';$('#simpleDesc').value='测试资料收集';createSimpleActivity();check('新活动无预置文章与素材',act().article===null&&act().materials.length===0);
 nav('stream');demo.draftMessage='我们一起完成了自然观察。';demo.scenario='发送失败';sendMobileMessage();check('失败保留输入',demo.draftMessage==='我们一起完成了自然观察。'&&act().materials.length===0);closeModal();demo.scenario='正常';sendMobileMessage();return out;
});
await p.waitForFunction(()=>!demo.sending);
console.log(results);
console.log(await p.evaluate(()=>{const out=[];out.push({name:'发送成功',ok:act().materials.length===1});prepareGeneration();prepareQuote();let before=demo.balance;startMobileTask();out.push({name:'冻结后创建任务',ok:demo.balance===before-demo.quote&&demo.frozen===demo.quote});return out}));
await p.waitForFunction(()=>demo.task.stage==='成功');
console.log(await p.evaluate(()=>{const out=[];out.push({name:'任务成功结算且不停止收集',ok:demo.frozen===0&&act().article!==null&&act().status==='收集中'});nav('article');openEditor();$('#articleTitle').value='人工修改标题';saveMobileArticle();out.push({name:'人工保存保留旧版本',ok:act().article.title==='人工修改标题'&&act().article.versions.length===1});demo.role='参与者';demo.screen='stream';render();out.push({name:'参与者不显示选材和管理',ok:!$('.activity-shortcuts').textContent.includes('选材')&&!$('.activity-shortcuts').textContent.includes('管理')});demo.id='a1';demo.role='协作者';out.push({name:'协作者默认未授权',ok:!canAI()});demo.role='发起人';demo.screen='quote';demo.scenario='点数不足';render();out.push({name:'余额不足阻止确认',ok:!$('.flow-body').textContent.includes('确认并生成')});demo.scenario='正常';demo.screen='home';render();return out}));
await p.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
console.log(await p.evaluate(()=>{const screens=['home','stream','materials','settings','collaborators','quote','article','share','profile','points'];const out=[];for(const s of screens){demo.screen=s;render();out.push({screen:s,width:innerWidth,scroll:document.documentElement.scrollWidth})}demo.screen='home';render();return out}));
console.log(await p.screenshot({path:'/Users/xiao/项目/班级共创/ui-preview/preview-full-mobile.png'}));
await p.cdp('Emulation.clearDeviceMetricsOverride');
