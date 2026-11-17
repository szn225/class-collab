const {call}=require('../../utils/v2')
const {renderArticle}=require('../../utils/ai-article')
Page({
 data:{token:'',article:null,displayHtml:'',loading:true,error:'',unavailable:false},
 onLoad(options){this.setData({token:options.token||''});this.loadArticle()},
 onUnload(){this.disposed=true;this.sequence=(this.sequence||0)+1},
 async onPullDownRefresh(){try{await this.loadArticle()}finally{wx.stopPullDownRefresh()}},
 async loadArticle(){const sequence=this.sequence=(this.sequence||0)+1;this.setData({loading:true,error:'',article:null,displayHtml:'',unavailable:false});try{if(!/^[a-zA-Z0-9_-]{20,128}$/.test(this.data.token)){const error=new Error('文章未公开或分享已关闭');error.status=404;throw error}const article=await call('public.article',{token:this.data.token});if(this.disposed||sequence!==this.sequence)return;this.setData({article,displayHtml:renderArticle(article)});wx.setNavigationBarTitle({title:article.title||'文章'})}catch(e){if(!this.disposed&&sequence===this.sequence)this.setData({error:e.message||'文章暂时无法加载',unavailable:e.status===404})}finally{if(!this.disposed&&sequence===this.sequence)this.setData({loading:false})}},
 copyArticleLink(){if(!this.data.article||this.data.loading||this.data.error)return;wx.setClipboardData({data:getApp().globalData.baseUrl+'/s/'+this.data.token})},
 onShareAppMessage(){return this.data.article?{title:this.data.article.title,path:'/pages/shared-article/index?token='+encodeURIComponent(this.data.token),imageUrl:'/assets/redesign/collab-empty.png'}:{title:'慧共创',path:'/pages/home/index'}},
})
