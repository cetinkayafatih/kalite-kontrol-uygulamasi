// ============================================
// TÜM VERİ MODELLERİ
// ============================================

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  isActive: boolean;
}

export interface MaterialType {
  id: string;
  name: string;
  code: string;
  unit?: string;  // 'adet', 'bobin', 'metre' vb.
  defaultAQL: string;
  criteria: ControlCriterion[];
  defectTypes: DefectType[];
}

export interface ControlCriterion {
  id: string;
  name: string;
  description: string;
  acceptanceCriteria: string;
  inspectionMethod?: string;  // 'Görsel', 'Dokunma ve koku' vb.
  isCritical: boolean;
}

export interface DefectType {
  id: string;
  code: string;
  name: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

// Parti yapısı konfigürasyonu
export interface PackageConfig {
  palletCount: number;       // P - Palet sayısı
  packagesPerPallet: number; // B - Palet başı poşet sayısı
  itemsPerPackage: number;   // L - Poşet içi etiket sayısı
}

// Numune pozisyonu (clusterSampling.ts ile senkron)
export interface SamplePosition {
  code: string;           // "02-11-02" formatında
  pallet: number;         // Palet numarası
  package: number;        // Poşet numarası
  position: '01' | '02' | '03'; // Konum kodu
  positionLabel: string;  // "ÜSTTEN", "ORTADAN", "ALTTAN"
}

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
  orderNumber: string;
  receivedDate: string;
  inspectionDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  decision: 'accepted' | 'rejected' | null;
  inspectedBy: string;
  notes: string;
  createdAt: string;
  defectCount: number;
  // Küme örnekleme için yeni alanlar
  packageConfig?: PackageConfig;
  samplePositions?: SamplePosition[];
  currentSampleIndex?: number;
}

export interface Inspection {
  id: string;
  lotId: string;
  sampleNumber: number;
  isDefective: boolean;
  defects: InspectionDefect[];
  notes: string;
  photoBase64: string | null;  // Eski sistem (geriye uyumluluk)
  photoUrl: string | null;      // Yeni sistem (Supabase Storage)
  inspectedAt: string;
}

export interface InspectionDefect {
  criterionId: string;
  defectTypeId: string;
  description: string;
}

export interface SamplingResult {
  sampleCode: string;
  sampleSize: number;
  acceptanceNumber: number;
  rejectionNumber: number;
}

export interface DashboardStats {
  todayInspections: number;
  weeklyInspections: number;
  monthlyInspections: number;
  acceptanceRate: number;
  pendingLots: number;
  totalLots: number;
  totalAccepted: number;
  totalRejected: number;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalLots: number;
  acceptedLots: number;
  rejectedLots: number;
  acceptanceRate: number;
  totalDefects: number;
  avgDefectsPerLot: number;
}

export interface DefectAnalysis {
  defectTypeId: string;
  defectName: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  inspections: number;
  accepted: number;
  rejected: number;
  defectRate: number;
}

export interface Settings {
  companyName: string;
  companyLogo: string | null;
  defaultAQL: string;
  defaultInspectionLevel: 'I' | 'II' | 'III';
  darkMode: boolean;
  language: 'tr' | 'en';
}

export type InspectionStatus = 'pending' | 'in-progress' | 'completed';
export type Decision = 'accepted' | 'rejected' | null;
export type Severity = 'critical' | 'major' | 'minor';
export type InspectionLevel = 'I' | 'II' | 'III';

// ============================================
// AUDIT LOG (Denetim Kayıtları)
// ============================================

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  tableName: string;
  recordId: string;
  action: 'create' | 'update' | 'delete';
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
  createdAt: string;
}

export interface AuditLogFilter {
  tableName?: string;
  recordId?: string;
  userId?: string;
  action?: 'create' | 'update' | 'delete';
  startDate?: string;
  endDate?: string;
}
