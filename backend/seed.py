from app import create_app, db
from app.models import Perusahaan, Faskes, Dokter, Pasien, Dokumen_Klaim

app = create_app()

def run_seeder():
    with app.app_context():
        # 1. Bersihkan data lama jika ada (agar tidak double saat di-run berkali-kali)
        db.drop_all()
        db.create_all()

        print("Menyuntikkan data ekosistem")

        # 2. Buat Entitas Perusahaan
        pt_a = Perusahaan(nama="PT Teknologi Bangsa")
        pt_b = Perusahaan(nama="PT Makmur Sentosa (Target Fraud)")
        db.session.add_all([pt_a, pt_b])
        db.session.commit()

        # 3. Buat Entitas Faskes & Dokter
        klinik_normal = Faskes(nama="Klinik Sehat Utama", jenis="Klinik Pratama")
        klinik_mencurigakan = Faskes(nama="Klinik Berkah Medika", jenis="Klinik Pratama")
        db.session.add_all([klinik_normal, klinik_mencurigakan])
        db.session.commit()

        dr_andi = Dokter(nama="dr. Andi Susanto", faskes_id=klinik_normal.id)
        dr_budi = Dokter(nama="dr. Budi Santoso (Suspect)", faskes_id=klinik_mencurigakan.id)
        db.session.add_all([dr_andi, dr_budi])
        db.session.commit()

        # 4. Buat Entitas Pasien (Karyawan)
        pasien_normal = Pasien(nama="Rina Wijaya", perusahaan_id=pt_a.id)
        
        # Komplotan PT Makmur Sentosa
        komplotan_1 = Pasien(nama="Joko Riyadi", perusahaan_id=pt_b.id)
        komplotan_2 = Pasien(nama="Siti Aminah", perusahaan_id=pt_b.id)
        komplotan_3 = Pasien(nama="Bambang Pamungkas", perusahaan_id=pt_b.id)
        
        db.session.add_all([pasien_normal, komplotan_1, komplotan_2, komplotan_3])
        db.session.commit()

        # 5. Injeksi Data Klaim / Surat Sakit
        # Data Normal
        klaim_1 = Dokumen_Klaim(
            pasien_id=pasien_normal.id, faskes_id=klinik_normal.id, dokter_id=dr_andi.id,
            tanggal_periksa="2026-09-01", diagnosis="Demam Berdarah (A91)", durasi_istirahat=3
        )

        # Data Fraud (Pola Ekosistem Mencurigakan)
        klaim_2 = Dokumen_Klaim(
            pasien_id=komplotan_1.id, faskes_id=klinik_mencurigakan.id, dokter_id=dr_budi.id,
            tanggal_periksa="2026-09-05", diagnosis="Dispepsia (K30)", durasi_istirahat=2
        )
        klaim_3 = Dokumen_Klaim(
            pasien_id=komplotan_2.id, faskes_id=klinik_mencurigakan.id, dokter_id=dr_budi.id,
            tanggal_periksa="2026-09-05", diagnosis="Dispepsia (K30)", durasi_istirahat=2
        )
        klaim_4 = Dokumen_Klaim(
            pasien_id=komplotan_3.id, faskes_id=klinik_mencurigakan.id, dokter_id=dr_budi.id,
            tanggal_periksa="2026-09-06", diagnosis="Dispepsia (K30)", durasi_istirahat=2
        )

        db.session.add_all([klaim_1, klaim_2, klaim_3, klaim_4])
        db.session.commit()

        print("Sukses! Data skenario fraud berhasil ditanamkan ke database.")

if __name__ == '__main__':
    run_seeder()