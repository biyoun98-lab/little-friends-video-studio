import express from "express";
const app=express();
const PORT=process.env.PORT||3000;
// Free browser-rendering edition: no paid AI provider, API key, or generation endpoint.
app.get("/api/health",(req,res)=>res.json({ok:true,mode:"free-browser-renderer",paidAI:false}));
app.use(express.static("."));
app.listen(PORT,()=>console.log("Little Friends free studio running on "+PORT));
