import csv,json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SEC=ROOT/"data/sec/sec_index.csv"; DRUGS=ROOT/"data/drug_database.csv"; OUT=ROOT/"data/search_index.json"

def norm(v): return re.sub(r"[^a-z0-9]+"," ",(v or "").lower()).strip()

def read(path):
    if not path.exists(): return []
    with path.open(encoding="utf-8") as f: return list(csv.DictReader(f))

def main():
    records=[]
    for r in read(SEC):
        records.append({"source_type":"SEC","search_text":norm(" ".join(r.values())),"record":r})
    for r in read(DRUGS):
        records.append({"source_type":"CDSCO_DRUG","search_text":norm(" ".join(r.values())),"record":r})
    OUT.write_text(json.dumps(records,ensure_ascii=False),encoding="utf-8")
    print(f"Built {len(records)} searchable records -> {OUT}")

if __name__=="__main__": main()
