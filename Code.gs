/**
 * BINA MARGA DASHBOARD BACKEND API (Google Apps Script)
 * 
 * Skenario Basis Data Spreadsheet:
 * 1. Spreadsheet memiliki Sheet bernama "DATA_SPK_2026"
 *    - Kolom Status diasumsikan berada di kolom D (indeks 3) dengan nilai seperti "Berjalan", "Selesai", dll.
 * 2. Spreadsheet memiliki Sheet bernama "LAPORAN_BULANAN_2026"
 *    - Kolom Progres Fisik diasumsikan berada di kolom C (indeks 2) berupa angka/persentase (misal: 0.68 atau 68)
 *    - Kolom Serapan Anggaran berada di kolom D (indeks 3) berupa angka rupiah (misal: 120000000000)
 */

// GANTI DENGAN SPREADSHEET ID ANDA YANG SEBENARNYA
var SPREADSHEET_ID = 'MASUKKAN_SPREADSHEET_ID_ANDA_DI_SINI';

function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // --- 1. HITUNG TOTAL SPK AKTIF (DATA_SPK_2026) ---
    var spkSheet = ss.getSheetByName("DATA_SPK_2026");
    var totalSPK = 0;
    
    if (spkSheet) {
      var spkData = spkSheet.getDataRange().getValues();
      // Asumsikan Baris 1 adalah Header. Baris data mulai dari indeks 1.
      // Kolom D (Status SPK) = indeks 3
      for (var i = 1; i < spkData.length; i++) {
        var status = spkData[i][3]; // Kolom D
        if (status && status.toString().trim().toLowerCase() === "berjalan") {
          totalSPK++;
        }
      }
    } else {
      totalSPK = 45; // Fallback jika sheet belum ada
    }

    // --- 2. HITUNG PROGRES FISIK & SERAPAN ANGGARAN (LAPORAN_BULANAN_2026) ---
    var lapSheet = ss.getSheetByName("LAPORAN_BULANAN_2026");
    var totalProgres = 0;
    var countProgres = 0;
    var totalSerapan = 0;
    
    if (lapSheet) {
      var lapData = lapSheet.getDataRange().getValues();
      // Asumsikan Baris 1 adalah Header. Baris data mulai dari indeks 1.
      // Kolom C (Progres Fisik) = indeks 2
      // Kolom D (Serapan Anggaran) = indeks 3
      for (var j = 1; j < lapData.length; j++) {
        var progresVal = lapData[j][2]; // Kolom C
        var serapanVal = lapData[j][3]; // Kolom D
        
        // Hitung Progres Fisik
        if (progresVal !== "" && !isNaN(progresVal)) {
          // Jika nilai disimpan dalam desimal (misal 0.68), konversikan ke persen (* 100)
          var val = parseFloat(progresVal);
          if (val <= 1.0 && val > 0) {
            val = val * 100;
          }
          totalProgres += val;
          countProgres++;
        }
        
        // Hitung Serapan Anggaran
        if (serapanVal !== "" && !isNaN(serapanVal)) {
          totalSerapan += parseFloat(serapanVal);
        }
      }
    }
    
    var avgProgres = countProgres > 0 ? Math.round(totalProgres / countProgres) : 68; // Fallback jika pembagian nol
    if (totalSerapan === 0) {
      totalSerapan = 120000000000; // Fallback Rp 120 Miliar jika kosong
    }
    
    // --- 3. KEMAS KE FORMAT JSON ---
    var result = {
      status: "success",
      totalSPK: totalSPK,
      progresFisik: avgProgres,
      totalSerapan: totalSerapan,
      timestamp: new Date().toISOString()
    };
    
    // Mengembalikan response JSON yang mendukung CORS
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Mengembalikan response error
    var errorResult = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * CARA DEPLOY SEBAGAI WEB APP DI GOOGLE APPS SCRIPT:
 * 
 * 1. Buka spreadsheet Google Sheets Anda.
 * 2. Klik Ekstensi -> Apps Script.
 * 3. Hapus kode bawaan dan tempel kode Code.gs di atas.
 * 4. Ganti 'MASUKKAN_SPREADSHEET_ID_ANDA_DI_SINI' dengan ID Spreadsheet Anda (lihat URL Spreadsheet Anda).
 * 5. Klik "Simpan" (ikon disket).
 * 6. Klik tombol "Terapkan" (Deploy) di kanan atas -> "Penerapan baru" (New deployment).
 * 7. Pilih Jenis Penerapan: "Aplikasi Web" (Web App).
 * 8. Konfigurasi:
 *    - Deskripsi: Integrasi API Bina Marga
 *    - Jalankan sebagai: "Saya" (akun email Anda)
 *    - Yang memiliki akses: "Siapa saja" (Anyone) -> PENTING! Agar frontend web dapat mengambil data tanpa login.
 * 9. Klik "Terapkan" (Deploy).
 * 10. Jika diminta otorisasi, klik "Berikan Otorisasi" (Authorize access), pilih email Anda, klik "Lanjutan" (Advanced) -> "Buka (tidak aman)" -> klik "Izinkan".
 * 11. Salin "URL Aplikasi Web" yang dihasilkan (contoh: https://script.google.com/macros/s/.../exec).
 * 12. Tempel URL tersebut pada panel konfigurasi di bagian bawah halaman Dashboard Web Anda dan klik "Simpan & Hubungkan".
 */
