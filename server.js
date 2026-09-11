const express=require("express"), fs=require("fs"), path=require("path"), {spawn}=require("child_process");
const app=express(); app.use(express.json({limit:"2mb"})); app.use(express.static(path.join(__dirname,"public")));
const PORT=process.env.PORT||3000, ROOT=path.join(__dirname,"servers"); fs.mkdirSync(ROOT,{recursive:true});
const jobs=new Map();

function idok(id){return /^[a-zA-Z0-9_-]{1,64}$/.test(id)}
function get(id){return jobs.get(id)}
function info(id){let j=get(id); return {id,name:id,status:j?.status||"stopped",pid:j?.proc?.pid||null,logs:j?.logs||""}}
app.get("/api/health",(q,s)=>s.json({ok:true,name:"Pyni Pterodactyl",runtime:"standalone"}));
app.get("/api/servers",(q,s)=>{let ids=fs.readdirSync(ROOT,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);s.json(ids.map(info))});
app.post("/api/servers",(q,s)=>{let id=q.body?.id;if(!idok(id))return s.status(400).json({error:"Invalid server name"});let d=path.join(ROOT,id);fs.mkdirSync(d,{recursive:true});s.json(info(id))});
app.post("/api/servers/:id/start",(q,s)=>{
 let id=q.params.id;if(!idok(id))return s.status(400).json({error:"Invalid id"});let d=path.join(ROOT,id), cmd=q.body?.command;
 if(!cmd)return s.status(400).json({error:"command required"});
 if(get(id)?.status==="running")return s.status(409).json({error:"Already running"});
 let p=spawn(cmd,{cwd:d,shell:true,env:{...process.env}});
 let j={proc:p,status:"running",logs:""};jobs.set(id,j);
 const add=x=>{j.logs+=(x.toString());if(j.logs.length>50000)j.logs=j.logs.slice(-50000)};
 p.stdout.on("data",add);p.stderr.on("data",add);p.on("close",c=>{j.status="stopped";j.logs+=`\n[Pyni] Process exited: ${c}\n`;j.proc=null});
 s.json(info(id));
});
app.post("/api/servers/:id/stop",(q,s)=>{let j=get(q.params.id);if(!j?.proc)return s.json(info(q.params.id));j.proc.kill("SIGTERM");s.json(info(q.params.id))});
app.post("/api/servers/:id/restart",(q,s)=>{let id=q.params.id,j=get(id);let cmd=q.body?.command;if(j?.proc)j.proc.kill("SIGTERM");setTimeout(()=>{if(cmd)startInternal(id,cmd)},400);s.json({ok:true})});
function startInternal(id,cmd){let d=path.join(ROOT,id),p=spawn(cmd,{cwd:d,shell:true,env:{...process.env}}),j={proc:p,status:"running",logs:""};jobs.set(id,j);const add=x=>{j.logs+=x.toString();if(j.logs.length>50000)j.logs=j.logs.slice(-50000)};p.stdout.on("data",add);p.stderr.on("data",add);p.on("close",c=>{j.status="stopped";j.logs+=`\n[Pyni] Process exited: ${c}\n`;j.proc=null})}
app.get("/api/servers/:id/logs",(q,s)=>{let j=get(q.params.id);s.json({logs:j?.logs||""})});
app.post("/api/servers/:id/command",(q,s)=>{let j=get(q.params.id),c=q.body?.command;if(!j?.proc)return s.status(409).json({error:"Server not running"});j.proc.stdin.write(c+"\n");s.json({ok:true})});
app.get("*",(q,s)=>s.sendFile(path.join(__dirname,"public/index.html")));
app.listen(PORT,()=>console.log(`Pyni Pterodactyl listening on :${PORT}`));
