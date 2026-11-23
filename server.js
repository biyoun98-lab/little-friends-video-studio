import express from "express";
const app=express();
app.use(express.json({limit:"1mb"}));
const PORT=process.env.PORT||3000;
const FAL_KEY=process.env.FAL_KEY;
const DEFAULT_MODEL=process.env.FAL_VIDEO_MODEL;
const allowedHost="queue.fal.run";
function modelId(value){const id=(value||DEFAULT_MODEL||"").trim();if(!/^[a-zA-Z0-9._/-]+$/.test(id)||id.startsWith("/")||id.includes(".."))throw new Error("Set a valid FAL_VIDEO_MODEL on the server.");return id}
app.post("/api/generate",async(req,res)=>{try{
 if(!FAL_KEY)return res.status(503).json({error:"AI engine is not configured. Add FAL_KEY to the server environment."});
 const model=modelId(req.body.model);
 const prompt=String(req.body.prompt||"").trim();if(!prompt||prompt.length>4000)return res.status(400).json({error:"Prompt must be between 1 and 4000 characters."});
 const duration=Math.min(15,Math.max(1,Number(req.body.duration)||8));
 const aspect=["9:16","16:9","1:1"].includes(req.body.aspect_ratio)?req.body.aspect_ratio:"9:16";
 const response=await fetch("https://"+allowedHost+"/"+model,{method:"POST",headers:{"Authorization":"Key "+FAL_KEY,"Content-Type":"application/json"},body:JSON.stringify({prompt,duration,aspect_ratio:aspect})});
 const data=await response.json();if(!response.ok)return res.status(response.status).json({error:data.detail||data.message||"fal.ai rejected the request",details:data});
 res.json({request_id:data.request_id,status_url:data.status_url});
 }catch(e){res.status(400).json({error:e.message})}});
app.get("/api/status",async(req,res)=>{try{
 if(!FAL_KEY)return res.status(503).json({error:"AI engine is not configured."});
 const statusUrl=new URL(String(req.query.status_url||""));if(statusUrl.protocol!=="https:"||statusUrl.hostname!==allowedHost)return res.status(400).json({error:"Invalid provider status URL."});
 const r=await fetch(statusUrl,{headers:{"Authorization":"Key "+FAL_KEY}});const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data.detail||"Could not read provider status"});
 if(data.status!=="COMPLETED")return res.json({status:data.status});
 const responseUrl=new URL(String(data.response_url||""));if(responseUrl.protocol!=="https:"||responseUrl.hostname!==allowedHost)return res.status(502).json({error:"Invalid provider result URL."});
 const result=await fetch(responseUrl,{headers:{"Authorization":"Key "+FAL_KEY}});const output=await result.json();if(!result.ok)return res.status(result.status).json({error:"Could not retrieve generated video"});
 const videoUrl=output.video?.url||output.output?.video?.url||output.videos?.[0]?.url;
 if(!videoUrl)return res.status(502).json({error:"This model response did not contain a video URL. Check its output schema."});
 res.json({status:"COMPLETED",video_url:videoUrl});
 }catch(e){res.status(400).json({error:e.message})}});
app.use(express.static("."));
app.listen(PORT,()=>console.log("Little Friends Studio running on "+PORT));
