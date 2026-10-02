(() => {
 const config=window.ORDER_STORAGE||{},base=(config.url||'').replace(/\/$/,'');
 let token='';
 const enabled=!!(base&&config.publishableKey);
 async function request(path,options={}){
  const response=await fetch(base+path,{...options,headers:{apikey:config.publishableKey,...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
  if(!response.ok)throw Error(response.status===401?'Sign in again to upload.':'Shared storage request failed. Check your connection and uploader access.');
  const body=await response.text();return body?JSON.parse(body):null;
 }
 window.SharedOrders={enabled,
  async login(email,password){const session=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});token=session.access_token;},
  async logout(){try{await request('/auth/v1/logout',{method:'POST'});}finally{token='';}},
  async list(){return request('/rest/v1/order_documents?select=delivery_date,file_name,object_path&order=delivery_date.asc');},
  url(path){return base+'/storage/v1/object/public/order-pdfs/'+path.split('/').map(encodeURIComponent).join('/');},
  async upload(file,date){
   if(!token)throw Error('Sign in to upload a shared PDF.');
   const path=date+'/'+crypto.randomUUID()+'.pdf';
   await request('/storage/v1/object/order-pdfs/'+path,{method:'POST',headers:{'Content-Type':'application/pdf'},body:file});
   try{await request('/rest/v1/order_documents',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({delivery_date:date,file_name:file.name,object_path:path})});}
   catch(error){
    try{await request('/storage/v1/object/order-pdfs',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});}catch{throw Error('Upload did not finish. Ask the administrator to remove the unlisted PDF from storage before retrying.');}
    throw error;
   }
  }
 };
})();
