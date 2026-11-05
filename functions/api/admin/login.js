import{response,digest,safeEqual,hashPassword,signSession,cookie,allowOrigin}from "../../_shared/auth.js";
export async function onRequestPost({request,env}){
 if(!allowOrigin(request))return response({error:"Invalid origin"},403);
 if(!env.DB||!env.ADMIN_USERNAME||!env.ADMIN_PASS_SALT||!env.ADMIN_PASS_HASH||!env.ADMIN_SESSION_KEY)return response({error:"Administrator access not configured"},503);
 if(Number(request.headers.get("content-length")||0)>3000)return response({error:"Invalid request"},413);
 let data;try{data=await request.json()}catch{return response({error:"Invalid request"},400)}
 const username=typeof data.username==="string"?data.username.trim():"";
 const password=typeof data.password==="string"?data.password:"";
 if(username.length>100||password.length>256)return response({error:"Invalid credentials"},401);
 const ip=request.headers.get("CF-Connecting-IP")||"unknown",bucket=await digest("northsouth-admin:"+ip);
 const now=Math.floor(Date.now()/1000);
 try{
  const existing=await env.DB.prepare("SELECT count,expires_at FROM admin_login_attempts WHERE bucket=?").bind(bucket).first();
  if(existing&&existing.expires_at>now&&existing.count>=8)return response({error:"Too many attempts. Try again later."},429);
  const candidate=await hashPassword(password,env.ADMIN_PASS_SALT);
  if(!safeEqual(username,env.ADMIN_USERNAME)||!safeEqual(candidate,env.ADMIN_PASS_HASH)){
   await env.DB.prepare("INSERT INTO admin_login_attempts(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=?").bind(bucket,now+1800,now,now+1800).run();
   return response({error:"Invalid credentials"},401);
  }
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE bucket=?").bind(bucket).run();
  return response({ok:true,username},200,{"set-cookie":cookie(await signSession(env,username))});
 }catch{return response({error:"Authentication temporarily unavailable"},503)}
}
