export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          specialist_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          specialist_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          specialist_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_fee_payments: {
        Row: {
          amount: number
          created_at: string
          fee_id: string
          id: string
          method: string | null
          notes: string | null
          paid_at: string
          recorded_by: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fee_id: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          recorded_by: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee_id?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          recorded_by?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_fee_payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "client_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      client_fees: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          health_unit_id: string | null
          id: string
          is_active: boolean
          next_due_date: string
          notes: string | null
          patient_id: string | null
          patient_name: string
          recurrence: Database["public"]["Enums"]["fee_recurrence"]
          start_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          health_unit_id?: string | null
          id?: string
          is_active?: boolean
          next_due_date: string
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          recurrence?: Database["public"]["Enums"]["fee_recurrence"]
          start_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          health_unit_id?: string | null
          id?: string
          is_active?: boolean
          next_due_date?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          recurrence?: Database["public"]["Enums"]["fee_recurrence"]
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_fees_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_fees_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_documents: {
        Row: {
          created_at: string
          id: string
          kind: string
          patient_id: string | null
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          patient_id?: string | null
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          patient_id?: string | null
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_assignments: {
        Row: {
          area: Database["public"]["Enums"]["work_area"]
          created_at: string
          health_unit_id: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          area: Database["public"]["Enums"]["work_area"]
          created_at?: string
          health_unit_id: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["work_area"]
          created_at?: string
          health_unit_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignments_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          entry_type: string
          expense_date: string
          fixed_expense_id: string | null
          health_unit_id: string | null
          id: string
          notes: string | null
          operation_date: string | null
          period_month: number
          period_year: number
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          entry_type?: string
          expense_date?: string
          fixed_expense_id?: string | null
          health_unit_id?: string | null
          id?: string
          notes?: string | null
          operation_date?: string | null
          period_month: number
          period_year: number
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          entry_type?: string
          expense_date?: string
          fixed_expense_id?: string | null
          health_unit_id?: string | null
          id?: string
          notes?: string | null
          operation_date?: string | null
          period_month?: number
          period_year?: number
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_fixed_expense_id_fkey"
            columns: ["fixed_expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          category: string | null
          created_at: string
          default_amount: number
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_amount?: number
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      floor_furniture: {
        Row: {
          color: string
          created_at: string
          furniture_type: string
          height: number
          id: string
          is_active: boolean
          label: string | null
          notes: string | null
          patient_id: string | null
          rotation: number
          updated_at: string
          width: number
          x: number
          y: number
          zone_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          furniture_type?: string
          height?: number
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          patient_id?: string | null
          rotation?: number
          updated_at?: string
          width?: number
          x?: number
          y?: number
          zone_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          furniture_type?: string
          height?: number
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          patient_id?: string | null
          rotation?: number
          updated_at?: string
          width?: number
          x?: number
          y?: number
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floor_furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "floor_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_zones: {
        Row: {
          capacity: number
          color: string
          created_at: string
          height: number
          id: string
          is_active: boolean
          name: string
          notes: string | null
          rotation: number
          specialist_id: string | null
          updated_at: string
          width: number
          x: number
          y: number
          zone_type: string
        }
        Insert: {
          capacity?: number
          color?: string
          created_at?: string
          height?: number
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          rotation?: number
          specialist_id?: string | null
          updated_at?: string
          width?: number
          x?: number
          y?: number
          zone_type?: string
        }
        Update: {
          capacity?: number
          color?: string
          created_at?: string
          height?: number
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          rotation?: number
          specialist_id?: string | null
          updated_at?: string
          width?: number
          x?: number
          y?: number
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_zones_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      health_units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      informed_consents: {
        Row: {
          consent_type: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          signed_at: string
          signed_by_name: string | null
          witness_name: string | null
        }
        Insert: {
          consent_type: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          signed_at?: string
          signed_by_name?: string | null
          witness_name?: string | null
        }
        Update: {
          consent_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          signed_at?: string
          signed_by_name?: string | null
          witness_name?: string | null
        }
        Relationships: []
      }
      meal_intake: {
        Row: {
          amount: string | null
          consumed: boolean
          created_at: string
          health_unit_id: string
          id: string
          intake_date: string
          meal: string
          notes: string | null
          patient_id: string
          recorded_by: string
        }
        Insert: {
          amount?: string | null
          consumed?: boolean
          created_at?: string
          health_unit_id: string
          id?: string
          intake_date?: string
          meal: string
          notes?: string | null
          patient_id: string
          recorded_by: string
        }
        Update: {
          amount?: string | null
          consumed?: boolean
          created_at?: string
          health_unit_id?: string
          id?: string
          intake_date?: string
          meal?: string
          notes?: string | null
          patient_id?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_intake_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_intake_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          cena: string | null
          colacion_am: string | null
          colacion_pm: string | null
          comida: string | null
          created_at: string
          created_by: string | null
          day_of_week: number
          desayuno: string | null
          health_unit_id: string
          id: string
          notes: string | null
          patient_id: string | null
          updated_at: string
          week_start: string
        }
        Insert: {
          cena?: string | null
          colacion_am?: string | null
          colacion_pm?: string | null
          comida?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week: number
          desayuno?: string | null
          health_unit_id: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          updated_at?: string
          week_start: string
        }
        Update: {
          cena?: string | null
          colacion_am?: string | null
          colacion_pm?: string | null
          comida?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          desayuno?: string | null
          health_unit_id?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_notes: {
        Row: {
          afecto: string | null
          apariencia: string | null
          appointment_id: string | null
          conciencia: string | null
          created_at: string
          diagnostico_sesion: string | null
          id: string
          is_locked: boolean
          juicio: string | null
          medicamentos: string | null
          motivo_consulta: string | null
          notas_libres: string | null
          orientacion: string | null
          padecimiento_actual: string | null
          patient_id: string
          pensamiento: string | null
          plan_sesion: string | null
          proxima_cita: string | null
          session_date: string
          specialist_id: string
          updated_at: string
        }
        Insert: {
          afecto?: string | null
          apariencia?: string | null
          appointment_id?: string | null
          conciencia?: string | null
          created_at?: string
          diagnostico_sesion?: string | null
          id?: string
          is_locked?: boolean
          juicio?: string | null
          medicamentos?: string | null
          motivo_consulta?: string | null
          notas_libres?: string | null
          orientacion?: string | null
          padecimiento_actual?: string | null
          patient_id: string
          pensamiento?: string | null
          plan_sesion?: string | null
          proxima_cita?: string | null
          session_date?: string
          specialist_id: string
          updated_at?: string
        }
        Update: {
          afecto?: string | null
          apariencia?: string | null
          appointment_id?: string | null
          conciencia?: string | null
          created_at?: string
          diagnostico_sesion?: string | null
          id?: string
          is_locked?: boolean
          juicio?: string | null
          medicamentos?: string | null
          motivo_consulta?: string | null
          notas_libres?: string | null
          orientacion?: string | null
          padecimiento_actual?: string | null
          patient_id?: string
          pensamiento?: string | null
          plan_sesion?: string | null
          proxima_cita?: string | null
          session_date?: string
          specialist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_notes_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          address: string | null
          alergias: string | null
          created_at: string
          created_by: string | null
          diagnostico_cie10: string | null
          diagnostico_descripcion: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          heredofamiliares: string | null
          id: string
          marital_status: string | null
          medicamentos_actuales: string | null
          observaciones: string | null
          occupation: string | null
          patient_id: string
          personales_no_patologicos: string | null
          personales_patologicos: string | null
          plan_terapeutico: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alergias?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_cie10?: string | null
          diagnostico_descripcion?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          heredofamiliares?: string | null
          id?: string
          marital_status?: string | null
          medicamentos_actuales?: string | null
          observaciones?: string | null
          occupation?: string | null
          patient_id: string
          personales_no_patologicos?: string | null
          personales_patologicos?: string | null
          plan_terapeutico?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alergias?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_cie10?: string | null
          diagnostico_descripcion?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          heredofamiliares?: string | null
          id?: string
          marital_status?: string | null
          medicamentos_actuales?: string | null
          observaciones?: string | null
          occupation?: string | null
          patient_id?: string
          personales_no_patologicos?: string | null
          personales_patologicos?: string | null
          plan_terapeutico?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_log: {
        Row: {
          created_at: string
          description: string | null
          dose: string | null
          event_at: string
          health_unit_id: string
          id: string
          log_type: Database["public"]["Enums"]["medication_log_type"]
          medication: string | null
          notes: string | null
          patient_id: string
          recorded_by: string
          route: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dose?: string | null
          event_at?: string
          health_unit_id: string
          id?: string
          log_type?: Database["public"]["Enums"]["medication_log_type"]
          medication?: string | null
          notes?: string | null
          patient_id: string
          recorded_by: string
          route?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dose?: string | null
          event_at?: string
          health_unit_id?: string
          id?: string
          log_type?: Database["public"]["Enums"]["medication_log_type"]
          medication?: string | null
          notes?: string | null
          patient_id?: string
          recorded_by?: string
          route?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_log_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_flow: {
        Row: {
          arrived_at: string
          created_at: string
          created_by: string | null
          exited_at: string | null
          id: string
          in_consult_at: string | null
          notes: string | null
          patient_id: string
          specialist_id: string | null
          stage: string
          to_payment_at: string | null
          updated_at: string
          visit_id: string | null
          zone_id: string | null
        }
        Insert: {
          arrived_at?: string
          created_at?: string
          created_by?: string | null
          exited_at?: string | null
          id?: string
          in_consult_at?: string | null
          notes?: string | null
          patient_id: string
          specialist_id?: string | null
          stage?: string
          to_payment_at?: string | null
          updated_at?: string
          visit_id?: string | null
          zone_id?: string | null
        }
        Update: {
          arrived_at?: string
          created_at?: string
          created_by?: string | null
          exited_at?: string | null
          id?: string
          in_consult_at?: string | null
          notes?: string | null
          patient_id?: string
          specialist_id?: string | null
          stage?: string
          to_payment_at?: string | null
          updated_at?: string
          visit_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_flow_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_flow_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_flow_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_flow_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "floor_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invoices: {
        Row: {
          amount: number
          concept: string | null
          created_at: string
          error_reason: string | null
          file_url: string | null
          health_unit_id: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          patient_id: string | null
          patient_name: string
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          uploaded_by: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          concept?: string | null
          created_at?: string
          error_reason?: string | null
          file_url?: string | null
          health_unit_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          patient_id?: string | null
          patient_name: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          uploaded_by: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          concept?: string | null
          created_at?: string
          error_reason?: string | null
          file_url?: string | null
          health_unit_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          patient_id?: string | null
          patient_name?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          uploaded_by?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_invoices_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          health_unit_id: string | null
          id: string
          notes: string | null
          phone: string | null
          quote_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          health_unit_id?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          quote_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          health_unit_id?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          quote_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          collected_by: string | null
          concepts: Json
          created_at: string
          flow_id: string | null
          id: string
          notes: string | null
          patient_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          visit_id: string | null
        }
        Insert: {
          amount: number
          collected_by?: string | null
          concepts?: Json
          created_at?: string
          flow_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          visit_id?: string | null
        }
        Update: {
          amount?: number
          collected_by?: string | null
          concepts?: Json
          created_at?: string
          flow_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employees: {
        Row: {
          area: Database["public"]["Enums"]["payroll_area"]
          bank: string | null
          bank_account: string | null
          base_salary: number
          created_at: string
          created_by: string | null
          frequency: Database["public"]["Enums"]["payroll_frequency"]
          full_name: string
          health_unit_id: string | null
          id: string
          is_active: boolean
          notes: string | null
          position: string | null
          rfc: string | null
          updated_at: string
        }
        Insert: {
          area: Database["public"]["Enums"]["payroll_area"]
          bank?: string | null
          bank_account?: string | null
          base_salary?: number
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["payroll_frequency"]
          full_name: string
          health_unit_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: string | null
          rfc?: string | null
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["payroll_area"]
          bank?: string | null
          bank_account?: string | null
          base_salary?: number
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["payroll_frequency"]
          full_name?: string
          health_unit_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: string | null
          rfc?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payroll_items: {
        Row: {
          absences: number
          base_amount: number
          bonuses: number
          created_at: string
          deductions: number
          employee_id: string
          employee_name: string
          id: string
          net_amount: number
          notes: string | null
          overtime: number
          receipt_url: string | null
          run_id: string
          updated_at: string
        }
        Insert: {
          absences?: number
          base_amount?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id: string
          employee_name: string
          id?: string
          net_amount?: number
          notes?: string | null
          overtime?: number
          receipt_url?: string | null
          run_id: string
          updated_at?: string
        }
        Update: {
          absences?: number
          base_amount?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          employee_name?: string
          id?: string
          net_amount?: number
          notes?: string | null
          overtime?: number
          receipt_url?: string | null
          run_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          area: Database["public"]["Enums"]["payroll_area"]
          authorized_at: string | null
          authorized_by: string | null
          created_at: string
          created_by: string
          frequency: Database["public"]["Enums"]["payroll_frequency"]
          health_unit_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payroll_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          area: Database["public"]["Enums"]["payroll_area"]
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string
          created_by: string
          frequency?: Database["public"]["Enums"]["payroll_frequency"]
          health_unit_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["payroll_area"]
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string
          created_by?: string
          frequency?: Database["public"]["Enums"]["payroll_frequency"]
          health_unit_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          created_at: string
          dosis: string | null
          duracion: string | null
          frecuencia: string | null
          id: string
          indicaciones: string | null
          medicamento: string
          prescription_id: string
          presentacion: string | null
          via: string | null
        }
        Insert: {
          created_at?: string
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          indicaciones?: string | null
          medicamento: string
          prescription_id: string
          presentacion?: string | null
          via?: string | null
        }
        Update: {
          created_at?: string
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          indicaciones?: string | null
          medicamento?: string
          prescription_id?: string
          presentacion?: string | null
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          diagnostico: string | null
          id: string
          indicaciones: string | null
          is_locked: boolean
          issued_at: string
          note_id: string | null
          patient_id: string
          specialist_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostico?: string | null
          id?: string
          indicaciones?: string | null
          is_locked?: boolean
          issued_at?: string
          note_id?: string | null
          patient_id: string
          specialist_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostico?: string | null
          id?: string
          indicaciones?: string | null
          is_locked?: boolean
          issued_at?: string
          note_id?: string | null
          patient_id?: string
          specialist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          pin_hash: string | null
          pin_set_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          additional_costs: Json
          base_monthly_price: number
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          estimated_admission_date: string | null
          id: string
          notes: string | null
          other_to_quote: Json
          quote_number: string
          resident_age: number | null
          resident_name: string | null
          service_type: string
          updated_at: string
        }
        Insert: {
          additional_costs?: Json
          base_monthly_price: number
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          estimated_admission_date?: string | null
          id?: string
          notes?: string | null
          other_to_quote?: Json
          quote_number: string
          resident_age?: number | null
          resident_name?: string | null
          service_type: string
          updated_at?: string
        }
        Update: {
          additional_costs?: Json
          base_monthly_price?: number
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          estimated_admission_date?: string | null
          id?: string
          notes?: string | null
          other_to_quote?: Json
          quote_number?: string
          resident_age?: number | null
          resident_name?: string | null
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      requisition_items: {
        Row: {
          created_at: string
          description: string
          id: string
          image_path: string | null
          notes: string | null
          quantity: number
          requisition_id: string
          status: Database["public"]["Enums"]["requisition_status"]
          unit: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_path?: string | null
          notes?: string | null
          quantity?: number
          requisition_id: string
          status?: Database["public"]["Enums"]["requisition_status"]
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          notes?: string | null
          quantity?: number
          requisition_id?: string
          status?: Database["public"]["Enums"]["requisition_status"]
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          area: Database["public"]["Enums"]["work_area"] | null
          assigned_to: string | null
          authorized_at: string | null
          authorized_by: string | null
          created_at: string
          description: string | null
          executed_at: string | null
          executed_by: string | null
          health_unit_id: string
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          priority: Database["public"]["Enums"]["requisition_priority"]
          rejected_reason: string | null
          req_type: Database["public"]["Enums"]["requisition_type"]
          requested_by: string
          status: Database["public"]["Enums"]["requisition_status"]
          title: string
          total_amount: number | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          area?: Database["public"]["Enums"]["work_area"] | null
          assigned_to?: string | null
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string
          description?: string | null
          executed_at?: string | null
          executed_by?: string | null
          health_unit_id: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          priority?: Database["public"]["Enums"]["requisition_priority"]
          rejected_reason?: string | null
          req_type: Database["public"]["Enums"]["requisition_type"]
          requested_by: string
          status?: Database["public"]["Enums"]["requisition_status"]
          title: string
          total_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          area?: Database["public"]["Enums"]["work_area"] | null
          assigned_to?: string | null
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string
          description?: string | null
          executed_at?: string | null
          executed_by?: string | null
          health_unit_id?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          priority?: Database["public"]["Enums"]["requisition_priority"]
          rejected_reason?: string | null
          req_type?: Database["public"]["Enums"]["requisition_type"]
          requested_by?: string
          status?: Database["public"]["Enums"]["requisition_status"]
          title?: string
          total_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          consultation_fee: number
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          is_partner: boolean
          phone: string | null
          specialty: Database["public"]["Enums"]["specialty_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          consultation_fee?: number
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_partner?: boolean
          phone?: string | null
          specialty: Database["public"]["Enums"]["specialty_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          consultation_fee?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_partner?: boolean
          phone?: string | null
          specialty?: Database["public"]["Enums"]["specialty_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_evaluations: {
        Row: {
          created_at: string
          frequency: string | null
          full_name: string
          health_unit_id: string | null
          id: string
          info_generated: string | null
          info_processing: string | null
          info_received: string | null
          interview_date: string
          interviewer_id: string
          observations: string | null
          pain_points: string | null
          position: string
          reports_to: string | null
          team_in_charge: string | null
          tools_used: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: string | null
          full_name: string
          health_unit_id?: string | null
          id?: string
          info_generated?: string | null
          info_processing?: string | null
          info_received?: string | null
          interview_date?: string
          interviewer_id: string
          observations?: string | null
          pain_points?: string | null
          position: string
          reports_to?: string | null
          team_in_charge?: string | null
          tools_used?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: string | null
          full_name?: string
          health_unit_id?: string | null
          id?: string
          info_generated?: string | null
          info_processing?: string | null
          info_received?: string | null
          interview_date?: string
          interviewer_id?: string
          observations?: string | null
          pain_points?: string | null
          position?: string
          reports_to?: string | null
          team_in_charge?: string | null
          tools_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_evaluations_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          arrival_time: string
          created_at: string
          departure_time: string | null
          id: string
          notes: string | null
          patient_id: string
          receptionist_id: string | null
          specialist_id: string
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
        }
        Insert: {
          arrival_time?: string
          created_at?: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          receptionist_id?: string | null
          specialist_id: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Update: {
          arrival_time?: string
          created_at?: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          receptionist_id?: string | null
          specialist_id?: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          bmi: number | null
          created_at: string
          created_by: string | null
          diastolic_bp: number | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          measured_at: string
          note_id: string | null
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          resp_rate: number | null
          systolic_bp: number | null
          temperature: number | null
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          created_by?: string | null
          diastolic_bp?: number | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          measured_at?: string
          note_id?: string | null
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          resp_rate?: number | null
          systolic_bp?: number | null
          temperature?: number | null
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          created_at?: string
          created_by?: string | null
          diastolic_bp?: number | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          measured_at?: string
          note_id?: string | null
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          resp_rate?: number | null
          systolic_bp?: number | null
          temperature?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_remove_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_user_pin: {
        Args: { _pin: string; _user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      current_specialist_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_my_pin: { Args: { _pin: string }; Returns: undefined }
      user_in_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      verify_pin: { Args: { _pin: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "recepcion"
        | "especialista"
        | "administrativo"
        | "dueno"
        | "promotor"
        | "enfermera"
        | "intendencia"
        | "mantenimiento"
        | "asistente_admin"
        | "contador"
        | "rrhh"
        | "empleado"
      appointment_status:
        | "programada"
        | "confirmada"
        | "cancelada"
        | "completada"
        | "no_asistio"
      fee_recurrence: "unica" | "semanal" | "quincenal" | "mensual"
      invoice_status: "pendiente" | "verificada" | "erronea" | "cancelada"
      medication_log_type:
        | "medicamento"
        | "estudio"
        | "consulta"
        | "salida"
        | "otro"
      payment_method: "efectivo" | "transferencia" | "tarjeta"
      payroll_area:
        | "enfermeria"
        | "intendencia"
        | "mantenimiento"
        | "administrativo"
        | "otro"
      payroll_frequency: "semanal" | "quincenal" | "mensual"
      payroll_status: "borrador" | "autorizada" | "pagada" | "cancelada"
      requisition_priority: "baja" | "media" | "alta" | "urgente"
      requisition_status:
        | "pendiente"
        | "autorizada"
        | "rechazada"
        | "comprada"
        | "pagada"
        | "cancelada"
      requisition_type:
        | "medicamentos"
        | "limpieza"
        | "mantenimiento"
        | "servicio_mantenimiento"
        | "pago_proveedor"
      specialty_type: "psiquiatra" | "psicologo"
      visit_status: "en_espera" | "en_consulta" | "atendido" | "cancelado"
      work_area:
        | "enfermeria"
        | "intendencia"
        | "administracion"
        | "abastecimiento"
        | "mantenimiento"
        | "contabilidad"
        | "rrhh"
        | "direccion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "recepcion",
        "especialista",
        "administrativo",
        "dueno",
        "promotor",
        "enfermera",
        "intendencia",
        "mantenimiento",
        "asistente_admin",
        "contador",
        "rrhh",
        "empleado",
      ],
      appointment_status: [
        "programada",
        "confirmada",
        "cancelada",
        "completada",
        "no_asistio",
      ],
      fee_recurrence: ["unica", "semanal", "quincenal", "mensual"],
      invoice_status: ["pendiente", "verificada", "erronea", "cancelada"],
      medication_log_type: [
        "medicamento",
        "estudio",
        "consulta",
        "salida",
        "otro",
      ],
      payment_method: ["efectivo", "transferencia", "tarjeta"],
      payroll_area: [
        "enfermeria",
        "intendencia",
        "mantenimiento",
        "administrativo",
        "otro",
      ],
      payroll_frequency: ["semanal", "quincenal", "mensual"],
      payroll_status: ["borrador", "autorizada", "pagada", "cancelada"],
      requisition_priority: ["baja", "media", "alta", "urgente"],
      requisition_status: [
        "pendiente",
        "autorizada",
        "rechazada",
        "comprada",
        "pagada",
        "cancelada",
      ],
      requisition_type: [
        "medicamentos",
        "limpieza",
        "mantenimiento",
        "servicio_mantenimiento",
        "pago_proveedor",
      ],
      specialty_type: ["psiquiatra", "psicologo"],
      visit_status: ["en_espera", "en_consulta", "atendido", "cancelado"],
      work_area: [
        "enfermeria",
        "intendencia",
        "administracion",
        "abastecimiento",
        "mantenimiento",
        "contabilidad",
        "rrhh",
        "direccion",
      ],
    },
  },
} as const
