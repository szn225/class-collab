const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path')
const moduleShim={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../miniprogram/utils/v2.js'),'utf8'),{module:moduleShim,exports:moduleShim.exports,Error,Date,Math,Promise})
const classify=moduleShim.exports.networkFailure
assert.match(classify({errMsg:'request:fail url not in domain list'}).message,/域名/)
assert.match(classify({errMsg:'request:fail timeout'}).message,/超时/)
assert.match(classify({errMsg:'request:fail SSL certificate error'}).message,/安全连接/)
assert.match(classify({errMsg:'request:fail disconnected'}).message,/网络连接/)
console.log('PASS request failures distinguish domain whitelist, timeout, TLS and connectivity')
