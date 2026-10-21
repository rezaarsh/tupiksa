import os
from flask import Blueprint, request, jsonify
from app.models import db, Pasien, Faskes, Dokumen_Klaim, Dokter, Perusahaan
from app.services import analyze_document_with_ai
from datetime import datetime

api = Blueprint('api', __name__)

@api.route('/api/claims', methods=['GET'])
def get_claims():
    claims = Dokumen_Klaim.query.order_by(Dokumen_Klaim.id.desc()).all()
    result = []
    for claim in claims:
        result.append({
            "id": claim.id,
            "pasien": claim.pasien.nama if claim.pasien else "Unknown",
            "faskes": claim.faskes.nama if claim.faskes else "Unknown",
            "tanggal": claim.tanggal_periksa,
            "risk_score": claim.risk_score,
            "status_fraud": claim.status_fraud,
            "alasan_ai": claim.alasan_ai 
        })
    return jsonify(result), 200

@api.route('/api/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "Tidak ada file yang diunggah"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nama file kosong"}), 400

    # 1. Kirim file ke Gemini
    ai_result = analyze_document_with_ai(file)
    
    # 2. Ambil data dari AI
    nama_pasien_ai = ai_result.get("nama_pasien", "Pasien Tidak Dikenal")
    nama_faskes_ai = ai_result.get("nama_faskes", "Faskes Tidak Dikenal")
    tanggal_ai = ai_result.get("tanggal_surat", datetime.utcnow().strftime('%Y-%m-%d'))
    
    # 3. Cari atau Buat Pasien Baru (Suntik Perusahaan ID default agar tidak error NOT NULL)
    pasien = Pasien.query.filter_by(nama=nama_pasien_ai).first()
    if not pasien:
        pasien = Pasien(nama=nama_pasien_ai, perusahaan_id=1) 
        db.session.add(pasien)
        db.session.commit()

    # 4. Cari atau Buat Faskes Baru
    faskes = Faskes.query.filter_by(nama=nama_faskes_ai).first()
    if not faskes:
        faskes = Faskes(nama=nama_faskes_ai, jenis="Klinik") 
        db.session.add(faskes)
        db.session.commit()
        
    # 5. Cari atau Buat Dokter Default (Agar tidak error NOT NULL di Dokumen_Klaim)
    dokter = Dokter.query.filter_by(id=1).first()
    if not dokter:
        dokter = Dokter(nama="Dr. Default", faskes_id=faskes.id)
        db.session.add(dokter)
        db.session.commit()

    # 6. Network Analysis (Mencari anomali frekuensi faskes)
    network_score = 0
    network_reason = ""
    # Menggunakan Dokumen_Klaim sesuai nama modelmu
    klaim_terakhir = Dokumen_Klaim.query.filter_by(faskes_id=faskes.id).order_by(Dokumen_Klaim.id.desc()).limit(5).all()
    
    if len(klaim_terakhir) >= 2: # Kita set ke 2 agar langsung bereaksi saat kamu upload 3 file sekaligus
        network_score += 40
        network_reason = f"Network Anomaly: Faskes '{faskes.nama}' terdeteksi memproses klaim dalam jumlah tinggi di waktu berdekatan."

    final_score = min(ai_result.get("risk_score", 0) + network_score, 100.0)
    final_status = True if final_score > 60 else False
    
    if network_reason:
        ai_result["alasan_ai"].append(network_reason)

    # 7. Simpan ke Database
    klaim_baru = Dokumen_Klaim(
        pasien_id=pasien.id,
        faskes_id=faskes.id,
        dokter_id=dokter.id,
        tanggal_periksa=tanggal_ai, 
        diagnosis=ai_result.get("diagnosis", "Tidak Diketahui"),
        durasi_istirahat=ai_result.get("durasi_istirahat", 0),
        risk_score=final_score,
        status_fraud=final_status,
        alasan_ai=str(ai_result.get("alasan_ai", []))
    )
    
    db.session.add(klaim_baru)
    db.session.commit()

    # Siapkan response
    ai_result["final_score"] = final_score
    ai_result["status_fraud"] = final_status
    ai_result["alasan"] = ai_result["alasan_ai"]

    return jsonify({
        "message": "Dokumen berhasil dianalisis",
        "data": ai_result
    }), 200

@api.route('/api/reset-claims', methods=['DELETE'])
def reset_claims():
    try:
        # Menghapus semua isi tabel Dokumen_Klaim
        db.session.query(Dokumen_Klaim).delete()
        db.session.commit()
        return jsonify({"message": "Seluruh riwayat klaim berhasil direset."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500