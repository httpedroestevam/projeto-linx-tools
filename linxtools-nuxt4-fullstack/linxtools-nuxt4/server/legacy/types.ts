export type ProfileRole = 'admin' | 'lideranca' | 'analista';
export type Capability = 'notices' | 'videos' | 'releases' | 'links';
export type PublicationStatus = 'draft' | 'published';
export type InputRecord = Record<string, unknown>;

export function isInputRecord(value: unknown): value is InputRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export interface NoticeOption {
  id: string;
  label: string;
}

export interface NoticeOptions {
  categories: NoticeOption[];
  priorities: NoticeOption[];
}

export type ProfilePermissions = Record<ProfileRole, Capability[]>;

export interface ToolRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  accent: string;
  status: 'ready';
  featured: boolean;
  sort_order: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: ProfileRole;
  active?: boolean;
  permissions?: Capability[];
  password_hash?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionRecord {
  user_id: string;
  token_hash: string;
  expires_at: string;
}

export interface NoticeRecord {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  status: PublicationStatus;
  display_order?: number;
  published_at?: string | null;
  expires_at?: string | null;
  archived_at?: string | null;
  pinned?: boolean;
  requires_ack?: boolean;
  acknowledgements?: string[];
  author_id?: string;
  author_name?: string;
  acknowledged?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReleaseRecord {
  id: string;
  title: string;
  product: string;
  summary: string;
  version: string;
  url: string;
  status: PublicationStatus;
  published_at?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LinkRecord {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  status: PublicationStatus;
  display_order?: number;
  published_at?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  provider: 'youtube' | 'vimeo';
  provider_id: string;
  status: PublicationStatus;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  external_url?: string;
  embed_url?: string;
}

export interface IdeaRecord {
  id: string;
  title: string;
  description: string;
  role: string;
  created_at: string;
}

export interface IdeaInput {
  title: string;
  description: string;
  role: string;
}

export type NoticeInput = Omit<NoticeRecord, 'id' | 'display_order' | 'acknowledgements'>;
export type VideoInput = Omit<VideoRecord, 'id' | 'created_at' | 'updated_at'>;

export interface PortalSettings {
  hero_title: string;
  hero_description: string;
  banner_text: string;
  banner_enabled: boolean;
}

export interface LocalDatabase {
  tools: ToolRecord[];
  releases: ReleaseRecord[];
  ideas: IdeaRecord[];
  users: UserRecord[];
  sessions: SessionRecord[];
  notices: NoticeRecord[];
  videos: VideoRecord[];
  links?: LinkRecord[];
  portal?: Partial<PortalSettings>;
  profile_permissions?: unknown;
  notice_options?: unknown;
}

export interface HttpRequest {
  headers: Record<string, string | string[] | undefined> & {
    host?: string;
    cookie?: string;
    origin?: string;
    'x-forwarded-proto'?: string;
    'content-length'?: string;
  };
  socket: { encrypted?: boolean };
  [Symbol.asyncIterator](): AsyncIterator<Buffer | string>;
}

export interface SupabaseQueryOptions {
  filters?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  single?: boolean;
  upsert?: boolean;
}

export interface SupabaseRecord extends InputRecord {
  id?: string;
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
  published_at?: string | null;
  status?: PublicationStatus;
  display_order?: number;
  notice_id?: string;
  requires_ack?: boolean;
  token_hash?: string;
  expires_at?: string;
  user_id?: string;
  profile_permissions?: unknown;
  notice_options?: unknown;
}

export interface SupabaseQuery {
  <T extends SupabaseRecord = SupabaseRecord>(
    table: string,
    options: SupabaseQueryOptions & { single: true },
  ): Promise<T | null>;
  <T extends SupabaseRecord = SupabaseRecord>(
    table: string,
    options?: SupabaseQueryOptions,
  ): Promise<T[]>;
}
