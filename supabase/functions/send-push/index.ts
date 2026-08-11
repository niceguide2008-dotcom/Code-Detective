import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:cors});

async function getAdmin(req:Request){
 const auth=req.headers.get("Authorization"); if(!auth) throw new Error("Missing authorization.");
 const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
 const {data,error}=await supabase.auth.getUser(); if(error||!data.user) throw new Error("Invalid session.");
 const {data:isAdmin,error:roleError}=await supabase.rpc("is_admin"); if(roleError||!isAdmin) throw new Error("Administrator access required.");
 return supabase;
}

serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 try{
  const supabase=await getAdmin(req); const body=await req.json();
  const ids=Array.isArray(body.recipientIds)?body.recipientIds.slice(0,500):[];
  if(!ids.length) return json({sent:0});
  const {data:tokens,error}=await supabase.from("device_push_tokens").select("token").in("user_id",ids);
  if(error) throw error;
  if(!tokens?.length) return json({sent:0,reason:"No registered Android devices."});

  const projectId=Deno.env.get("FIREBASE_PROJECT_ID");
  const clientEmail=Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw=Deno.env.get("FIREBASE_PRIVATE_KEY");
  if(!projectId||!clientEmail||!privateKeyRaw) return json({sent:0,configured:false,reason:"Firebase service-account secrets are not configured."});

  const pem=privateKeyRaw.replace(/\\n/g,"\n");
  const b64url=(bytes:Uint8Array)=>{let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");};
  const json64=(obj:any)=>b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const now=Math.floor(Date.now()/1000);
  const header=json64({alg:"RS256",typ:"JWT"});
  const claim=json64({iss:clientEmail,scope:"https://www.googleapis.com/auth/firebase.messaging",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600});
  const keyData=pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
  const der=Uint8Array.from(atob(keyData),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey("pkcs8",der,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(`${header}.${claim}`)));
  const jwt=`${header}.${claim}.${b64url(sig)}`;

  const tokenRes=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})});
  const tokenData=await tokenRes.json();
  if(!tokenRes.ok) return json({error:tokenData?.error_description||"Firebase token exchange failed."},502);

  let sent=0;
  for(const row of tokens){
    const r=await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,{
      method:"POST",
      headers:{Authorization:`Bearer ${tokenData.access_token}`,"Content-Type":"application/json"},
      body:JSON.stringify({message:{token:row.token,notification:{title:String(body.title||"Code Detective"),body:String(body.message||"")},data:{type:String(body.type||"general")}}})
    });
    if(r.ok) sent++;
  }
  return json({sent,total:tokens.length});
 }catch(e){return json({error:e?.message||"Unexpected error."},500);}
});
