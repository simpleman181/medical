import {NextRequest,NextResponse} from "next/server";
import {readFile} from "fs/promises";
import path from "path";
import {normalizeDrugName,splitCombination} from "@/lib/search/normalize";

const CDSCO_SEC="https://cdsco.gov.in/opencms/opencms/en/Committees/SEC/";
const CDSCO_DRUGS="https://cdscoonline.gov.in/CDSCO/cdscoDrugs";
const INDEX=path.join(process.cwd(),"data","search_index.json");

type Indexed={source_type:"SEC"|"CDSCO_DRUG";search_text:string;record:Record<string,string>};

function score(text:string,parts:string[]){
  const n=normalizeDrugName(text);
  return parts.reduce((s,p)=>s+(n.includes(p)?1:0),0);
}

export async function GET(req:NextRequest){
  const q=(req.nextUrl.searchParams.get("q")||"").trim();
  if(q.length<3)return NextResponse.json({query:q,sec:[],approvals:[],message:"Enter at least 3 characters."},{status:400});
  const parts=splitCombination(q);
  try{
    const raw=await readFile(INDEX,"utf8");
    const records:Indexed[]=JSON.parse(raw);
    const matches=records
      .map(x=>({...x,_score:score(x.search_text,parts)}))
      .filter(x=>x._score===parts.length)
      .sort((a,b)=>b._score-a._score)
      .slice(0,100);
    const sec=matches.filter(x=>x.source_type==="SEC").map(x=>({
      date:x.record.release_date||"",
      committee:x.record.category||"",
      drug:x.record.title||"",
      firm:"",
      application:"",
      recommendation:x.record.text||"",
      source:x.record.source_url||CDSCO_SEC
    }));
    const approvals=matches.filter(x=>x.source_type==="CDSCO_DRUG").map(x=>({
      date:x.record.approval_date||"",
      drug:x.record.drug||"",
      type:x.record.type||"",
      composition:x.record.composition||"",
      dosage:x.record.dosage||"",
      indication:x.record.indication||"",
      manufacturer:x.record.manufacturer||"",
      source:x.record.source_url||CDSCO_DRUGS
    }));
    return NextResponse.json({query:q,normalized:normalizeDrugName(q),terms:parts,sec,approvals,sources:{sec:CDSCO_SEC,drugDatabase:CDSCO_DRUGS},status:"ok",matchCount:matches.length});
  }catch(error){
    return NextResponse.json({query:q,normalized:normalizeDrugName(q),terms:parts,sec:[],approvals:[],sources:{sec:CDSCO_SEC,drugDatabase:CDSCO_DRUGS},status:"index_missing",message:"Run the CDSCO ingestion scripts to build data/search_index.json.",error:String(error)},{status:503});
  }
}