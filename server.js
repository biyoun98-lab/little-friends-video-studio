import express from "express";
const app=express();
app.use(express.json({limit:"1mb"}));
const PORT=process.env.PORT||3000;
const FAL_KEY=process.env.FAL_KEY;
const MODEL=process.env.FAL_VIDEO_MODEL||"alibaba/wan-3.0-prime/text-to-video";
const QUEUE="https://queue.fal.run";
const jobs=new Map();
function safeModel(id){if(!/^[a-zA-Z0-9._/-]+$/.test(id)||id.startsWith("/")||id.includes(".."))throw new Error("Invalid FAL_VIDEO_MODEL.");return id}
function providerUrl(value){const u=new URL(String(value||""));if(u.protocol!=="https:"||u.hostname!=="queue.fal.run")throw new Error("Invalid provider URL.");return u}
app.get("/api/health",(req,res)=>res.json({ok:true,aiConfigured:Boolean(FAL_KEY),model:MODEL}));
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
