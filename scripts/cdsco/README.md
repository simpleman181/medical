# CDSCO ingestion

## SEC collector
Run from the repository root:

`python -m pip install -r scripts/cdsco/requirements.txt`
`python scripts/cdsco/sec_collector.py`

The collector discovers PDF links from the CDSCO SEC index, downloads new PDFs, hashes them, extracts text and writes `data/sec/sec_index.csv`.

The extracted text is evidence for downstream parsing. Do not treat an AI summary as the source of truth.
