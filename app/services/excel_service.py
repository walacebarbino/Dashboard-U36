import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
EXCEL_PATH = BASE_DIR / "data" / "INSPECAO-RIR-PPU.xlsx"

def ler_dados_ppu():
    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name="PPU", engine="openpyxl")
        df.columns = [str(col).strip() for col in df.columns]
        return df.fillna("").to_dict(orient="records")
    except Exception as e:
        return {"erro": f"Não foi possível ler a aba PPU: {str(e)}"}