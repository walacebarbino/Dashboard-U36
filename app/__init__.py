from flask import Flask
from .routes.pages import pages_bp
from .routes.api import api_bp


def create_app():
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp)

    print("\nROTAS REGISTRADAS:")
    for rule in app.url_map.iter_rules():
        print(rule)

    return app