import{response,cookie,allowOrigin}from "../../_shared/auth.js";
export function onRequestPost({request}){if(!allowOrigin(request))return response({error:"Invalid origin"},403);return response({ok:true},200,{"set-cookie":cookie("",0)})}
