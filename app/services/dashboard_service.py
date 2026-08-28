from app.services.excel_service import ler_dados_ppu


def to_float(valor):
    try:
        if valor in ("", None):
            return 0.0

        texto = str(valor).strip()

        if "." in texto and "," in texto:
            texto = texto.replace(".", "").replace(",", ".")
        elif "," in texto:
            texto = texto.replace(",", ".")

        return float(texto)

    except (TypeError, ValueError):
        return 0.0


def gerar_resumo_dashboard():
    dados = ler_dados_ppu()

    if isinstance(dados, dict) and "erro" in dados:
        return dados

    total_validado = 0.0
    total_inspecionado = 0.0
    itens_montagem = 0
    realizado_fab = 0.0
    realizado_mont = 0.0

    for item in dados:
        regra = str(item.get("REGRA", "")).strip().upper()

        if regra == "FABRICAR":
            realizado_fab += to_float(item.get("Realizado", 0))

        if regra == "MONTAR":
            realizado_mont += to_float(item.get("Realizado", 0))

        if regra != "MONTAR":
            continue

        total_validado += to_float(
            item.get("TOTAL À FABRICAR (VALID.)", 0)
        )

        total_inspecionado += to_float(
            item.get("LIBERADO PELA ENGENHARIA", 0)
        )

        itens_montagem += 1

    pendente = max(total_validado - total_inspecionado, 0)

    return {
        "peso_total_kg": total_validado,
        "inspecionado_kg": total_inspecionado,
        "pendente_kg": pendente,
        "itens": itens_montagem,
        "realizado_fab_kg": realizado_fab,
        "realizado_mont_kg": realizado_mont,
    }