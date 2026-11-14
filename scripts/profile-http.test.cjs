const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module'),{test}=require('node:test'),ts=require('../backend/node_modules/typescript'),root=path.resolve(__dirname,'..')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f)
const resolve=Module._resolveFilename;Module._resolveFilename=function(name,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,'backend/src',name.slice(2)):name,...args)}
const {NextRequest}=require('../backend/node_modules/next/server'),store=require('../backend/src/lib/v2/store.ts'),{initialState}=require('../backend/src/lib/v2/model.ts'),route=require('../backend/src/app/api/v2/[...path]/route.ts')
process.env.AUTH_SECRET='profile-fixture-'.repeat(4);process.env.WECHAT_APP_ID='fixture';process.env.WECHAT_APP_SECRET='fixture';process.env.NEXT_PUBLIC_SUPABASE_URL='https://storage.fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture'
let state={revision:0,state:initialState()},serial=0,headSize=4,signFail=false,headCalls=0
store.database.read=async()=>structuredClone(state);store.database.cas=async(revision,next)=>{if(state.revision!==revision)return false;state={revision:revision+1,state:structuredClone(next)};return true}
global.fetch=async(url,o={})=>{if(String(url).startsWith('https://api.weixin.qq.com/'))return Response.json({openid:new URL(url).searchParams.get('js_code')});assert.ok(String(url).startsWith('https://storage.fixture.invalid/storage/v1/'));if(o.method==='HEAD'){headCalls++;return new Response(null,{headers:{'Content-Length':String(headSize),'Content-Type':'image/png'}})}if(String(url).includes('/upload/sign/'))return Response.json({url:'/object/upload/sign/hui-materials/fixture?token=private'});if(String(url).includes('/object/sign/')){if(signFail)return new Response('',{status:503});return Response.json({signedURL:'/object/sign/hui-materials/fixture?token=private'})}throw Error('Unexpected transport')}
async function http(command,data={},token=''){const result=await route.POST(new NextRequest('http://localhost/api/v2/'+command.replaceAll('.','/'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({requestId:'profile_request_'+(++serial),...data})}),{params:{path:command.split('.')}});return {status:result.status,...await result.json()}}
test('avatar upload and profile save authenticate ownership, validate completed files, persist safely, and preserve old clients',async()=>{
 const a=(await http('auth.login',{code:'A'})).data,b=(await http('auth.login',{code:'B'})).data,token=a.token,balance=a.user.balance
 assert.equal((await http('profile.avatar.prepare',{size:4,mime:'image/png'})).status,401)
 assert.equal((await http('profile.avatar.prepare',{size:1048577,mime:'image/png'},token)).status,400)
 assert.equal((await http('profile.avatar.prepare',{size:4,mime:'image/svg+xml'},token)).status,400)
 const prepareBody={size:4,mime:'image/png',requestId:'avatar_prepare_fixed'},upload=(await http('profile.avatar.prepare',prepareBody,token)).data
 assert.ok(upload.path.startsWith('profiles/'+a.user.id+'/'));assert.equal(upload.activityId,null);assert.equal((await http('profile.avatar.prepare',prepareBody,token)).data.id,upload.id)
 assert.equal((await http('profile.update',{name:'新昵称',avatarUploadId:upload.id},token)).status,409);assert.equal((await http('me',{},token)).data.name,'')
 const n=headCalls;assert.equal((await http('profile.avatar.complete',{uploadId:upload.id},b.token)).status,409);assert.equal(headCalls,n)
 headSize=3;assert.equal((await http('profile.avatar.complete',{uploadId:upload.id},token)).status,409);assert.equal(state.state.uploads[0].complete,false);headSize=4
 assert.equal((await http('profile.avatar.complete',{uploadId:upload.id},token)).status,200)
 assert.equal((await http('profile.update',{avatarUploadId:upload.id},b.token)).status,409)
 const body={name:'微信昵称',avatarUploadId:upload.id,profileSetupDone:true,requestId:'avatar_save_fixed'},saved=await http('profile.update',body,token)
 assert.equal(saved.status,200);assert.equal(saved.data.name,'微信昵称');assert.ok(saved.data.avatarUrl.startsWith('https://storage.fixture.invalid/'));assert.equal(saved.data.avatarPath,undefined);assert.equal(saved.data.profileSetupDone,true);assert.equal(saved.data.balance,balance)
 assert.equal((await http('profile.update',body,token)).data.name,'微信昵称');assert.equal(state.state.users[0].avatarPath,upload.path)
 const relogin=(await http('auth.login',{code:'A'})).data;assert.equal(relogin.user.id,a.user.id);assert.ok(relogin.user.avatarUrl);assert.equal(relogin.user.balance,balance)
 const renamed=(await http('profile.update',{name:'旧客户端改名'},relogin.token)).data;assert.equal(renamed.name,'旧客户端改名');assert.ok(renamed.avatarUrl)
 const next=(await http('profile.avatar.prepare',{size:4,mime:'image/png'},token)).data;await http('profile.avatar.complete',{uploadId:next.id},token);await http('profile.update',{avatarUploadId:next.id},token);assert.equal(state.state.uploads.find(x=>x.id===upload.id).used,false)
 const other=(await http('me',{},b.token)).data;assert.equal(other.avatarUrl,undefined);assert.equal(other.name,'')
 signFail=true;const fallback=await http('me',{},token);assert.equal(fallback.status,200);assert.equal(fallback.data.avatarUrl,'');assert.equal(fallback.data.name,'旧客户端改名');signFail=false
 const spoof=await http('profile.update',{name:'仍然本人',avatarPath:'other/file.png',avatarUrl:'https://evil.invalid/image'},token);assert.equal(spoof.status,200);assert.equal(state.state.users[0].avatarPath,next.path)
 assert.equal(state.state.ledger.length,2);assert.equal(state.state.users[0].balance,balance)
})
