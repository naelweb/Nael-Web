// State Management
import { supabase } from './supabaseClient.js';

let apiEndpoint = localStorage.getItem('bina_marga_api_url') || '';
let isFetching = false;
let isAdminMode = localStorage.getItem('isAdminMode') === 'true';

// Global cache variables for page data (loaded from Supabase)
let cachedCardsData = null;
let cachedPortalData = null;
let cachedRekapData = null;
let cachedGalleryTitle = '';
let cachedFieldDocTitle = '';

const CARDS_STORAGE_KEY = 'bina_marga_cards_data';
const CARDS_DEFAULT = {
    2025: { title: "Tahun Anggaran 2025", subtitle: "Kemantapan Jalan Provinsi Kaltim", rencana: 85.70, realisasi: 85.83, panjang: 805.77 },
    2026: { title: "Tahun Anggaran 2026", subtitle: "Kemantapan Jalan Provinsi Kaltim", rencana: 89.84, realisasi: null, panjang: 843.46 }
};

function loadCardsData() {
    if (cachedCardsData) return cachedCardsData;
    return loadCardsDataFromLocalStorage();
}

function loadCardsDataFromLocalStorage() {
    try {
        const stored = localStorage.getItem(CARDS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            for (const year of [2025, 2026]) {
                if (parsed[year]) {
                    if (parsed[year].title === undefined) parsed[year].title = CARDS_DEFAULT[year].title;
                    if (parsed[year].subtitle === undefined) parsed[year].subtitle = CARDS_DEFAULT[year].subtitle;
                }
            }
            return parsed;
        }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(CARDS_DEFAULT));
}

function saveCardsData(data) {
    cachedCardsData = data;
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(data));
    if (supabase) {
        saveCardsDataToSupabase(data);
    }
}

async function saveCardsDataToSupabase(data) {
    try {
        for (const year of Object.keys(data)) {
            const card = data[year];
            const { error } = await supabase
                .from('cards_data')
                .upsert({
                    year: parseInt(year, 10),
                    title: card.title,
                    subtitle: card.subtitle,
                    rencana: parseFloat(card.rencana),
                    realisasi: card.realisasi !== null ? parseFloat(card.realisasi) : null,
                    panjang: parseFloat(card.panjang)
                });
            if (error) throw error;
        }
        console.log("Cards data successfully saved to Supabase.");
    } catch (err) {
        console.error("Error saving cards data to Supabase:", err);
    }
}

const PORTALS_STORAGE_KEY = 'bina_marga_portal_data';
const PORTALS_DEFAULT = [
    {
        id: "group-2026",
        title: "Tahun Anggaran 2026",
        icon: "fa-solid fa-calendar-check",
        buttons: [
            { id: "btn-1", title: "Dokumen Paket Pekerjaan TA 2026", url: "https://docs.google.com/forms/d/e/1FAIpQLScTdnOCj3I4FzlrtSYEz7sakaP7NIfgQo3ADynUfTMIugdJpA/viewform", icon: "fa-solid fa-folder-open" },
            { id: "btn-2", title: "Laporan Bulanan BM 2026", url: "https://docs.google.com/forms/d/e/1FAIpQLSdQvlrUcUgTEzS7b-Gk23rG0g4FqdfqJMG5lMpvB-b1ATA_Jg/viewform", icon: "fa-solid fa-file-invoice" }
        ]
    },
    {
        id: "group-2025",
        title: "Tahun Anggaran 2025",
        icon: "fa-solid fa-calendar-days",
        buttons: [
            { id: "btn-3", title: "Data Bina Marga 2025", url: "https://drive.google.com/drive/folders/1fM6bB2Y_tH7gxeLZBWffRPkRA6UtIj1Y", icon: "fa-solid fa-database" },
            { id: "btn-4", title: "SPK Bina Marga TA 2025", url: "https://docs.google.com/spreadsheets/d/1ANRWC59gNAhIWAD7AeC1BLaiB1jJebHQuqiO09lzmUI/edit?resourcekey=&gid=2069665605#gid=2069665605", icon: "fa-solid fa-folder-open" },
            { id: "btn-5", title: "Laporan Bulanan BM 2025", url: "https://docs.google.com/spreadsheets/d/1E1SeJCTq0lIYzwXKr1fE3JDXqhGbFIY20arAydttE-o/edit?resourcekey=&gid=312133315#gid=312133315", icon: "fa-solid fa-file-invoice" },
            { id: "btn-6", title: "Prognosis Bina Marga TA 2025", url: "https://docs.google.com/spreadsheets/d/1LxmgxMKZh22mcgnRddWfDj_MGFWxhHYZXcl6wlIOEEw/edit", icon: "fa-solid fa-chart-pie" },
            { id: "btn-7", title: "Data STA TA 2025", url: "https://docs.google.com/spreadsheets/d/1rNciy86IslGKIwRzvszjH4FYCtFyAe5I8BkVFngnHhQ/edit?gid=391266308#gid=391266308", icon: "fa-solid fa-road" }
        ]
    },
    {
        id: "group-master",
        title: "Master Data",
        icon: "fa-solid fa-folder-closed",
        buttons: [
            { id: "btn-8", title: "LB Program Jalan Provinsi 2019-2024", url: "https://drive.google.com/drive/folders/1B9T191pMCZgCg5QBpg3U9YTCjw-G5hAa", icon: "fa-solid fa-book" }
        ]
    }
];

function loadPortalData() {
    if (cachedPortalData) return cachedPortalData;
    return loadPortalDataFromLocalStorage();
}

function loadPortalDataFromLocalStorage() {
    try {
        const stored = localStorage.getItem(PORTALS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(PORTALS_DEFAULT));
}

function savePortalData(data) {
    cachedPortalData = data;
    localStorage.setItem(PORTALS_STORAGE_KEY, JSON.stringify(data));
    if (supabase) {
        savePortalDataToSupabase(data);
    }
}

async function savePortalDataToSupabase(data) {
    try {
        // Upsert groups
        const groupsToUpsert = data.map((group, idx) => ({
            id: group.id,
            title: group.title,
            icon: group.icon,
            display_order: idx
        }));
        
        const { error: groupError } = await supabase
            .from('portal_groups')
            .upsert(groupsToUpsert);
            
        if (groupError) throw groupError;
        
        // Upsert buttons
        const buttonsToUpsert = [];
        data.forEach(group => {
            group.buttons.forEach((btn, idx) => {
                buttonsToUpsert.push({
                    id: btn.id,
                    group_id: group.id,
                    title: btn.title,
                    url: btn.url,
                    icon: btn.icon || 'fa-solid fa-link',
                    display_order: idx
                });
            });
        });
        
        if (buttonsToUpsert.length > 0) {
            const { error: btnError } = await supabase
                .from('portal_buttons')
                .upsert(buttonsToUpsert);
            if (btnError) throw btnError;
        }
        
        console.log("Portal data successfully saved to Supabase.");
    } catch (err) {
        console.error("Error saving portal data to Supabase:", err);
    }
}

// Mock Data
const MOCK_DATA = {
    totalSPK: 45,
    progresFisik: 68,
    totalSerapan: "Rp 120 Miliar"
};

// DOM Elements
const valSpk = document.getElementById('val-spk');
const valProgres = document.getElementById('val-progres');
const barProgres = document.getElementById('bar-progres');
const lblProgres = document.getElementById('lbl-progres');
const valAnggaran = document.getElementById('val-anggaran');
const apiUrlInput = document.getElementById('api-url-input');
const connectionStatus = document.getElementById('connection-status');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch all data from Supabase (or fallback to local storage)
    await loadAllDbData();

    // Set Input Value if Saved
    if (apiEndpoint) {
        if (apiUrlInput) apiUrlInput.value = apiEndpoint;
        if (connectionStatus) {
            connectionStatus.innerHTML = `Status: Terhubung ke API kustom (Live Sheets Mode).`;
            connectionStatus.style.color = 'var(--accent-cyan)';
        }
        loadDashboardData(apiEndpoint);
    } else {
        // Load default mock data
        applyDashboardData(MOCK_DATA);
    }

    // Initialize Rekapitulasi Table & Modal Previews
    renderRekapTable();
    setupModalPreviews();
    renderSummaryCards();
    renderPortalSection();

    // Initialize Navigation Bar
    initNavbar();

    // Initialize Sidebar Mini-Gallery Lightbox
    initGallery();
    initGalleryTitle();

    // Initialize Scroll Reveal Animations
    initScrollReveal();

    // Loading screen outro transition timing (completes in 2.6s)
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('loaded');
        }
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        
        // Trigger layout resize to recalculate sizes if needed
        window.dispatchEvent(new Event('resize'));
    }, 2600);
});

async function loadAllDbData() {
    if (!supabase) {
        // Load fallback caches from localStorage or defaults
        cachedCardsData = loadCardsDataFromLocalStorage();
        cachedPortalData = loadPortalDataFromLocalStorage();
        cachedRekapData = loadRekapDataFromLocalStorage();
        cachedGalleryTitle = localStorage.getItem('bina_marga_gallery_title') || 'Dokumentasi Kegiatan 2025';
        cachedFieldDocTitle = localStorage.getItem('bina_marga_field_doc_title') || 'Dokumentasi Lapangan';
        return;
    }

    try {
        const [cardsRes, rekapRes, groupsRes, buttonsRes, settingsRes] = await Promise.all([
            supabase.from('cards_data').select('*'),
            supabase.from('rekap_data').select('*'),
            supabase.from('portal_groups').select('*').order('display_order', { ascending: true }),
            supabase.from('portal_buttons').select('*').order('display_order', { ascending: true }),
            supabase.from('site_settings').select('*')
        ]);

        if (cardsRes.error) throw cardsRes.error;
        if (rekapRes.error) throw rekapRes.error;
        if (groupsRes.error) throw groupsRes.error;
        if (buttonsRes.error) throw buttonsRes.error;
        if (settingsRes.error) throw settingsRes.error;

        // 1. Populate Cards
        if (cardsRes.data && cardsRes.data.length > 0) {
            cachedCardsData = {};
            cardsRes.data.forEach(row => {
                cachedCardsData[row.year] = {
                    title: row.title,
                    subtitle: row.subtitle,
                    rencana: parseFloat(row.rencana),
                    realisasi: row.realisasi !== null ? parseFloat(row.realisasi) : null,
                    panjang: parseFloat(row.panjang)
                };
            });
            localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cachedCardsData));
        } else {
            cachedCardsData = loadCardsDataFromLocalStorage();
        }

        // 2. Populate Rekap
        if (rekapRes.data && rekapRes.data.length > 0) {
            cachedRekapData = rekapRes.data.map(row => ({
                tahun: parseInt(row.tahun, 10),
                pagu: parseFloat(row.pagu),
                keuangan: parseFloat(row.keuangan),
                fisik: parseFloat(row.fisik)
            }));
            localStorage.setItem(REKAP_STORAGE_KEY, JSON.stringify(cachedRekapData));
        } else {
            cachedRekapData = loadRekapDataFromLocalStorage();
        }

        // 3. Populate Portals
        if (groupsRes.data && groupsRes.data.length > 0) {
            cachedPortalData = groupsRes.data.map(group => {
                const groupButtons = buttonsRes.data
                    .filter(btn => btn.group_id === group.id)
                    .map(btn => ({
                        id: btn.id,
                        title: btn.title,
                        url: btn.url,
                        icon: btn.icon
                    }));
                return {
                    id: group.id,
                    title: group.title,
                    icon: group.icon,
                    buttons: groupButtons
                };
            });
            localStorage.setItem(PORTALS_STORAGE_KEY, JSON.stringify(cachedPortalData));
        } else {
            cachedPortalData = loadPortalDataFromLocalStorage();
        }

        // 4. Populate Site Settings
        if (settingsRes.data) {
            const gTitle = settingsRes.data.find(s => s.key === 'gallery_title');
            const fTitle = settingsRes.data.find(s => s.key === 'field_doc_title');
            cachedGalleryTitle = gTitle ? gTitle.value : 'Dokumentasi Kegiatan 2025';
            cachedFieldDocTitle = fTitle ? fTitle.value : 'Dokumentasi Lapangan';
            localStorage.setItem('bina_marga_gallery_title', cachedGalleryTitle);
            localStorage.setItem('bina_marga_field_doc_title', cachedFieldDocTitle);
        }

        console.log("Dashboard data successfully loaded from Supabase.");
    } catch (err) {
        console.error("Error loading dashboard data from Supabase, falling back to local storage:", err);
        cachedCardsData = loadCardsDataFromLocalStorage();
        cachedPortalData = loadPortalDataFromLocalStorage();
        cachedRekapData = loadRekapDataFromLocalStorage();
        cachedGalleryTitle = localStorage.getItem('bina_marga_gallery_title') || 'Dokumentasi Kegiatan 2025';
        cachedFieldDocTitle = localStorage.getItem('bina_marga_field_doc_title') || 'Dokumentasi Lapangan';
    }
}





// Save Custom API Endpoint
function saveApiUrl() {
    if (!apiUrlInput) return;
    const url = apiUrlInput.value.trim();
    if (url === '') {
        localStorage.removeItem('bina_marga_api_url');
        apiEndpoint = '';
        if (connectionStatus) {
            connectionStatus.innerHTML = 'Status: Menggunakan data tiruan (Mockup Mode).';
            connectionStatus.style.color = '#5f8085';
        }
        applyDashboardData(MOCK_DATA);
        alert('API URL dibersihkan. Kembali menggunakan data mockup.');
    } else {
        try {
            new URL(url); // Validate URL format
            localStorage.setItem('bina_marga_api_url', url);
            apiEndpoint = url;
            if (connectionStatus) {
                connectionStatus.innerHTML = 'Status: Terhubung ke API kustom (Live Sheets Mode).';
                connectionStatus.style.color = 'var(--accent-cyan)';
            }
            loadDashboardData(url);
        } catch (e) {
            alert('Format URL tidak valid. Mohon masukkan URL lengkap.');
        }
    }
}

// Apply Data to DOM Elements
function applyDashboardData(data) {
    // 1. Total SPK
    if (valSpk) {
        valSpk.textContent = `${data.totalSPK} SPK`;
        valSpk.classList.remove('loading-text');
    }

    // 2. Progres Fisik
    if (valProgres) {
        const progressVal = parseFloat(data.progresFisik) || 0;
        valProgres.textContent = `${progressVal}%`;
        valProgres.classList.remove('loading-text');
        if (barProgres) barProgres.style.width = `${progressVal}%`;
        if (lblProgres) lblProgres.textContent = `${progressVal}% Terealisasi`;
    }

    // 3. Serapan Anggaran
    if (valAnggaran) {
        valAnggaran.textContent = typeof data.totalSerapan === 'number' 
            ? formatRupiah(data.totalSerapan) 
            : data.totalSerapan;
        valAnggaran.classList.remove('loading-text');
    }
}

// Show Loading States in DOM
function setLoaderState() {
    // Card 1
    if (valSpk) valSpk.innerHTML = '<span class="skeleton-pulse skeleton-value" style="display:inline-block;"></span>';
    // Card 2
    if (valProgres) valProgres.innerHTML = '<span class="skeleton-pulse skeleton-value" style="display:inline-block;"></span>';
    if (barProgres) barProgres.style.width = '0%';
    if (lblProgres) lblProgres.innerHTML = 'Memuat...';
    // Card 3
    if (valAnggaran) valAnggaran.innerHTML = '<span class="skeleton-pulse skeleton-value" style="display:inline-block;"></span>';
}

// Helper to Format Currency to Rupiah
function formatRupiah(value) {
    if (value >= 1e9) {
        return `Rp ${(value / 1e9).toFixed(2)} Miliar`;
    } else if (value >= 1e6) {
        return `Rp ${(value / 1e6).toFixed(2)} Juta`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

// Asynchronous Dashboard Fetching Data
async function loadDashboardData(url) {
    if (isFetching) return;
    isFetching = true;
    
    setLoaderState();
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors', // Enable CORS redirection following
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate Apps Script payload schema
        if (data.totalSPK === undefined || data.progresFisik === undefined || data.totalSerapan === undefined) {
            throw new Error("Format JSON respons tidak valid.");
        }
        
        applyDashboardData(data);
        console.log("Data berhasil diambil dari Google Sheets:", data);
        
    } catch (error) {
        console.error("Gagal memuat data dari Google Sheets API:", error);
        
        // Visual Error State on Cards
        if (valSpk) valSpk.innerHTML = '<span style="color: var(--error); font-size:0.9rem;">Gagal Memuat</span>';
        if (valProgres) valProgres.innerHTML = '<span style="color: var(--error); font-size:0.9rem;">Gagal Memuat</span>';
        if (lblProgres) lblProgres.innerHTML = 'Error API';
        if (valAnggaran) valAnggaran.innerHTML = '<span style="color: var(--error); font-size:0.9rem;">Gagal Memuat</span>';
        
        // Fallback alert
        setTimeout(() => {
            alert(`Koneksi Gagal: ${error.message}\n\nMenampilkan data mockup sebagai cadangan.`);
            applyDashboardData(MOCK_DATA);
        }, 800);
    } finally {
        isFetching = false;
    }
}

// Handle Citizen Complaint Form Submission
function handleComplaintSubmit(event) {
    event.preventDefault();
    
    const pelapor = document.getElementById('nama-pelapor').value.trim();
    const lokasi = document.getElementById('lokasi-kerusakan').value.trim();
    const deskripsi = document.getElementById('deskripsi-kerusakan').value.trim();
    
    const submitBtn = event.target.querySelector('.form-submit-btn');
    const originalText = submitBtn.textContent;
    
    // Disable button and show sending progress
    submitBtn.disabled = true;
    submitBtn.textContent = 'MENGIRIM...';
    
    setTimeout(() => {
        // Success Mockup alert
        alert(`Laporan Pengaduan Berhasil Dikirim!\n\nNama: ${pelapor}\nLokasi: ${lokasi}\nLaporan Anda akan ditinjau oleh Bidang Pemeliharaan Jalan & Jembatan.`);
        
        // Reset Form and Restore Button
        document.getElementById('complaint-form').reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }, 1200);
}

// ═══════════════════════════════════════════════════════════════════
// REKAPITULASI PAGU & REALISASI — Data, Render, CRUD
// ═══════════════════════════════════════════════════════════════════

const REKAP_STORAGE_KEY = 'bina_marga_rekap_data';

// Default data (2019–2025)
const REKAP_DEFAULT = [
    { tahun: 2019, pagu: 619499939397.00,    keuangan: 411991184257.13, fisik: 99.98 },
    { tahun: 2020, pagu: 346392174064.00,    keuangan: 280814038814.43, fisik: 100.00 },
    { tahun: 2021, pagu: 681509357600.00,    keuangan: 584460604804.95, fisik: 96.63 },
    { tahun: 2022, pagu: 788197691713.00,    keuangan: 664736396253.00, fisik: 86.65 },
    { tahun: 2023, pagu: 2195394894981.91,   keuangan: 1976580133758.00, fisik: 99.84 },
    { tahun: 2024, pagu: 1303982789805.00,   keuangan: 1273819526743.96, fisik: 97.57 },
    { tahun: 2025, pagu: 2261855760358.00,   keuangan: 2078724320744.00, fisik: 95.59 },
];

// Load from localStorage or use default
function loadRekapData() {
    if (cachedRekapData) return cachedRekapData;
    return loadRekapDataFromLocalStorage();
}

function loadRekapDataFromLocalStorage() {
    try {
        const stored = localStorage.getItem(REKAP_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return [...REKAP_DEFAULT];
}

function saveRekapData(data) {
    cachedRekapData = data;
    localStorage.setItem(REKAP_STORAGE_KEY, JSON.stringify(data));
    if (supabase) {
        saveRekapDataToSupabase(data);
    }
}

async function saveRekapDataToSupabase(data) {
    try {
        const rowsToUpsert = data.map(row => ({
            tahun: parseInt(row.tahun, 10),
            pagu: parseFloat(row.pagu),
            keuangan: parseFloat(row.keuangan),
            fisik: parseFloat(row.fisik)
        }));
        
        const { error } = await supabase
            .from('rekap_data')
            .upsert(rowsToUpsert);
            
        if (error) throw error;
        console.log("Rekap data successfully saved to Supabase.");
    } catch (err) {
        console.error("Error saving rekap data to Supabase:", err);
    }
}

// Format angka ke Rupiah ringkas (Triliun / Miliar)
function formatRupiahRekap(val) {
    if (val >= 1e12) return `Rp ${(val / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`;
    if (val >= 1e9)  return `Rp ${(val / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
}

// Format angka lengkap untuk sub-label
function formatRupiahFull(val) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(val);
}

// Badge class berdasar % serapan
function getBadgeClass(pct) {
    if (pct >= 95) return 'badge-green';
    if (pct >= 80) return 'badge-yellow';
    return 'badge-red';
}

// Bar fill class berdasar % fisik
function getFillClass(fisik) {
    if (fisik >= 95) return 'fill-green';
    if (fisik >= 80) return 'fill-yellow';
    return 'fill-red';
}

// Render tabel utama
function renderRekapTable() {
    const data = loadRekapData();
    const tbody = document.getElementById('rekap-tbody');
    const tfoot = document.getElementById('rekap-tfoot');
    if (!tbody || !tfoot) return;

    // Sort by year asc
    data.sort((a, b) => a.tahun - b.tahun);

    // Render body
    tbody.innerHTML = data.map((row, idx) => {
        const serapanPct = row.pagu > 0 ? (row.keuangan / row.pagu * 100) : 0;
        const serapanFormatted = serapanPct.toFixed(2) + '%';
        const badgeClass = getBadgeClass(serapanPct);
        const fillClass = getFillClass(row.fisik);
        const fisikPct = Math.min(row.fisik, 100);

        return `
        <tr>
            <td class="col-tahun"><button class="btn-detail-trigger" onclick="showYearDetails(${row.tahun})" title="Klik untuk melihat rincian sub kegiatan">${row.tahun}</button></td>
            <td class="td-currency">
                ${formatRupiahRekap(row.pagu)}
                <span class="td-sub">${formatRupiahFull(row.pagu)}</span>
            </td>
            <td class="td-currency">
                ${formatRupiahRekap(row.keuangan)}
                <span class="td-sub">${formatRupiahFull(row.keuangan)}</span>
            </td>
            <td class="td-serapan-wrap">
                <span class="serapan-badge ${badgeClass}">${serapanFormatted}</span>
            </td>
            <td>
                <div class="td-fisik-wrap">
                    <div class="fisik-bar-row">
                        <span class="fisik-pct-label">${row.fisik.toFixed(2)}%</span>
                        <div class="fisik-bar-track">
                            <div class="fisik-bar-fill ${fillClass}" style="width: ${fisikPct}%;"></div>
                        </div>
                    </div>
                </div>
            </td>
            <td class="col-act">
                <div class="td-actions">
                    <button class="btn-edit-row" title="Edit" onclick="openEditModal(${idx})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-del-row" title="Hapus" onclick="deleteRekapRow(${idx})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Render footer (totals + rata-rata)
    const totalPagu     = data.reduce((s, r) => s + r.pagu, 0);
    const totalKeuangan = data.reduce((s, r) => s + r.keuangan, 0);
    const totalSerapan  = totalPagu > 0 ? (totalKeuangan / totalPagu * 100) : 0;
    const avgFisik      = data.length > 0 ? data.reduce((s, r) => s + r.fisik, 0) / data.length : 0;
    const footBadge     = getBadgeClass(totalSerapan);
    const footFill      = getFillClass(avgFisik);

    tfoot.innerHTML = `
    <tr>
        <td class="col-tahun" style="color: var(--text-secondary) !important; font-size: 0.75rem !important;">TOTAL</td>
        <td class="td-currency">${formatRupiahRekap(totalPagu)}</td>
        <td class="td-currency">${formatRupiahRekap(totalKeuangan)}</td>
        <td class="td-serapan-wrap">
            <span class="serapan-badge ${footBadge}">${totalSerapan.toFixed(2)}%</span>
        </td>
        <td>
            <div class="td-fisik-wrap">
                <div class="fisik-bar-row">
                    <span class="fisik-pct-label">${avgFisik.toFixed(2)}%</span>
                    <div class="fisik-bar-track">
                        <div class="fisik-bar-fill ${footFill}" style="width: ${Math.min(avgFisik,100)}%;"></div>
                    </div>
                </div>
            </div>
        </td>
        <td class="col-act"></td>
    </tr>`;
}

// Delete row
function deleteRekapRow(idx) {
    const data = loadRekapData();
    data.sort((a, b) => a.tahun - b.tahun);
    const row = data[idx];
    if (!row) return;
    if (!confirm(`Hapus data tahun ${row.tahun}? Tindakan ini tidak bisa dibatalkan.`)) return;
    const tahunToDelete = row.tahun;
    data.splice(idx, 1);
    saveRekapData(data);
    if (supabase) {
        deleteRekapRowFromSupabase(tahunToDelete);
    }
    renderRekapTable();
}

async function deleteRekapRowFromSupabase(tahun) {
    if (!supabase) return;
    try {
        const { error } = await supabase
            .from('rekap_data')
            .delete()
            .eq('tahun', tahun);
        if (error) throw error;
        console.log(`Rekap row ${tahun} successfully deleted from Supabase.`);
    } catch (err) {
        console.error("Error deleting rekap row from Supabase:", err);
    }
}

// ─── Modal ─────────────────────────────────────────────────────────

const modalOverlay  = document.getElementById('rekap-modal-overlay');
const modalTitle    = document.getElementById('modal-title');
const modalEditIdx  = document.getElementById('modal-edit-index');
const modalTahun    = document.getElementById('modal-tahun');
const modalPagu     = document.getElementById('modal-pagu');
const modalKeuangan = document.getElementById('modal-keuangan');
const modalFisik    = document.getElementById('modal-fisik');
const prevPagu      = document.getElementById('prev-pagu');
const prevKeuangan  = document.getElementById('prev-keuangan');

// Live preview Rupiah di modal input
function setupModalPreviews() {
    if (!modalPagu || !modalKeuangan) return;
    modalPagu.addEventListener('input', () => {
        const v = parseFloat(modalPagu.value);
        prevPagu.textContent = isNaN(v) ? '—' : formatRupiahFull(v);
    });
    modalKeuangan.addEventListener('input', () => {
        const v = parseFloat(modalKeuangan.value);
        prevKeuangan.textContent = isNaN(v) ? '—' : formatRupiahFull(v);
    });
}

function openModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-open');
}

function closeModalDirect() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-open');
}

function closeModal(e) {
    if (e.target === modalOverlay) closeModalDirect();
}

function openEditModal(idx) {
    const data = loadRekapData();
    data.sort((a, b) => a.tahun - b.tahun);
    const row = data[idx];
    if (!row) return;

    modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Data Tahun ${row.tahun}`;
    modalEditIdx.value   = idx;
    modalTahun.value     = row.tahun;
    modalPagu.value      = row.pagu;
    modalKeuangan.value  = row.keuangan;
    modalFisik.value     = row.fisik;

    prevPagu.textContent     = formatRupiahFull(row.pagu);
    prevKeuangan.textContent = formatRupiahFull(row.keuangan);

    openModal();
}

function openAddModal() {
    modalTitle.innerHTML = `<i class="fa-solid fa-plus"></i> Tambah Tahun Anggaran`;
    modalEditIdx.value   = '';
    document.getElementById('modal-form').reset();
    prevPagu.textContent     = '—';
    prevKeuangan.textContent = '—';
    openModal();
}

function saveModalData(e) {
    e.preventDefault();

    const tahun    = parseInt(modalTahun.value, 10);
    const pagu     = parseFloat(modalPagu.value);
    const keuangan = parseFloat(modalKeuangan.value);
    const fisik    = parseFloat(modalFisik.value);

    if (isNaN(tahun) || isNaN(pagu) || isNaN(keuangan) || isNaN(fisik)) {
        alert('Semua field harus diisi dengan angka yang valid.');
        return;
    }

    const data = loadRekapData();
    data.sort((a, b) => a.tahun - b.tahun);

    const editIdx = modalEditIdx.value;

    if (editIdx === '') {
        // Tambah baru — cek duplikat
        if (data.find(r => r.tahun === tahun)) {
            alert(`Data tahun ${tahun} sudah ada. Gunakan tombol Edit untuk mengubah.`);
            return;
        }
        data.push({ tahun, pagu, keuangan, fisik });
    } else {
        // Edit existing
        const idx = parseInt(editIdx, 10);
        if (data[idx]) {
            data[idx] = { tahun, pagu, keuangan, fisik };
        }
    }

    saveRekapData(data);
    renderRekapTable();
    closeModalDirect();
}

// ─── Admin Password Modal Handlers ────────────────────────────────
const adminPasswordOverlay = document.getElementById('admin-password-overlay');
const adminPasswordInput = document.getElementById('admin-password-input');
const adminPasswordError = document.getElementById('admin-password-error');

function openAdminPasswordModal() {
    if (!adminPasswordOverlay) return;
    if (adminPasswordInput) {
        adminPasswordInput.value = '';
        adminPasswordInput.classList.remove('shake');
    }
    if (adminPasswordError) adminPasswordError.textContent = '';
    adminPasswordOverlay.classList.add('is-open');
    setTimeout(() => {
        if (adminPasswordInput) adminPasswordInput.focus();
    }, 150);
}

function closeAdminPasswordModalDirect() {
    if (!adminPasswordOverlay) return;
    adminPasswordOverlay.classList.remove('is-open');
}

function closeAdminPasswordModal(e) {
    if (e.target === adminPasswordOverlay) closeAdminPasswordModalDirect();
}

function submitAdminPassword(e) {
    e.preventDefault();
    if (!adminPasswordInput) return;
    const password = adminPasswordInput.value;
    if (password === "admin123") {
        isAdminMode = true;
        localStorage.setItem('isAdminMode', isAdminMode);
        updateAdminUI();
        closeAdminPasswordModalDirect();
    } else {
        if (adminPasswordError) adminPasswordError.textContent = "Kata sandi salah!";
        adminPasswordInput.classList.remove('shake');
        void adminPasswordInput.offsetWidth; // trigger reflow to restart animation
        adminPasswordInput.classList.add('shake');
    }
}

function updateAdminUI() {
    const adminLockBtn = document.getElementById('admin-lock-btn');
    const rekapSection = document.querySelector('.rekap-section');
    if (!adminLockBtn || !rekapSection) return;
    const lockIcon = adminLockBtn.querySelector('i');
    if (isAdminMode) {
        rekapSection.classList.remove('admin-locked');
        document.body.classList.remove('admin-locked');
        adminLockBtn.classList.add('unlocked');
        adminLockBtn.title = "Mode Admin Terbuka (Klik untuk mengunci)";
        if (lockIcon) {
            lockIcon.className = 'fa-solid fa-lock-open';
        }
    } else {
        rekapSection.classList.add('admin-locked');
        document.body.classList.add('admin-locked');
        adminLockBtn.classList.remove('unlocked');
        adminLockBtn.title = "Mode Admin Terkunci (Klik untuk membuka)";
        if (lockIcon) {
            lockIcon.className = 'fa-solid fa-lock';
        }
    }
    if (typeof renderPortalSection === 'function') {
        renderPortalSection();
    }
}

// ─── Summary Cards Edit Modal Handlers ────────────────────────────
function renderSummaryCards() {
    const data = loadCardsData();
    
    for (const year of [2025, 2026]) {
        const rCard = data[year];
        if (rCard) {
            const titleEl = document.getElementById(`card-${year}-title`);
            const subtitleEl = document.getElementById(`card-${year}-subtitle`);
            if (titleEl) titleEl.textContent = rCard.title;
            if (subtitleEl) subtitleEl.textContent = rCard.subtitle;
            
            const rLabel = document.getElementById(`card-${year}-rencana`);
            const pLabel = document.getElementById(`card-${year}-panjang`);
            if (rLabel) rLabel.textContent = `${rCard.rencana.toFixed(2).replace('.', ',')}%`;
            if (pLabel) pLabel.textContent = `${rCard.panjang.toFixed(2).replace('.', ',')} Km`;
            
            if (year === 2025) {
                const aLabel = document.getElementById('card-2025-realisasi');
                if (aLabel) aLabel.textContent = `${rCard.realisasi.toFixed(2).replace('.', ',')}%`;
            }
        }
    }
}

function openCardEditModal(year) {
    const overlay = document.getElementById('card-edit-modal-overlay');
    const title = document.getElementById('card-modal-title');
    const yearInput = document.getElementById('card-modal-year');
    const titleInput = document.getElementById('card-modal-title-input');
    const subtitleInput = document.getElementById('card-modal-subtitle-input');
    const rencanaInput = document.getElementById('card-modal-rencana');
    const realisasiGroup = document.getElementById('card-modal-realisasi-group');
    const realisasiInput = document.getElementById('card-modal-realisasi');
    const panjangLabel = document.getElementById('card-modal-panjang-label');
    const panjangInput = document.getElementById('card-modal-panjang');
    
    if (!overlay || !yearInput) return;
    
    const data = loadCardsData();
    const cardData = data[year];
    if (!cardData) return;
    
    yearInput.value = year;
    title.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Data Summary ${year}`;
    if (titleInput) titleInput.value = cardData.title || '';
    if (subtitleInput) subtitleInput.value = cardData.subtitle || '';
    rencanaInput.value = cardData.rencana;
    panjangInput.value = cardData.panjang;
    
    if (year === 2025) {
        realisasiGroup.style.display = '';
        realisasiInput.setAttribute('required', 'true');
        realisasiInput.value = cardData.realisasi !== null ? cardData.realisasi : '';
        panjangLabel.textContent = 'Total Panjang Jalan Tertangani (Km)';
    } else {
        realisasiGroup.style.display = 'none';
        realisasiInput.removeAttribute('required');
        realisasiInput.value = '';
        panjangLabel.textContent = 'Total Panjang Jalan (Km)';
    }
    
    overlay.classList.add('is-open');
}

function closeCardModalDirect() {
    const overlay = document.getElementById('card-edit-modal-overlay');
    if (overlay) overlay.classList.remove('is-open');
}

function closeCardModal(e) {
    const overlay = document.getElementById('card-edit-modal-overlay');
    if (e.target === overlay) closeCardModalDirect();
}

function saveCardModalData(e) {
    e.preventDefault();
    
    const yearInput = document.getElementById('card-modal-year');
    const titleInput = document.getElementById('card-modal-title-input');
    const subtitleInput = document.getElementById('card-modal-subtitle-input');
    const rencanaInput = document.getElementById('card-modal-rencana');
    const realisasiInput = document.getElementById('card-modal-realisasi');
    const panjangInput = document.getElementById('card-modal-panjang');
    
    if (!yearInput) return;
    
    const year = parseInt(yearInput.value, 10);
    const titleVal = titleInput ? titleInput.value.trim() : '';
    const subtitleVal = subtitleInput ? subtitleInput.value.trim() : '';
    const rencana = parseFloat(rencanaInput.value);
    const panjang = parseFloat(panjangInput.value);
    let realisasi = null;
    
    if (year === 2025) {
        realisasi = parseFloat(realisasiInput.value);
    }
    
    if (!titleVal || !subtitleVal) {
        alert('Judul dan Deskripsi card tidak boleh kosong.');
        return;
    }
    
    if (isNaN(rencana) || isNaN(panjang) || (year === 2025 && isNaN(realisasi))) {
        alert('Mohon masukkan nilai angka yang valid.');
        return;
    }
    
    const data = loadCardsData();
    if (data[year]) {
        data[year].title = titleVal;
        data[year].subtitle = subtitleVal;
        data[year].rencana = rencana;
        data[year].panjang = panjang;
        data[year].realisasi = realisasi;
        
        saveCardsData(data);
        renderSummaryCards();
        closeCardModalDirect();
    }
}

// ─── Portal Buttons & Drag-and-Drop Handlers ──────────────────────
function renderPortalSection() {
    const container = document.getElementById('portal-groups-container');
    if (!container) return;
    
    const data = loadPortalData();
    
    container.innerHTML = data.map(group => {
        const buttonsHtml = group.buttons.map(btn => `
            <a href="${btn.url}" target="_blank" rel="noopener noreferrer" class="pill-button" data-id="${btn.id}" draggable="${isAdminMode ? 'true' : 'false'}">
                <div class="pill-button-content">
                    <i class="${btn.icon || 'fa-solid fa-link'} pill-button-icon"></i>
                    <span>${btn.title}</span>
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square pill-arrow"></i>
                <div class="pill-button-actions col-act">
                    <button class="btn-edit-portal" onclick="openPortalEditModal(event, '${btn.id}')" title="Edit Button">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-del-portal" onclick="deletePortalButton(event, '${btn.id}')" title="Hapus Button">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </a>
        `).join('');
        
        return `
            <div class="year-group reveal active" data-group-id="${group.id}">
                <div class="year-group-header">
                    <div class="year-title">
                        <i class="${group.icon}"></i>
                        <span>${group.title}</span>
                    </div>
                    <button class="portal-add-btn col-act" onclick="openPortalAddModal('${group.id}')" title="Tambah Button">
                        <i class="fa-solid fa-plus"></i> Tambah
                    </button>
                </div>
                <div class="button-grid">
                    ${buttonsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // Wire up Drag and Drop events
    makeButtonsDraggable();
}

function makeButtonsDraggable() {
    const buttons = document.querySelectorAll('.portal-section .pill-button');
    buttons.forEach(btn => {
        if (isAdminMode) {
            btn.setAttribute('draggable', 'true');
        } else {
            btn.removeAttribute('draggable');
        }
        
        btn.addEventListener('dragstart', (e) => {
            if (!isAdminMode) return;
            e.dataTransfer.setData('text/plain', btn.dataset.id);
            btn.classList.add('dragging');
        });
        
        btn.addEventListener('dragend', () => {
            btn.classList.remove('dragging');
        });
    });
    
    const grids = document.querySelectorAll('.portal-section .button-grid');
    grids.forEach(grid => {
        grid.addEventListener('dragover', (e) => {
            if (!isAdminMode) return;
            e.preventDefault();
            const draggingBtn = document.querySelector('.pill-button.dragging');
            if (!draggingBtn) return;
            
            const afterElement = getDragAfterElement(grid, e.clientY);
            if (afterElement == null) {
                grid.appendChild(draggingBtn);
            } else {
                grid.insertBefore(draggingBtn, afterElement);
            }
        });
        
        grid.addEventListener('drop', (e) => {
            if (!isAdminMode) return;
            e.preventDefault();
            savePortalReorderState();
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.pill-button:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function savePortalReorderState() {
    const portalData = loadPortalData();
    const allButtons = [];
    portalData.forEach(g => allButtons.push(...g.buttons));
    
    const newPortalData = [];
    const groups = document.querySelectorAll('.portal-section .year-group');
    groups.forEach(groupEl => {
        const groupId = groupEl.dataset.groupId;
        const origGroup = portalData.find(g => g.id === groupId);
        if (!origGroup) return;
        
        const newButtons = [];
        const btnElements = groupEl.querySelectorAll('.pill-button');
        btnElements.forEach(btnEl => {
            const btnId = btnEl.dataset.id;
            const origBtn = allButtons.find(b => b.id === btnId);
            if (origBtn) {
                newButtons.push(origBtn);
            }
        });
        
        newPortalData.push({
            ...origGroup,
            buttons: newButtons
        });
    });
    
    savePortalData(newPortalData);
    renderPortalSection();
}

// Intercept clicks on pill-button in Admin Mode to allow dragging/editing
document.addEventListener('click', (e) => {
    if (isAdminMode) {
        const btn = e.target.closest('.portal-section .pill-button');
        if (btn) {
            // Check if they clicked an action button
            if (e.target.closest('.pill-button-actions')) {
                return; // Let the action buttons handle it
            }
            // Prevent navigation for the link itself in admin mode
            e.preventDefault();
        }
    }
}, true);

// CRUD Handlers for Portal Buttons
function openPortalAddModal(groupId) {
    const overlay = document.getElementById('portal-edit-modal-overlay');
    const title = document.getElementById('portal-modal-title');
    const actionInput = document.getElementById('portal-modal-action');
    const groupInput = document.getElementById('portal-modal-group-id');
    const buttonInput = document.getElementById('portal-modal-button-id');
    const titleInput = document.getElementById('portal-modal-title-input');
    const urlInput = document.getElementById('portal-modal-url-input');
    const iconSelect = document.getElementById('portal-modal-icon-select');
    
    if (!overlay) return;
    
    title.innerHTML = '<i class="fa-solid fa-plus"></i> Tambah Button Portal';
    actionInput.value = 'add';
    groupInput.value = groupId;
    buttonInput.value = '';
    titleInput.value = '';
    urlInput.value = '';
    iconSelect.value = 'fa-solid fa-folder-open';
    
    overlay.classList.add('is-open');
}

function openPortalEditModal(e, buttonId) {
    e.preventDefault();
    e.stopPropagation();
    
    const overlay = document.getElementById('portal-edit-modal-overlay');
    const title = document.getElementById('portal-modal-title');
    const actionInput = document.getElementById('portal-modal-action');
    const groupInput = document.getElementById('portal-modal-group-id');
    const buttonInput = document.getElementById('portal-modal-button-id');
    const titleInput = document.getElementById('portal-modal-title-input');
    const urlInput = document.getElementById('portal-modal-url-input');
    const iconSelect = document.getElementById('portal-modal-icon-select');
    
    if (!overlay) return;
    
    const data = loadPortalData();
    let foundBtn = null;
    let foundGroupId = null;
    
    for (const group of data) {
        const btn = group.buttons.find(b => b.id === buttonId);
        if (btn) {
            foundBtn = btn;
            foundGroupId = group.id;
            break;
        }
    }
    
    if (!foundBtn) return;
    
    title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Button Portal';
    actionInput.value = 'edit';
    groupInput.value = foundGroupId;
    buttonInput.value = buttonId;
    titleInput.value = foundBtn.title;
    urlInput.value = foundBtn.url;
    iconSelect.value = foundBtn.icon || 'fa-solid fa-folder-open';
    
    overlay.classList.add('is-open');
}

function closePortalModalDirect() {
    const overlay = document.getElementById('portal-edit-modal-overlay');
    if (overlay) overlay.classList.remove('is-open');
}

function closePortalModal(e) {
    const overlay = document.getElementById('portal-edit-modal-overlay');
    if (e.target === overlay) closePortalModalDirect();
}

function deletePortalButton(e, buttonId) {
    e.preventDefault();
    e.stopPropagation();
    
    const data = loadPortalData();
    let btnTitle = '';
    
    for (const group of data) {
        const btn = group.buttons.find(b => b.id === buttonId);
        if (btn) {
            btnTitle = btn.title;
            break;
        }
    }
    
    if (!confirm(`Hapus button "${btnTitle}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    
    for (const group of data) {
        const idx = group.buttons.findIndex(b => b.id === buttonId);
        if (idx !== -1) {
            group.buttons.splice(idx, 1);
            break;
        }
    }
    
    savePortalData(data);
    if (supabase) {
        deletePortalButtonFromSupabase(buttonId);
    }
    renderPortalSection();
}

async function deletePortalButtonFromSupabase(buttonId) {
    if (!supabase) return;
    try {
        const { error } = await supabase
            .from('portal_buttons')
            .delete()
            .eq('id', buttonId);
        if (error) throw error;
        console.log(`Button ${buttonId} successfully deleted from Supabase.`);
    } catch (err) {
        console.error("Error deleting button from Supabase:", err);
    }
}

function savePortalModalData(e) {
    e.preventDefault();
    
    const actionInput = document.getElementById('portal-modal-action');
    const groupInput = document.getElementById('portal-modal-group-id');
    const buttonInput = document.getElementById('portal-modal-button-id');
    const titleInput = document.getElementById('portal-modal-title-input');
    const urlInput = document.getElementById('portal-modal-url-input');
    const iconSelect = document.getElementById('portal-modal-icon-select');
    
    const action = actionInput.value;
    const groupId = groupInput.value;
    const buttonId = buttonInput.value;
    const btnTitle = titleInput.value.trim();
    const btnUrl = urlInput.value.trim();
    const btnIcon = iconSelect.value;
    
    if (!btnTitle || !btnUrl) {
        alert('Mohon lengkapi semua data button.');
        return;
    }
    
    const data = loadPortalData();
    
    if (action === 'add') {
        const group = data.find(g => g.id === groupId);
        if (group) {
            const newId = 'btn-' + Date.now();
            group.buttons.push({
                id: newId,
                title: btnTitle,
                url: btnUrl,
                icon: btnIcon
            });
        }
    } else if (action === 'edit') {
        let updated = false;
        for (const group of data) {
            const btn = group.buttons.find(b => b.id === buttonId);
            if (btn) {
                btn.title = btnTitle;
                btn.url = btnUrl;
                btn.icon = btnIcon;
                updated = true;
                break;
            }
        }
        if (!updated) return;
    }
    
    savePortalData(data);
    renderPortalSection();
    closePortalModalDirect();
}



// ═══════════════════════════════════════════════════════════════════
// NAVIGATION BAR INTERACTIONS (Sticky scroll class, scroll spy, mobile toggle)
// ═══════════════════════════════════════════════════════════════════
function initNavbar() {
    const headerEl = document.querySelector('header');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    let isScrollingFromMenu = false;
    let scrollTimeout = null;

    // Sticky Scroll Effect
    if (headerEl) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                headerEl.classList.add('scrolled');
            } else {
                headerEl.classList.remove('scrolled');
            }
        });
    }

    // Toggle Mobile Menu
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('is-active');
            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('is-active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('is-active');
                const icon = menuToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // Close menu when selecting a menu link and handle click scroll behavior
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            isScrollingFromMenu = true;

            // Set active class immediately
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (navMenu) {
                navMenu.classList.remove('is-active');
                const icon = menuToggle?.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }

            const href = link.getAttribute('href');
            if (href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Debounce ScrollSpy verification until scroll transitions complete
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrollingFromMenu = false;
            }, 800);
        });
    });

    // ScrollSpy: highlight menu items depending on scroll position (defined in exact physical order)
    function updateScrollSpy() {
        const scrollPos = window.scrollY || document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        // Sticky header height or default offset
        const headerHeight = headerEl ? headerEl.offsetHeight : 100;
        const offset = headerHeight + 50; // trigger point: header height + 50px buffer

        // Helper to calculate absolute top position of an element by ID
        const getAbsoluteTop = (id) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            if (id === 'home') return 0; // Home is always at the very top of the page (0px)
            return el.getBoundingClientRect().top + scrollPos;
        };

        const positions = {
            home: 0,
            'data-hub': getAbsoluteTop('data-hub'),
            'projects': getAbsoluteTop('projects'),
            'gallery': getAbsoluteTop('gallery')
        };

        let currentActiveId = 'home';

        // Check scroll position against ranges from bottom to top
        if (scrollPos + viewportHeight >= scrollHeight - 80) {
            currentActiveId = 'gallery';
        } else if (scrollPos >= positions['gallery'] - offset) {
            currentActiveId = 'gallery';
        } else if (scrollPos >= positions['projects'] - offset) {
            currentActiveId = 'projects';
        } else if (scrollPos >= positions['data-hub'] - offset) {
            currentActiveId = 'data-hub';
        } else {
            currentActiveId = 'home';
        }

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentActiveId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Run on scroll and initial load
    window.addEventListener('scroll', () => {
        if (!isScrollingFromMenu) {
            updateScrollSpy();
        }
    });
    updateScrollSpy();

    // Admin Lock Mode Toggle Feature
    const adminLockBtn = document.getElementById('admin-lock-btn');
    if (adminLockBtn) {
        adminLockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isAdminMode) {
                openAdminPasswordModal();
            } else {
                isAdminMode = false;
                localStorage.setItem('isAdminMode', isAdminMode);
                updateAdminUI();
            }
        });
    }

    updateAdminUI();
}

// Lightbox overlay helper for Sidebar Mini-Gallery using Fancybox
function initGallery() {
    if (typeof Fancybox !== 'undefined') {
        Fancybox.bind('[data-fancybox]', {
            Animated: true,
            showClass: "f-fadeIn",
            hideClass: "f-fadeOut",
            Toolbar: {
                display: {
                    left: ["infobar"],
                    middle: [],
                    right: ["zoom", "slideshow", "fullscreen", "close"],
                },
            },
        });
    }
}

// Sub Activity Details Data
const DETAIL_SUB_KEGIATAN = {
    2019: [
        { nama: "Pelebaran Jalan Lintas Samarinda - Tenggarong", pagu: 250000000000.00, keuangan: 185000000000.00 },
        { nama: "Rehabilitasi Jembatan Sungai Karang Mumus", pagu: 150000000000.00, keuangan: 120000000000.00 },
        { nama: "Peningkatan Struktur Jalan Lintas Sebulu", pagu: 219499939397.00, keuangan: 106991184257.13 }
    ],
    2020: [
        { nama: "Pemeliharaan Rutin Jalan Koridor Lintas Kutai Kartanegara", pagu: 146392174064.00, keuangan: 110814038814.43 },
        { nama: "Pembangunan Jembatan Bentang Pendek Lintas Mahakam", pagu: 200000000000.00, keuangan: 170000000000.00 }
    ],
    2021: [
        { nama: "Peningkatan Jalan Lintas Utama Balikpapan - Penajam", pagu: 381509357600.00, keuangan: 324460604804.95 },
        { nama: "Rekonstruksi Jembatan Kawasan Hulu Kaltim", pagu: 300000000000.00, keuangan: 260000000000.00 }
    ],
    2022: [
        { nama: "Preservasi Jalan Lintas Koridor Samarinda - Bontang", pagu: 488197691713.00, keuangan: 404736396253.00 },
        { nama: "Pembangunan Jembatan Akses Kawasan Industri Kariangau", pagu: 300000000000.00, keuangan: 260000000000.00 }
    ],
    2023: [
        { nama: "Pelebaran Lintas Penunjang Kawasan IKN Nusantara", pagu: 1195394894981.91, keuangan: 1076580133758.00 },
        { nama: "Rehabilitasi Struktur Jembatan Sungai Mahakam III", pagu: 1000000000000.00, keuangan: 900000000000.00 }
    ],
    2024: [
        { nama: "Peningkatan Kapasitas Jalan Koridor Lintas Melak", pagu: 803982789805.00, keuangan: 783819526743.96 },
        { nama: "Pembangunan Jembatan Lintas Sungai Besar Kaltim", pagu: 500000000000.00, keuangan: 490000000000.00 }
    ],
    2025: [
        { nama: "Pelebaran Jalan Lintas Utama Provinsi TA 2025", pagu: 1261855760358.00, keuangan: 1178724320744.00 },
        { nama: "Pembangunan Akses Jembatan Penghubung Kawasan Strategis", pagu: 1000000000000.00, keuangan: 900000000000.00 }
    ]
};

// Show details modal handler
function showYearDetails(tahun) {
    const data = loadRekapData();
    const row = data.find(r => r.tahun === tahun);
    if (!row) return;

    let subActivities = DETAIL_SUB_KEGIATAN[tahun];
    
    // Fallback for custom years added dynamically
    if (!subActivities) {
        subActivities = [
            { nama: `Pekerjaan Konstruksi & Preservasi Jalan Provinsi TA ${tahun}`, pagu: row.pagu * 0.65, keuangan: row.keuangan * 0.65 },
            { nama: `Peningkatan Struktur Jembatan & Pemeliharaan TA ${tahun}`, pagu: row.pagu * 0.35, keuangan: row.keuangan * 0.35 }
        ];
    }

    const tbody = document.getElementById('detail-modal-tbody');
    const title = document.getElementById('detail-modal-title');
    if (!tbody || !title) return;

    title.innerHTML = `<i class="fa-solid fa-circle-info"></i> Rincian Sub Kegiatan Tahun ${tahun}`;
    
    tbody.innerHTML = subActivities.map(sub => `
        <tr>
            <td style="text-align: left; font-weight: 600; color: var(--text-primary); padding: 0.75rem 0.5rem; line-height: 1.4;">${sub.nama}</td>
            <td class="td-currency" style="text-align: right; padding: 0.75rem 0.5rem;">${formatRupiahFull(sub.pagu)}</td>
            <td class="td-currency" style="text-align: right; padding: 0.75rem 0.5rem;">${formatRupiahFull(sub.keuangan)}</td>
        </tr>
    `).join('');

    const overlay = document.getElementById('detail-modal-overlay');
    if (overlay) overlay.classList.add('is-open');
}

function closeDetailModalDirect() {
    const overlay = document.getElementById('detail-modal-overlay');
    if (overlay) overlay.classList.remove('is-open');
}

function closeDetailModal(e) {
    const overlay = document.getElementById('detail-modal-overlay');
    if (e.target === overlay) closeDetailModalDirect();
}

// Performant Scroll Reveal Handler using IntersectionObserver
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Stop observing once revealed to maintain page performance
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05, // trigger when 5% of the card is visible
        rootMargin: '0px 0px -30px 0px' // trigger slightly before entering viewport fully
    });

    revealElements.forEach(el => {
        // Initial check in case it's already in view on page load
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('active');
        } else {
            observer.observe(el);
        }
    });
}

// ─── Sidebar Gallery Title Inline Edit Handlers ───────────────────
function initGalleryTitle() {
    const textEl1 = document.getElementById('sidebar-gallery-title-text');
    if (textEl1) {
        textEl1.textContent = cachedGalleryTitle || localStorage.getItem('bina_marga_gallery_title') || 'Dokumentasi Kegiatan 2025';
    }
    const textEl2 = document.getElementById('sidebar-field-doc-title-text');
    if (textEl2) {
        textEl2.textContent = cachedFieldDocTitle || localStorage.getItem('bina_marga_field_doc_title') || 'Dokumentasi Lapangan';
    }
}

function startInlineEditGalleryTitle() {
    const textEl = document.getElementById('sidebar-gallery-title-text');
    if (!textEl) return;
    
    textEl.contentEditable = 'true';
    textEl.classList.add('inline-editing');
    textEl.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(textEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            textEl.blur();
        } else if (e.key === 'Escape') {
            textEl.contentEditable = 'false';
            textEl.classList.remove('inline-editing');
            textEl.textContent = cachedGalleryTitle || localStorage.getItem('bina_marga_gallery_title') || 'Dokumentasi Kegiatan 2025';
            cleanup();
        }
    };
    
    const onBlur = () => {
        textEl.contentEditable = 'false';
        textEl.classList.remove('inline-editing');
        const newTitle = textEl.textContent.trim();
        if (newTitle) {
            cachedGalleryTitle = newTitle;
            localStorage.setItem('bina_marga_gallery_title', newTitle);
            if (supabase) {
                saveSettingToSupabase('gallery_title', newTitle);
            }
        } else {
            textEl.textContent = cachedGalleryTitle || localStorage.getItem('bina_marga_gallery_title') || 'Dokumentasi Kegiatan 2025';
        }
        cleanup();
    };
    
    function cleanup() {
        textEl.removeEventListener('keydown', onKeyDown);
        textEl.removeEventListener('blur', onBlur);
    }
    
    textEl.addEventListener('keydown', onKeyDown);
    textEl.addEventListener('blur', onBlur);
}

function startInlineEditFieldDocTitle() {
    const textEl = document.getElementById('sidebar-field-doc-title-text');
    if (!textEl) return;
    
    textEl.contentEditable = 'true';
    textEl.classList.add('inline-editing');
    textEl.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(textEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            textEl.blur();
        } else if (e.key === 'Escape') {
            textEl.contentEditable = 'false';
            textEl.classList.remove('inline-editing');
            textEl.textContent = cachedFieldDocTitle || localStorage.getItem('bina_marga_field_doc_title') || 'Dokumentasi Lapangan';
            cleanup();
        }
    };
    
    const onBlur = () => {
        textEl.contentEditable = 'false';
        textEl.classList.remove('inline-editing');
        const newTitle = textEl.textContent.trim();
        if (newTitle) {
            cachedFieldDocTitle = newTitle;
            localStorage.setItem('bina_marga_field_doc_title', newTitle);
            if (supabase) {
                saveSettingToSupabase('field_doc_title', newTitle);
            }
        } else {
            textEl.textContent = cachedFieldDocTitle || localStorage.getItem('bina_marga_field_doc_title') || 'Dokumentasi Lapangan';
        }
        cleanup();
    };
    
    function cleanup() {
        textEl.removeEventListener('keydown', onKeyDown);
        textEl.removeEventListener('blur', onBlur);
    }
    
    textEl.addEventListener('keydown', onKeyDown);
    textEl.addEventListener('blur', onBlur);
}

async function saveSettingToSupabase(key, value) {
    if (!supabase) return;
    try {
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key, value });
        if (error) throw error;
        console.log(`Setting ${key} saved to Supabase.`);
    } catch (err) {
        console.error(`Error saving setting ${key} to Supabase:`, err);
    }
}



