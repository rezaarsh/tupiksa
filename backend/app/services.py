import os
import json
from google import genai
from google.genai import types
from config import Config
from datetime import datetime

# Inisialisasi Client
client = genai.Client(api_key=Config.GEMINI_API_KEY)

def analyze_document_with_ai(file_storage):
    tanggal_hari_ini = datetime.now().strftime('%d %B %Y')
    """
    Menerima file dari frontend, mengecek formatnya, 
    dan mengirimkannya ke Gemini untuk dianalisis.
    """
    
    prompt = f"""
    Kamu adalah "Carety", seorang Agen AI Investigator Fraud Kesehatan. 
    Tugasmu adalah menganalisis dokumen Surat Keterangan Sakit ini.
    
    INFORMASI PENTING: Hari ini adalah tanggal {tanggal_hari_ini}. 
    Gunakan referensi hari ini untuk menentukan apakah tanggal di surat itu masuk akal (di masa lalu/hari ini) atau merupakan anomali (tanggal di masa depan).

    Ekstrak data dan lakukan Fraud Detection.
    Keluarkan jawabanmu MURNI dalam format JSON tanpa teks pembuka/penutup, dengan struktur pasti seperti ini:
    {{
        "nama_pasien": "nama pasien yang tertulis di surat",
        "nama_faskes": "nama klinik/faskes yang tertulis",
        "tanggal_surat": "tanggal surat diterbitkan (WAJIB ubah ke format YYYY-MM-DD, contoh: 2026-09-17)",
        "diagnosis": "nama penyakit yang tertulis",
        "durasi_istirahat": angka_hari_istirahat,
        "risk_score": angka dari 0.0 sampai 100.0,
        "status_fraud": true atau false,
        "alasan_ai": ["poin alasan kecurigaan 1", "poin alasan kecurigaan 2"]
    }}
    """
    
    try:
        # 1. Dapatkan format tipe file dari upload (misal: 'application/pdf', 'image/png')
        mime_type = file_storage.mimetype
        
        # 2. SMART REJECTION: Tolak otomatis file Word
        if 'word' in mime_type or 'officedocument' in mime_type:
            return {
                "diagnosis": "Format Tidak Sah",
                "durasi_istirahat": 0,
                "risk_score": 100.0,
                "status_fraud": True,
                "alasan_ai": [
                    "Investigasi Ditolak: Terdeteksi penggunaan dokumen Word mentah (.doc/.docx).", 
                    "Dokumen digital yang dapat diedit bebas bukanlah bukti klaim medis yang sah karena tidak memiliki validasi stempel basah faskes. Harap unggah Scan PDF atau Foto Fisik."
                ]
            }
        
        # 3. Baca file sebagai byte mentah (Ini menggantikan peran Pillow!)
        file_bytes = file_storage.read()
        
        # 4. Kirim langsung ke Gemini (Support PDF, PNG, JPG)
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=file_bytes,
                    mime_type=mime_type,
                )
            ]
        )
        
        # Membersihkan format dan mengubah ke Dictionary
        response_text = response.text.replace("```json", "").replace("```", "").strip()
        hasil_analisis = json.loads(response_text)
        return hasil_analisis

    except Exception as e:
        print(f"Error pada AI Engine: {e}")
        return {
            "diagnosis": "Gagal Terbaca",
            "durasi_istirahat": 0,
            "risk_score": 0.0,
            "status_fraud": False,
            "alasan_ai": [f"Terjadi kesalahan AI: {str(e)}"]
        }