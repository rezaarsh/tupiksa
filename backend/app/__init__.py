from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Mengizinkan Frontend (React) untuk menarik data dari Backend
    CORS(app)

    db.init_app(app)

    with app.app_context():
        from app import models
        db.create_all()
        
    # Mendaftarkan Rute API
    from app.routes import api
    app.register_blueprint(api)

    return app