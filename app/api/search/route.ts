import {NextRequest,NextResponse} from "next/server";
import {normalizeDrugName,splitCombination} from "@/lib/search/normalize";
import type {SecRecord,ApprovalRecord} from "@/lib/types";

const CDSCO_SEC="https://cdsco.gov.in/opencms/opencms/en/Committee/Committees/";
const CDSCO_DRUGS="https://www.cdscoonline.gov.in/CDSCO/cdscoDrugs";

function score(text:string,parts:string[]){const n=normalizeDrugName(text);return parts.reduce((s,p)=>s+(n.includes(p)?1:0),0)}

export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get("q")||"").trim();
 if(q.length<3)return NextResponse.json({query:q,sec:[],approvals:[],message:"Enter at least 3 characters."});
 const parts=splitCombination(q);
 // Live remote search is intentionally separated from the UI. Until the ingestion
 // job is populated, return an explicit no-data state rather than inventing records.
 const result={query:q,normalized:normalizeDrugName(q),terms:parts,sec:[] as SecRecord[],approvals:[] as ApprovalRecord[],sources:{sec:CDSCO_SEC,drugDatabase:CDSCO_DRUGS},status:"ingestion_pending"};
 return NextResponse.json(result);
}
