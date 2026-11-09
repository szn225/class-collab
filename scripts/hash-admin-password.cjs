// Reads the password from stdin, never from shell arguments or logs.
// Example: read -s password; printf '%s' "$password" | node scripts/hash-admin-password.cjs
const {randomBytes,scryptSync}=require('node:crypto');let input=''
process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{input+=chunk;if(input.length>200)process.exit(1)})
process.stdin.on('end',()=>{input=input.replace(/\r?\n$/,'');if(input.length<14){console.error('请使用至少 14 个字符的密码');process.exitCode=1;return}const salt=randomBytes(24).toString('hex');process.stdout.write(salt+':'+scryptSync(input,salt,64).toString('hex')+'\n')})
