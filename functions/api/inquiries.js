const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const clean=(v,max)=>typeof v==="string"?v.trim().slice(0,max+1):"";
export async function onRequestPost({request,env}){
 if(!env.DB)return json({ok:false,error:"Inquiry service is unavailable"},503);
 const origin=request.headers.get("Origin");
 const allowed=new Set(["https://northsouthent-site.pages.dev","https://northsouthent.com","https://www.northsouthent.com"]);
 if(!origin||!allowed.has(origin))return json({ok:false,error:"Invalid request origin"},403);
 if(!(request.headers.get("content-type")||"").includes("application/json"))return json({ok:false,error:"Expected JSON"},415);
 if(Number(request.headers.get("content-length")||0)>10000)return json({ok:false,error:"Request too large"},413);
 let input;try{input=await request.json()}catch{return json({ok:false,error:"Invalid JSON"},400)}
 if(!input||typeof input!=="object")return json({ok:false,error:"Invalid submission"},400);
 if(clean(input.website,200))return json({ok:true,message:"Inquiry received"});
 const name=clean(input.name,100),email=clean(input.email,180),phone=clean(input.phone,40);
 const service=clean(input.service,80),message=clean(input.message,3000);
 if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>180||phone.length>40||!["Business Management","Marketing & Advertising","Business Consulting","Artist Management","Events & Nightlife","Project Management","Partnership","Other"].includes(service)||message.length<15||message.length>3000||input.consent!==true)
 return json({ok:false,error:"Please check all required fields and consent"},400);
 const now=Math.floor(Date.now()/1000),hour=Math.floor(now/3600);
 const ip=request.headers.get("CF-Connecting-IP")||"unknown";
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip+":"+hour+":northsouth"));
 const bucket=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
 try{
  await env.DB.prepare("INSERT INTO request_limits(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1,expires_at=excluded.expires_at").bind(bucket,now+7200).run();
  const rate=await env.DB.prepare("SELECT count FROM request_limits WHERE bucket=?").bind(bucket).first();
  if(rate&&rate.count>5)return json({ok:false,error:"Too many requests. Please try again later."},429);
  const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO inquiries(id,name,email,phone,service,message,consent) VALUES (?,?,?,?,?,?,1)").bind(id,name,email,phone,service,message).run();
  return json({ok:true,reference:id.slice(0,8).toUpperCase(),message:"Your inquiry has been received."},201)
 }catch(e){return json({ok:false,error:"Unable to save inquiry. Please try again."},503)}
}
export function onRequestGet(){return json({ok:false,error:"Method not allowed"},405)}
