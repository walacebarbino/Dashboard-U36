import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
EXCEL_PATH = BASE_DIR / "data" / "INSPECAO-RIR-PPU.xlsx"
DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"