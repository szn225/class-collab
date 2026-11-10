const catalog=require('../../assets/ui/icons/catalog')
Component({
 properties:{name:{type:String,value:''},size:{type:null,value:22},tone:{type:String,value:'default'},color:{type:String,value:''}},
 data:{src:'',dimension:'22px'},
 observers:{'name,size,tone,color'(){this.refresh()}},
 lifetimes:{attached(){this.refresh()}},
 methods:{
  refresh(){const raw=String(this.data.name||'').split('/').pop().replace(/\.svg$/,'');const name=catalog.aliases[raw]||raw;const tones={'#245d50':'accent','#ffffff':'on-accent','#fff':'on-accent','#126a32':'positive','#b91c1c':'negative'};const tone=tones[String(this.data.color||'').toLowerCase()]||this.data.tone;const chosen=catalog.tones.includes(tone)?tone:'default';const value=String(this.data.size||22);this.setData({src:catalog.names.includes(name)?'/assets/ui/icons/'+name+'-'+chosen+'.svg':'',dimension:/^\d+(?:\.\d+)?$/.test(value)?value+'px':value})},
  tap(e){this.triggerEvent('click',e.detail)}
 }
})
