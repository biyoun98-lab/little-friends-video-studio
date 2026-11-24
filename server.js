import express from "express";
const app=express();
app.use(express.json({limit:"1mb"}));
const PORT=process.env.PORT||3000;
const FAL_KEY=process.env.FAL_KEY;
const MODEL=process.env.FAL_VIDEO_MODEL||"alibaba/wan-3.0-prime/text-to-video";
const QUEUE="https://queue.fal.run";
const jobs=new Map();
const longcatJobs=new Map();
const LONGCAT_API_URL=process.env.LONGCAT_API_URL||"";
const LONGCAT_API_TOKEN=process.env.LONGCAT_API_TOKEN||"";
function longcatBase(){
 if(!LONGCAT_API_URL)return null;
 const u=new URL(LONGCAT_API_URL);
 if(u.protocol!=="https:" && !(u.protocol==="http:" && ["localhost","127.0.0.1"].includes(u.hostname)))throw new Error("LONGCAT_API_URL must use HTTPS (HTTP is allowed only for localhost).");
 if(u.username||u.password)throw new Error("Do not put credentials inside LONGCAT_API_URL.");
 return u.href.replace(/\\/$/,"");
}
function longcatHeaders(){return {"Content-Type":"application/json",...(LONGCAT_API_TOKEN?{"Authorization":"Bearer "+LONGCAT_API_TOKEN}:{})}}

function safeModel(id){if(!/^[a-zA-Z0-9._/-]+$/.test(id)||id.startsWith("/")||id.includes(".."))throw new Error("Invalid FAL_VIDEO_MODEL.");return id}
function providerUrl(value){const u=new URL(String(value||""));if(u.protocol!=="https:"||u.hostname!=="queue.fal.run")throw new Error("Invalid provider URL.");return u}
app.get("/api/health",(req,res)=>res.json({ok:true,aiConfigured:Boolean(FAL_KEY),model:MODEL,longcatConfigured:Boolean(LONGCAT_API_URL)}));
app.get("/api/longcat/health",(req,res)=>res.json({ok:true,configured:Boolean(LONGCAT_API_URL),engine:"LongCat-Video"}));
app.post("/api/longcat/generate",async(req,res)=>{try{
 const base=longcatBase();if(!base)return res.status(503).json({error:"LongCat GPU worker is not configured. Set LONGCAT_API_URL on the studio server."});
 const prompt=String(req.body.prompt||"").trim();if(!prompt||prompt.length>20000)return res.status(400).json({error:"Prompt must be between 1 and 20000 characters."});
 const duration=Number(req.body.duration)||5;if(!Number.isInteger(duration)||duration<2||duration>30)return res.status(400).json({error:"Duration must be an integer from 2 to 30 seconds."});
 const resolution=["480p","720p"].includes(req.body.resolution)?req.body.resolution:"480p";
 const aspect=["9:16","16:9","1:1"].includes(req.body.aspect_ratio)?req.body.aspect_ratio:"9:16";
 const response=await fetch(base+"/generate",{method:"POST",headers:longcatHeaders(),signal:AbortSignal.timeout(30000),body:JSON.stringify({prompt,duration,resolution,aspect_ratio:aspect})});
 const data=await response.json();if(!response.ok)return res.status(response.status).json({error:data.error||data.detail||"LongCat worker rejected the request."});
 if(!data.job_id)return res.status(502).json({error:"LongCat worker must return a job_id."});
 const requestId="longcat_"+crypto.randomUUID();longcatJobs.set(requestId,{base,workerJobId:String(data.job_id),createdAt:Date.now()});
 res.json({request_id:requestId});
 }catch(e){res.status(502).json({error:e.message||"LongCat worker is unavailable."})}});
app.get("/api/longcat/status",async(req,res)=>{try{
 const requestId=String(req.query.request_id||"");const job=longcatJobs.get(requestId);if(!job)return res.status(404).json({error:"LongCat job not found in this server session."});
 const response=await fetch(job.base+"/status/"+encodeURIComponent(job.workerJobId),{headers:longcatHeaders(),signal:AbortSignal.timeout(15000)});
 const data=await response.json();if(!response.ok)return res.status(response.status).json({error:data.error||data.detail||"Could not read LongCat job status."});
 const status=String(data.status||"").toLowerCase();
 if(status==="failed"){longcatJobs.delete(requestId);return res.json({status:"FAILED",error:data.error||"LongCat generation failed."})}
 if(status==="completed"){
  const videoUrl=new URL(String(data.video_url||""));if(videoUrl.protocol!=="https:"&&!(videoUrl.protocol==="http:"&&["localhost","127.0.0.1"].includes(videoUrl.hostname)))return res.status(502).json({error:"Worker returned an unsafe video URL."});
  longcatJobs.delete(requestId);return res.json({status:"COMPLETED",video_url:videoUrl.href});
 }
 if(!["queued","pending","running","processing"].includes(status))return res.status(502).json({error:"Worker returned an unknown job status."});
 res.json({status:status.toUpperCase()});
 }catch(e){res.status(502).json({error:e.message||"LongCat worker is unavailable."})}});

app.post("/api/generate",async(req,res)=>{try{
 if(!FAL_KEY)return res.status(503).json({error:"AI engine is not configured. Add FAL_KEY to the server environment."});
 const prompt=String(req.body.prompt||"").trim();if(!prompt||prompt.length>20000)return res.status(400).json({error:"Prompt must be between 1 and 20000 characters."});
 const duration=Number(req.body.duration)||5;if(!Number.isInteger(duration)||duration<2||duration>30)return res.status(400).json({error:"Duration must be an integer from 2 to 30 seconds."});
 const resolution=["480p","720p","1080p"].includes(req.body.resolution)?req.body.resolution:"480p";
 const aspect=["9:16","16:9","1:1","4:3","3:4","adaptive"].includes(req.body.aspect_ratio)?req.body.aspect_ratio:"9:16";
 const endpoint=safeModel(MODEL);
 const response=await fetch(QUEUE+"/"+endpoint,{method:"POST",headers:{"Authorization":"Key "+FAL_KEY,"Content-Type":"application/json"},body:JSON.stringify({prompt,resolution,aspect_ratio:aspect,duration,audio:false,enable_prompt_expansion:true,enable_thinking:false,enable_safety_checker:true})});
 const data=await response.json();if(!response.ok)return res.status(response.status).json({error:data.detail||data.message||"fal.ai rejected the request"});
 if(!data.request_id||!data.status_url)return res.status(502).json({error:"Provider did not return a valid queue job."});
 jobs.set(data.request_id,{statusUrl:providerUrl(data.status_url).href,responseUrl:data.response_url?providerUrl(data.response_url).href:null,createdAt:Date.now()});
 res.json({request_id:data.request_id});
 }catch(e){res.status(400).json({error:e.message})}});
app.get("/api/status",async(req,res)=>{try{
 if(!FAL_KEY)return res.status(503).json({error:"AI engine is not configured."});
 const id=String(req.query.request_id||"");const job=jobs.get(id);if(!job)return res.status(404).json({error:"Job not found in this server session. Start a new generation if needed."});
 const r=await fetch(job.statusUrl,{headers:{"Authorization":"Key "+FAL_KEY}});const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data.detail||"Could not read provider status"});
 if(data.status!=="COMPLETED"){if(data.status==="FAILED"){jobs.delete(id);return res.json({status:"FAILED",error:data.error||"Video generation failed."})}return res.json({status:data.status})}
 const responseUrl=providerUrl(data.response_url||job.responseUrl).href;
 const result=await fetch(responseUrl,{headers:{"Authorization":"Key "+FAL_KEY}});const output=await result.json();if(!result.ok)return res.status(result.status).json({error:"Could not retrieve generated video"});
 const videoUrl=output.video?.url||output.output?.video?.url||output.videos?.[0]?.url;
 if(!videoUrl)return res.status(502).json({error:"This model response did not contain a video URL."});
 jobs.delete(id);res.json({status:"COMPLETED",video_url:videoUrl});
 }catch(e){res.status(400).json({error:e.message})}});
app.use(express.static("."));
app.listen(PORT,()=>console.log("Little Friends Studio running on "+PORT));
