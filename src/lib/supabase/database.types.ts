export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_usage: {
        Row: {
          cached_input_tokens: number;
          chat_id: string | null;
          cost_usd: number;
          created_at: string;
          estimated: boolean;
          id: string;
          input_tokens: number;
          model_id: string;
          output_tokens: number;
          owner: string;
          reply_id: string | null;
          task: string;
        };
        ComputedFields: never;
        Insert: {
          cached_input_tokens?: number;
          chat_id?: string | null;
          cost_usd: number;
          created_at?: string;
          estimated?: boolean;
          id?: string;
          input_tokens: number;
          model_id: string;
          output_tokens: number;
          owner?: string;
          reply_id?: string | null;
          task: string;
        };
        Update: {
          cached_input_tokens?: number;
          chat_id?: string | null;
          cost_usd?: number;
          created_at?: string;
          estimated?: boolean;
          id?: string;
          input_tokens?: number;
          model_id?: string;
          output_tokens?: number;
          owner?: string;
          reply_id?: string | null;
          task?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          check: string | null;
          created_at: string;
          help: string;
          id: string;
          kc_id: string;
          owner: string;
          question_id: string;
          result: string;
          session_id: string;
        };
        ComputedFields: never;
        Insert: {
          check?: string | null;
          created_at?: string;
          help: string;
          id?: string;
          kc_id: string;
          owner?: string;
          question_id: string;
          result: string;
          session_id: string;
        };
        Update: {
          check?: string | null;
          created_at?: string;
          help?: string;
          id?: string;
          kc_id?: string;
          owner?: string;
          question_id?: string;
          result?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_kc_id_fkey";
            columns: ["kc_id"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempts_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "study_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      brief_excluded_materials: {
        Row: {
          course_id: string;
          material_id: string;
          owner: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          material_id: string;
          owner?: string;
        };
        Update: {
          course_id?: string;
          material_id?: string;
          owner?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brief_excluded_materials_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "briefs";
            referencedColumns: ["course_id"];
          },
          {
            foreignKeyName: "brief_excluded_materials_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brief_excluded_materials_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      brief_messages: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          model_id: string | null;
          owner: string;
          parts: NonNullable<Json>;
          role: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          model_id?: string | null;
          owner?: string;
          parts: NonNullable<Json>;
          role: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          model_id?: string | null;
          owner?: string;
          parts?: NonNullable<Json>;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brief_messages_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "briefs";
            referencedColumns: ["course_id"];
          },
          {
            foreignKeyName: "brief_messages_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      briefs: {
        Row: {
          calculator: boolean | null;
          course_id: string;
          created_at: string;
          exam_date: string | null;
          formula_sheet: boolean | null;
          goal: string | null;
          notes: string | null;
          notes_updated_at: string | null;
          open_book: boolean | null;
          owner: string;
          reserved_exam_answered: boolean;
          reserved_exam_id: string | null;
          scope_confirmed: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          calculator?: boolean | null;
          course_id: string;
          created_at?: string;
          exam_date?: string | null;
          formula_sheet?: boolean | null;
          goal?: string | null;
          notes?: string | null;
          notes_updated_at?: string | null;
          open_book?: boolean | null;
          owner?: string;
          reserved_exam_answered?: boolean;
          reserved_exam_id?: string | null;
          scope_confirmed?: boolean;
          updated_at?: string;
        };
        Update: {
          calculator?: boolean | null;
          course_id?: string;
          created_at?: string;
          exam_date?: string | null;
          formula_sheet?: boolean | null;
          goal?: string | null;
          notes?: string | null;
          notes_updated_at?: string | null;
          open_book?: boolean | null;
          owner?: string;
          reserved_exam_answered?: boolean;
          reserved_exam_id?: string | null;
          scope_confirmed?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "briefs_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: true;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "briefs_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "briefs_reserved_exam_id_fkey";
            columns: ["reserved_exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          chat_id: string;
          created_at: string;
          id: string;
          model_id: string | null;
          parts: NonNullable<Json>;
          role: string;
          stopped: boolean;
          tutor_context: Json | null;
        };
        ComputedFields: never;
        Insert: {
          chat_id: string;
          created_at?: string;
          id?: string;
          model_id?: string | null;
          parts: NonNullable<Json>;
          role: string;
          stopped?: boolean;
          tutor_context?: Json | null;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          id?: string;
          model_id?: string | null;
          parts?: NonNullable<Json>;
          role?: string;
          stopped?: boolean;
          tutor_context?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      chats: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          last_message_at: string;
          latest_reply_id: string | null;
          owner: string;
          title: string | null;
          title_set_manually: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          latest_reply_id?: string | null;
          owner?: string;
          title?: string | null;
          title_set_manually?: boolean;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          latest_reply_id?: string | null;
          owner?: string;
          title?: string | null;
          title_set_manually?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chats_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chats_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chunks: {
        Row: {
          course_id: string;
          created_at: string;
          embedding: string | null;
          heading: string | null;
          id: string;
          label: string;
          markdown: string;
          material_id: string;
          owner: string;
          page_from: number;
          page_to: number;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          embedding?: string | null;
          heading?: string | null;
          id?: string;
          label: string;
          markdown: string;
          material_id: string;
          owner: string;
          page_from: number;
          page_to: number;
          position: number;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          embedding?: string | null;
          heading?: string | null;
          id?: string;
          label?: string;
          markdown?: string;
          material_id?: string;
          owner?: string;
          page_from?: number;
          page_to?: number;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "chunks_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chunks_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chunks_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          created_at: string;
          id: string;
          language: string | null;
          name: string;
          owner: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          language?: string | null;
          name: string;
          owner?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          language?: string | null;
          name?: string;
          owner?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      developer_flags: {
        Row: {
          app_commit: string | null;
          case_id: string | null;
          chat_id: string | null;
          course_id: string | null;
          created_at: string;
          finished_at: string | null;
          id: string;
          note: string;
          owner: string;
        };
        ComputedFields: never;
        Insert: {
          app_commit?: string | null;
          case_id?: string | null;
          chat_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          note?: string;
          owner: string;
        };
        Update: {
          app_commit?: string | null;
          case_id?: string | null;
          chat_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          note?: string;
          owner?: string;
        };
        Relationships: [
          {
            foreignKeyName: "developer_flags_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "developer_flags_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "developer_flags_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      developers: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "developers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_results: {
        Row: {
          course_id: string;
          created_at: string;
          exam_date: string;
          grade: string | null;
          id: string;
          owner: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          exam_date: string;
          grade?: string | null;
          id?: string;
          owner?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          exam_date?: string;
          grade?: string | null;
          id?: string;
          owner?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_results_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_results_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_scopes: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          owner: string;
          scope: string;
          topic_id: string;
          words: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          owner: string;
          scope: string;
          topic_id: string;
          words: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          owner?: string;
          scope?: string;
          topic_id?: string;
          words?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_scopes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_scopes_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_scopes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      exams: {
        Row: {
          asked: boolean;
          confirmed: boolean | null;
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          owner: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          asked?: boolean;
          confirmed?: boolean | null;
          course_id: string;
          created_at?: string;
          id?: string;
          name: string;
          owner: string;
          position: number;
        };
        Update: {
          asked?: boolean;
          confirmed?: boolean | null;
          course_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          owner?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_chunks: {
        Row: {
          chunk_id: string;
          course_id: string;
          exercise_id: string;
          owner: string;
          position: number;
          role: string;
        };
        ComputedFields: never;
        Insert: {
          chunk_id: string;
          course_id: string;
          exercise_id: string;
          owner: string;
          position: number;
          role: string;
        };
        Update: {
          chunk_id?: string;
          course_id?: string;
          exercise_id?: string;
          owner?: string;
          position?: number;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_chunks_chunk_id_fkey";
            columns: ["chunk_id"];
            isOneToOne: true;
            referencedRelation: "chunks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_chunks_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_chunks_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_chunks_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_kcs: {
        Row: {
          course_id: string;
          exercise_id: string;
          kc_id: string;
          owner: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          exercise_id: string;
          kc_id: string;
          owner: string;
        };
        Update: {
          course_id?: string;
          exercise_id?: string;
          kc_id?: string;
          owner?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_kcs_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_kcs_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_kcs_kc_id_fkey";
            columns: ["kc_id"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_kcs_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          course_id: string;
          created_at: string;
          difficulty: number;
          exam_id: string | null;
          final_answers: Json | null;
          id: string;
          owner: string;
          position: number;
          question_chunk_id: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          difficulty: number;
          exam_id?: string | null;
          final_answers?: Json | null;
          id?: string;
          owner: string;
          position: number;
          question_chunk_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          difficulty?: number;
          exam_id?: string | null;
          final_answers?: Json | null;
          id?: string;
          owner?: string;
          position?: number;
          question_chunk_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_question_chunk_id_fkey";
            columns: ["question_chunk_id"];
            isOneToOne: true;
            referencedRelation: "chunks";
            referencedColumns: ["id"];
          },
        ];
      };
      kc_sources: {
        Row: {
          chunk_id: string;
          course_id: string;
          kc_id: string;
          owner: string;
        };
        ComputedFields: never;
        Insert: {
          chunk_id: string;
          course_id: string;
          kc_id: string;
          owner: string;
        };
        Update: {
          chunk_id?: string;
          course_id?: string;
          kc_id?: string;
          owner?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kc_sources_chunk_id_fkey";
            columns: ["chunk_id"];
            isOneToOne: false;
            referencedRelation: "chunks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kc_sources_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kc_sources_kc_id_fkey";
            columns: ["kc_id"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kc_sources_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      kcs: {
        Row: {
          assumes: NonNullable<Json>;
          course_id: string;
          created_at: string;
          description: string;
          embedding: string | null;
          id: string;
          name: string;
          origin: string;
          owner: string;
          position: number;
          retired_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          assumes?: NonNullable<Json>;
          course_id: string;
          created_at?: string;
          description: string;
          embedding?: string | null;
          id?: string;
          name: string;
          origin: string;
          owner: string;
          position: number;
          retired_at?: string | null;
        };
        Update: {
          assumes?: NonNullable<Json>;
          course_id?: string;
          created_at?: string;
          description?: string;
          embedding?: string | null;
          id?: string;
          name?: string;
          origin?: string;
          owner?: string;
          position?: number;
          retired_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kcs_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kcs_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_map_builds: {
        Row: {
          app_commit: string | null;
          check_report: Json | null;
          course_id: string;
          exercise_grouping_hash: string | null;
          exercise_groups: Json | null;
          failure_reason: string | null;
          finished_at: string | null;
          heartbeat_at: string;
          needs_update: boolean;
          owner: string;
          progress: Json | null;
          started_at: string;
          status: string;
          topic_tree_hash: string | null;
        };
        ComputedFields: never;
        Insert: {
          app_commit?: string | null;
          check_report?: Json | null;
          course_id: string;
          exercise_grouping_hash?: string | null;
          exercise_groups?: Json | null;
          failure_reason?: string | null;
          finished_at?: string | null;
          heartbeat_at?: string;
          needs_update?: boolean;
          owner: string;
          progress?: Json | null;
          started_at?: string;
          status: string;
          topic_tree_hash?: string | null;
        };
        Update: {
          app_commit?: string | null;
          check_report?: Json | null;
          course_id?: string;
          exercise_grouping_hash?: string | null;
          exercise_groups?: Json | null;
          failure_reason?: string | null;
          finished_at?: string | null;
          heartbeat_at?: string;
          needs_update?: boolean;
          owner?: string;
          progress?: Json | null;
          started_at?: string;
          status?: string;
          topic_tree_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_map_builds_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: true;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_map_builds_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      material_pages: {
        Row: {
          created_at: string;
          id: string;
          language: string | null;
          material_id: string;
          notes: string | null;
          owner: string;
          page_number: number;
          skipped: string | null;
          units: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          language?: string | null;
          material_id: string;
          notes?: string | null;
          owner: string;
          page_number: number;
          skipped?: string | null;
          units: NonNullable<Json>;
        };
        Update: {
          created_at?: string;
          id?: string;
          language?: string | null;
          material_id?: string;
          notes?: string | null;
          owner?: string;
          page_number?: number;
          skipped?: string | null;
          units?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "material_pages_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_pages_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          course_id: string;
          created_at: string;
          heartbeat_at: string;
          id: string;
          language: string | null;
          media_type: string;
          name: string;
          notes: string | null;
          owner: string;
          pages_done: number;
          pages_total: number | null;
          parse_failure: string | null;
          parse_start_failed: boolean;
          parse_status: string;
          position: number;
          size_bytes: number;
          storage_path: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          heartbeat_at?: string;
          id?: string;
          language?: string | null;
          media_type: string;
          name: string;
          notes?: string | null;
          owner?: string;
          pages_done?: number;
          pages_total?: number | null;
          parse_failure?: string | null;
          parse_start_failed?: boolean;
          parse_status?: string;
          position?: number;
          size_bytes: number;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          heartbeat_at?: string;
          id?: string;
          language?: string | null;
          media_type?: string;
          name?: string;
          notes?: string | null;
          owner?: string;
          pages_done?: number;
          pages_total?: number | null;
          parse_failure?: string | null;
          parse_start_failed?: boolean;
          parse_status?: string;
          position?: number;
          size_bytes?: number;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "materials_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memories: {
        Row: {
          course_id: string;
          owner: string;
          text: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          owner?: string;
          text?: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          owner?: string;
          text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memories_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: true;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memories_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_exams: {
        Row: {
          brier: number | null;
          course_id: string;
          created_at: string;
          duration_minutes: number | null;
          failure: string | null;
          gaps_done: number;
          gaps_total: number;
          graded_at: string | null;
          grading_started_at: string | null;
          id: string;
          owner: string;
          predicted_score: number | null;
          reserved_exam_id: string | null;
          score: number | null;
          session_id: string | null;
          started_at: string | null;
          status: string;
          submitted_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          brier?: number | null;
          course_id: string;
          created_at?: string;
          duration_minutes?: number | null;
          failure?: string | null;
          gaps_done?: number;
          gaps_total?: number;
          graded_at?: string | null;
          grading_started_at?: string | null;
          id?: string;
          owner: string;
          predicted_score?: number | null;
          reserved_exam_id?: string | null;
          score?: number | null;
          session_id?: string | null;
          started_at?: string | null;
          status?: string;
          submitted_at?: string | null;
        };
        Update: {
          brier?: number | null;
          course_id?: string;
          created_at?: string;
          duration_minutes?: number | null;
          failure?: string | null;
          gaps_done?: number;
          gaps_total?: number;
          graded_at?: string | null;
          grading_started_at?: string | null;
          id?: string;
          owner?: string;
          predicted_score?: number | null;
          reserved_exam_id?: string | null;
          score?: number | null;
          session_id?: string | null;
          started_at?: string | null;
          status?: string;
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mock_exams_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_exams_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_exams_reserved_exam_id_fkey";
            columns: ["reserved_exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_exams_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "study_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_items: {
        Row: {
          check: string | null;
          exercise_id: string | null;
          graded_at: string | null;
          id: string;
          mock_id: string;
          owner: string;
          points: number;
          points_awarded: number | null;
          position: number;
          predicted_success: number;
          problem_id: string | null;
          prompt: string;
          question_id: string | null;
          steps: Json | null;
          topic_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          check?: string | null;
          exercise_id?: string | null;
          graded_at?: string | null;
          id?: string;
          mock_id: string;
          owner: string;
          points: number;
          points_awarded?: number | null;
          position: number;
          predicted_success: number;
          problem_id?: string | null;
          prompt: string;
          question_id?: string | null;
          steps?: Json | null;
          topic_id?: string | null;
        };
        Update: {
          check?: string | null;
          exercise_id?: string | null;
          graded_at?: string | null;
          id?: string;
          mock_id?: string;
          owner?: string;
          points?: number;
          points_awarded?: number | null;
          position?: number;
          predicted_success?: number;
          problem_id?: string | null;
          prompt?: string;
          question_id?: string | null;
          steps?: Json | null;
          topic_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mock_items_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_items_mock_id_fkey";
            columns: ["mock_id"];
            isOneToOne: false;
            referencedRelation: "mock_exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_items_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_items_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_items_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mock_items_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      prerequisite_links: {
        Row: {
          course_id: string;
          from_kc: string;
          id: string;
          owner: string;
          to_kc: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          from_kc: string;
          id?: string;
          owner: string;
          to_kc: string;
        };
        Update: {
          course_id?: string;
          from_kc?: string;
          id?: string;
          owner?: string;
          to_kc?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prerequisite_links_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prerequisite_links_from_kc_fkey";
            columns: ["from_kc"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prerequisite_links_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prerequisite_links_to_kc_fkey";
            columns: ["to_kc"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_kcs: {
        Row: {
          course_id: string;
          kc_id: string;
          owner: string;
          problem_id: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          kc_id: string;
          owner: string;
          problem_id: string;
        };
        Update: {
          course_id?: string;
          kc_id?: string;
          owner?: string;
          problem_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_kcs_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_kcs_kc_id_fkey";
            columns: ["kc_id"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_kcs_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_kcs_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_runs: {
        Row: {
          course_id: string;
          owner: string;
          started_at: string;
          status: string;
          stock: string;
          topic_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          owner: string;
          started_at?: string;
          status: string;
          stock: string;
          topic_id?: string | null;
        };
        Update: {
          course_id?: string;
          owner?: string;
          started_at?: string;
          status?: string;
          stock?: string;
          topic_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "problem_runs_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: true;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_runs_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_runs_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      problems: {
        Row: {
          course_id: string;
          created_at: string;
          difficulty: number;
          failure: string | null;
          final_answers: Json | null;
          flag: string | null;
          flagged_at: string | null;
          id: string;
          original_exercise_id: string | null;
          owner: string;
          program: string | null;
          solution: string | null;
          source: string;
          statement: string | null;
          status: string;
          topic_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          difficulty: number;
          failure?: string | null;
          final_answers?: Json | null;
          flag?: string | null;
          flagged_at?: string | null;
          id?: string;
          original_exercise_id?: string | null;
          owner: string;
          program?: string | null;
          solution?: string | null;
          source: string;
          statement?: string | null;
          status?: string;
          topic_id?: string | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          difficulty?: number;
          failure?: string | null;
          final_answers?: Json | null;
          flag?: string | null;
          flagged_at?: string | null;
          id?: string;
          original_exercise_id?: string | null;
          owner?: string;
          program?: string | null;
          solution?: string | null;
          source?: string;
          statement?: string | null;
          status?: string;
          topic_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "problems_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problems_original_exercise_id_fkey";
            columns: ["original_exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problems_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problems_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_kcs: {
        Row: {
          kc_id: string;
          question_id: string;
        };
        ComputedFields: never;
        Insert: {
          kc_id: string;
          question_id: string;
        };
        Update: {
          kc_id?: string;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_kcs_kc_id_fkey";
            columns: ["kc_id"];
            isOneToOne: false;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_kcs_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          answer_message_id: string | null;
          answer_text: string | null;
          answered_at: string | null;
          asked_at: string;
          confidence: number | null;
          exercise_id: string | null;
          graded_at: string | null;
          id: string;
          owner: string;
          problem_id: string | null;
          prompt: string;
          session_id: string;
        };
        ComputedFields: never;
        Insert: {
          answer_message_id?: string | null;
          answer_text?: string | null;
          answered_at?: string | null;
          asked_at?: string;
          confidence?: number | null;
          exercise_id?: string | null;
          graded_at?: string | null;
          id?: string;
          owner?: string;
          problem_id?: string | null;
          prompt: string;
          session_id: string;
        };
        Update: {
          answer_message_id?: string | null;
          answer_text?: string | null;
          answered_at?: string | null;
          asked_at?: string;
          confidence?: number | null;
          exercise_id?: string | null;
          graded_at?: string | null;
          id?: string;
          owner?: string;
          problem_id?: string | null;
          prompt?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_answer_message_id_fkey";
            columns: ["answer_message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "study_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      study_sessions: {
        Row: {
          chat_id: string | null;
          close_started_at: string | null;
          closed_at: string | null;
          course_id: string;
          ended_at: string | null;
          id: string;
          mock_id: string | null;
          owner: string;
          planned_minutes: number | null;
          rating: number | null;
          rating_note: string | null;
          started_at: string;
        };
        ComputedFields: never;
        Insert: {
          chat_id?: string | null;
          close_started_at?: string | null;
          closed_at?: string | null;
          course_id: string;
          ended_at?: string | null;
          id?: string;
          mock_id?: string | null;
          owner: string;
          planned_minutes?: number | null;
          rating?: number | null;
          rating_note?: string | null;
          started_at?: string;
        };
        Update: {
          chat_id?: string | null;
          close_started_at?: string | null;
          closed_at?: string | null;
          course_id?: string;
          ended_at?: string | null;
          id?: string;
          mock_id?: string | null;
          owner?: string;
          planned_minutes?: number | null;
          rating?: number | null;
          rating_note?: string | null;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: true;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_sessions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_sessions_mock_id_fkey";
            columns: ["mock_id"];
            isOneToOne: false;
            referencedRelation: "mock_exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_sessions_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_choices: {
        Row: {
          choice: string;
          created_at: string;
          owner: string;
          topic_id: string;
        };
        ComputedFields: never;
        Insert: {
          choice: string;
          created_at?: string;
          owner?: string;
          topic_id: string;
        };
        Update: {
          choice?: string;
          created_at?: string;
          owner?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_choices_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topic_choices_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_kcs: {
        Row: {
          kc_id: string;
          owner: string;
          position: number;
          topic_id: string;
        };
        ComputedFields: never;
        Insert: {
          kc_id: string;
          owner: string;
          position: number;
          topic_id: string;
        };
        Update: {
          kc_id?: string;
          owner?: string;
          position?: number;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_kcs_kc_id_fkey";
            columns: ["kc_id"];
            isOneToOne: true;
            referencedRelation: "kcs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topic_kcs_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topic_kcs_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_notes: {
        Row: {
          owner: string;
          text: string;
          topic_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          owner: string;
          text: string;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          owner?: string;
          text?: string;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_notes_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topic_notes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: true;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          central_question: string | null;
          course_id: string;
          created_at: string;
          id: string;
          name: string;
          owner: string;
          parent_id: string | null;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          central_question?: string | null;
          course_id: string;
          created_at?: string;
          id?: string;
          name: string;
          owner: string;
          parent_id?: string | null;
          position: number;
        };
        Update: {
          central_question?: string | null;
          course_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          owner?: string;
          parent_id?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "topics_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      unit_extractions: {
        Row: {
          assumes_matched: boolean;
          batch: number;
          content_hash: string;
          course_id: string;
          created_at: string;
          id: string;
          kc_ids: string[] | null;
          kind: string;
          material_id: string;
          output: NonNullable<Json>;
          owner: string;
          prompt_digest: string | null;
        };
        ComputedFields: never;
        Insert: {
          assumes_matched?: boolean;
          batch: number;
          content_hash: string;
          course_id: string;
          created_at?: string;
          id?: string;
          kc_ids?: string[] | null;
          kind: string;
          material_id: string;
          output: NonNullable<Json>;
          owner: string;
          prompt_digest?: string | null;
        };
        Update: {
          assumes_matched?: boolean;
          batch?: number;
          content_hash?: string;
          course_id?: string;
          created_at?: string;
          id?: string;
          kc_ids?: string[] | null;
          kind?: string;
          material_id?: string;
          output?: NonNullable<Json>;
          owner?: string;
          prompt_digest?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chapter_extractions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chapter_extractions_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "unit_extractions_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_brief_note: {
        Args: { course_id: string; text: string };
        Returns: boolean;
      };
      alike_kcs: {
        Args: { p_count: number; p_course_id: string; p_similarity: number };
        Returns: {
          a: string;
          b: string;
          similarity: number;
        }[];
      };
      append_memory: {
        Args: { course_id: string; text: string };
        Returns: boolean;
      };
      arrange_knowledge_map: {
        Args: {
          p_check_report?: Json;
          p_course_id: string;
          p_dropped_prerequisites?: Json;
          p_kcs: Json;
          p_topic_tree_hash: string;
          p_topics: Json;
        };
        Returns: boolean;
      };
      clear_unit_sources: {
        Args: { p_chunk_ids: string[]; p_course_id: string };
        Returns: boolean;
      };
      course_build_snapshot: { Args: { p_course_id: string }; Returns: Json };
      match_chunks: {
        Args: { p_count: number; p_course_id: string; p_embedding: string };
        Returns: {
          distance: number;
          id: string;
        }[];
      };
      match_kcs: {
        Args: {
          p_count: number;
          p_course_id: string;
          p_embedding: string;
          p_retired?: boolean;
        };
        Returns: {
          id: string;
          similarity: number;
        }[];
      };
      move_material: {
        Args: { p_direction: string; p_material_id: string };
        Returns: boolean;
      };
      queue_knowledge_map_build: {
        Args: { course_id: string };
        Returns: boolean;
      };
      queue_material_parse: { Args: { material_id: string }; Returns: boolean };
      queue_mock_exam: {
        Args: { p_course_id: string };
        Returns: {
          mock_id: string;
          queued: boolean;
        }[];
      };
      queue_problem_run: {
        Args: { p_course_id: string; p_topic_id?: string };
        Returns: boolean;
      };
      record_knowledge_map_build_start_failure: {
        Args: { course_id: string };
        Returns: boolean;
      };
      record_parse_start_failure: {
        Args: { material_id: string };
        Returns: boolean;
      };
      release_mock_exam: { Args: { p_mock_id: string }; Returns: boolean };
      release_problem_run: { Args: { p_course_id: string }; Returns: boolean };
      replace_material_chunks: {
        Args: { p_chunks: Json; p_material_id: string };
        Returns: undefined;
      };
      restart_mock_grading: { Args: { p_mock_id: string }; Returns: boolean };
      retire_unsourced_kcs: { Args: { p_course_id: string }; Returns: number };
      save_brief: {
        Args: {
          asked_exam_ids?: string[];
          course_id: string;
          course_language?: string;
          exam_ids?: string[];
          excluded_material_ids?: string[];
          fields?: Json;
        };
        Returns: boolean;
      };
      set_chunk_embeddings: {
        Args: { p_embeddings: Json };
        Returns: undefined;
      };
      set_exam_scope: {
        Args: {
          course_id: string;
          scope?: string;
          topic_id: string;
          words?: string;
        };
        Returns: boolean;
      };
      set_exercise_exams: {
        Args: { p_course_id: string; p_exercises: Json };
        Returns: undefined;
      };
      set_session_minutes: {
        Args: { p_chat_id: string; p_minutes: number };
        Returns: boolean;
      };
      set_session_mock: {
        Args: { p_chat_id: string; p_mock_id: string };
        Returns: boolean;
      };
      start_mock_exam: { Args: { p_mock_id: string }; Returns: boolean };
      store_assumed_prerequisites: {
        Args: {
          p_assumes: Json;
          p_course_id: string;
          p_extraction_ids: string[];
          p_matched: Json;
          p_prerequisites: Json;
        };
        Returns: boolean;
      };
      store_session_close: {
        Args: {
          p_condensed_memory?: string;
          p_memory_lines: string[];
          p_memory_read_at?: string;
          p_session_id: string;
          p_topic_notes?: Json;
        };
        Returns: boolean;
      };
      store_unit_kcs: {
        Args: {
          p_course_id: string;
          p_kcs: Json;
          p_prerequisites: Json;
          p_units: Json;
        };
        Returns: boolean;
      };
      submit_mock_exam: { Args: { p_mock_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
