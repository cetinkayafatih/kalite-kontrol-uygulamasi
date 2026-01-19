import { v4 as uuidv4 } from 'uuid';
import type { Lot, Inspection } from '../types';

// Demo veri oluşturma - 30 lot, 24 kabul, 6 red
// Redler etiket tedarikçilerine dağıtılmış

const suppliers = [
  { id: 'sup-001', name: 'ABC Etiket Ltd. Şti.' },
  { id: 'sup-002', name: 'XYZ İplik San. A.Ş.' },
  { id: 'sup-003', name: 'Tekstil Malzeme Tic.' },
];

// Etiket tedarikçileri (red dağıtımı için)
const labelSuppliers = ['sup-001', 'sup-003'];

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 8) + 8); // 08:00-16:00 arası
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

function generateLotNumber(index: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(index / 3));
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `LOT-${dateStr}-${String(index + 1).padStart(3, '0')}`;
}

export function generateDemoData(): { lots: Lot[]; inspections: Inspection[] } {
  const lots: Lot[] = [];
  const inspections: Inspection[] = [];

  // 6 red lot indeksleri (etiket tedarikçilerine dağıt)
  // Redleri farklı günlere dağıt
  const rejectedIndices = [3, 8, 14, 19, 24, 28];

  for (let i = 0; i < 30; i++) {
    const isRejected = rejectedIndices.includes(i);
    const lotId = uuidv4();

    // Red lotları etiket tedarikçilerine dağıt
    let supplierId: string;
    let materialTypeId: string;

    if (isRejected) {
      // Redler etiket tedarikçilerine
      supplierId = labelSuppliers[i % labelSuppliers.length];
      materialTypeId = 'mat-label';
    } else {
      // Kabul edilenler karışık
      const supplierIndex = i % suppliers.length;
      supplierId = suppliers[supplierIndex].id;
      materialTypeId = supplierIndex === 1 ? 'mat-yarn' : 'mat-label';
    }

    const lotSize = [500, 1000, 2000, 3000, 5000][Math.floor(Math.random() * 5)];
    const sampleSize = Math.min(Math.floor(lotSize * 0.05), 125);
    const acceptanceNumber = Math.floor(sampleSize * 0.025);
    const rejectionNumber = acceptanceNumber + 1;

    const defectCount = isRejected
      ? rejectionNumber + Math.floor(Math.random() * 3) // Red: rejection sayısından fazla hata
      : Math.floor(Math.random() * (acceptanceNumber + 1)); // Kabul: acceptance sayısından az hata

    const createdAt = randomDate(30);
    const inspectionDate = new Date(createdAt);
    inspectionDate.setHours(inspectionDate.getHours() + 2);

    const lot: Lot = {
      id: lotId,
      lotNumber: generateLotNumber(i),
      supplierId,
      materialTypeId,
      quantity: lotSize,
      aql: '2.5',
      inspectionLevel: 'II',
      sampleCode: lotSize <= 150 ? 'F' : lotSize <= 500 ? 'G' : lotSize <= 1200 ? 'H' : 'J',
      sampleSize,
      acceptanceNumber,
      rejectionNumber,
      orderNumber: `SIP-${String(2024000 + i).padStart(6, '0')}`,
      receivedDate: createdAt,
      inspectionDate: inspectionDate.toISOString(),
      status: 'completed',
      decision: isRejected ? 'rejected' : 'accepted',
      inspectedBy: ['Ahmet', 'Mehmet', 'Ayse'][i % 3],
      notes: '',
      defectCount,
      createdAt,
    };

    lots.push(lot);

    // Her lot için inspection kayıtları oluştur
    let defectsFound = 0;
    for (let s = 1; s <= sampleSize; s++) {
      const isDefective = defectsFound < defectCount && Math.random() < (defectCount / sampleSize);

      if (isDefective) {
        defectsFound++;
      }

      const inspection: Inspection = {
        id: uuidv4(),
        lotId,
        sampleNumber: s,
        isDefective,
        defects: isDefective ? [{
          criterionId: '',
          defectTypeId: ['E01', 'E02', 'E03', 'E04', 'E05'][Math.floor(Math.random() * 5)],
          description: '',
        }] : [],
        notes: '',
        photoBase64: null,
        photoUrl: null,
        inspectedAt: new Date(new Date(createdAt).getTime() + s * 30000).toISOString(),
      };

      inspections.push(inspection);
    }
  }

  // Tarihe göre sırala (en yeni en üstte)
  lots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { lots, inspections };
}

// Özet bilgi
export function getDemoDataSummary(lots: Lot[]): {
  total: number;
  accepted: number;
  rejected: number;
  bySupplier: Record<string, { accepted: number; rejected: number }>;
} {
  const summary = {
    total: lots.length,
    accepted: lots.filter(l => l.decision === 'accepted').length,
    rejected: lots.filter(l => l.decision === 'rejected').length,
    bySupplier: {} as Record<string, { accepted: number; rejected: number }>,
  };

  suppliers.forEach(s => {
    const supplierLots = lots.filter(l => l.supplierId === s.id);
    summary.bySupplier[s.name] = {
      accepted: supplierLots.filter(l => l.decision === 'accepted').length,
      rejected: supplierLots.filter(l => l.decision === 'rejected').length,
    };
  });

  return summary;
}
