"use client";
import {useState} from "react";
import {Search,ShieldCheck,Database,FileText,ExternalLink} from "lucide-react";

type Result={date:string;committee?:string;drug:string;firm?:string;application?:string;recommendation?:string;source:string;type?:string;composition?:string;dosage?:string;indication?:string;manufacturer?:string};

export default function Home(){
 const[q,setQ]=useState(""); const[loading,setLoading]=useState(false); const[error,setError]=useState(""); const[searched,setSearched]=useState(false);
 const[sec,setSec]=useState<Result[]>([]); const[approvals,setApprovals]=useState<Result[]>([]);
 async function search(){
  if(q.trim().length<3){setError("Enter at least 3 characters.");return}
  setLoading(true);setError("");setSearched(true);
  try{
   const r=await fetch("/api/search?q="+encodeURIComponent(q.trim()));
   const data=await r.json();
   if(!r.ok) throw new Error(data.message||"Search failed");
   setSec(data.sec||[]);setApprovals(data.approvals||[]);
  }catch(e){setError(e instanceof Error?e.message:"Search failed");setSec([]);setApprovals([])}
  finally{setLoading(false)}
 }
 return <main><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><div className="flex items-center gap-2 text-xl font-bold"><ShieldCheck size={25}/>CDSCO Regulatory Intelligence</div><p className="mt-1 text-sm text-slate-500">Evidence-first search across SEC recommendations and CDSCO drug records</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">MVP</span></div></header>
 <section className="mx-auto max-w-7xl px-6 py-10"><div className="rounded-2xl bg-[#10233f] p-8 text-white"><h1 className="text-3xl font-bold">Search CDSCO regulatory records</h1><p className="mt-2 max-w-2xl text-slate-300">Search indexed SEC documents and CDSCO Drug Database records. Results remain linked to their source.</p><div className="mt-7 flex max-w-4xl gap-3"><div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3"><Search size={20} className="text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. Semaglutide or Pembrolizumab + Lenvatinib" className="w-full bg-transparent text-slate-900 outline-none"/></div><button onClick={search} disabled={loading} className="rounded-xl bg-white px-6 font-semibold text-[#10233f] disabled:opacity-60">{loading?"Searching...":"Search"}</button></div></div>
 {error&&<div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
 {searched&&!loading&&!error&&<div className="mt-8 space-y-8"><div className="grid gap-4 md:grid-cols-3"><Stat icon={<FileText/>} label="SEC records" value={String(sec.length)}/><Stat icon={<Database/>} label="CDSCO approvals" value={String(approvals.length)}/><Stat icon={<ShieldCheck/>} label="Evidence" value="Source-linked"/></div><ResultTable title="SEC Recommendation History" headers={["Meeting / release date","Committee","Document","Evidence"]} rows={sec.map(x=>[x.date,x.committee||"",x.drug,<Evidence source={x.source}/>])}/><ResultTable title="CDSCO Drug Records" headers={["Approval date","Drug","Type","Composition","Dosage","Indication","Manufacturer","Source"]} rows={approvals.map(x=>[x.date,x.drug,x.type||"",x.composition||"",x.dosage||"",x.indication||"",x.manufacturer||"",<Evidence source={x.source}/>])}/>{sec.length===0&&approvals.length===0&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">No indexed exact-term matches were found. Run the CDSCO ingestion scripts and rebuild the search index if this is the first run.</div>}</div>}</section></main>
}
function Evidence({source}:{source:string}){return <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline"><ExternalLink size={14}/>Source</a>}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl border bg-white p-5"><div className="mb-3 text-slate-500">{icon}</div><div className="text-sm text-slate-500">{label}</div><div className="mt-1 font-semibold">{value}</div></div>}
function ResultTable({title,headers,rows}:{title:string;headers:string[];rows:(string|React.ReactNode)[][]}){return <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b px-6 py-5"><h2 className="font-bold">{title}</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map(h=><th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-t align-top">{r.map((c,j)=><td key={j} className="px-5 py-4 max-w-md">{c}</td>)}</tr>)}</tbody></table></div></section>}