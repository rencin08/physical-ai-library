export async function findLibraryServer({preferred,remembered,fetcher=fetch}={}){
 const candidates=[...new Set([preferred,remembered,'http://localhost:3001','http://localhost:3000'].filter(Boolean))];
 for(const candidate of candidates){
  try{
   const parsed=new URL(candidate);
   if(!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)||!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)continue;
   const ping=await fetcher(`${parsed.origin}/api/library/status`,{signal:AbortSignal.timeout(5000)});
   if(ping.ok&&(await ping.json()).app==='physical-ai-library')return parsed.origin;
  }catch{}
 }
 throw new Error('Open Physical AI Library before running discovery. No responding library server was found.');
}
