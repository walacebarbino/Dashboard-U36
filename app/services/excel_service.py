import pandas as pd
from pathlib import Path
from functools import lru_cache
import threading


BASE_DIR = Path(__file__).resolve().parents[2]
EXCEL_PATH = BASE_DIR / "data" / "INSPECAO-RIR-PPU.xlsx"

import threading

_excel_cache = {}
_cache_lock = threading.Lock()


def carregar_aba_excel(sheet_name, header=0):
    mtime = EXCEL_PATH.stat().st_mtime
    chave = (sheet_name, header, mtime)

    with _cache_lock:
        if chave in _excel_cache:
            return _excel_cache[chave].copy()

    df = pd.read_excel(
        EXCEL_PATH,
        sheet_name=sheet_name,
        header=header,
        engine="openpyxl"
    )

    with _cache_lock:
        _excel_cache.clear()
        _excel_cache[chave] = df.copy()

    return df.copy()


def ler_dados_ppu():
    try:
        df = carregar_aba_excel("PPU")
        df.columns = [str(col).strip() for col in df.columns]
        return df.fillna("").to_dict(orient="records")
    except Exception as e:
        return {"erro": f"Não foi possível ler a aba PPU: {str(e)}"}


def ler_spools_total():
    try:
        df = carregar_aba_excel("PPU")

        df.columns = [str(col).strip() for col in df.columns]

        coluna = "TOTAL SPOOLS"
        if coluna not in df.columns:
            raise ValueError(f"Coluna '{coluna}' não encontrada na aba PPU.")

        total = pd.to_numeric(df[coluna], errors="coerce").fillna(0).sum()

        return int(total)
    except Exception:
        return 0
    

import re
import unicodedata


def normalizar_texto(txt):
    if pd.isna(txt):
        return ""
    txt = str(txt).strip().upper()
    txt = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode("ascii")
    return txt


def norm_col(c):
    c = str(c).strip().lower()
    c = unicodedata.normalize("NFKD", c).encode("ascii", "ignore").decode("ascii")
    c = re.sub(r"\s+", "_", c)
    c = re.sub(r"[^\w_]", "", c)
    return c


def encontrar_linha_cabecalho(df, texto_procurado):
    alvo = norm_col(texto_procurado)
    for i, row in df.iterrows():
        valores = [norm_col(x) for x in row.astype(str).tolist()]
        if alvo in valores:
            return i
    return None


def dedup_cols(cols):
    seen = {}
    out = []
    for c in cols:
        if c not in seen:
            seen[c] = 0
            out.append(c)
        else:
            seen[c] += 1
            out.append(f"{c}_{seen[c]}")
    return out


def preparar_cabecalho(df, idx_header):
    df = df.copy()
    df.columns = df.iloc[idx_header].astype(str).tolist()
    df = df.iloc[idx_header + 1:].reset_index(drop=True)
    df.columns = [norm_col(c) for c in df.columns]

    novas_colunas = []
    for col in df.columns:
        if "codigo" in col and "petrobras" in col:
            novas_colunas.append("codigo_petrobras")
        elif col == "codigo_material":
            novas_colunas.append("codigo_petrobras")
        elif col in ["qtd_necessidade_sp", "qtd_necessidade", "quantidade"]:
            novas_colunas.append("qtd")
        elif col in ["qtd_previs", "qtd_prevista"]:
            novas_colunas.append("qtd_estoque_bruto")
        else:
            novas_colunas.append(col)

    df.columns = novas_colunas
    df.columns = dedup_cols(df.columns)
    df = df.dropna(axis=1, how="all")
    return df


def classificar_familia(descricao, codigo=""):
    desc = normalizar_texto(descricao)
    cod = normalizar_texto(codigo)
    base = f"{cod} {desc}"

    if "BOCA DE LOBO" in base:
        return "FABRICACAO"

    if "JUNTA ESPIRAL" in base or ("JUNTA" in base and "ESPIRAL" in base):
        return "MONTAGEM"

    if any(t in base for t in [
        "VALV", "VGA", "GAVETA", "GLOBO", "ESFERA", "RETENCAO", "RETENO", "FILTRO",
        "FIGURA OITO", "FIGURA 8", "RAQUETE", "JUNTA ANEL", "JUNTA OVAL"
    ]):
        return "MONTAGEM"

    if "FLANGE CEGO" in base:
        return "MONTAGEM"

    if any(t in base for t in ["C90", "J45", "CURVA 90", "JOELHO 90", "CURVA 45", "JOELHO"]):
        return "FABRICACAO"

    if "TAMPAO" in base or "TAMPAO" in base:
        return "FABRICACAO"

    if any(t in base for t in [
        "TUBO", "CURVA", "REDUCAO", "FLANGE", "LUVA", "MEIA-LUVA", "NIPLE", "NIPPLE",
        "CAP", "TAMPO", " TE ", "TEE", "NIP RED", "SOCKOLET", "WELDOLET"
    ]):
        return "FABRICACAO"

    return "VERIFICAR"


def formatar_data_br(valor):
    if pd.isna(valor) or valor == "":
        return ""
    data = pd.to_datetime(valor, errors="coerce")
    if pd.isna(data):
        texto = str(valor).strip()
        if texto in ["", "00/01/1900", "1900-01-00"]:
            return ""
        return texto
    return data.strftime("%d/%m/%Y")


@lru_cache(maxsize=1)
def _carregar_spools_fabricaveis_cache():
    try:
        calm_raw = carregar_aba_excel("CALM EMITIDAS", header=None)
        estoque_raw = carregar_aba_excel("ESTOQUE", header=None)

        idx_calm = encontrar_linha_cabecalho(calm_raw, "Código Petrobras")
        if idx_calm is None:
            idx_calm = encontrar_linha_cabecalho(calm_raw, "Codigo Petrobras")
        if idx_calm is None:
            idx_calm = encontrar_linha_cabecalho(calm_raw, "Código Material")
        if idx_calm is None:
            idx_calm = encontrar_linha_cabecalho(calm_raw, "Codigo Material")

        idx_estoque = encontrar_linha_cabecalho(estoque_raw, "Código Petrobras")
        if idx_estoque is None:
            idx_estoque = encontrar_linha_cabecalho(estoque_raw, "Codigo Petrobras")

        if idx_calm is None:
            raise ValueError("Cabeçalho da aba CALM EMITIDAS não encontrado.")
        if idx_estoque is None:
            raise ValueError("Cabeçalho da aba ESTOQUE não encontrado.")

        calm = preparar_cabecalho(calm_raw, idx_calm)
        estoque_df = preparar_cabecalho(estoque_raw, idx_estoque)

        if "codigo_petrobras" not in calm.columns:
            calm["codigo_petrobras"] = ""
        calm["codigo_petrobras"] = calm["codigo_petrobras"].astype(str).str.strip().str.upper()

        if "codigo_petrobras" not in estoque_df.columns:
            estoque_df["codigo_petrobras"] = ""
        estoque_df["codigo_petrobras"] = estoque_df["codigo_petrobras"].astype(str).str.strip().str.upper()

        if "descricao_material" not in calm.columns:
            calm["descricao_material"] = ""

        if "diametro_1" not in calm.columns:
            calm["diametro_1"] = ""

        if "qtd" not in calm.columns:
            calm["qtd"] = 0
        calm["qtd"] = pd.to_numeric(calm["qtd"], errors="coerce").fillna(0)

        if "peso_total" not in calm.columns:
            calm["peso_total"] = 0
        calm["peso_total"] = pd.to_numeric(calm["peso_total"], errors="coerce").fillna(0)

        if "isometrico_spool" in calm.columns:
            grupo_col = "isometrico_spool"
        elif "isometrico" in calm.columns:
            grupo_col = "isometrico"
        else:
            calm["tag"] = ""
            grupo_col = "tag"

        if grupo_col not in calm.columns:
            calm[grupo_col] = ""
        calm["tag"] = calm[grupo_col].astype(str).str.strip()

        estoque_status = estoque_df[["codigo_petrobras"]].copy()

        if "status" in estoque_df.columns:
            estoque_status["status_estoque"] = estoque_df["status"]
        else:
            estoque_status["status_estoque"] = ""

        if "dt_prevista" in estoque_df.columns:
            estoque_status["dt_prevista_estoque"] = estoque_df["dt_prevista"]
        else:
            estoque_status["dt_prevista_estoque"] = ""

        estoque_status = estoque_status.drop_duplicates(subset=["codigo_petrobras"])

        resultado = calm.merge(
            estoque_status,
            on="codigo_petrobras",
            how="left"
        )

        resultado["status_final"] = resultado["status_estoque"].fillna("").astype(str).str.strip()

        datas_convertidas = pd.to_datetime(
            resultado["dt_prevista_estoque"],
            errors="coerce",
            cache=True
        )

        resultado["data_prevista_final"] = datas_convertidas.dt.strftime("%d/%m/%Y")
        resultado["data_prevista_final"] = resultado["data_prevista_final"].fillna("")

        mascara_invalidas = datas_convertidas.isna()
        if mascara_invalidas.any():
            valores_originais = resultado.loc[mascara_invalidas, "dt_prevista_estoque"].fillna("").astype(str).str.strip()
            valores_originais = valores_originais.replace({
                "00/01/1900": "",
                "1900-01-00": "",
                "NaT": "",
                "nan": ""
            })
            resultado.loc[mascara_invalidas, "data_prevista_final"] = valores_originais

        resultado = resultado[[
            "tag",
            "codigo_petrobras",
            "descricao_material",
            "diametro_1",
            "qtd",
            "peso_total",
            "status_final",
            "data_prevista_final"
        ]].copy()

        resultado = resultado.rename(columns={
            "codigo_petrobras": "material",
            "descricao_material": "descricao",
            "diametro_1": "diametro",
            "peso_total": "peso",
            "status_final": "status",
            "data_prevista_final": "data_prevista"
        })

        return resultado.fillna("")

    except Exception as e:
        raise ValueError(f"Não foi possível ler os dados dos spools: {str(e)}")

def ler_spools_fabricaveis():
    try:
        return _carregar_spools_fabricaveis_cache().to_dict(orient="records")
    except Exception as e:
        return {"erro": str(e)}

def limpar_cache_spools():
    _carregar_spools_fabricaveis_cache.cache_clear()