import type { MaterialType, Supplier } from '../types';

// ============================================
// ISO 2859-1 ÖRNEKLEME TABLOLARI
// ============================================

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
  "500001-9999999": { code: "Q", size: 1250 },
};

// Muayene seviyelerine göre örneklem kodu çarpanları
export const inspectionLevelMultipliers: Record<string, number> = {
  "I": 0.4,    // Azaltılmış - daha az örnek
  "II": 1,     // Normal
  "III": 1.6,  // Sıkılaştırılmış - daha fazla örnek
};

// AQL değerlerine göre Kabul (Ac) ve Red (Re) sayıları
export const acceptanceTable: Record<string, Record<string, [number, number] | null>> = {
  A: { "0.65": null, "1.0": null, "1.5": null, "2.5": [0, 1], "4.0": [0, 1], "6.5": [0, 1] },
  B: { "0.65": null, "1.0": null, "1.5": [0, 1], "2.5": [0, 1], "4.0": [0, 1], "6.5": [1, 2] },
  C: { "0.65": null, "1.0": [0, 1], "1.5": [0, 1], "2.5": [0, 1], "4.0": [0, 1], "6.5": [1, 2] },
  D: { "0.65": null, "1.0": [0, 1], "1.5": [0, 1], "2.5": [0, 1], "4.0": [1, 2], "6.5": [2, 3] },
  E: { "0.65": [0, 1], "1.0": [0, 1], "1.5": [0, 1], "2.5": [1, 2], "4.0": [1, 2], "6.5": [3, 4] },
  F: { "0.65": [0, 1], "1.0": [0, 1], "1.5": [1, 2], "2.5": [1, 2], "4.0": [2, 3], "6.5": [5, 6] },
  G: { "0.65": [0, 1], "1.0": [1, 2], "1.5": [1, 2], "2.5": [2, 3], "4.0": [3, 4], "6.5": [7, 8] },
  H: { "0.65": [0, 1], "1.0": [1, 2], "1.5": [2, 3], "2.5": [3, 4], "4.0": [5, 6], "6.5": [10, 11] },
  J: { "0.65": [1, 2], "1.0": [2, 3], "1.5": [3, 4], "2.5": [5, 6], "4.0": [7, 8], "6.5": [14, 15] },
  K: { "0.65": [1, 2], "1.0": [3, 4], "1.5": [5, 6], "2.5": [7, 8], "4.0": [10, 11], "6.5": [21, 22] },
  L: { "0.65": [2, 3], "1.0": [5, 6], "1.5": [7, 8], "2.5": [10, 11], "4.0": [14, 15], "6.5": [21, 22] },
  M: { "0.65": [3, 4], "1.0": [7, 8], "1.5": [10, 11], "2.5": [14, 15], "4.0": [21, 22], "6.5": [21, 22] },
  N: { "0.65": [5, 6], "1.0": [10, 11], "1.5": [14, 15], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
  P: { "0.65": [7, 8], "1.0": [14, 15], "1.5": [21, 22], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
  Q: { "0.65": [10, 11], "1.0": [21, 22], "1.5": [21, 22], "2.5": [21, 22], "4.0": [21, 22], "6.5": [21, 22] },
};

// ============================================
// MALZEME TÜRLERİ
// ============================================

export const labelMaterial: MaterialType = {
  id: "mat-label",
  name: "Etiket",
  code: "ETK",
  unit: "adet",
  defaultAQL: "2.5",
  criteria: [
    {
      id: "L01",
      name: "Baskı Kalitesi",
      description: "Baskının netliği ve okunabilirliği",
      acceptanceCriteria: "Net, okunaklı, lekesiz olmalı",
      isCritical: true,
    },
    {
      id: "L02",
      name: "Renk Uyumu",
      description: "Referans numuneye göre renk kontrolü",
      acceptanceCriteria: "Onaylı numuneye uygun olmalı",
      isCritical: true,
    },
    {
      id: "L03",
      name: "Boyut/Ölçü",
      description: "Etiket boyutlarının kontrolü",
      acceptanceCriteria: "Tolerans: ±1mm",
      isCritical: false,
    },
    {
      id: "L04",
      name: "Kesim Kalitesi",
      description: "Kesim kenarlarının düzgünlüğü",
      acceptanceCriteria: "Düzgün kenarlar, çapaksız",
      isCritical: false,
    },
    {
      id: "L05",
      name: "Yazı/Logo Doğruluğu",
      description: "Yazım ve logo kontrolü",
      acceptanceCriteria: "Hatasız yazım, doğru logo",
      isCritical: true,
    },
    {
      id: "L06",
      name: "Malzeme Kalitesi",
      description: "Etiket malzemesinin fiziksel durumu",
      acceptanceCriteria: "Yırtık, delik, katlama yok",
      isCritical: true,
    },
    {
      id: "L07",
      name: "Yapışkanlık",
      description: "Yapışkanlı etiketler için yapışma testi",
      acceptanceCriteria: "Tam yapışma, kalıntısız çıkma",
      isCritical: false,
    },
    {
      id: "L08",
      name: "Barkod Okunabilirliği",
      description: "Barkod tarama testi",
      acceptanceCriteria: "Tarayıcıda %100 okuma",
      isCritical: true,
    },
  ],
  defectTypes: [
    { id: "E01", code: "E01", name: "Baskı Hatası", description: "Silik, bulanık, eksik baskı", severity: "major" },
    { id: "E02", code: "E02", name: "Renk Kayması", description: "Renk tonu farklı, soluk", severity: "major" },
    { id: "E03", code: "E03", name: "Boyut Hatası", description: "Ölçü tolerans dışı", severity: "major" },
    { id: "E04", code: "E04", name: "Kesim Hatası", description: "Eğri kesim, çapak", severity: "minor" },
    { id: "E05", code: "E05", name: "Yazım Hatası", description: "Yanlış yazı, eksik harf", severity: "critical" },
    { id: "E06", code: "E06", name: "Malzeme Hasarı", description: "Yırtık, delik, kırışık", severity: "major" },
    { id: "E07", code: "E07", name: "Yapışma Sorunu", description: "Yapışmıyor veya kalıntı bırakıyor", severity: "major" },
    { id: "E08", code: "E08", name: "Barkod Hatası", description: "Okunamıyor, yanlış kod", severity: "critical" },
  ],
};

export const yarnMaterial: MaterialType = {
  id: "mat-yarn",
  name: "İplik",
  code: "IPL",
  unit: "bobin",
  defaultAQL: "2.5",
  criteria: [
    {
      id: "Y01",
      name: "Sarım Kalitesi",
      description: "Bobinin sarım düzgünlüğü kontrolü",
      acceptanceCriteria: "Düzgün sarım, gevşeklik veya aşırı sıkışma yok",
      inspectionMethod: "Görsel",
      isCritical: true,
    },
    {
      id: "Y02",
      name: "Bobin Formu",
      description: "Bobinin fiziksel form kontrolü",
      acceptanceCriteria: "Deforme değil, ezik veya çarpık değil",
      inspectionMethod: "Görsel",
      isCritical: false,
    },
    {
      id: "Y03",
      name: "Renk Homojenliği",
      description: "Parti içi renk uyumu kontrolü",
      acceptanceCriteria: "Parti içinde renk farkı yok, referansa uygun",
      inspectionMethod: "Görsel karşılaştırma",
      isCritical: true,
    },
    {
      id: "Y04",
      name: "Yabancı Madde",
      description: "Kontaminasyon kontrolü",
      acceptanceCriteria: "Kir, yağ, toz veya leke yok",
      inspectionMethod: "Görsel",
      isCritical: true,
    },
    {
      id: "Y05",
      name: "Nem/Koku",
      description: "Nem durumu ve koku kontrolü",
      acceptanceCriteria: "Kuru, küf veya kötü koku yok",
      inspectionMethod: "Dokunma ve koku",
      isCritical: true,
    },
    {
      id: "Y06",
      name: "Etiket Bilgisi",
      description: "Bobin etiketi doğrulama",
      acceptanceCriteria: "Lot numarası, iplik numarası ve renk kodu doğru",
      inspectionMethod: "Görsel",
      isCritical: false,
    },
    {
      id: "Y07",
      name: "Neps (Topaklanma)",
      description: "Yüzeyde topaklanma kontrolü",
      acceptanceCriteria: "Yüzeyde belirgin topaklanma yok",
      inspectionMethod: "Görsel (bobin yüzeyi)",
      isCritical: true,
    },
    {
      id: "Y08",
      name: "Düğüm/Ek Yeri",
      description: "İplik ek noktaları kontrolü",
      acceptanceCriteria: "Aşırı düğüm veya kötü yapılmış ek yeri yok",
      inspectionMethod: "Görsel",
      isCritical: false,
    },
  ],
  defectTypes: [
    { id: "I01", code: "I01", name: "Sarım Hatası", description: "Gevşek sarım, sıkı sarım, düzensiz sarım", severity: "major" },
    { id: "I02", code: "I02", name: "Bobin Deformasyonu", description: "Ezik, çarpık veya hasarlı bobin", severity: "major" },
    { id: "I03", code: "I03", name: "Renk Farkı", description: "Parti içi renk uyumsuzluğu, ton farkı", severity: "critical" },
    { id: "I04", code: "I04", name: "Yabancı Madde", description: "Kir, yağ, toz, leke kontaminasyonu", severity: "major" },
    { id: "I05", code: "I05", name: "Nem/Küf", description: "Islak, nemli, küflü veya kötü kokulu", severity: "critical" },
    { id: "I06", code: "I06", name: "Etiket Hatası", description: "Yanlış veya eksik etiket bilgisi", severity: "minor" },
    { id: "I07", code: "I07", name: "Görünür Neps", description: "Bobin yüzeyinde belirgin topaklanma", severity: "major" },
    { id: "I08", code: "I08", name: "Aşırı Düğüm", description: "Çok sayıda düğüm veya kötü yapılmış ek", severity: "major" },
  ],
};

export const materialTypes: MaterialType[] = [labelMaterial, yarnMaterial];

// ============================================
// AQL SEÇENEKLERİ
// ============================================

export const aqlOptions = [
  { value: "0.65", label: "%0.65 - Çok Sıkı" },
  { value: "1.0", label: "%1.0 - Sıkı" },
  { value: "1.5", label: "%1.5 - Normal-Sıkı" },
  { value: "2.5", label: "%2.5 - Normal (Önerilen)" },
  { value: "4.0", label: "%4.0 - Gevşek" },
  { value: "6.5", label: "%6.5 - Çok Gevşek" },
];

// ============================================
// MUAYENE SEVİYELERİ
// ============================================

export const inspectionLevels = [
  { value: "I", label: "Seviye I - Azaltılmış" },
  { value: "II", label: "Seviye II - Normal (Önerilen)" },
  { value: "III", label: "Seviye III - Sıkılaştırılmış" },
];

// ============================================
// ÖRNEK TEDARİKÇİLER
// ============================================

export const sampleSuppliers: Supplier[] = [
  {
    id: "sup-001",
    name: "ABC Etiket Ltd. Şti.",
    code: "ABC",
    contactPerson: "Ahmet Yılmaz",
    phone: "0212 555 1234",
    email: "info@abcetiket.com",
    address: "İstanbul, Türkiye",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "sup-002",
    name: "XYZ İplik San. A.Ş.",
    code: "XYZ",
    contactPerson: "Mehmet Demir",
    phone: "0216 444 5678",
    email: "satis@xyziplik.com",
    address: "Bursa, Türkiye",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "sup-003",
    name: "Tekstil Malzeme Tic.",
    code: "TMT",
    contactPerson: "Ayşe Kaya",
    phone: "0224 333 9012",
    email: "ayse@tekstilmalzeme.com",
    address: "Bursa, Türkiye",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

export function calculateSampling(lotSize: number, aql: string, inspectionLevel: string = "II"): {
  sampleCode: string;
  sampleSize: number;
  acceptanceNumber: number;
  rejectionNumber: number;
} | null {
  let sampleCode = "";
  let sampleSize = 0;

  for (const [range, data] of Object.entries(sampleSizeTable)) {
    const [min, max] = range.split("-").map(Number);
    if (lotSize >= min && lotSize <= max) {
      sampleCode = data.code;
      sampleSize = data.size;
      break;
    }
  }

  if (!sampleCode) return null;

  // Muayene seviyesine göre ayarlama
  const multiplier = inspectionLevelMultipliers[inspectionLevel] || 1;
  sampleSize = Math.round(sampleSize * multiplier);

  const acceptance = acceptanceTable[sampleCode]?.[aql];
  if (!acceptance) return null;

  return {
    sampleCode,
    sampleSize,
    acceptanceNumber: acceptance[0],
    rejectionNumber: acceptance[1],
  };
}

export function generateLotNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `LOT-${year}-${random}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return "0.0";
  return ((value / total) * 100).toFixed(1);
}

export function makeDecision(
  defectCount: number,
  acceptanceNumber: number,
  rejectionNumber: number
): "accepted" | "rejected" | "continue" {
  if (defectCount <= acceptanceNumber) return "accepted";
  if (defectCount >= rejectionNumber) return "rejected";
  return "continue";
}

export function getSeverityColor(severity: "critical" | "major" | "minor"): string {
  switch (severity) {
    case "critical":
      return "#EF4444";
    case "major":
      return "#F59E0B";
    case "minor":
      return "#6B7280";
  }
}

export function getSeverityLabel(severity: "critical" | "major" | "minor"): string {
  switch (severity) {
    case "critical":
      return "Kritik";
    case "major":
      return "Büyük";
    case "minor":
      return "Küçük";
  }
}
