import{response,authorized,allowOrigin}from "../../_shared/auth.js";
export async function onRequestGet({request,env}){
 if(!await authorized(request,env))return response({error:"Not authorized"},401);
 if(!env.DB)return response({error:"Database offline"},503);
 const counts=await env.DB.prepare("SELECT status,COUNT(*) AS total FROM inquiries GROUP BY status").all();
 const rows=await env.DB.prepare("SELECT id,created_at,name,email,phone,service,message,status FROM inquiries ORDER BY created_at DESC LIMIT 100").all();
 const totals={new:0,contacted:0,in_progress:0,closed:0};
 for(const x of counts.results||[])totals[x.status]=x.total;
 return response({ok:true,totals,inquiries:rows.results||[]});
}
export async function onRequestPatch({request,env}){
 if(!await authorized(request,env))return response({error:"Not authorized"},401);
 if(!allowOrigin(request))return response({error:"Invalid origin"},403);
 let body;try{body=await request.json()}catch{return response({error:"Invalid JSON"},400)}
 const statuses=["new","contacted","in_progress","closed"];
 if(!body||typeof body.id!=="string"||!statuses.includes(body.status)||!/^[-\da-f]{36}$/i.test(body.id))return response({error:"Invalid update"},400);
 const existing=await env.DB.prepare("SELECT status FROM inquiries WHERE id=?").bind(body.id).first();
 if(!existing)return response({error:"Not found"},404);
 if(existing.status===body.status)return response({ok:true,unchanged:true});
 await env.DB.batch([
  env.DB.prepare("UPDATE inquiries SET status=? WHERE id=?").bind(body.status,body.id),
  env.DB.prepare("INSERT INTO inquiry_events(id,inquiry_id,actor,from_status,to_status) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),body.id,env.ADMIN_USERNAME,existing.status,body.status)
 ]);
 return response({ok:true,status:body.status});
}
