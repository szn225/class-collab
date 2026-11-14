// Visual fixtures only: no generation, article saves, or production writes.
const automator=require('/private/tmp/hui-layout-verify/node_modules/miniprogram-automator')
const path=require('node:path'),assert=require('node:assert/strict')
async function main(){
 const mini=await automator.launch({cliPath:'/Applications/wechatwebdevtools.app/Contents/MacOS/cli',projectPath:process.env.HUI_DEVICE_PROJECT,port:9442,trustProject:true,timeout:45000})
 try {
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'排版样例测试'}})
  console.log('Request isolation ready');const p=await mini.reLaunch('/pages/co-create/index');console.log('Article page opened');await p.waitFor(1000)
  console.log('Applying sample');await p.setData({screen:'article',title:'文章',loading:false,busy:false,error:'',activity:{name:'春日共创',manager:false,role:'participant'},article:{title:'把春天写进我们的故事',body:'春风拂过校园，大家带着各自的观察与期待相聚。我们用文字和照片，记录这段值得珍藏的时光。\n\n一、在阳光下相遇\n\n清晨的操场上，同学们一起布置活动场地。有人整理桌椅，有人分发材料，忙碌的身影为校园增添了生机。\n\n大家把途中看到的花草、听到的笑声写在卡片上，让每一份小小的发现，都成为共同的回忆。\n\n> 美好的故事，来自每个人真实的记录。\n\n活动结束后，我们把这些片段放在一起。这份共同完成的记录，也将陪伴我们走向下一次相聚。',images:[],statusText:'草稿',revision:1}})
  console.log('Sample ready');for(const theme of ['forest','warm','blue']){
   console.log('Rendering '+theme);await p.callMethod('chooseArticleTheme',{currentTarget:{dataset:{theme}}});await p.waitFor(500)
   assert.equal(await p.data('articleTheme'),theme)
   assert.equal((await p.$$('.article-style-option')).length,3)
   await mini.evaluate(()=>wx.pageScrollTo({scrollTop:0,duration:0}));await p.waitFor(250)
   await mini.screenshot({path:path.resolve(__dirname,'../docs/device-test/release-2.4.2/style-'+theme+'.png')})
  }
  console.log('PASS native article renders three switchable decoration themes')
 }finally{try{await mini.restoreWxMethod('request');await mini.reLaunch('/pages/home/index')}finally{await mini.disconnect()}}
}
main().catch(e=>{console.error(e);process.exitCode=1})
