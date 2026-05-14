from flask import Blueprint, jsonify
from app.services.excel_service import ler_dados_ppu, ler_spools_total
from app.services.dashboard_service import gerar_resumo_dashboard

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.route("/ppu")
def api_ppu():
    try:
        dados = ler_dados_ppu()

        if isinstance(dados, dict) and dados.get("erro"):
            return jsonify(dados), 500

        spools_total = ler_spools_total()

        return jsonify({
            "dados": dados,
            "spools_total": spools_total
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@api_bp.route("/dashboard/resumo")
def api_dashboard_resumo():
    resumo = gerar_resumo_dashboard()
    return jsonify(resumo)

@api_bp.route("/health")
def health():
    return jsonify({"status": "ok"})