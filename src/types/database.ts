// Supabase Database Types
// Auto-generated types for type-safe queries

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string;
          name: string;
          code: string;
          contact_person: string;
          phone: string;
          email: string;
          address: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          address?: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          address?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
      materials: {
        Row: {
          id: string;
          name: string;
          code: string;
          unit: string | null;
          default_aql: string;
          criteria: object[];
          defect_types: object[];
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          unit?: string | null;
          default_aql?: string;
          criteria?: object[];
          defect_types?: object[];
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          unit?: string | null;
          default_aql?: string;
          criteria?: object[];
          defect_types?: object[];
        };
      };
      lots: {
        Row: {
          id: string;
          lot_number: string;
          supplier_id: string;
          material_type_id: string;
          quantity: number;
          sample_size: number;
          sample_code: string;
          aql: string;
          inspection_level: string;
          acceptance_number: number;
          rejection_number: number;
          order_number: string | null;
          received_date: string;
          inspection_date: string | null;
          status: string;
          decision: string | null;
          inspected_by: string | null;
          notes: string | null;
          created_at: string;
          defect_count: number;
          package_config: object | null;
          sample_positions: object[] | null;
          current_sample_index: number | null;
        };
        Insert: {
          id?: string;
          lot_number: string;
          supplier_id: string;
          material_type_id: string;
          quantity: number;
          sample_size: number;
          sample_code: string;
          aql: string;
          inspection_level?: string;
          acceptance_number: number;
          rejection_number: number;
          order_number?: string | null;
          received_date: string;
          inspection_date?: string | null;
          status?: string;
          decision?: string | null;
          inspected_by?: string | null;
          notes?: string | null;
          created_at?: string;
          defect_count?: number;
          package_config?: object | null;
          sample_positions?: object[] | null;
          current_sample_index?: number | null;
        };
        Update: {
          id?: string;
          lot_number?: string;
          supplier_id?: string;
          material_type_id?: string;
          quantity?: number;
          sample_size?: number;
          sample_code?: string;
          aql?: string;
          inspection_level?: string;
          acceptance_number?: number;
          rejection_number?: number;
          order_number?: string | null;
          received_date?: string;
          inspection_date?: string | null;
          status?: string;
          decision?: string | null;
          inspected_by?: string | null;
          notes?: string | null;
          created_at?: string;
          defect_count?: number;
          package_config?: object | null;
          sample_positions?: object[] | null;
          current_sample_index?: number | null;
        };
      };
      inspections: {
        Row: {
          id: string;
          lot_id: string;
          sample_number: number;
          is_defective: boolean;
          defects: object[];
          notes: string | null;
          photo_base64: string | null;
          inspected_at: string;
        };
        Insert: {
          id?: string;
          lot_id: string;
          sample_number: number;
          is_defective?: boolean;
          defects?: object[];
          notes?: string | null;
          photo_base64?: string | null;
          inspected_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string;
          sample_number?: number;
          is_defective?: boolean;
          defects?: object[];
          notes?: string | null;
          photo_base64?: string | null;
          inspected_at?: string;
        };
      };
      switching_states: {
        Row: {
          id: string;
          supplier_id: string;
          material_type_id: string;
          current_level: string;
          consecutive_accepted: number;
          consecutive_rejected: number;
          total_inspections: number;
          history: object[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          material_type_id: string;
          current_level?: string;
          consecutive_accepted?: number;
          consecutive_rejected?: number;
          total_inspections?: number;
          history?: object[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          material_type_id?: string;
          current_level?: string;
          consecutive_accepted?: number;
          consecutive_rejected?: number;
          total_inspections?: number;
          history?: object[];
          updated_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          company_name: string;
          company_logo: string | null;
          default_aql: string;
          default_inspection_level: string;
          dark_mode: boolean;
          language: string;
        };
        Insert: {
          id?: string;
          company_name?: string;
          company_logo?: string | null;
          default_aql?: string;
          default_inspection_level?: string;
          dark_mode?: boolean;
          language?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          company_logo?: string | null;
          default_aql?: string;
          default_inspection_level?: string;
          dark_mode?: boolean;
          language?: string;
        };
      };
    };
  };
}
