const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
function client(responses){
 const calls=[],window={ORDER_STORAGE:{url:'https://example.supabase.co',publishableKey:'public-key'}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../scripts/shared-orders.js'),'utf8'),{window,crypto:{randomUUID:()=> 'unique-id'},fetch:async(url,options)=>{calls.push({url,...options});const result=responses.shift();return {ok:result.status<400,status:result.status,text:async()=>result.body||''};}});
 return {api:window.SharedOrders,calls};
}
test('upload requires sign-in and supports empty metadata response',async()=>{
 const {api,calls}=client([{status:200,body:'{"access_token":"session"}'},{status:200,body:'{}'},{status:201}]);
 await assert.rejects(api.upload({name:'order.pdf'},'2026-10-06'),/Sign in/);
 await api.login('staff@example.com','password');await api.upload({name:'order.pdf'},'2026-10-06');
 assert.equal(calls.length,3);assert.equal(calls[1].headers.Authorization,'Bearer session');
 assert.equal(JSON.parse(calls[2].body).delivery_date,'2026-10-06');
});
test('failed metadata saves clean uploaded file instead of claiming success',async()=>{
 const {api,calls}=client([{status:200,body:'{"access_token":"session"}'},{status:200,body:'{}'},{status:403},{status:200,body:'[]'}]);
 await api.login('staff@example.com','password');await assert.rejects(api.upload({name:'order.pdf'},'2026-10-06'));
 assert.equal(calls.at(-1).method,'DELETE');
});
