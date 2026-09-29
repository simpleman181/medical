import csv,re,requests
from pathlib import Path
from bs4 import BeautifulSoup

URL="https://cdscoonline.gov.in/CDSCO/cdscoDrugs"
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"data"/"drug_database.csv"
FIELDS=["approval_date","drug","type","composition","dosage","indication","manufacturer","manufacturing_site","source_url"]

def clean(v):
    return re.sub(r"\\s+"," ",v or "").strip()

def parse_blocks(html):
    soup=BeautifulSoup(html,"html.parser")
    text=soup.get_text("\n")
    lines=[clean(x) for x in text.splitlines() if clean(x)]
    labels={"Approval Date :":"approval_date","Type :":"type","Composition :":"composition","Dosage :":"dosage","Indication :":"indication","Manufacturer Name :":"manufacturer","Manufacturing Site Address :":"manufacturing_site"}
    records=[]; current={}; drug=""
    i=0
    while i < len(lines):
        line=lines[i]
        if line.startswith("Approval Date"):
            if current.get("approval_date") and drug:
                records.append({"drug":drug,**current,"source_url":URL})
            current={}
            j=i+1
            while j<len(lines) and not lines[j]: j+=1
            current["approval_date"]=clean(lines[j] if j<len(lines) else "")
            drug=""
        elif line in labels:
            key=labels[line]; j=i+1; vals=[]
            while j<len(lines) and lines[j] not in labels and not lines[j].startswith("Approval Date"):
                vals.append(lines[j]); j+=1
            current[key]=clean(" ".join(vals))
            i=j-1
        elif line and not drug and i+1<len(lines) and (i==0 or lines[i-1] not in labels):
            # Candidate drug title; retain it until the first labelled field.
            if len(line)<300 and not line.lower().startswith(("bulk drug","finished formulation","new drug","fdc")):
                drug=line
        i+=1
    if current.get("approval_date") and drug:
        records.append({"drug":drug,**current,"source_url":URL})
    return records

def main():
    r=requests.get(URL,timeout=90,verify=True,headers={"User-Agent":"CDSCO-Regulatory-Intelligence/0.1"})
    r.raise_for_status()
    records=parse_blocks(r.text)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    with OUT.open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS); w.writeheader()
        for x in records: w.writerow({k:x.get(k,"") for k in FIELDS})
    print(f"Extracted {len(records)} approval records -> {OUT}")

if __name__=="__main__": main()
