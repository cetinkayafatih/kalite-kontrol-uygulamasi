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
}

export interface Inspection {
  id: string;
  lotId: string;
  sampleNumber: number;
  isDefective: boolean;
  defects: InspectionDefect[];
  notes: string;
  photoBase64: string | null;
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
