import { useState, useEffect } from 'react';

function App() {
  const [claims, setClaims] = useState([]);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedClaim, setSelectedClaim] = useState(null);

  const fetchClaims = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/claims');
      const data = await response.json();
      setClaims(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleResetData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat klaim karyawan? Tindakan ini tidak bisa dibatalkan.")) {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/reset-claims', { method: 'DELETE' });
        if (response.ok) {
          setClaims([]);
          setUploadResult(null);
          alert("Data uji coba berhasil dibersihkan!");
        }
      } catch (error) {
        console.error("Gagal mereset data:", error);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert("Pilih minimal satu dokumen!");

    setIsUploading(true);
    setUploadResult(null);
    let hasilSementara = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);

      try {
        const response = await fetch('http://127.0.0.1:5000/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        hasilSementara.push({
          namaFile: files[i].name,
          ...result.data
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Upload gagal untuk file ${files[i].name}:`, error);
      }
    }

    setUploadResult(hasilSementara[hasilSementara.length - 1]);
    fetchClaims();
    setIsUploading(false);
    alert(`Investigasi selesai untuk ${files.length} dokumen. Silakan cek hasil skor di layar!`);
  };

  const filteredClaims = claims.filter(claim => {
    if (!startDate && !endDate) return true;
    const claimDate = new Date(claim.tanggal);
    if (isNaN(claimDate.getTime())) return true;
    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date('2000-01-01');
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-01-01');
    return claimDate >= start && claimDate <= end;
  });

  const totalKlaim = filteredClaims.length;
  const totalFraud = filteredClaims.filter(c => c.status_fraud).length;
  const persentaseFraud = totalKlaim > 0 ? Math.round((totalFraud / totalKlaim) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Tupiksa</h1>
          <p className="text-slate-500 mt-2 text-lg">Corporate HR Healthcare Fraud Intelligence</p>
        </div>
        <button
          onClick={handleResetData}
          className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold py-2 px-4 rounded-lg transition text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
          Reset Data Uji Coba
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Klaim Diproses</p>
            <h2 className="text-3xl font-extrabold text-blue-900 mt-1">{totalKlaim} <span className="text-sm font-normal text-slate-400">dokumen</span></h2>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Indikasi Fraud</p>
            <h2 className="text-3xl font-extrabold text-red-600 mt-1">{totalFraud} <span className="text-sm font-normal text-slate-400">anomali</span></h2>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" /></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Rasio Risiko Ekosistem</p>
            <h2 className="text-3xl font-extrabold text-orange-500 mt-1">{persentaseFraud}%</h2>
          </div>
          <div className="w-full max-w-[80px] bg-slate-100 rounded-full h-3 ml-4">
            <div className={`h-3 rounded-full ${persentaseFraud > 50 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${persentaseFraud}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Investigasi Dokumen Baru</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition">
              <input
                type="file"
                multiple
                accept="image/*, .pdf, .doc, .docx"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:bg-slate-400">
              {isUploading ? 'Agen AI Sedang Menganalisis...' : 'Mulai Analisis AI'}
            </button>
          </form>

          {uploadResult && (
            <div className={`mt-6 p-4 rounded-xl border ${uploadResult.status_fraud ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <h3 className="font-bold text-lg mb-2">Hasil AI & Ekosistem:</h3>
              <p><strong>Skor Risiko:</strong> {uploadResult.final_score}%</p>
              <p><strong>Diagnosis terdeteksi:</strong> {uploadResult.diagnosis}</p>
              <div className="mt-2 text-sm">
                <strong>Alasan Kecurigaan:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {uploadResult.alasan && uploadResult.alasan.map((alasan, i) => <li key={i}>{alasan}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold">Investigasi Klaim Medis Karyawan</h2>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1">Dari Tanggal</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-300 rounded-lg text-sm p-1.5 focus:outline-none focus:border-blue-500" />
              </div>
              <span className="text-slate-400 mt-5">-</span>
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1">Sampai Tanggal</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-300 rounded-lg text-sm p-1.5 focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="mt-5 bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg text-sm font-medium transition" title="Hapus Filter">Clear</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Nama Karyawan</th>
                  <th className="px-4 py-3">Klinik / Faskes</th>
                  <th className="px-4 py-3">Tanggal Surat</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      onClick={() => setSelectedClaim(claim)}
                      className="hover:bg-blue-50 transition cursor-pointer group"
                      title="Klik untuk melihat detail investigasi"
                    >
                      <td className="px-4 py-3 font-medium group-hover:text-blue-700">{claim.pasien}</td>
                      <td className="px-4 py-3 text-slate-500">{claim.faskes}</td>
                      <td className="px-4 py-3 text-slate-500">{claim.tanggal}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${claim.risk_score > 60 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${claim.risk_score}%` }}></div>
                          </div>
                          <span className="font-bold">{claim.risk_score}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {claim.status_fraud ? (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">FRAUD ALERT</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">AMAN</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500 italic">Tidak ada data klaim yang sesuai filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedClaim && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className={`p-6 border-b ${selectedClaim.status_fraud ? 'bg-red-50' : 'bg-blue-50'} flex justify-between items-start`}>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Laporan Investigasi AI</h3>
                <p className="text-slate-500 mt-1">ID Dokumen: #{selectedClaim.id} | Tanggal Surat: {selectedClaim.tanggal}</p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Data Karyawan</p>
                  <p className="font-semibold text-lg mt-1">{selectedClaim.pasien}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Klinik / Faskes</p>
                  <p className="font-semibold text-lg mt-1">{selectedClaim.faskes}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-bold text-lg border-b-2 border-slate-200 pb-1 pr-4">Detail Peringatan (Risk Score: {selectedClaim.risk_score}%)</h4>
                  {selectedClaim.status_fraud ?
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">FRAUD DETECTED</span> :
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">CLEAN DOCUMENT</span>
                  }
                </div>

                <div className="bg-slate-50 p-5 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-200 max-h-[250px] overflow-y-auto font-mono">
                  {selectedClaim.alasan_ai ? selectedClaim.alasan_ai.replace(/\[\vert{}\]|'/g, '').split(',').map((item, idx) => (
                    <div key={idx} className="mb-2 flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span>{item.trim()}</span>
                    </div>
                  )) : "Tidak ada catatan spesifik."}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedClaim(null)} className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-2 px-6 rounded-lg transition shadow-sm">
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;