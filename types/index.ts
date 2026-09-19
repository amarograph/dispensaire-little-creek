export type Universe = 'redm';

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'datetime'
  | 'select'
  | 'checkbox'
  | 'multi_select'
  | 'table';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TemplateField {
  id: string;
  owner_id: string;
  template_id: string;
  key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options?: string[];
  table_columns?: TableColumn[];
  default_value?: string;
  sort_order: number;
  created_at: string;
}

export interface Template {
  id: string;
  owner_id: string;
  universe: Universe;
  name: string;
  slug: string;
  description?: string;
  body: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  template_fields?: TemplateField[];
}

export interface Archive {
  id: string;
  owner_id: string;
  universe: Universe;
  template_id?: string;
  template_name: string;
  patient_name: string;
  storage_path: string;
  filename: string;
  field_values: Record<string, unknown>;
  rendered_body?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  owner_id: string;
  universe: Universe;
  key: string;
  value?: string;
}

export interface Doc {
  id: string;
  owner_id: string;
  universe?: Universe;
  name: string;
  description?: string;
  storage_path: string;
  filename: string;
  file_size?: number;
  created_at: string;
}

export interface Page {
  id: string;
  owner_id: string;
  universe?: Universe;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}