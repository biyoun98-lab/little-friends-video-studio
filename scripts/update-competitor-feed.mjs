import { mkdir, writeFile } from "node:fs/promises";

const fixedChannels=[
["Cocomelon – Nursery Rhymes","UCbCmjCuTUZos6Inko4u57UQ"],
["Super Simple Songs","UCLsooMJoIpl_7ux2jvdPB-Q"],
["Ms Rachel – Toddler Learning Videos","UCG2CL6EUjG8TVT1Tpl9nJdg"],
["Numberblocks","UCPlwvN0w4qFSP1FllALB92w"],
["Pinkfong – Baby Shark","UCcdwLMPsaU2ezNSJU1nFoBQ"],
["BabyBus","UCpYye8D5fFMUPf9nSfgd4bA"],
["Little Baby Bum","UCKAqou7V9FAWXpZd9xtOg3Q"],
["ChuChu TV","UCBnZ16ahKA2DZ_T5W0FPUXg"],
["Kidz Toons","UCbnMgJ5FVXbeW1zWevN24tg"],
["Bee TV","UCZyzJreQEtHYXw_eOgcIwRg"],
["Chloe and Koko TV","UCgqiSokOr9E86J0See4Gkmw"],
["Playful Animals","UCJ4gmhNe7CTu-3VbtWCkomA"],
["Bunny ABC Kids","UC71PNUaS-TtKtxav2M5FzJA"],
["Lily's World","UCw3UI5p2X9Ea91Snah06IcQ"],
["KidsMegaHub","UClwE4BXcILf_DsqDTxMEDmA"],
["Jad Learning World","UCOSMzc-1mNqJorB3QimIuQQ"],
["Bubble Toon TV","UCqaEKpifOifDJHFflcH65vQ"],
["ZOOZIVA TV","UCMXuXWog44c-OhT4RuCqftg"],
["Kiddies Kito World","UCM8xsWTfl6rZKy58brPoSyg"],
["ABC Luma","UCYVnuLz7Tx53Y2Ciq4KGf6w"],
["Indra Bikin Rusuh","UCiDwAnb2UWMqX0UgN06zIBg"],
["The Smile Brothers","UC2US4TU1bPVDEgUvGmUb9YQ"],
["NVN KIDS TV","UCFrbMMZhBfZ4J3XI97Od5ow"],
["Pip the Kiwi","UCZedmr5a3IeOQbtWbF4Paxg"],
["MoodNMotion","UCvXRcORuGSjLknV2Wbm-0zQ"],
["Pinky Corner","UCfY2ICJVnaDiYO5_8WMGcBA"],
["Bumble Bloom Kids","UCXjct7TtEtTdj0Bg5Fu8Y9w"]
].map(([name,id])=>({name,id}));

function decodeXml(value=""){return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
function tagValue(xml,tag){const open="<"+tag,close="</"+tag+">",start=xml.indexOf(open);if(start<0)return "";const openEnd=xml.indexOf(">",start),end=xml.indexOf(close,openEnd+1);if(openEnd<0||end<0)return "";return decodeXml(xml.slice(openEnd+1,end).replace("<![CDATA[","").replace("]]>","").trim());}
async function fetchChannel(channel){
 const response=await fetch("https://www.youtube.com/feeds/videos.xml?channel_id="+encodeURIComponent(channel.id),{headers:{"User-Agent":"LittleFriendsStudio/1.0 public RSS"}});
 if(!response.ok)throw new Error("RSS HTTP "+response.status);
 const xml=await response.text();
 const entries=xml.split("<entry>").slice(1).map(part=>"<entry>"+part.split("</entry>")[0]+"</entry>");
 return entries.slice(0,15).map(entry=>{
  const videoId=tagValue(entry,"yt:videoId");
  return videoId?{channel:channel.name,title:tagValue(entry,"title"),published:tagValue(entry,"published"),url:"https://www.youtube.com/watch?v="+videoId,videoId}:null;
 }).filter(Boolean);
}
const results=await Promise.allSettled(fixedChannels.map(fetchChannel));
const videos=results.flatMap(x=>x.status==="fulfilled"?x.value:[]);
const failed=results.map((x,i)=>x.status==="rejected"?fixedChannels[i].name:null).filter(Boolean);
const data={updated_at:new Date().toISOString(),source:"YouTube public RSS feeds",channels_total:fixedChannels.length,channels_ok:results.filter(x=>x.status==="fulfilled").length,channels_failed:failed,videos:videos.sort((a,b)=>b.published.localeCompare(a.published))};
await mkdir("data",{recursive:true});
await writeFile("data/competitor-feed.json",JSON.stringify(data,null,2)+"\n");
console.log("Saved "+videos.length+" recent videos from "+data.channels_ok+"/"+fixedChannels.length+" channels.");
if(!videos.length)throw new Error("No competitor videos were returned; refusing to publish an empty feed.");
