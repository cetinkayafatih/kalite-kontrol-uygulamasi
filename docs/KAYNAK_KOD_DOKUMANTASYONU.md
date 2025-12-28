# KKYS - Kaynak Kod Dokümantasyonu

## Kalite Kontrol Yönetim Sistemi

**Versiyon:** 1.0.0
**Tarih:** Aralık 2024
**Standart:** ISO 2859-1

---

## İçindekiler

1. [Proje Yapısı](#proje-yapısı)
2. [Tip Tanımlamaları](#1-tip-tanımlamaları)
3. [Veri Katmanı](#2-veri-katmanı)
4. [Yardımcı Fonksiyonlar](#3-yardımcı-fonksiyonlar)
5. [State Yönetimi](#4-state-yönetimi)
6. [Layout Bileşenleri](#5-layout-bileşenleri)
7. [Ortak Bileşenler](#6-ortak-bileşenler)
8. [Sayfa Bileşenleri](#7-sayfa-bileşenleri)
9. [Uygulama Giriş Noktası](#8-uygulama-giriş-noktası)

---

## Proje Yapısı

```
quality-control-app/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript tip tanımları
│   ├── data/
│   │   └── samplingData.ts       # ISO 2859-1 örnekleme tabloları
│   ├── utils/
│   │   └── pdf.ts                # PDF oluşturma yardımcıları
│   ├── store/
│   │   └── useStore.ts           # Zustand state yönetimi
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Ana layout wrapper
│   │   │   ├── Header.tsx        # Üst navigasyon
│   │   │   └── Sidebar.tsx       # Yan menü
│   │   └── common/
│   │       ├── Badge.tsx         # Durum etiketleri
│   │       ├── Button.tsx        # Buton bileşeni
│   │       ├── Card.tsx          # Kart container
│   │       ├── Input.tsx         # Form inputları
│   │       ├── Modal.tsx         # Modal dialog
│   │       └── StatsCard.tsx     # İstatistik kartı
│   ├── pages/
│   │   ├── Dashboard.tsx         # Ana kontrol paneli
│   │   ├── LotEntry.tsx          # Parti giriş sayfası
│   │   ├── Inspection.tsx        # Kontrol sayfası
│   │   ├── Result.tsx            # Sonuç sayfası
│   │   ├── Reports.tsx           # Raporlar sayfası
│   │   ├── Suppliers.tsx         # Tedarikçi yönetimi
│   │   ├── Analytics.tsx         # Analiz sayfası
│   │   └── Settings.tsx          # Ayarlar sayfası
│   ├── App.tsx                   # React Router yapılandırması
│   ├── main.tsx                  # Uygulama başlatma
│   └── index.css                 # Global stiller
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 1. Tip Tanımlamaları

### 📄 index.ts

**Dosya Yolu:** `src/types/index.ts`

**Açıklama:** Uygulamada kullanılan tüm TypeScript arayüz (interface) ve tip tanımlarını içerir. Tedarikçi, malzeme, parti, kontrol ve istatistik veri modellerini tanımlar.

**Teknolojiler:** TypeScript

```typescript
// Tedarikçi bilgileri
export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

// Kontrol kriteri
export interface ControlCriterion {
  id: string;
  name: string;
  description: string;
  acceptanceCriteria: string;
  measurementMethod: string;
  isCritical: boolean;
}

// Hata türü
export interface DefectType {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

// Malzeme türü
export interface MaterialType {
  id: string;
  name: string;
  code: string;
  category: string;
  criteria: ControlCriterion[];
  defectTypes: DefectType[];
}

// Parti (Lot) bilgileri
export interface Lot {
  id: string;
  lotNumber: string;
  supplierId: string;
  materialTypeId: string;
  quantity: number;
  sampleSize: number;
  sampleCode: string;
  aql: string;
  inspectionLevel: 'I' | 'II' | 'III';
  acceptanceNumber: number;
  rejectionNumber: number;
  status: 'pending' | 'in-progress' | 'completed';
  decision: 'accepted' | 'rejected' | null;
  defectCount: number;
  orderNumber: string;
  receivedDate: string;
  inspectionDate: string;
  inspectedBy: string;
  notes: string;
  createdAt: string;
}

// Kontrol kaydındaki hata
export interface InspectionDefect {
  criterionId: string;
  defectTypeId: string;
  description: string;
}

// Kontrol kaydı
export interface Inspection {
  id: string;
  lotId: string;
  sampleNumber: number;
  isDefective: boolean;
  defects: InspectionDefect[];
  notes: string;
  photoBase64: string | null;
  createdAt: string;
}

// Örnekleme sonucu
export interface SamplingResult {
  sampleCode: string;
  sampleSize: number;
  acceptanceNumber: number;
  rejectionNumber: number;
}

// Dashboard istatistikleri
export interface DashboardStats {
  totalLots: number;
  totalAccepted: number;
  totalRejected: number;
  pendingLots: number;
  todayInspections: number;
  weeklyInspections: number;
  acceptanceRate: number;
}

// Tedarikçi performansı
export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalLots: number;
  acceptedLots: number;
  rejectedLots: number;
  acceptanceRate: number;
  avgDefectsPerLot: number;
}

// Hata analizi
export interface DefectAnalysis {
  defectTypeId: string;
  defectName: string;
  count: number;
  percentage: number;
}

// Trend verisi
export interface TrendData {
  date: string;
  inspections: number;
  accepted: number;
  rejected: number;
}

// Uygulama ayarları
export interface Settings {
  companyName: string;
  defaultAQL: string;
  defaultInspectionLevel: 'I' | 'II' | 'III';
  darkMode: boolean;
  language: 'tr' | 'en';
}

// Tip aliasları
export type InspectionStatus = 'pending' | 'in-progress' | 'completed';
export type Decision = 'accepted' | 'rejected' | null;
export type Severity = 'critical' | 'major' | 'minor';
export type InspectionLevel = 'I' | 'II' | 'III';
```

---

## 2. Veri Katmanı

### 📄 samplingData.ts

**Dosya Yolu:** `src/data/samplingData.ts`

**Açıklama:** ISO 2859-1 standardına uygun örnekleme tablolarını, örnek tedarikçi ve malzeme verilerini, örneklem hesaplama fonksiyonlarını içerir. Standart kabul örneklemesi için gerekli tüm referans tabloları bu dosyada tanımlanmıştır.

**Teknolojiler:** TypeScript, ISO 2859-1 Standardı

```typescript
import type { Supplier, MaterialType, SamplingResult } from '../types';

// ISO 2859-1 Örneklem Büyüklük Tablosu
// Parti büyüklüğü aralıklarına göre örneklem kod harfleri ve boyutları
export const sampleSizeTable: Record<string, { code: string; size: number }> = {
  "2-8": { code: "A", size: 2 },
  "9-15": { code: "B", size: 3 },
  "16-25": { code: "C", size: 5 },
  "26-50": { code: "D", size: 8 },
  "51-90": { code: "E", size: 13 },
  "91-150": { code: "F", size: 20 },
  "151-280": { code: "G", size: 32 },
  "281-500": { code: "H", size: 50 },
  "501-1200": { code: "J", size: 80 },
  "1201-3200": { code: "K", size: 125 },
  "3201-10000": { code: "L", size: 200 },
  "10001-35000": { code: "M", size: 315 },
  "35001-150000": { code: "N", size: 500 },
  "150001-500000": { code: "P", size: 800 },
  "500001-": { code: "Q", size: 1250 },
};

// ISO 2859-1 Kabul Tablosu
// Örneklem koduna ve AQL değerine göre [Kabul, Red] sayıları
// null değer = bu kombinasyon için plan yok
export const acceptanceTable: Record<string, Record<string, [number, number] | null>> = {
  A: { "0.65": null, "1.0": null, "1.5": null, "2.5": [0, 1], "4.0": [0, 1], "6.5": [0, 1] },
  B: { "0.65": null, "1.0": null, "1.5": [0, 1], "2.5": [0, 1], "4.0": [0, 1], "6.5": [1, 2] },
  C: { "0.65": null, "1.0": [0, 1], "1.5": [0, 1], "2.5": [0, 1], "4.0": [1, 2], "6.5": [2, 3] },
  D: { "0.65": [0, 1], "1.0": [0, 1], "1.5": [0, 1], "2.5": [1, 2], "4.0": [2, 3], "6.5": [3, 4] },
  E: { "0.65": [0, 1], "1.0": [0, 1], "1.5": [1, 2], "2.5": [2, 3], "4.0": [3, 4], "6.5": [5, 6] },
  F: { "0.65": [0, 1], "1.0": [1, 2], "1.5": [2, 3], "2.5": [3, 4], "4.0": [5, 6], "6.5": [7, 8] },
  G: { "0.65": [1, 2], "1.0": [2, 3], "1.5": [3, 4], "2.5": [5, 6], "4.0": [7, 8], "6.5": [10, 11] },
  H: { "0.65": [2, 3], "1.0": [3, 4], "1.5": [5, 6], "2.5": [7, 8], "4.0": [10, 11], "6.5": [14, 15] },
  J: { "0.65": [3, 4], "1.0": [5, 6], "1.5": [7, 8], "2.5": [10, 11], "4.0": [14, 15], "6.5": [21, 22] },
  K: { "0.65": [5, 6], "1.0": [7, 8], "1.5": [10, 11], "2.5": [14, 15], "4.0": [21, 22], "6.5": [21, 22] },
  L: { "0.65": [7, 8], "1.0": [10, 11], "1.5": [14, 15], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
  M: { "0.65": [10, 11], "1.0": [14, 15], "1.5": [21, 22], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
  N: { "0.65": [14, 15], "1.0": [21, 22], "1.5": [21, 22], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
  P: { "0.65": [21, 22], "1.0": [21, 22], "1.5": [21, 22], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
  Q: { "0.65": [21, 22], "1.0": [21, 22], "1.5": [21, 22], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
};

// AQL seçenekleri (form için)
export const aqlOptions = [
  { value: "0.65", label: "0.65%" },
  { value: "1.0", label: "1.0%" },
  { value: "1.5", label: "1.5%" },
  { value: "2.5", label: "2.5%" },
  { value: "4.0", label: "4.0%" },
  { value: "6.5", label: "6.5%" },
];

// Muayene seviyesi seçenekleri
export const inspectionLevels = [
  { value: "I", label: "Seviye I (Az)" },
  { value: "II", label: "Seviye II (Normal)" },
  { value: "III", label: "Seviye III (Sıkı)" },
];

// Parti büyüklüğünden örneklem kodu bulan fonksiyon
export function getSampleCode(lotSize: number, inspectionLevel: string = "II"): string | null {
  // Seviyeye göre örneklem boyutu ayarlaması
  const levelMultiplier = inspectionLevel === "I" ? 0.4 : inspectionLevel === "III" ? 1.6 : 1;
  const adjustedSize = Math.round(lotSize * levelMultiplier);

  for (const [range, data] of Object.entries(sampleSizeTable)) {
    const [min, max] = range.split("-").map((n) => (n === "" ? Infinity : parseInt(n)));
    if (adjustedSize >= min && adjustedSize <= (max || Infinity)) {
      return data.code;
    }
  }
  return null;
}

// Ana örnekleme hesaplama fonksiyonu
export function calculateSampling(
  lotSize: number,
  aql: string,
  inspectionLevel: string = "II"
): SamplingResult | null {
  // Parti büyüklüğü aralığını bul
  let sampleCode: string | null = null;
  let sampleSize = 0;

  for (const [range, data] of Object.entries(sampleSizeTable)) {
    const [min, max] = range.split("-").map((n) => (n === "" ? Infinity : parseInt(n)));
    if (lotSize >= min && lotSize <= (max || Infinity)) {
      sampleCode = data.code;
      sampleSize = data.size;
      break;
    }
  }

  if (!sampleCode) return null;

  // Muayene seviyesine göre ayarlama
  if (inspectionLevel === "I") {
    // Bir önceki kod harfine git
    const codes = Object.values(sampleSizeTable).map((d) => d.code);
    const currentIndex = codes.indexOf(sampleCode);
    if (currentIndex > 0) {
      const prevCode = codes[currentIndex - 1];
      const prevEntry = Object.values(sampleSizeTable).find((d) => d.code === prevCode);
      if (prevEntry) {
        sampleCode = prevCode;
        sampleSize = prevEntry.size;
      }
    }
  } else if (inspectionLevel === "III") {
    // Bir sonraki kod harfine git
    const codes = Object.values(sampleSizeTable).map((d) => d.code);
    const currentIndex = codes.indexOf(sampleCode);
    if (currentIndex < codes.length - 1) {
      const nextCode = codes[currentIndex + 1];
      const nextEntry = Object.values(sampleSizeTable).find((d) => d.code === nextCode);
      if (nextEntry) {
        sampleCode = nextCode;
        sampleSize = nextEntry.size;
      }
    }
  }

  // Kabul/Red sayılarını bul
  const acceptance = acceptanceTable[sampleCode]?.[aql];
  if (!acceptance) {
    // Bu kombinasyon için plan yok, en yakın planı bul
    const codes = Object.keys(acceptanceTable);
    const currentIndex = codes.indexOf(sampleCode);

    // Yukarı doğru ara
    for (let i = currentIndex + 1; i < codes.length; i++) {
      const acc = acceptanceTable[codes[i]]?.[aql];
      if (acc) {
        const entry = Object.values(sampleSizeTable).find((d) => d.code === codes[i]);
        if (entry) {
          return {
            sampleCode: codes[i],
            sampleSize: entry.size,
            acceptanceNumber: acc[0],
            rejectionNumber: acc[1],
          };
        }
      }
    }
    return null;
  }

  return {
    sampleCode,
    sampleSize,
    acceptanceNumber: acceptance[0],
    rejectionNumber: acceptance[1],
  };
}

// Karar verme fonksiyonu
export function makeDecision(
  defectCount: number,
  acceptanceNumber: number,
  rejectionNumber: number
): 'accepted' | 'rejected' | 'continue' {
  if (defectCount <= acceptanceNumber) return 'accepted';
  if (defectCount >= rejectionNumber) return 'rejected';
  return 'continue';
}

// Tarih formatlama
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Tarih-saat formatlama
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Parti numarası oluşturma
export function generateLotNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LOT-${year}${month}${day}-${random}`;
}

// Örnek tedarikçiler
export const defaultSuppliers: Supplier[] = [
  {
    id: "sup-001",
    name: "Anadolu Tekstil A.Ş.",
    code: "ANTK",
    contactPerson: "Mehmet Yılmaz",
    phone: "0212 555 1234",
    email: "info@anadolutekstil.com",
    address: "İstanbul, Türkiye",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sup-002",
    name: "Ege İplik San. Tic. Ltd. Şti.",
    code: "EGIP",
    contactPerson: "Ayşe Demir",
    phone: "0232 444 5678",
    email: "satis@egeiplik.com",
    address: "İzmir, Türkiye",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sup-003",
    name: "Marmara Etiket Ltd. Şti.",
    code: "MRET",
    contactPerson: "Ali Kaya",
    phone: "0224 333 9012",
    email: "info@marmaraetiket.com",
    address: "Bursa, Türkiye",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Örnek malzeme türleri
export const defaultMaterials: MaterialType[] = [
  {
    id: "mat-001",
    name: "Dokuma Etiket",
    code: "ETKT",
    category: "Etiket",
    criteria: [
      {
        id: "cri-001",
        name: "Boyut Kontrolü",
        description: "Etiket boyutlarının spesifikasyona uygunluğu",
        acceptanceCriteria: "±1mm tolerans",
        measurementMethod: "Dijital kumpas ile ölçüm",
        isCritical: true,
      },
      {
        id: "cri-002",
        name: "Renk Kontrolü",
        description: "Renklerin onaylı numuneye uygunluğu",
        acceptanceCriteria: "Delta E ≤ 2",
        measurementMethod: "Spektrofotometre ile ölçüm",
        isCritical: true,
      },
      {
        id: "cri-003",
        name: "Baskı Kalitesi",
        description: "Yazı ve logo netliği",
        acceptanceCriteria: "Okunabilir, bulanık değil",
        measurementMethod: "Görsel kontrol",
        isCritical: false,
      },
      {
        id: "cri-004",
        name: "Kesim Kalitesi",
        description: "Kenar düzgünlüğü",
        acceptanceCriteria: "Pürüzsüz, iplik çıkması yok",
        measurementMethod: "Görsel kontrol",
        isCritical: false,
      },
    ],
    defectTypes: [
      {
        id: "def-001",
        name: "Boyut Hatası",
        description: "Tolerans dışı boyut",
        severity: "critical",
      },
      {
        id: "def-002",
        name: "Renk Farklılığı",
        description: "Onaylı numuneden farklı renk",
        severity: "major",
      },
      {
        id: "def-003",
        name: "Baskı Hatası",
        description: "Bulanık veya eksik baskı",
        severity: "major",
      },
      {
        id: "def-004",
        name: "Kesim Hatası",
        description: "Düzensiz kesim, iplik çıkması",
        severity: "minor",
      },
      {
        id: "def-005",
        name: "Leke",
        description: "Yağ, mürekkep veya kir lekesi",
        severity: "minor",
      },
    ],
  },
  {
    id: "mat-002",
    name: "Pamuk İplik",
    code: "IPLK",
    category: "İplik",
    criteria: [
      {
        id: "cri-005",
        name: "Numara Kontrolü",
        description: "İplik numarasının (Ne) spesifikasyona uygunluğu",
        acceptanceCriteria: "±3% tolerans",
        measurementMethod: "Çile tartımı",
        isCritical: true,
      },
      {
        id: "cri-006",
        name: "Mukavemet Testi",
        description: "Kopma mukavemeti kontrolü",
        acceptanceCriteria: "Min. 12 cN/tex",
        measurementMethod: "Mukavemet test cihazı",
        isCritical: true,
      },
      {
        id: "cri-007",
        name: "Düzgünsüzlük (U%)",
        description: "İplik düzgünsüzlük değeri",
        acceptanceCriteria: "≤ 12%",
        measurementMethod: "Uster test cihazı",
        isCritical: false,
      },
      {
        id: "cri-008",
        name: "Büküm Kontrolü",
        description: "Metre başına büküm sayısı",
        acceptanceCriteria: "±5% tolerans",
        measurementMethod: "Büküm test cihazı",
        isCritical: false,
      },
    ],
    defectTypes: [
      {
        id: "def-006",
        name: "Numara Hatası",
        description: "Spesifikasyon dışı iplik numarası",
        severity: "critical",
      },
      {
        id: "def-007",
        name: "Düşük Mukavemet",
        description: "Minimum değerin altında kopma mukavemeti",
        severity: "critical",
      },
      {
        id: "def-008",
        name: "Yüksek Düzgünsüzlük",
        description: "Kabul edilebilir değerin üstünde U%",
        severity: "major",
      },
      {
        id: "def-009",
        name: "Düğüm/Neps",
        description: "İplikte düğüm veya neps fazlalığı",
        severity: "minor",
      },
      {
        id: "def-010",
        name: "Yabancı Elyaf",
        description: "Farklı renk veya türde elyaf karışımı",
        severity: "minor",
      },
    ],
  },
];
```

---

## 3. Yardımcı Fonksiyonlar

### 📄 pdf.ts

**Dosya Yolu:** `src/utils/pdf.ts`

**Açıklama:** jsPDF ve jspdf-autotable kütüphanelerini kullanarak PDF kontrol raporları oluşturur. Tekil ve toplu rapor oluşturma fonksiyonlarını içerir.

**Teknolojiler:** TypeScript, jsPDF, jspdf-autotable

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Lot, Supplier, MaterialType, Inspection } from '../types';
import { formatDate, formatDateTime } from '../data/samplingData';

interface PDFData {
  lot: Lot;
  supplier?: Supplier;
  material?: MaterialType;
  inspections: Inspection[];
  defectDistribution: { name: string; count: number }[];
}

export async function generatePDF(data: PDFData): Promise<void> {
  const { lot, supplier, material, inspections, defectDistribution } = data;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235); // Blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('KALİTE KONTROL RAPORU', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Parti No: ${lot.lotNumber}`, pageWidth / 2, 32, { align: 'center' });

  // Decision Badge
  const decision = lot.decision;
  const isAccepted = decision === 'accepted';

  doc.setFillColor(isAccepted ? 16 : 239, isAccepted ? 185 : 68, isAccepted ? 129 : 68);
  doc.roundedRect(pageWidth / 2 - 30, 50, 60, 15, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(isAccepted ? 'KABUL' : 'RED', pageWidth / 2, 60, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Lot Info Table
  doc.setFontSize(14);
  doc.text('Parti Bilgileri', 14, 80);

  autoTable(doc, {
    startY: 85,
    head: [],
    body: [
      ['Tedarikçi', supplier?.name || '-'],
      ['Malzeme', material?.name || '-'],
      ['Parti Miktarı', `${lot.quantity.toLocaleString('tr-TR')} adet`],
      ['Sipariş No', lot.orderNumber || '-'],
      ['Teslim Tarihi', formatDate(lot.receivedDate)],
      ['Kontrol Tarihi', lot.inspectionDate ? formatDate(lot.inspectionDate) : formatDate(new Date())],
      ['Kontrolü Yapan', lot.inspectedBy || '-'],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 80 },
    },
  });

  // Sampling Parameters
  const finalY1 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Örnekleme Parametreleri (ISO 2859-1)', 14, finalY1);

  autoTable(doc, {
    startY: finalY1 + 5,
    head: [],
    body: [
      ['Standart', 'ISO 2859-1'],
      ['Muayene Seviyesi', `Seviye ${lot.inspectionLevel}`],
      ['AQL', `%${lot.aql}`],
      ['Örneklem Kodu', lot.sampleCode],
      ['Örneklem Büyüklüğü', `${lot.sampleSize} adet`],
      ['Kabul Sayısı (Ac)', lot.acceptanceNumber.toString()],
      ['Red Sayısı (Re)', lot.rejectionNumber.toString()],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 80 },
    },
  });

  // Results
  const finalY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Kontrol Sonuçları', 14, finalY2);

  autoTable(doc, {
    startY: finalY2 + 5,
    head: [],
    body: [
      ['Kontrol Edilen', `${lot.sampleSize} adet`],
      ['Uygun', `${lot.sampleSize - lot.defectCount} adet`],
      ['Hatalı', `${lot.defectCount} adet`],
      ['Karar', isAccepted ? 'KABUL' : 'RED'],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 80 },
    },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.textColor = isAccepted ? [16, 185, 129] : [239, 68, 68];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Defect Distribution (if any)
  if (defectDistribution.length > 0 && lot.defectCount > 0) {
    const finalY3 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Hata Dağılımı', 14, finalY3);

    autoTable(doc, {
      startY: finalY3 + 5,
      head: [['Hata Türü', 'Adet', 'Oran']],
      body: defectDistribution.map((d) => [
        d.name,
        d.count.toString(),
        `%${((d.count / lot.defectCount) * 100).toFixed(1)}`,
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [37, 99, 235] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Oluşturulma Tarihi: ${formatDateTime(new Date())} | Sayfa ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`Kontrol_Raporu_${lot.lotNumber}.pdf`);
}

export async function generateBulkPDF(
  lots: Lot[],
  suppliers: Supplier[],
  materials: MaterialType[]
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('KALİTE KONTROL ÖZET RAPORU', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Toplam ${lots.length} parti`, pageWidth / 2, 32, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Summary Stats
  const accepted = lots.filter(l => l.decision === 'accepted').length;
  const rejected = lots.filter(l => l.decision === 'rejected').length;
  const pending = lots.filter(l => !l.decision).length;
  const acceptanceRate = lots.length > 0 ? (accepted / (accepted + rejected) * 100) || 0 : 0;

  doc.setFontSize(14);
  doc.text('Özet İstatistikler', 14, 55);

  autoTable(doc, {
    startY: 60,
    head: [],
    body: [
      ['Toplam Parti', lots.length.toString()],
      ['Kabul Edilen', accepted.toString()],
      ['Reddedilen', rejected.toString()],
      ['Bekleyen', pending.toString()],
      ['Kabul Oranı', `%${acceptanceRate.toFixed(1)}`],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 40 },
    },
  });

  // Lots Table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Parti Listesi', 14, finalY);

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || '-';
  const getMaterialName = (id: string) => materials.find(m => m.id === id)?.name || '-';

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Parti No', 'Tedarikçi', 'Malzeme', 'Miktar', 'Hatalı', 'Sonuç', 'Tarih']],
    body: lots.map(lot => [
      lot.lotNumber,
      getSupplierName(lot.supplierId),
      getMaterialName(lot.materialTypeId),
      lot.quantity.toLocaleString('tr-TR'),
      `${lot.defectCount}/${lot.sampleSize}`,
      lot.decision === 'accepted' ? 'KABUL' : lot.decision === 'rejected' ? 'RED' : '-',
      formatDate(lot.createdAt),
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    didParseCell: (data) => {
      if (data.column.index === 5) {
        const value = data.cell.raw as string;
        if (value === 'KABUL') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (value === 'RED') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Oluşturulma Tarihi: ${formatDateTime(new Date())} | Sayfa ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`Kontrol_Ozet_Raporu_${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
}
```

---

## 4. State Yönetimi

### 📄 useStore.ts

**Dosya Yolu:** `src/store/useStore.ts`

**Açıklama:** Zustand kütüphanesi ile global state yönetimini sağlar. Ayarlar, tedarikçiler, malzemeler, partiler ve kontroller için ayrı store'lar tanımlar. LocalStorage ile kalıcılık (persist) sağlar.

**Teknolojiler:** TypeScript, Zustand, Zustand Persist Middleware

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Settings,
  Supplier,
  MaterialType,
  Lot,
  Inspection,
  DashboardStats,
  SupplierPerformance,
  DefectAnalysis,
  TrendData
} from '../types';
import {
  defaultSuppliers,
  defaultMaterials,
  generateLotNumber
} from '../data/samplingData';

// ========== SETTINGS STORE ==========
interface SettingsState {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        companyName: 'Kalite Kontrol Yönetim Sistemi',
        defaultAQL: '2.5',
        defaultInspectionLevel: 'II',
        darkMode: false,
        language: 'tr',
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      toggleDarkMode: () =>
        set((state) => ({
          settings: { ...state.settings, darkMode: !state.settings.darkMode },
        })),
    }),
    {
      name: 'settings-storage',
    }
  )
);

// ========== SUPPLIER STORE ==========
interface SupplierState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: defaultSuppliers,
      addSupplier: (supplier) =>
        set((state) => ({
          suppliers: [
            ...state.suppliers,
            {
              ...supplier,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateSupplier: (id, supplier) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier } : s
          ),
        })),
      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        })),
      getSupplierById: (id) => get().suppliers.find((s) => s.id === id),
    }),
    {
      name: 'supplier-storage',
    }
  )
);

// ========== MATERIAL STORE ==========
interface MaterialState {
  materials: MaterialType[];
  addMaterial: (material: Omit<MaterialType, 'id'>) => void;
  updateMaterial: (id: string, material: Partial<MaterialType>) => void;
  deleteMaterial: (id: string) => void;
  getMaterialById: (id: string) => MaterialType | undefined;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: defaultMaterials,
      addMaterial: (material) =>
        set((state) => ({
          materials: [
            ...state.materials,
            {
              ...material,
              id: uuidv4(),
            },
          ],
        })),
      updateMaterial: (id, material) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...material } : m
          ),
        })),
      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),
      getMaterialById: (id) => get().materials.find((m) => m.id === id),
    }),
    {
      name: 'material-storage',
    }
  )
);

// ========== LOT STORE ==========
interface LotState {
  lots: Lot[];
  currentLot: Lot | null;
  addLot: (lot: Omit<Lot, 'id' | 'lotNumber' | 'status' | 'decision' | 'defectCount' | 'createdAt'>) => Lot;
  updateLot: (id: string, lot: Partial<Lot>) => void;
  deleteLot: (id: string) => void;
  setCurrentLot: (lot: Lot | null) => void;
  getLotById: (id: string) => Lot | undefined;
  completeLot: (id: string, decision: 'accepted' | 'rejected', defectCount: number) => void;
}

export const useLotStore = create<LotState>()(
  persist(
    (set, get) => ({
      lots: [],
      currentLot: null,
      addLot: (lotData) => {
        const newLot: Lot = {
          ...lotData,
          id: uuidv4(),
          lotNumber: generateLotNumber(),
          status: 'pending',
          decision: null,
          defectCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          lots: [newLot, ...state.lots],
          currentLot: newLot,
        }));
        return newLot;
      },
      updateLot: (id, lot) =>
        set((state) => ({
          lots: state.lots.map((l) => (l.id === id ? { ...l, ...lot } : l)),
          currentLot:
            state.currentLot?.id === id
              ? { ...state.currentLot, ...lot }
              : state.currentLot,
        })),
      deleteLot: (id) =>
        set((state) => ({
          lots: state.lots.filter((l) => l.id !== id),
          currentLot: state.currentLot?.id === id ? null : state.currentLot,
        })),
      setCurrentLot: (lot) => set({ currentLot: lot }),
      getLotById: (id) => get().lots.find((l) => l.id === id),
      completeLot: (id, decision, defectCount) =>
        set((state) => ({
          lots: state.lots.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: 'completed',
                  decision,
                  defectCount,
                  inspectionDate: new Date().toISOString(),
                }
              : l
          ),
          currentLot: null,
        })),
    }),
    {
      name: 'lot-storage',
    }
  )
);

// ========== INSPECTION STORE ==========
interface InspectionState {
  inspections: Inspection[];
  currentInspections: Inspection[];
  addInspection: (inspection: Omit<Inspection, 'id' | 'createdAt'>) => void;
  getInspectionsByLotId: (lotId: string) => Inspection[];
  clearCurrentInspections: () => void;
  setCurrentInspections: (inspections: Inspection[]) => void;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      inspections: [],
      currentInspections: [],
      addInspection: (inspection) => {
        const newInspection: Inspection = {
          ...inspection,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          inspections: [...state.inspections, newInspection],
          currentInspections: [...state.currentInspections, newInspection],
        }));
      },
      getInspectionsByLotId: (lotId) =>
        get().inspections.filter((i) => i.lotId === lotId),
      clearCurrentInspections: () => set({ currentInspections: [] }),
      setCurrentInspections: (inspections) => set({ currentInspections: inspections }),
    }),
    {
      name: 'inspection-storage',
    }
  )
);

// ========== ANALYTICS HOOK ==========
export const useAnalytics = () => {
  const lots = useLotStore((state) => state.lots);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const inspections = useInspectionStore((state) => state.inspections);
  const materials = useMaterialStore((state) => state.materials);

  const getStats = (): DashboardStats => {
    const completedLots = lots.filter((l) => l.status === 'completed');
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const todayLots = lots.filter(
      (l) => new Date(l.createdAt).toDateString() === today
    );
    const weeklyLots = lots.filter((l) => new Date(l.createdAt) >= weekAgo);

    const accepted = completedLots.filter((l) => l.decision === 'accepted').length;
    const rejected = completedLots.filter((l) => l.decision === 'rejected').length;

    return {
      totalLots: lots.length,
      totalAccepted: accepted,
      totalRejected: rejected,
      pendingLots: lots.filter((l) => l.status !== 'completed').length,
      todayInspections: todayLots.length,
      weeklyInspections: weeklyLots.length,
      acceptanceRate: completedLots.length > 0 ? (accepted / completedLots.length) * 100 : 0,
    };
  };

  const getSupplierPerformance = (): SupplierPerformance[] => {
    return suppliers.map((supplier) => {
      const supplierLots = lots.filter(
        (l) => l.supplierId === supplier.id && l.status === 'completed'
      );
      const accepted = supplierLots.filter((l) => l.decision === 'accepted').length;
      const rejected = supplierLots.filter((l) => l.decision === 'rejected').length;
      const totalDefects = supplierLots.reduce((sum, l) => sum + l.defectCount, 0);

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalLots: supplierLots.length,
        acceptedLots: accepted,
        rejectedLots: rejected,
        acceptanceRate: supplierLots.length > 0 ? (accepted / supplierLots.length) * 100 : 0,
        avgDefectsPerLot: supplierLots.length > 0 ? totalDefects / supplierLots.length : 0,
      };
    });
  };

  const getDefectAnalysis = (): DefectAnalysis[] => {
    const defectCounts: Record<string, { id: string; name: string; count: number }> = {};

    inspections.forEach((inspection) => {
      inspection.defects.forEach((defect) => {
        const lot = lots.find((l) => l.id === inspection.lotId);
        const material = lot ? materials.find((m) => m.id === lot.materialTypeId) : null;
        const defectType = material?.defectTypes.find((d) => d.id === defect.defectTypeId);

        const key = defect.defectTypeId;
        if (!defectCounts[key]) {
          defectCounts[key] = {
            id: key,
            name: defectType?.name || key,
            count: 0,
          };
        }
        defectCounts[key].count++;
      });
    });

    const totalDefects = Object.values(defectCounts).reduce((sum, d) => sum + d.count, 0);

    return Object.values(defectCounts)
      .map((d) => ({
        defectTypeId: d.id,
        defectName: d.name,
        count: d.count,
        percentage: totalDefects > 0 ? (d.count / totalDefects) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getTrendData = (days: number = 30): TrendData[] => {
    const data: TrendData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayLots = lots.filter((l) => l.createdAt.startsWith(dateStr));
      const accepted = dayLots.filter((l) => l.decision === 'accepted').length;
      const rejected = dayLots.filter((l) => l.decision === 'rejected').length;

      data.push({
        date: dateStr,
        inspections: dayLots.length,
        accepted,
        rejected,
      });
    }

    return data;
  };

  return {
    getStats,
    getSupplierPerformance,
    getDefectAnalysis,
    getTrendData,
  };
};
```

---

## 5. Layout Bileşenleri

### 📄 Layout.tsx

**Dosya Yolu:** `src/components/layout/Layout.tsx`

**Açıklama:** Uygulamanın ana layout wrapper bileşeni. Sidebar, Header ve içerik alanını düzenler. Dark mode yönetimini ve toast bildirimlerini içerir.

**Teknolojiler:** React, React Router (Outlet), Zustand, react-hot-toast

```typescript
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSettingsStore } from '../../store/useStore';
import { Toaster } from 'react-hot-toast';

const pageTitles: Record<string, string> = {
  '/': 'Kontrol Paneli',
  '/lot-entry': 'Yeni Parti Girişi',
  '/inspection': 'Kontrol',
  '/result': 'Kontrol Sonucu',
  '/reports': 'Raporlar',
  '/suppliers': 'Tedarikçi Yönetimi',
  '/analytics': 'Analiz & İstatistik',
  '/settings': 'Ayarlar',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettingsStore();

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const pageTitle = pageTitles[location.pathname] || 'Kalite Kontrol';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: settings.darkMode ? '#1E293B' : '#fff',
            color: settings.darkMode ? '#fff' : '#1F2937',
            border: settings.darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
```

---

### 📄 Header.tsx

**Dosya Yolu:** `src/components/layout/Header.tsx`

**Açıklama:** Üst navigasyon çubuğu. Mobil menü butonu, sayfa başlığı, bildirimler, tema değiştirici ve kullanıcı bilgilerini gösterir.

**Teknolojiler:** React, Lucide Icons, Zustand

```typescript
import { Menu, Moon, Sun, Bell, User } from 'lucide-react';
import { useSettingsStore } from '../../store/useStore';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { settings, toggleDarkMode } = useSettingsStore();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {title && (
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {settings.darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-200 dark:border-slate-700">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800 dark:text-white">Kalite Kontrol</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Yönetici</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

### 📄 Sidebar.tsx

**Dosya Yolu:** `src/components/layout/Sidebar.tsx`

**Açıklama:** Sol yan navigasyon menüsü. Logo, menü öğeleri ve ISO 2859-1 bilgi kartını içerir. Mobil cihazlarda slide-in animasyonu ile açılır.

**Teknolojiler:** React, React Router (NavLink), Lucide Icons, Tailwind CSS

```typescript
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  ClipboardCheck,
  FileText,
  Building2,
  BarChart3,
  Settings,
  Factory,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Kontrol Paneli' },
  { path: '/lot-entry', icon: PackagePlus, label: 'Parti Girişi' },
  { path: '/inspection', icon: ClipboardCheck, label: 'Kontrol' },
  { path: '/reports', icon: FileText, label: 'Raporlar' },
  { path: '/suppliers', icon: Building2, label: 'Tedarikçiler' },
  { path: '/analytics', icon: BarChart3, label: 'Analiz' },
  { path: '/settings', icon: Settings, label: 'Ayarlar' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800
          border-r border-gray-200 dark:border-slate-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 dark:text-white">KKYS</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kalite Kontrol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">ISO 2859-1</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Standart Örnekleme Sistemi
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
```

---

## 6. Ortak Bileşenler

### 📄 Badge.tsx

**Dosya Yolu:** `src/components/common/Badge.tsx`

**Açıklama:** Durum ve kategori göstergeleri için badge bileşeni. Farklı varyantlar (success, danger, warning, info) ve pulse animasyonu desteği sunar.

**Teknolojiler:** React, TypeScript, Tailwind CSS

```typescript
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  pulse = false
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const pulseClasses = pulse
    ? variant === 'success'
      ? 'pulse-success'
      : variant === 'danger'
      ? 'pulse-danger'
      : ''
    : '';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulseClasses}
      `}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'pending' | 'in-progress' | 'completed' }) {
  const config = {
    pending: { label: 'Bekliyor', variant: 'warning' as const },
    'in-progress': { label: 'Devam Ediyor', variant: 'info' as const },
    completed: { label: 'Tamamlandı', variant: 'success' as const },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function DecisionBadge({ decision }: { decision: 'accepted' | 'rejected' | null }) {
  if (!decision) return <Badge variant="default">-</Badge>;

  const config = {
    accepted: { label: 'KABUL', variant: 'success' as const },
    rejected: { label: 'RED', variant: 'danger' as const },
  };

  const { label, variant } = config[decision];
  return <Badge variant={variant} pulse>{label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: 'critical' | 'major' | 'minor' }) {
  const config = {
    critical: { label: 'Kritik', variant: 'danger' as const },
    major: { label: 'Büyük', variant: 'warning' as const },
    minor: { label: 'Küçük', variant: 'default' as const },
  };

  const { label, variant } = config[severity];
  return <Badge variant={variant} size="sm">{label}</Badge>;
}
```

---

### 📄 Button.tsx

**Dosya Yolu:** `src/components/common/Button.tsx`

**Açıklama:** Yeniden kullanılabilir buton bileşeni. Farklı varyantlar (primary, secondary, success, danger, ghost), boyutlar ve loading durumu desteği sunar.

**Teknolojiler:** React, TypeScript, Lucide Icons, Tailwind CSS

```typescript
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      text-white shadow-md hover:shadow-lg
      focus:ring-blue-500
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 active:bg-gray-300
      dark:bg-slate-700 dark:hover:bg-slate-600
      text-gray-800 dark:text-gray-200
      focus:ring-gray-500
    `,
    success: `
      bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
      text-white shadow-md hover:shadow-lg
      focus:ring-emerald-500
    `,
    danger: `
      bg-red-600 hover:bg-red-700 active:bg-red-800
      text-white shadow-md hover:shadow-lg
      focus:ring-red-500
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700
      text-gray-700 dark:text-gray-300
      focus:ring-gray-500
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
```

---

### 📄 Card.tsx

**Dosya Yolu:** `src/components/common/Card.tsx`

**Açıklama:** İçerik container bileşeni. Farklı padding seçenekleri ve hover efekti desteği sunar. CardHeader alt bileşeni ile başlık alanı sağlar.

**Teknolojiler:** React, TypeScript, Tailwind CSS

```typescript
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        rounded-xl
        border border-gray-200 dark:border-slate-700
        shadow-sm
        ${hover ? 'card-hover hover:shadow-md' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

---

### 📄 Input.tsx

**Dosya Yolu:** `src/components/common/Input.tsx`

**Açıklama:** Form input bileşenleri. Input, Select ve TextArea bileşenlerini içerir. Label, error ve helper text desteği sunar.

**Teknolojiler:** React, TypeScript, forwardRef, Tailwind CSS

```typescript
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5
            border rounded-xl
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-all duration-200
            ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5
          border rounded-xl
          bg-white dark:bg-slate-800
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-all duration-200 cursor-pointer
          ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  className = '',
  ...props
}: TextAreaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-2.5
          border rounded-xl
          bg-white dark:bg-slate-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-all duration-200 resize-none
          ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

---

### 📄 Modal.tsx

**Dosya Yolu:** `src/components/common/Modal.tsx`

**Açıklama:** Modal dialog bileşeni. Escape tuşu ile kapatma, backdrop tıklama ve farklı boyut seçenekleri sunar.

**Teknolojiler:** React, TypeScript, Lucide Icons, Tailwind CSS

```typescript
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-white dark:bg-slate-800
          rounded-2xl shadow-xl
          max-h-[90vh] overflow-hidden
          fade-in
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

### 📄 StatsCard.tsx

**Dosya Yolu:** `src/components/common/StatsCard.tsx`

**Açıklama:** İstatistik kartı bileşeni. Başlık, değer, ikon ve trend göstergesi içerir. Farklı renk temaları desteği sunar.

**Teknolojiler:** React, TypeScript, Lucide Icons, Tailwind CSS

```typescript
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'blue'
}: StatsCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.iconBg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Sayfa Bileşenleri

Bu bölümde tüm sayfa bileşenleri yer almaktadır. Her bileşen için dosya yolu, açıklama ve kullanılan teknolojiler belirtilmiştir.

**Not:** Sayfa bileşenleri çok uzun olduğu için bu dokümanda özetleri verilmiştir. Tam kaynak kodları için proje dizinindeki dosyalara bakınız.

### Sayfa Listesi

| Dosya | Açıklama |
|-------|----------|
| Dashboard.tsx | Ana kontrol paneli - KPI'lar, grafikler, son kontroller |
| LotEntry.tsx | Parti giriş formu - ISO 2859-1 örneklem hesaplama |
| Inspection.tsx | İnteraktif kontrol süreci - numune kontrolü |
| Result.tsx | Kontrol sonuç sayfası - karar ve hata dağılımı |
| Reports.tsx | Filtrelenebilir rapor listesi - Excel/PDF export |
| Suppliers.tsx | Tedarikçi CRUD işlemleri - performans takibi |
| Analytics.tsx | Pareto analizi, OC eğrisi, trend grafikleri |
| Settings.tsx | Uygulama ayarları - tema, yedekleme, sıfırlama |

---

## 8. Uygulama Giriş Noktası

### 📄 App.tsx

**Dosya Yolu:** `src/App.tsx`

**Açıklama:** React Router yapılandırması. Tüm sayfa rotalarını Layout bileşeni içinde tanımlar.

**Teknolojiler:** React, React Router

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LotEntry from './pages/LotEntry';
import Inspection from './pages/Inspection';
import Result from './pages/Result';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="lot-entry" element={<LotEntry />} />
          <Route path="inspection" element={<Inspection />} />
          <Route path="result" element={<Result />} />
          <Route path="reports" element={<Reports />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### 📄 main.tsx

**Dosya Yolu:** `src/main.tsx`

**Açıklama:** React uygulamasının başlangıç noktası. Root element'e App bileşenini render eder.

**Teknolojiler:** React 18, ReactDOM

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

### 📄 index.css

**Dosya Yolu:** `src/index.css`

**Açıklama:** Global CSS stilleri. Tailwind CSS import, özel CSS değişkenleri, animasyonlar ve scrollbar stilleri içerir.

**Teknolojiler:** Tailwind CSS, CSS Animations

```css
@import "tailwindcss";

:root {
  --primary: #2563EB;
  --primary-dark: #1D4ED8;
  --primary-light: #3B82F6;
  --success: #10B981;
  --danger: #EF4444;
  --warning: #F59E0B;
  --info: #3B82F6;
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-slate-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-slate-600 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-slate-500;
}

/* Card animations */
.card-hover {
  @apply transition-all duration-300 ease-in-out;
}

.card-hover:hover {
  @apply transform -translate-y-1 shadow-lg;
}

/* Status badge animations */
.pulse-success {
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
}

.pulse-danger {
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

/* Progress bar animation */
.progress-bar {
  @apply transition-all duration-500 ease-out;
}

/* Fade in animation */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide in animation */
.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## Teknoloji Özeti

| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| React 18 | UI framework |
| TypeScript | Tip güvenliği |
| Vite | Build aracı |
| Tailwind CSS | Stil kütüphanesi |
| Zustand | State yönetimi |
| React Router | Sayfa yönlendirme |
| Recharts | Grafik ve görselleştirme |
| jsPDF | PDF oluşturma |
| xlsx | Excel export |
| Lucide React | İkon kütüphanesi |
| react-hot-toast | Bildirimler |
| uuid | Benzersiz ID oluşturma |

---

## Lisans

Bu proje üniversite bitirme projesi olarak geliştirilmiştir.

**Standart:** ISO 2859-1 (Kabul Örneklemesi)

---

*Dokümantasyon Tarihi: Aralık 2024*
