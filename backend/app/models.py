from app import db

class Perusahaan(db.Model):
    __tablename__ = 'perusahaan'
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    pasien = db.relationship('Pasien', backref='perusahaan', lazy=True)

class Faskes(db.Model):
    __tablename__ = 'faskes'
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    jenis = db.Column(db.String(50))
    dokter = db.relationship('Dokter', backref='faskes', lazy=True)
    klaim = db.relationship('Dokumen_Klaim', backref='faskes', lazy=True)

class Dokter(db.Model):
    __tablename__ = 'dokter'
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    faskes_id = db.Column(db.Integer, db.ForeignKey('faskes.id'), nullable=False)
    klaim = db.relationship('Dokumen_Klaim', backref='dokter', lazy=True)

class Pasien(db.Model):
    __tablename__ = 'pasien'
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    perusahaan_id = db.Column(db.Integer, db.ForeignKey('perusahaan.id'), nullable=False)
    klaim = db.relationship('Dokumen_Klaim', backref='pasien', lazy=True)

class Dokumen_Klaim(db.Model):
    __tablename__ = 'dokumen_klaim'
    id = db.Column(db.Integer, primary_key=True)
    pasien_id = db.Column(db.Integer, db.ForeignKey('pasien.id'), nullable=False)
    faskes_id = db.Column(db.Integer, db.ForeignKey('faskes.id'), nullable=False)
    dokter_id = db.Column(db.Integer, db.ForeignKey('dokter.id'), nullable=False)
    
    tanggal_periksa = db.Column(db.String(20))
    diagnosis = db.Column(db.String(200))
    durasi_istirahat = db.Column(db.Integer)
    
    risk_score = db.Column(db.Float, default=0.0)
    status_fraud = db.Column(db.Boolean, default=False)
    alasan_ai = db.Column(db.Text)