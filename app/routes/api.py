from flask import Blueprint, jsonify
from app.services.excel_service import ler_dados_ppu
from app.services.dashboard_service import gerar_resumo_dashboard

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.route("/ppu")
def api_ppu():
    dados = ler_dados_ppu()
    return jsonify(dados)

@api_bp.route("/dashboard/resumo")
def api_dashboard_resumo():
    resumo = gerar_resumo_dashboard()
    return jsonify(resumo)

@api_bp.route("/health")
def health():
    return jsonify({"status": "ok"})