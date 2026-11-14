// Use integer tenths for arithmetic while retaining point-valued API/storage fields.
// Existing whole-point accounts and immutable historical ledgers need no rescaling.
export function pointUnits(value: number): number {
 const units=Math.round(value*10)
 if(!Number.isFinite(value)||!Number.isSafeInteger(units)||Math.abs(units/10-value)>1e-9)throw new Error('点数精度须为 0.1 点')
 return units
}
export const billingDefaults={usageBillingEnabled:false,pointsPerYuan:100,serviceMarkupBps:20000,writingCacheInputCentsPerMillion:4}
type Row=Record<string,any>
function integer(value:unknown):value is number{return Number.isSafeInteger(value)&&Number(value)>=0}
// Cost unit: one millionth of one cent. Round only once, at final point settlement.
export function usageCost(usage:Row[],config:Row):bigint|null {
 if(!usage.length)return null
 let cost=BigInt(0)
 for(const u of usage){
  if(!['writing','vision','layout'].includes(u.kind)||!integer(u.prompt_tokens)||!integer(u.completion_tokens))return null
  const prefix=u.kind==='layout'?'writing':u.kind
  const input=config[prefix+'InputCentsPerMillion'],output=config[prefix+'OutputCentsPerMillion']
  const hit=u.prompt_cache_hit_tokens??u.prompt_tokens_details?.cached_tokens??0
  const cache=config[prefix+'CacheInputCentsPerMillion']??input
  if(!integer(input)||!integer(output)||!integer(cache)||!integer(hit)||hit>u.prompt_tokens)return null
  cost+=BigInt(u.prompt_tokens-hit)*BigInt(input)+BigInt(hit)*BigInt(cache)+BigInt(u.completion_tokens)*BigInt(output)
 }
 return cost
}
export function pointsForCost(cost:bigint,config:Row):number {
 if(!integer(config.pointsPerYuan)||config.pointsPerYuan===0||!integer(config.serviceMarkupBps)||config.serviceMarkupBps<10000)throw new Error('动态计价规则未配置')
 const scale=config.pointStep===1?1:10
 const numerator=cost*BigInt(config.pointsPerYuan)*BigInt(config.serviceMarkupBps)*BigInt(scale)
 const denominator=BigInt(1000000)*BigInt(100)*BigInt(10000)
 const units=(numerator+denominator-BigInt(1))/denominator
 if(units>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('计费金额超限')
 return Number(units)/scale
}
export function quoteBilling(q:Row,inputBound:number):Row {
 const c=q.config
 if(!c.usageBillingEnabled)return {billingMode:'fixed'}
 const layoutCost=q.withLayout?BigInt(q.layoutInputBound)*BigInt(c.writingInputCentsPerMillion)+BigInt(c.layoutMaxOutput)*BigInt(c.writingOutputCentsPerMillion):BigInt(0)
 const maxCost=layoutCost+BigInt(inputBound)*BigInt(c.writingInputCentsPerMillion)+BigInt(c.maxOutput)*BigInt(c.writingOutputCentsPerMillion)+BigInt(q.uncached.length)*BigInt(c.visionImageMaxCents)*BigInt(1000000)
 // Estimate from content bytes and target length, without a separate paid model call.
 const sourceBytes=Buffer.byteLength(JSON.stringify(q.snapshot),'utf8')
 const estimateInput=Math.min(inputBound,Math.ceil(sourceBytes/2)+1500+q.uncached.length*1000)
 const estimateOutput=Math.min(c.maxOutput,Math.ceil(q.length*(q.kind==='layout'?4:2))+500)
 const estimateLayoutCost=q.withLayout?BigInt(Math.min(q.layoutInputBound,q.length*3+q.snapshot.materials.reduce((n:number,m:Row)=>n+m.images.length,0)*1500+2500))*BigInt(c.writingInputCentsPerMillion)+BigInt(Math.min(c.layoutMaxOutput,q.length*3+2000))*BigInt(c.writingOutputCentsPerMillion):BigInt(0)
 const estimateCost=estimateLayoutCost+BigInt(estimateInput)*BigInt(c.writingInputCentsPerMillion)+BigInt(estimateOutput)*BigInt(c.writingOutputCentsPerMillion)+BigInt(q.uncached.length)*BigInt(c.visionImageMaxCents)*BigInt(1000000)
 return {billingMode:'usage',price:pointsForCost(maxCost,c),estimatedPoints:pointsForCost(estimateCost,c),billingRates:{pointsPerYuan:c.pointsPerYuan,serviceMarkupBps:c.serviceMarkupBps,inputCentsPerMillion:c.writingInputCentsPerMillion,outputCentsPerMillion:c.writingOutputCentsPerMillion,cacheInputCentsPerMillion:c.writingCacheInputCentsPerMillion??c.writingInputCentsPerMillion}}
}
export function settlement(t:Row):Row {
 if(t.billingMode!=='usage')return {chargedPoints:t.price,returnedPoints:0}
 const cost=usageCost(t.usage||[],t.config)
 // Missing/unverifiable metering is borne by the platform, never charged at the cap.
 const calculated=cost===null?0:pointsForCost(cost,t.config)
 const chargedPoints=Math.min(calculated,t.price)
 return {chargedPoints,returnedPoints:(pointUnits(t.price)-pointUnits(chargedPoints))/10,billingVerified:cost!==null,calculatedPoints:calculated,platformCoveredPoints:(pointUnits(calculated)-pointUnits(chargedPoints))/10}
}
