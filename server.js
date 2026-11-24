import express from "express";
const app=express();
const PORT=process.env.PORT||3000;
const competitorChannels=[{"name":"Kidz Toons","id":"UCbnMgJ5FVXbeW1zWevN24tg"},{"name":"Bee TV","id":"UCZyzJreQEtHYXw_eOgcIwRg"},{"name":"Chloe and Koko TV","id":"UCgqiSokOr9E86J0See4Gkmw"},{"name":"Playful Animals","id":"UCJ4gmhNe7CTu-3VbtWCkomA"},{"name":"Bunny ABC Kids","id":"UC71PNUaS-TtKtxav2M5FzJA"},{"name":"Lily's World","id":"UCw3UI5p2X9Ea91Snah06IcQ"},{"name":"KidsMegaHub","id":"UClwE4BXcILf_DsqDTxMEDmA"},{"name":"Jad Learning World","id":"UCOSMzc-1mNqJorB3QimIuQQ"},{"name":"Bubble Toon TV","id":"UCqaEKpifOifDJHFflcH65vQ"},{"name":"ZOOZIVA TV","id":"UCMXuXWog44c-OhT4RuCqftg"},{"name":"Kiddies Kito World","id":"UCM8xsWTfl6rZKy58brPoSyg"},{"name":"ABC Luma","id":"UCYVnuLz7Tx53Y2Ciq4KGf6w"},{"name":"Indra Bikin Rusuh","id":"UCiDwAnb2UWMqX0UgN06zIBg"},{"name":"The Smile Brothers","id":"UC2US4TU1bPVDEgUvGmUb9YQ"},{"name":"NVN KIDS TV","id":"UCFrbMMZhBfZ4J3XI97Od5ow"},{"name":"Pip the Kiwi","id":"UCZedmr5a3IeOQbtWbF4Paxg"},{"name":"MoodNMotion","id":"UCvXRcORuGSjLknV2Wbm-0zQ"},{"name":"Pinky Corner","id":"UCfY2ICJVnaDiYO5_8WMGcBA"},{"name":"Bumble Bloom Kids","id":"UCXjct7TtEtTdj0Bg5Fu8Y9w"}];
let competitorCache={at:0,data:null};
const CACHE_MS=15*60*1000;
app.use(express.json({limit:"1mb"}));
function decodeXml(value=""){return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
function tagValue(xml,tag){const match=xml.match(new RegExp("<"+tag+"[^>]*>([\\s\\S]*?)</"+tag+">","i"));return match?decodeXml(match[1].replace(/<!\\[CDATA\\[|\\]\\]>/g,"").trim()):"";}
async function fetchCompetitorChannel(channel){
 const url="https://www.youtube.com/feeds/videos.xml?channel_id="+encodeURIComponent(channel.id);
 const response=await fetch(url,{headers:{"User-Agent":"LittleFriendsStudio/1.0 (+public YouTube RSS reader)"}});
 if(!response.ok)throw new Error("HTTP "+response.status);
 const xml=await response.text(),entries=xml.match(/<entry>[\\s\\S]*?<\\/entry>/g)||[];
 return entries.slice(0,15).map(entry=>{const videoId=tagValue(entry,"yt:videoId"),title=tagValue(entry,"title"),published=tagValue(entry,"published");return videoId?{channel:channel.name,title,published,url:"https://www.youtube.com/watch?v="+videoId,videoId}:null;}).filter(Boolean);
}
app.get("/api/health",(req,res)=>res.json({ok:true,mode:"free-browser-renderer+public-youtube-rss",competitorChannels:competitorChannels.length}));
app.get("/api/competitors/latest",async(req,res)=>{
 if(competitorCache.data&&Date.now()-competitorCache.at<CACHE_MS)return res.json({...competitorCache.data,cached:true});
 const results=await Promise.allSettled(competitorChannels.map(fetchCompetitorChannel));
 const videos=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
 const channelsOk=results.filter(r=>r.status==="fulfilled").length;
 const failed=results.map((r,i)=>r.status==="rejected"?competitorChannels[i].name:null).filter(Boolean);
 const data={fetched_at:new Date().toISOString(),channels_total:competitorChannels.length,channels_ok:channelsOk,channels_failed:failed,videos:videos.sort((a,b)=>b.published.localeCompare(a.published))};
 if(!videos.length)return res.status(502).json({error:"لم تُرجع YouTube RSS أي فيديو في هذا التحديث. حاول لاحقاً.",channels_failed:failed});
 competitorCache={at:Date.now(),data};return res.json({...data,cached:false});
});
app.use(express.static("."));app.listen(PORT,()=>console.log("Little Friends free studio running on "+PORT));
