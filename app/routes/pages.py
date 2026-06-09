from flask import Blueprint, render_template, redirect, url_for


pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
def home():
    return redirect(url_for("pages.dashboard"))


@pages_bp.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@pages_bp.route("/ppu")
def ppu():
    return render_template("ppu.html")


@pages_bp.route("/sth")
def sth():
    return render_template("sth.html")


@pages_bp.route("/spools")
def spools():
    return render_template("spools.html")