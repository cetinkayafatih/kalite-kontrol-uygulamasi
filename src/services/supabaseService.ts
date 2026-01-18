// Supabase CRUD Service Functions
import { supabase } from '../lib/supabase';
import type {
  Supplier,
  MaterialType,
  Lot,
  Inspection,
  Settings,
  ControlCriterion,
  DefectType,
  PackageConfig,
  SamplePosition,
  InspectionDefect,
  AuditLog,
  AuditLogFilter
} from '../types';
import type { SwitchingState, SwitchingTransition } from '../types/switching';

// User info for audit logging
export interface AuditUser {
  id?: string;
  email?: string;
}

// ============================================
// TYPE CONVERTERS (DB <-> App)
// ============================================

// Supplier
function dbToSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    contactPerson: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    createdAt: row.created_at,
    isActive: row.is_active,
  };
}

function supplierToDb(supplier: Partial<Supplier>): any {
  const result: any = {};
  if (supplier.name !== undefined) result.name = supplier.name;
  if (supplier.code !== undefined) result.code = supplier.code;
  if (supplier.contactPerson !== undefined) result.contact_person = supplier.contactPerson;
  if (supplier.phone !== undefined) result.phone = supplier.phone;
  if (supplier.email !== undefined) result.email = supplier.email;
  if (supplier.address !== undefined) result.address = supplier.address;
  if (supplier.isActive !== undefined) result.is_active = supplier.isActive;
  return result;
}

// Material
function dbToMaterial(row: any): MaterialType {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    unit: row.unit || 'adet',
    defaultAQL: row.default_aql,
    criteria: (row.criteria || []) as ControlCriterion[],
    defectTypes: (row.defect_types || []) as DefectType[],
  };
}

function materialToDb(material: Partial<MaterialType>): any {
  const result: any = {};
  if (material.name !== undefined) result.name = material.name;
  if (material.code !== undefined) result.code = material.code;
  if (material.unit !== undefined) result.unit = material.unit;
  if (material.defaultAQL !== undefined) result.default_aql = material.defaultAQL;
  if (material.criteria !== undefined) result.criteria = material.criteria;
  if (material.defectTypes !== undefined) result.defect_types = material.defectTypes;
  return result;
}

// Lot
function dbToLot(row: any): Lot {
  return {
    id: row.id,
    lotNumber: row.lot_number,
    supplierId: row.supplier_id,
    materialTypeId: row.material_type_id,
    quantity: row.quantity,
    sampleSize: row.sample_size,
    sampleCode: row.sample_code,
    aql: row.aql,
    inspectionLevel: row.inspection_level as 'I' | 'II' | 'III',
    acceptanceNumber: row.acceptance_number,
    rejectionNumber: row.rejection_number,
    orderNumber: row.order_number || '',
    receivedDate: row.received_date,
    inspectionDate: row.inspection_date || '',
    status: row.status as 'pending' | 'in-progress' | 'completed',
    decision: row.decision as 'accepted' | 'rejected' | null,
    inspectedBy: row.inspected_by || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    defectCount: row.defect_count || 0,
    packageConfig: row.package_config as PackageConfig | undefined,
    samplePositions: row.sample_positions as SamplePosition[] | undefined,
    currentSampleIndex: row.current_sample_index || 0,
  };
}

function lotToDb(lot: Partial<Lot>): any {
  const result: any = {};
  if (lot.lotNumber !== undefined) result.lot_number = lot.lotNumber;
  if (lot.supplierId !== undefined) result.supplier_id = lot.supplierId;
  if (lot.materialTypeId !== undefined) result.material_type_id = lot.materialTypeId;
  if (lot.quantity !== undefined) result.quantity = lot.quantity;
  if (lot.sampleSize !== undefined) result.sample_size = lot.sampleSize;
  if (lot.sampleCode !== undefined) result.sample_code = lot.sampleCode;
  if (lot.aql !== undefined) result.aql = lot.aql;
  if (lot.inspectionLevel !== undefined) result.inspection_level = lot.inspectionLevel;
  if (lot.acceptanceNumber !== undefined) result.acceptance_number = lot.acceptanceNumber;
  if (lot.rejectionNumber !== undefined) result.rejection_number = lot.rejectionNumber;
  if (lot.orderNumber !== undefined) result.order_number = lot.orderNumber;
  if (lot.receivedDate !== undefined) result.received_date = lot.receivedDate;
  if (lot.inspectionDate !== undefined) result.inspection_date = lot.inspectionDate;
  if (lot.status !== undefined) result.status = lot.status;
  if (lot.decision !== undefined) result.decision = lot.decision;
  if (lot.inspectedBy !== undefined) result.inspected_by = lot.inspectedBy;
  if (lot.notes !== undefined) result.notes = lot.notes;
  if (lot.defectCount !== undefined) result.defect_count = lot.defectCount;
  if (lot.packageConfig !== undefined) result.package_config = lot.packageConfig;
  if (lot.samplePositions !== undefined) result.sample_positions = lot.samplePositions;
  if (lot.currentSampleIndex !== undefined) result.current_sample_index = lot.currentSampleIndex;
  return result;
}

// Inspection
function dbToInspection(row: any): Inspection {
  return {
    id: row.id,
    lotId: row.lot_id,
    sampleNumber: row.sample_number,
    isDefective: row.is_defective,
    defects: (row.defects || []) as InspectionDefect[],
    notes: row.notes || '',
    photoBase64: row.photo_base64,
    photoUrl: row.photo_url,
    inspectedAt: row.inspected_at,
  };
}

function inspectionToDb(inspection: Partial<Inspection>): any {
  const result: any = {};
  if (inspection.lotId !== undefined) result.lot_id = inspection.lotId;
  if (inspection.sampleNumber !== undefined) result.sample_number = inspection.sampleNumber;
  if (inspection.isDefective !== undefined) result.is_defective = inspection.isDefective;
  if (inspection.defects !== undefined) result.defects = inspection.defects;
  if (inspection.notes !== undefined) result.notes = inspection.notes;
  if (inspection.photoBase64 !== undefined) result.photo_base64 = inspection.photoBase64;
  if (inspection.photoUrl !== undefined) result.photo_url = inspection.photoUrl;
  return result;
}

// Switching State
function dbToSwitchingState(row: any): SwitchingState {
  return {
    supplierId: row.supplier_id,
    materialTypeId: row.material_type_id,
    currentLevel: row.current_level as 'normal' | 'tightened' | 'reduced',
    consecutiveAccepts: row.consecutive_accepted || 0,
    consecutiveRejects: row.consecutive_rejected || 0,
    recentResults: (row.recent_results || []) as ('accepted' | 'rejected')[],
    history: (row.history || []) as SwitchingTransition[],
    lastUpdated: row.updated_at,
    shouldStopProduction: row.should_stop_production || false,
  };
}

function switchingStateToDb(state: Partial<SwitchingState>): any {
  const result: any = {};
  if (state.supplierId !== undefined) result.supplier_id = state.supplierId;
  if (state.materialTypeId !== undefined) result.material_type_id = state.materialTypeId;
  if (state.currentLevel !== undefined) result.current_level = state.currentLevel;
  if (state.consecutiveAccepts !== undefined) result.consecutive_accepted = state.consecutiveAccepts;
  if (state.consecutiveRejects !== undefined) result.consecutive_rejected = state.consecutiveRejects;
  if (state.recentResults !== undefined) result.recent_results = state.recentResults;
  if (state.history !== undefined) result.history = state.history;
  if (state.shouldStopProduction !== undefined) result.should_stop_production = state.shouldStopProduction;
  result.updated_at = new Date().toISOString();
  return result;
}

// Settings
function dbToSettings(row: any): Settings {
  return {
    companyName: row.company_name,
    companyLogo: row.company_logo,
    defaultAQL: row.default_aql,
    defaultInspectionLevel: row.default_inspection_level as 'I' | 'II' | 'III',
    darkMode: row.dark_mode,
    language: row.language as 'tr' | 'en',
  };
}

function settingsToDb(settings: Partial<Settings>): any {
  const result: any = {};
  if (settings.companyName !== undefined) result.company_name = settings.companyName;
  if (settings.companyLogo !== undefined) result.company_logo = settings.companyLogo;
  if (settings.defaultAQL !== undefined) result.default_aql = settings.defaultAQL;
  if (settings.defaultInspectionLevel !== undefined) result.default_inspection_level = settings.defaultInspectionLevel;
  if (settings.darkMode !== undefined) result.dark_mode = settings.darkMode;
  if (settings.language !== undefined) result.language = settings.language;
  return result;
}

// ============================================
// SUPPLIER SERVICE
// ============================================

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToSupplier);
  },

  async getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? dbToSupplier(data) : null;
  },

  async create(supplier: Omit<Supplier, 'id' | 'createdAt'>, user?: AuditUser | null): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierToDb(supplier) as any)
      .select()
      .single();

    if (error) throw error;
    const created = dbToSupplier(data);

    // Audit log
    await auditService.log({
      user,
      tableName: 'suppliers',
      recordId: created.id,
      action: 'create',
      newValues: data,
    });

    return created;
  },

  async update(id: string, supplier: Partial<Supplier>, user?: AuditUser | null): Promise<Supplier> {
    // Fetch old values first
    const { data: oldData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierToDb(supplier) as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'suppliers',
      recordId: id,
      action: 'update',
      oldValues: oldData,
      newValues: data,
    });

    return dbToSupplier(data);
  },

  async delete(id: string, user?: AuditUser | null): Promise<void> {
    // Fetch old values first for audit
    const { data: oldData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'suppliers',
      recordId: id,
      action: 'delete',
      oldValues: oldData,
    });
  },
};

// ============================================
// MATERIAL SERVICE
// ============================================

export const materialService = {
  async getAll(): Promise<MaterialType[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(dbToMaterial);
  },

  async getById(id: string): Promise<MaterialType | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? dbToMaterial(data) : null;
  },

  async create(material: Omit<MaterialType, 'id'>, user?: AuditUser | null): Promise<MaterialType> {
    const { data, error } = await supabase
      .from('materials')
      .insert(materialToDb(material) as any)
      .select()
      .single();

    if (error) throw error;
    const created = dbToMaterial(data);

    // Audit log
    await auditService.log({
      user,
      tableName: 'materials',
      recordId: created.id,
      action: 'create',
      newValues: data,
    });

    return created;
  },

  async update(id: string, material: Partial<MaterialType>, user?: AuditUser | null): Promise<MaterialType> {
    // Fetch old values first
    const { data: oldData } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('materials')
      .update(materialToDb(material) as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'materials',
      recordId: id,
      action: 'update',
      oldValues: oldData,
      newValues: data,
    });

    return dbToMaterial(data);
  },

  async delete(id: string, user?: AuditUser | null): Promise<void> {
    // Fetch old values first for audit
    const { data: oldData } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'materials',
      recordId: id,
      action: 'delete',
      oldValues: oldData,
    });
  },
};

// ============================================
// LOT SERVICE
// ============================================

export const lotService = {
  async getAll(): Promise<Lot[]> {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToLot);
  },

  async getById(id: string): Promise<Lot | null> {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? dbToLot(data) : null;
  },

  async create(lot: Omit<Lot, 'id' | 'createdAt' | 'status' | 'decision' | 'defectCount'>, user?: AuditUser | null): Promise<Lot> {
    const insertData = {
      ...lotToDb(lot),
      status: 'pending',
      decision: null,
      defect_count: 0,
    };

    const { data, error } = await supabase
      .from('lots')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    const created = dbToLot(data);

    // Audit log
    await auditService.log({
      user,
      tableName: 'lots',
      recordId: created.id,
      action: 'create',
      newValues: data,
    });

    return created;
  },

  async update(id: string, lot: Partial<Lot>, user?: AuditUser | null): Promise<Lot> {
    // Fetch old values first
    const { data: oldData } = await supabase
      .from('lots')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('lots')
      .update(lotToDb(lot) as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'lots',
      recordId: id,
      action: 'update',
      oldValues: oldData,
      newValues: data,
    });

    return dbToLot(data);
  },

  async delete(id: string, user?: AuditUser | null): Promise<void> {
    // Fetch old values first for audit
    const { data: oldData } = await supabase
      .from('lots')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('lots')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'lots',
      recordId: id,
      action: 'delete',
      oldValues: oldData,
    });
  },

  async complete(id: string, decision: 'accepted' | 'rejected', defectCount: number, user?: AuditUser | null): Promise<Lot> {
    // Fetch old values first
    const { data: oldData } = await supabase
      .from('lots')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('lots')
      .update({
        status: 'completed',
        decision,
        defect_count: defectCount,
        inspection_date: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditService.log({
      user,
      tableName: 'lots',
      recordId: id,
      action: 'update',
      oldValues: oldData,
      newValues: data,
    });

    return dbToLot(data);
  },
};

// ============================================
// INSPECTION SERVICE
// ============================================

export const inspectionService = {
  async getAll(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('inspected_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToInspection);
  },

  async getByLotId(lotId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('lot_id', lotId)
      .order('sample_number');

    if (error) throw error;
    return (data || []).map(dbToInspection);
  },

  async create(inspection: Omit<Inspection, 'id' | 'inspectedAt'>, user?: AuditUser | null): Promise<Inspection> {
    const { data, error } = await supabase
      .from('inspections')
      .insert(inspectionToDb(inspection) as any)
      .select()
      .single();

    if (error) throw error;
    const created = dbToInspection(data);

    // Audit log
    await auditService.log({
      user,
      tableName: 'inspections',
      recordId: created.id,
      action: 'create',
      newValues: data,
    });

    return created;
  },

  async deleteByLotId(lotId: string, user?: AuditUser | null): Promise<void> {
    // Fetch all inspections for this lot for audit
    const { data: oldData } = await supabase
      .from('inspections')
      .select('*')
      .eq('lot_id', lotId);

    const { error } = await supabase
      .from('inspections')
      .delete()
      .eq('lot_id', lotId);

    if (error) throw error;

    // Audit log for each deleted inspection
    if (oldData) {
      for (const row of oldData) {
        await auditService.log({
          user,
          tableName: 'inspections',
          recordId: row.id,
          action: 'delete',
          oldValues: row,
        });
      }
    }
  },
};

// ============================================
// SWITCHING STATE SERVICE
// ============================================

export const switchingService = {
  async getAll(): Promise<SwitchingState[]> {
    const { data, error } = await supabase
      .from('switching_states')
      .select('*');

    if (error) throw error;
    return (data || []).map(dbToSwitchingState);
  },

  async get(supplierId: string, materialTypeId: string): Promise<SwitchingState | null> {
    const { data, error } = await supabase
      .from('switching_states')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('material_type_id', materialTypeId)
      .single();

    if (error) return null;
    return data ? dbToSwitchingState(data) : null;
  },

  async upsert(state: SwitchingState): Promise<SwitchingState> {
    const { data, error } = await supabase
      .from('switching_states')
      .upsert(switchingStateToDb(state) as any, {
        onConflict: 'supplier_id,material_type_id',
      })
      .select()
      .single();

    if (error) throw error;
    return dbToSwitchingState(data);
  },

  async delete(supplierId: string, materialTypeId: string): Promise<void> {
    const { error } = await supabase
      .from('switching_states')
      .delete()
      .eq('supplier_id', supplierId)
      .eq('material_type_id', materialTypeId);

    if (error) throw error;
  },
};

// ============================================
// SETTINGS SERVICE
// ============================================

export const settingsService = {
  async get(): Promise<Settings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (error) return null;
    return data ? dbToSettings(data) : null;
  },

  async update(settings: Partial<Settings>): Promise<Settings> {
    // First, try to get existing settings
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('settings')
        .update(settingsToDb(settings) as any)
        .eq('id', (existing as any).id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('settings')
        .insert(settingsToDb(settings) as any)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return dbToSettings(result);
  },
};

// ============================================
// AUDIT LOG SERVICE
// ============================================

function dbToAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    tableName: row.table_name,
    recordId: row.record_id,
    action: row.action as 'create' | 'update' | 'delete',
    oldValues: row.old_values,
    newValues: row.new_values,
    changedFields: row.changed_fields,
    createdAt: row.created_at,
  };
}

export const auditService = {
  // Log an audit entry
  async log(params: {
    user?: AuditUser | null;
    tableName: string;
    recordId: string;
    action: 'create' | 'update' | 'delete';
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
  }): Promise<void> {
    // Calculate changed fields for updates
    let changedFields: string[] | null = null;
    if (params.action === 'update' && params.oldValues && params.newValues) {
      changedFields = Object.keys(params.newValues).filter(
        key => JSON.stringify(params.oldValues?.[key]) !== JSON.stringify(params.newValues?.[key])
      );
    }

    // Filter out photo_base64 from values (too large)
    const filterLargeFields = (obj: Record<string, unknown> | null | undefined) => {
      if (!obj) return null;
      const filtered = { ...obj };
      if ('photo_base64' in filtered) {
        filtered.photo_base64 = filtered.photo_base64 ? '[BASE64_DATA]' : null;
      }
      return filtered;
    };

    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.user?.id || null,
      user_email: params.user?.email || null,
      table_name: params.tableName,
      record_id: params.recordId,
      action: params.action,
      old_values: filterLargeFields(params.oldValues),
      new_values: filterLargeFields(params.newValues),
      changed_fields: changedFields,
    });

    if (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit failures shouldn't break main operations
    }
  },

  // Query audit logs with filters
  async query(filters?: AuditLogFilter, limit = 50, offset = 0): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.tableName) {
      query = query.eq('table_name', filters.tableName);
    }
    if (filters?.recordId) {
      query = query.eq('record_id', filters.recordId);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(dbToAuditLog);
  },

  // Get audit history for a specific record
  async getRecordHistory(tableName: string, recordId: string): Promise<AuditLog[]> {
    return this.query({ tableName, recordId });
  },

  // Get total count for pagination
  async count(filters?: AuditLogFilter): Promise<number> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (filters?.tableName) {
      query = query.eq('table_name', filters.tableName);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },
};

// ============================================
// STORAGE SERVICE (Fotoğraf Depolama)
// ============================================

const BUCKET_NAME = 'inspection-photos';

export const storageService = {
  /**
   * Fotoğraf yükle
   * @param file - Yüklenecek dosya
   * @param lotId - Parti ID'si (klasör yapısı için)
   * @param sampleNumber - Numune numarası
   * @returns Fotoğrafın public URL'i
   */
  async uploadPhoto(file: File, lotId: string, sampleNumber: number): Promise<string> {
    // Dosya adı: lotId/sample_001_timestamp.jpg
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${lotId}/sample_${String(sampleNumber).padStart(3, '0')}_${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      throw new Error('Fotoğraf yüklenemedi: ' + uploadError.message);
    }

    // Public URL al
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  /**
   * Base64'ten fotoğraf yükle
   * @param base64Data - Base64 formatında resim verisi
   * @param lotId - Parti ID'si
   * @param sampleNumber - Numune numarası
   * @returns Fotoğrafın public URL'i
   */
  async uploadPhotoFromBase64(base64Data: string, lotId: string, sampleNumber: number): Promise<string> {
    // Base64'ü Blob'a çevir
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();

    // MIME type'dan uzantıyı belirle
    const mimeType = blob.type || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';

    // File oluştur
    const file = new File([blob], `photo.${ext}`, { type: mimeType });

    return this.uploadPhoto(file, lotId, sampleNumber);
  },

  /**
   * Fotoğrafı sil
   * @param photoUrl - Silinecek fotoğrafın URL'i
   */
  async deletePhoto(photoUrl: string): Promise<void> {
    // URL'den dosya yolunu çıkar
    const urlParts = photoUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Photo delete error:', error);
      // Silme hatası kritik değil, log'la ve devam et
    }
  },

  /**
   * Bir partiye ait tüm fotoğrafları sil
   * @param lotId - Parti ID'si
   */
  async deletePhotosByLotId(lotId: string): Promise<void> {
    // Klasördeki tüm dosyaları listele
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(lotId);

    if (listError || !files || files.length === 0) return;

    // Tüm dosyaları sil
    const filePaths = files.map(file => `${lotId}/${file.name}`);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      console.error('Photos delete error:', error);
    }
  },
};
