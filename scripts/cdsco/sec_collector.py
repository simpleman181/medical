import csv,hashlib,re
from datetime import datetime
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

SEC_INDEX="https://cdsco.gov.in/opencms/opencms/en/Committee/Committees/"
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"data"/"sec"
PDF_DIR=DATA/"pdf"
PDF_DIR.mkdir(parents=True,exist_ok=True)

def clean(s): return re.sub(r"\\s+"," ",s or "").strip()

def discover():
    r=requests.get(SEC_INDEX,timeout=60,verify=True,headers={"User-Agent":"CDSCO-Regulatory-Intelligence/0.1"})
    r.raise_for_status()
    soup=BeautifulSoup(r.text,"html.parser")
    rows=[]
    for tr in soup.select("table tr"):
        cells=tr.find_all(["td","th"])
        if len(cells)<4: continue
        title=clean(cells[1].get_text(" ",strip=True)) if len(cells)>1 else ""
        release=clean(cells[2].get_text(" ",strip=True)) if len(cells)>2 else ""
        category=clean(cells[3].get_text(" ",strip=True)) if len(cells)>3 else ""
        link=tr.find("a",href=True)
        if link and ".pdf" in link["href"].lower():
            href=requests.compat.urljoin(SEC_INDEX,link["href"])
            rows.append({"title":title,"release_date":release,"category":category,"source_url":href})
    return rows

def parse_pdf(path):
    reader=PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)

def main():
    records=[]
    for item in discover():
        name=hashlib.sha256(item["source_url"].encode()).hexdigest()[:20]+".pdf"
        path=PDF_DIR/name
        if not path.exists():
            data=requests.get(item["source_url"],timeout=90,verify=True,headers={"User-Agent":"CDSCO-Regulatory-Intelligence/0.1"})
            data.raise_for_status()
            path.write_bytes(data.content)
        text=parse_pdf(path)
        records.append({**item,"local_pdf":str(path.relative_to(ROOT)),"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"text":text})
    out=DATA/"sec_index.csv"
    with out.open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=["title","release_date","category","source_url","local_pdf","sha256","text"])
        w.writeheader();w.writerows(records)
    print(f"Processed {len(records)} SEC documents -> {out}")

if __name__=="__main__": main()
