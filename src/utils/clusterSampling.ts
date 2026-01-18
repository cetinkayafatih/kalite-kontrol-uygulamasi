// ============================================
// İKİ AŞAMALI KÜME ÖRNEKLEMESİ (Two-Stage Cluster Sampling)
// ============================================

// Pozisyon kodları: Üst, Orta, Alt
export type PositionCode = '01' | '02' | '03';

// Parti yapısı konfigürasyonu
export interface PackageConfig {
  palletCount: number;       // P - Palet sayısı
  packagesPerPallet: number; // B - Palet başı poşet sayısı
  itemsPerPackage: number;   // L - Poşet içi etiket sayısı
}

// Tek bir numune pozisyonu
export interface SamplePosition {
  code: string;           // "02-11-02" formatında
  pallet: number;         // Palet numarası (1-99)
  package: number;        // Poşet numarası (1-99)
  position: PositionCode; // Konum kodu ("01", "02", "03")
  positionLabel: string;  // "ÜSTTEN", "ORTADAN", "ALTTAN"
}

// Poşet grubu (aynı poşetten alınacak numuneler)
export interface PackageGroup {
  pallet: number;
  package: number;
  packageCode: string;    // "02-11" formatında
  sampleCount: number;    // Bu poşetten kaç numune alınacak
  samples: SamplePosition[];
}

// Pozisyon etiketlerini döndür
const POSITION_LABELS: Record<PositionCode, string> = {
  '01': 'ÜSTTEN',
  '02': 'ORTADAN',
  '03': 'ALTTAN'
};

/**
 * Pozisyon koduna göre Türkçe etiket döndürür
 */
export function getPositionLabel(code: PositionCode): string {
  return POSITION_LABELS[code];
}

// Küme örnekleme sabitleri
const MAX_PACKAGE_RATIO = 0.25; // Maksimum %25 poşet açılır
const MIN_PACKAGES = 3;         // Minimum 3 poşet açılır

/**
 * Açılacak poşet sayısını hesaplar (maksimum oran sınırlı)
 * S = max(MIN_PACKAGES, floor(T × MAX_RATIO))
 */
export function getPackagesToOpen(_sampleSize: number, totalPackages: number): number {
  // Oran bazlı maksimum poşet sayısı
  const maxByRatio = Math.floor(totalPackages * MAX_PACKAGE_RATIO);

  // En az MIN_PACKAGES, en fazla maxByRatio (ama totalPackages'ı geçmez)
  const packagesToOpen = Math.max(MIN_PACKAGES, maxByRatio);

  return Math.min(packagesToOpen, totalPackages);
}

/**
 * Poşet başına etiket sayısını dinamik hesaplar
 * m = ceil(n / S)
 */
export function getSamplesPerPackage(sampleSize: number, packagesToOpen?: number): number {
  // Eğer packagesToOpen verilmişse dinamik hesapla
  if (packagesToOpen && packagesToOpen > 0) {
    return Math.ceil(sampleSize / packagesToOpen);
  }

  // Geriye uyumluluk için eski sabit kurallar (referans)
  if (sampleSize <= 30) return 3;
  if (sampleSize <= 60) return 4;
  if (sampleSize <= 120) return 5;
  if (sampleSize <= 200) return 8;
  return 10;
}

/**
 * Tek bir rastgele sayıdan palet ve poşet koordinatını hesaplar
 * y → (palet, poşet) dönüşümü
 */
function yToCoordinate(y: number, packagesPerPallet: number): { pallet: number; package: number } {
  const pallet = Math.ceil(y / packagesPerPallet);
  const pkg = y - (pallet - 1) * packagesPerPallet;
  return { pallet, package: pkg };
}

/**
 * Koordinatı PP-BB formatına çevirir
 */
function formatPackageCode(pallet: number, pkg: number): string {
  return `${pallet.toString().padStart(2, '0')}-${pkg.toString().padStart(2, '0')}`;
}

/**
 * Tam pozisyon kodunu PP-BB-NN formatında oluşturur
 */
function formatFullCode(pallet: number, pkg: number, position: PositionCode): string {
  return `${formatPackageCode(pallet, pkg)}-${position}`;
}

/**
 * Fisher-Yates shuffle algoritması ile diziyi karıştırır
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Döngüsel pozisyon kodu döndürür (01 → 02 → 03 → 01 → ...)
 */
function getCyclicPosition(index: number): PositionCode {
  const positions: PositionCode[] = ['01', '02', '03'];
  return positions[index % 3];
}

/**
 * Ana fonksiyon: Tüm numune pozisyonlarını üretir
 * İki aşamalı küme örneklemesi algoritması
 */
export function generateSamplePositions(
  sampleSize: number,
  config: PackageConfig
): SamplePosition[] {
  const { palletCount, packagesPerPallet } = config;
  const totalPackages = palletCount * packagesPerPallet;

  // Açılacak poşet sayısı (S)
  const packagesToOpen = getPackagesToOpen(sampleSize, totalPackages);

  // 1..T arasında tüm poşet numaralarını oluştur
  const allPackageNumbers = Array.from({ length: totalPackages }, (_, i) => i + 1);

  // Rastgele karıştır ve ilk S tanesini seç
  const selectedPackageNumbers = shuffleArray(allPackageNumbers).slice(0, packagesToOpen);

  // Seçilen poşetleri koordinatlara çevir (rastgele sırayı koru)
  const selectedPackages = selectedPackageNumbers
    .map(y => yToCoordinate(y, packagesPerPallet));

  // Etiket dağılımı: q = n // S, r = n % S
  const q = Math.floor(sampleSize / packagesToOpen);
  const r = sampleSize % packagesToOpen;

  // Tüm numune pozisyonlarını oluştur
  const positions: SamplePosition[] = [];
  let sampleIndex = 0;

  for (let i = 0; i < selectedPackages.length; i++) {
    const { pallet, package: pkg } = selectedPackages[i];

    // Bu poşetten kaç etiket alınacak
    const samplesFromThisPackage = i < r ? q + 1 : q;

    for (let j = 0; j < samplesFromThisPackage; j++) {
      const position = getCyclicPosition(sampleIndex);
      positions.push({
        code: formatFullCode(pallet, pkg, position),
        pallet,
        package: pkg,
        position,
        positionLabel: getPositionLabel(position)
      });
      sampleIndex++;
    }
  }

  return positions;
}

/**
 * Poşet gruplarını döndürür (UI'da poşet bazlı görüntüleme için)
 */
export function getPackageGroups(positions: SamplePosition[]): PackageGroup[] {
  const groupMap = new Map<string, PackageGroup>();

  for (const pos of positions) {
    const key = `${pos.pallet}-${pos.package}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        pallet: pos.pallet,
        package: pos.package,
        packageCode: formatPackageCode(pos.pallet, pos.package),
        sampleCount: 0,
        samples: []
      });
    }

    const group = groupMap.get(key)!;
    group.samples.push(pos);
    group.sampleCount++;
  }

  // Palet sırasına göre sırala
  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.pallet !== b.pallet) return a.pallet - b.pallet;
    return a.package - b.package;
  });
}

/**
 * Bekleyen lotlardan rastgele bir lot seçer
 */
export function selectRandomLot<T extends { status: string; id: string }>(lots: T[]): T | null {
  const pendingLots = lots.filter(l => l.status === 'pending');
  if (pendingLots.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * pendingLots.length);
  return pendingLots[randomIndex];
}

/**
 * Örnekleme istatistiklerini hesaplar
 */
export function calculateSamplingStats(sampleSize: number, config: PackageConfig) {
  const totalPackages = config.palletCount * config.packagesPerPallet;
  const totalItems = totalPackages * config.itemsPerPackage;
  const packagesToOpen = getPackagesToOpen(sampleSize, totalPackages);
  const samplesPerPackage = getSamplesPerPackage(sampleSize, packagesToOpen);

  return {
    totalPackages,
    totalItems,
    samplesPerPackage,
    packagesToOpen,
    estimatedTime: packagesToOpen * 2 // Tahmini dakika (poşet başı 2 dk)
  };
}
