from app.services.excel_service import ler_dados_ppu

def to_float(valor):
    try:
        if valor in ("", None):
            return 0.0
        texto = str(valor).replace(".", "").replace(",", ".")
        return float(texto)
    except:
        return 0.0

def gerar_resumo_dashboard():
    dados = ler_dados_ppu()

    if isinstance(dados, dict) and "erro" in dados:
        return dados

    total_validado = 0.0
    total_inspecionado = 0.0

    for item in dados:
        total_validado += to_float(item.get("Total Fabricar Validado", 0))
        total_inspecionado += to_float(item.get("Inspecionado", 0))

    pendente = max(total_validado - total_inspecionado, 0)

    return {
        "peso_total_kg": total_validado,
        "inspecionado_kg": total_inspecionado,
        "pendente_kg": pendente,
        "itens": len(dados)
    }