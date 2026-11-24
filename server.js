import express from "express";
const app=express();
const PORT=process.env.PORT||3000;
const competitorChannels=[{"name":"Cocomelon – Nursery Rhymes","id":"UCbCmjCuTUZos6Inko4u57UQ"},{"name":"Super Simple Songs","id":"UCLsooMJoIpl_7ux2jvdPB-Q"},{"name":"Ms Rachel – Toddler Learning Videos","id":"UCG2CL6EUjG8TVT1Tpl9nJdg"},{"name":"Numberblocks","id":"UCPlwvN0w4qFSP1FllALB92w"},{"name":"Pinkfong – Baby Shark","id":"UCcdwLMPsaU2ezNSJU1nFoBQ"},{"name":"BabyBus","id":"UCpYye8D5fFMUPf9nSfgd4bA"},{"name":"Little Baby Bum","id":"UCKAqou7V9FAWXpZd9xtOg3Q"},{"name":"ChuChu TV","id":"UCBnZ16ahKA2DZ_T5W0FPUXg"},{"name":"Kidz Toons","id":"UCbnMgJ5FVXbeW1zWevN24tg"},{"name":"Bee TV","id":"UCZyzJreQEtHYXw_eOgcIwRg"},{"name":"Chloe and Koko TV","id":"UCgqiSokOr9E86J0See4Gkmw"},{"name":"Playful Animals","id":"UCJ4gmhNe7CTu-3VbtWCkomA"},{"name":"Bunny ABC Kids","id":"UC71PNUaS-TtKtxav2M5FzJA"},{"name":"Lily's World","id":"UCw3UI5p2X9Ea91Snah06IcQ"},{"name":"KidsMegaHub","id":"UClwE4BXcILf_DsqDTxMEDmA"},{"name":"Jad Learning World","id":"UCOSMzc-1mNqJorB3QimIuQQ"},{"name":"Bubble Toon TV","id":"UCqaEKpifOifDJHFflcH65vQ"},{"name":"ZOOZIVA TV","id":"UCMXuXWog44c-OhT4RuCqftg"},{"name":"Kiddies Kito World","id":"UCM8xsWTfl6rZKy58brPoSyg"},{"name":"ABC Luma","id":"UCYVnuLz7Tx53Y2Ciq4KGf6w"},{"name":"Indra Bikin Rusuh","id":"UCiDwAnb2UWMqX0UgN06zIBg"},{"name":"The Smile Brothers","id":"UC2US4TU1bPVDEgUvGmUb9YQ"},{"name":"NVN KIDS TV","id":"UCFrbMMZhBfZ4J3XI97Od5ow"},{"name":"Pip the Kiwi","id":"UCZedmr5a3IeOQbtWbF4Paxg"},{"name":"MoodNMotion","id":"UCvXRcORuGSjLknV2Wbm-0zQ"},{"name":"Pinky Corner","id":"UCfY2ICJVnaDiYO5_8WMGcBA"},{"name":"Bumble Bloom Kids","id":"UCXjct7TtEtTdj0Bg5Fu8Y9w"}];
let competitorCache={at:0,data:null};
const CACHE_MS=15*60*1000;
app.use(express.json({limit:"1mb"}));
function decodeXml(value=""){return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
function tagValue(xml,tag){
 const open="<"+tag,close="</"+tag+">",start=xml.indexOf(open);
 if(start<0)return "";
 const openEnd=xml.indexOf(">",start),end=xml.indexOf(close,openEnd+1);
 if(openEnd<0||end<0)return "";
 return decodeXml(xml.slice(openEnd+1,end).replace("<![CDATA[","").replace("]]>","").trim());
}
async function fetchCompetitorChannel(channel){
 const url="https://www.youtube.com/feeds/videos.xml?channel_id="+encodeURIComponent(channel.id);
 const response=await fetch(url,{headers:{"User-Agent":"LittleFriendsStudio/1.0 (+public YouTube RSS reader)"}});
 if(!response.ok)throw new Error("HTTP "+response.status);
 const xml=await response.text();
 const entries=xml.split("<entry>").slice(1).map(part=>"<entry>"+part.split("</entry>")[0]+"</entry>");
 return entries.slice(0,15).map(entry=>{
  const videoId=tagValue(entry,"yt:videoId"),title=tagValue(entry,"title"),published=tagValue(entry,"published");
  return videoId?{channel:channel.name,title,published,url:"https://www.youtube.com/watch?v="+videoId,videoId}:null;
 }).filter(Boolean);
}
app.get("/api/health",(req,res)=>res.json({ok:true,mode:"free-browser-renderer+public-youtube-rss+freellmapi",competitorChannels:competitorChannels.length,ai:{provider:"FreeLLMAPI",configured:Boolean(process.env.FREELLMAPI_API_KEY),model:process.env.FREELLMAPI_MODEL||"auto"}}));
app.get("/api/ai/status",(req,res)=>res.json({provider:"FreeLLMAPI",configured:Boolean(process.env.FREELLMAPI_API_KEY),model:process.env.FREELLMAPI_MODEL||"auto",baseUrl:(process.env.FREELLMAPI_BASE_URL||"http://127.0.0.1:3001/v1").replace(/\/$/,"")}));
app.post("/api/ai/story",async(req,res)=>{
 const apiKey=process.env.FREELLMAPI_API_KEY;
 if(!apiKey)return res.status(503).json({error:"FreeLLMAPI is not configured yet. Add FREELLMAPI_API_KEY to the server environment; never put it in browser code."});
 const {title="",goal="",language="en",duration=45,characters="",tone="Warm, cheerful, gentle"}=req.body||{};
 if(typeof title!=="string"||typeof goal!=="string"||typeof characters!=="string")return res.status(400).json({error:"Invalid episode input."});
 const base=(process.env.FREELLMAPI_BASE_URL||"http://127.0.0.1:3001/v1").replace(/\/$/,"");
 const model=process.env.FREELLMAPI_MODEL||"auto";
 const system="You are the original preschool story editor for Little Friends World. Create original, gentle, age-appropriate stories for ages 2–6. Never imitate named competitor content. Preserve the supplied character designs. Return ONLY valid JSON with keys title, learningGoal, scenes. scenes must be exactly four arrays of three strings: [short heading, child-friendly action/dialogue, concise visual direction]. No markdown fences.";
 const user=`Create one original ${duration}-second preschool episode. Language: ${language}. Title idea: ${title}. Learning goal: ${goal}. Tone: ${tone}. Character bible: ${characters}. Include a curiosity hook, discovery, practice, and reassuring resolution. Keep each dialogue scene under 28 words. Avoid unsafe actions, frightening imagery, copyrighted characters, existing songs, or copied scripts.`;
 try{
  const upstream=await fetch(base+"/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model,messages:[{role:"system",content:system},{role:"user",content:user}],temperature:0.75,max_tokens:1200}),signal:AbortSignal.timeout(65000)});
  const payload=await upstream.json().catch(()=>({}));
  if(!upstream.ok)return res.status(502).json({error:"FreeLLMAPI upstream error ("+upstream.status+"): "+String(payload.error?.message||payload.message||"request failed").slice(0,300)});
  const raw=payload.choices?.[0]?.message?.content;
  if(typeof raw!=="string")return res.status(502).json({error:"FreeLLMAPI returned no text content."});
  const clean=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  const story=JSON.parse(clean);
  if(!story||typeof story.title!=="string"||!Array.isArray(story.scenes)||story.scenes.length!==4||story.scenes.some(s=>!Array.isArray(s)||s.length!==3||s.some(v=>typeof v!=="string")))return res.status(502).json({error:"AI response did not match the required four-scene story format."});
  return res.json({provider:"FreeLLMAPI",model:payload.model||model,story:{title:story.title,learningGoal:String(story.learningGoal||goal),scenes:story.scenes}});
 }catch(error){return res.status(502).json({error:error.name==="TimeoutError"?"FreeLLMAPI request timed out.":"Could not reach FreeLLMAPI: "+String(error.message||error).slice(0,220)});}
});
app.get("/api/competitors/latest",async(req,res)=>{
 if(competitorCache.data&&Date.now()-competitorCache.at<CACHE_MS)return res.json({...competitorCache.data,cached:true});
 const allChannels=competitorChannels;
 const results=await Promise.allSettled(allChannels.map(fetchCompetitorChannel));
 const videos=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
 const channelsOk=results.filter(r=>r.status==="fulfilled").length;
 const failed=results.map((r,i)=>r.status==="rejected"?allChannels[i].name:null).filter(Boolean);
 const data={fetched_at:new Date().toISOString(),channels_total:allChannels.length,channels_ok:channelsOk,channels_failed:failed,videos:videos.sort((a,b)=>b.published.localeCompare(a.published))};
 if(!videos.length)return res.status(502).json({error:"لم تُرجع YouTube RSS أي فيديو في هذا التحديث. حاول لاحقاً.",channels_failed:failed});
 competitorCache={at:Date.now(),data};
 return res.json({...data,cached:false});
});
app.use(express.static("."));
app.listen(PORT,()=>console.log("Little Friends free studio running on "+PORT));
