import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

async function getAdmin(req:Request){
  const auth=req.headers.get("Authorization"); if(!auth) throw new Error("Missing authorization.");
  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
  const {data,error}=await supabase.auth.getUser(); if(error||!data.user) throw new Error("Invalid session.");
  const {data:isAdmin,error:roleError}=await supabase.rpc("is_admin");
  if(roleError || !isAdmin) throw new Error("Administrator access required.");
  return data.user;
}

function extractText(data:any):string {
  const content=data?.choices?.[0]?.message?.content;
  if(typeof content === "string") return content;
  if(Array.isArray(content)) return content.map((x:any)=>x?.text||"").join("");
  return "";
}

serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"POST required."},405);
  try{
    await getAdmin(req);
    const body=await req.json();
    const mode=body.mode==="assignment"?"assignment":"homework";
    const topic=String(body.topic||"").trim().slice(0,500);
    const subject=String(body.subject||"Java Programming").slice(0,200);
    const difficulty=String(body.difficulty||"Medium").slice(0,50);
    const count=Math.min(20,Math.max(1,Number(body.count||5)));
    if(!topic) return json({error:"Topic is required."},400);

    // All Code Detective AI features use the same OpenRouter provider.
    // Keep the key server-side in Supabase Edge Function secrets.
    const apiKey=Deno.env.get("OPENROUTER_API_KEY");
    if(!apiKey) return json({error:"Admin AI is not configured. Add OPENROUTER_API_KEY to Supabase Edge Function secrets."},503);

    const system=mode==="homework"
      ? "You generate rigorous but student-appropriate homework for Code Detective. Return ONLY valid JSON with keys topic, subject, difficulty, questions. Each question object must contain question, marks, difficulty, answer, explanation. Answers are teacher-facing."
      : "You generate student assignments for Code Detective. Return ONLY valid JSON with keys topic, subject, difficulty, questions. Each question object must contain question, marks, difficulty. Do NOT include answers.";
    const prompt=`Subject: ${subject}\nTopic: ${topic}\nDifficulty: ${difficulty}\nNumber of questions: ${count}\nGenerate ${mode} now.`;

    const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${apiKey}`,
        "HTTP-Referer":Deno.env.get("APP_URL")||"https://codedetective1913.netlify.app",
        "X-Title":"Code Detective AI Generator"
      },
      body:JSON.stringify({
        model:Deno.env.get("OPENROUTER_MODEL")||"openrouter/free",
        messages:[{role:"system",content:system},{role:"user",content:prompt}],
        temperature:0.4,
        response_format:{type:"json_object"}
      })
    });
    const data=await response.json();
    if(!response.ok) return json({error:data?.error?.message||data?.message||`AI provider returned HTTP ${response.status}.`},502);
    const raw=extractText(data).trim();
    let parsed; try{parsed=JSON.parse(raw)}catch{return json({error:"AI returned invalid structured data. Please try again."},502);}
    return json(parsed);
  }catch(e){return json({error:e?.message||"Unexpected error."},500);}
});
