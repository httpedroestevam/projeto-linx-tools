export type Role = 'admin' | 'lideranca' | 'analista'
export type Capability = 'notices' | 'videos' | 'releases' | 'links'
export type ProfilePermissions = Record<Role, Capability[]>
export interface NoticeOption { id: string; label: string }
export interface NoticeOptions { categories: NoticeOption[]; priorities: NoticeOption[] }
export interface User { id: string; name: string; email: string; role: Role; active: boolean; permissions: Capability[]; created_at?: string }
export interface Tool { id: string; slug: string; name: string; description: string; category: string; icon: string; accent: string; status: string; featured: boolean; sort_order: number }
export interface Notice { id: string; title: string; body: string; category: string; priority: string; status: 'draft'|'published'; pinned: boolean; requires_ack: boolean; display_order: number; acknowledged?: boolean; published_at: string|null; expires_at: string|null; author_name?: string; created_at?: string; archived_at?: string|null }
export interface Video { id: string; title: string; description: string; category: string; provider: string; embed_url: string; external_url: string; created_at?: string }
export interface Release { id: string; title: string; product: string; version: string; summary: string; published_at: string; url: string; status: string; archived_at?: string|null }
export interface UsefulLink { id: string; title: string; url: string; category: string; description: string; status: string; archived_at?: string|null }
export interface PortalConfig { hero_title: string; hero_description: string; banner_text: string; banner_enabled: boolean }
