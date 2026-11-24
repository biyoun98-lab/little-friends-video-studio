import express from "express";
import { timingSafeEqual } from "node:crypto";
const app=express();
const PORT=process.env.PORT||3000;
const AI_ENDPOINT="minimax/h3-max-turbo/text-to-video";
const recentAiSubmissions=new Map();
let aiUsageDay="";
let aiDailyCount=0;
const DAILY_AI_LIMIT=3;
app.use(express.json({limit:"1mb"}));

function validAiAccess(req){
  const supplied=Buffer.from(String(req.get("x-ai-access-code")||""));
  const expected=Buffer.from(String(process.env.AI_ACCESS_CODE||""));
  return expected.length>0&&supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
function resetDailyCounterIfNeeded(){
  const today=new Date().toISOString().slice(0,10);
  if(today!==aiUsageDay){aiUsageDay=today;aiDailyCount=0;}
}

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  mode:"free-browser-renderer+optional-cloud-ai",
  paidAI:!!process.env.FAL_KEY&&!!process.env.AI_ACCESS_CODE,
  aiVideoConfigured:!!process.env.FAL_KEY&&!!process.env.AI_ACCESS_CODE,
  aiVideoModel:AI_ENDPOINT
}));

app.post("/api/ai/video",async(req,res)=>{
  if(!process.env.FAL_KEY||!process.env.AI_ACCESS_CODE)return res.status(503).json({error:"Cloud AI is not configured. Add FAL_KEY and AI_ACCESS_CODE as private server environment variables."});
  if(!validAiAccess(req))return res.status(403).json({error:"Private studio access code is incorrect."});
  const prompt=typeof req.body?.prompt==="string"?req.body.prompt.trim():"";
  const duration=Number(req.body?.duration??5);
  const aspectRatio=req.body?.aspect_ratio??"9:16";
  if(!prompt||prompt.length>5000)return res.status(400).json({error:"Prompt must contain 1–5000 characters."});
  if(![5,10].includes(duration))return res.status(400).json({error:"Only 5- or 10-second draft requests are enabled in this version."});
  if(!["9:16","16:9","1:1"].includes(aspectRatio))return res.status(400).json({error:"Unsupported aspect ratio."});
  const clientIp=req.ip||req.socket.remoteAddress||"unknown";
  const last=recentAiSubmissions.get(clientIp)||0;
  if(Date.now()-last<60000)return res.status(429).json({error:"Please wait one minute before submitting another AI generation."});
  resetDailyCounterIfNeeded();
  if(aiDailyCount>=DAILY_AI_LIMIT)return res.status(429).json({error:"The studio has reached its limit of three AI drafts today. The free local renderer is still available."});
  try{
    const upstream=await fetch("https://queue.fal.run/"+AI_ENDPOINT,{
      method:"POST",
      headers:{Authorization:"Key "+process.env.FAL_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({prompt,prompt_expansion_mode:"balanced",duration,resolution:"768P",aspect_ratio:aspectRatio,enable_safety_checker:true})
    });
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return res.status(upstream.status).json({error:data.detail||data.error||"fal.ai rejected the request."});
    if(!data.request_id)return res.status(502).json({error:"fal.ai did not return a request ID."});
    recentAiSubmissions.set(clientIp,Date.now());
    aiDailyCount+=1;
    return res.status(202).json({status:data.status,request_id:data.request_id,model:AI_ENDPOINT,drafts_remaining_today:DAILY_AI_LIMIT-aiDailyCount});
  }catch(error){
    return res.status(502).json({error:"Could not reach the AI provider. Please try again later."});
  }
});

app.get("/api/ai/video/:requestId",async(req,res)=>{
  if(!process.env.FAL_KEY||!process.env.AI_ACCESS_CODE)return res.status(503).json({error:"Cloud AI is not configured."});
  if(!validAiAccess(req))return res.status(403).json({error:"Private studio access code is incorrect."});
  const requestId=req.params.requestId;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))
    return res.status(400).json({error:"Invalid request ID."});
  const base="https://queue.fal.run/"+AI_ENDPOINT+"/requests/"+requestId;
  try{
    const statusResponse=await fetch(base+"/status",{headers:{Authorization:"Key "+process.env.FAL_KEY}});
    const status=await statusResponse.json().catch(()=>({}));
    if(!statusResponse.ok)return res.status(statusResponse.status).json({error:status.detail||"Could not read AI job status."});
    if(status.status!=="COMPLETED")return res.json({status:status.status,request_id:requestId});
    const resultResponse=await fetch(base,{headers:{Authorization:"Key "+process.env.FAL_KEY}});
    const result=await resultResponse.json().catch(()=>({}));
    if(!resultResponse.ok)return res.status(resultResponse.status).json({error:result.detail||"AI result is not available."});
    return res.json({status:"COMPLETED",request_id:requestId,result});
  }catch(error){
    return res.status(502).json({error:"Could not retrieve the AI result."});
  }
});

app.use(express.static("."));
app.listen(PORT,()=>console.log("Little Friends studio running on "+PORT));
