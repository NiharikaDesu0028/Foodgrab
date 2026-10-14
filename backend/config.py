import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'foodgrab-default-secret-key-32d162a8')

    raw_db_url = os.environ.get('DATABASE_URL')
    if not raw_db_url or raw_db_url == 'sqlite:///foodgrab.db':
        # Anchor sqlite database deterministically inside backend folder
        db_path = os.path.join(basedir, 'foodgrab.db').replace('\\', '/')
        raw_db_url = f"sqlite:///{db_path}"
    elif raw_db_url.startswith('postgres://'):
        # Fix Render postgres:// prefix to postgresql://
        raw_db_url = raw_db_url.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = raw_db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.environ.get('PORT', 5000))
