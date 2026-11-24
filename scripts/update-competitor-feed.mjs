import { mkdir, writeFile } from "node:fs/promises";

const fixedChannels=[
["Kidz Toons","UCbnMgJ5FVXbeW1zWevN24tg"],["Bee TV","UCZyzJreQEtHYXw_eOgcIwRg"],["Chloe and Koko TV","UCgqiSokOr9E86J0See4Gkmw"],["Playful Animals","UCJ4gmhNe7CTu-3VbtWCkomA"],["Bunny ABC Kids","UC71PNUaS-TtKtxav2M5FzJA"],["Lily's World","UCw3UI5p2X9Ea91Snah06IcQ"],["KidsMegaHub","UClwE4BXcILf_DsqDTxMEDmA"],["Jad Learning World","UCOSMzc-1mNqJorB3QimIuQQ"],["Bubble Toon TV","UCqaEKpifOifDJHFflcH65vQ"],["ZOOZIVA TV","UCMXuXWog44c-OhT4RuCqftg"],["Kiddies Kito World","UCM8xsWTfl6rZKy58brPoSyg"],["ABC Luma","UCYVnuLz7Tx53Y2Ciq4KGf6w"],["Indra Bikin Rusuh","UCiDwAnb2UWMqX0UgN06zIBg"],["The Smile Brothers","UC2US4TU1bPVDEgUvGmUb9YQ"],["NVN KIDS TV","UCFrbMMZhBfZ4J3XI97Od5ow"],["Pip the Kiwi","UCZedmr5a3IeOQbtWbF4Paxg"],["MoodNMotion","UCvXRcORuGSjLknV2Wbm-0zQ"],["Pinky Corner","UCfY2ICJVnaDiYO5_8WMGcBA"],["Bumble Bloom Kids","UCXjct7TtEtTdj0Bg5Fu8Y9w"]
].map(([name,id])=>({name,id}));
const handleChannels=[
["Cocomelon – Nursery Rhymes","@CoComelon"],["Super Simple Songs","@supersimplesongs"],["Ms Rachel – Toddler Learning Videos","@msrachel"],["Numberblocks","@Numberblocks"],["Pinkfong – Baby Shark","@pinkfong"],["BabyBus","@babybus"],["Little Baby Bum","@LittleBabyBum"],["ChuChu TV","@ChuChuTV"]
].map(([name,handle])=>({name,handle}));

function decodeXml(value=""){return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
function tagValue(xml,tag){const open="<"+tag,close="</"+tag+">",start=xml.indexOf(open);if(start<0)return "";const openEnd=xml.indexOf(">",start),end=xml.indexOf(close,openEnd+1);if(openEnd<0||end<0)return "";return decodeXml(xml.slice(openEnd+1,end).replace("<![CDATA[","").replace("]]>","").trim());}
async function resolveHandle(channel){
 const response=await fetch("https://www.youtube.com/"+channel.handle,{headers:{"User-Agent":"Mozilla/5.0 LittleFriendsStudio/1.0"}});
 if(!response.ok)throw new Error("HTTP "+response.status);
 const page=await response.text(),match=page.match(/UC[a-zA-Z0-9_-]{22}/);
 if(!match)throw new Error("Could not resolve channel ID");
 return {name:channel.name,id:match[0]};
}
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
const resolved=await Promise.allSettled(handleChannels.map(resolveHandle));
const channels=fixedChannels.concat(resolved.filter(x=>x.status==="fulfilled").map(x=>x.value));
const results=await Promise.allSettled(channels.map(fetchChannel));
const videos=results.flatMap(x=>x.status==="fulfilled"?x.value:[]);
const failed=results.map((x,i)=>x.status==="rejected"?channels[i].name:null).filter(Boolean);
const data={updated_at:new Date().toISOString(),source:"YouTube public RSS feeds",channels_total:channels.length,channels_ok:results.filter(x=>x.status==="fulfilled").length,channels_failed:failed,videos:videos.sort((a,b)=>b.published.localeCompare(a.published))};
await mkdir("data",{recursive:true});
await writeFile("data/competitor-feed.json",JSON.stringify(data,null,2)+"\n");
console.log("Saved "+videos.length+" recent videos from "+data.channels_ok+"/"+channels.length+" channels.");
if(!videos.length)throw new Error("No competitor videos were returned; refusing to publish an empty feed.");
