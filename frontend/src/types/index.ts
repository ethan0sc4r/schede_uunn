export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface NavalUnit {
  id: number;
  name: string;
  unit_class: string;
  nation?: string;
  logo_path?: string;
  silhouette_path?: string;
  flag_path?: string;
  background_color: string;
  layout_config?: Record<string, any>;
  silhouette_zoom: string;
  silhouette_position_x: string;
  silhouette_position_y: string;
  template_name?: string;
  template_id?: string;
  notes?: string; // Rich text notes field
  created_by: number;
  creator?: User; // User who created this unit
  created_at: string;
  updated_at?: string;
  characteristics: UnitCharacteristic[];
}

export interface UnitCharacteristic {
  id: number;
  naval_unit_id: number;
  characteristic_name: string;
  characteristic_value: string;
  order_index: number;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  parent_group_id?: number;
  logo_path?: string;
  flag_path?: string;
  template_logo_path?: string;
  template_flag_path?: string;
  override_logo: boolean;
  override_flag: boolean;
  presentation_config?: PresentationConfig;
  created_by: number;
  created_at: string;
  updated_at?: string;
  naval_units: NavalUnit[];
  subgroups?: Group[];
}

export interface PresentationConfig {
  mode: 'single' | 'grid';
  interval?: number; // seconds for single mode
  grid_rows?: number;
  grid_cols?: number;
  auto_advance?: boolean;
  page_duration?: number; // seconds for grid mode
}

export interface CreateNavalUnitRequest {
  name: string;
  unit_class: string;
  nation?: string;
  background_color?: string;
  layout_config?: Record<string, any>;
  silhouette_zoom?: string;
  silhouette_position_x?: string;
  silhouette_position_y?: string;
  characteristics: CreateCharacteristicRequest[];
}

export interface CreateCharacteristicRequest {
  characteristic_name: string;
  characteristic_value: string;
  order_index: number;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  parent_group_id?: number;
  naval_unit_ids: number[];
  template_logo_path?: string;
  template_flag_path?: string;
  override_logo?: boolean;
  override_flag?: boolean;
  presentation_config?: PresentationConfig;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface SearchResponse {
  naval_units: NavalUnit[];
  total_count: number;
}

export interface FileUploadResponse {
  message: string;
  file_path: string;
}

export interface ApiError {
  detail: string;
}