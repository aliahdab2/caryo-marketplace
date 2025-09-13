export interface CarBrand {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  isActive: boolean;
}

export interface CarModel {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  brandId: number;
  brand: CarBrand;
  isActive: boolean;
}

export interface DataStatistics {
  totalBrands: number;
  activeBrands: number;
  totalModels: number;
  activeModels: number;
}

export interface ImportResult {
  success: boolean;
  message: string;
  data?: string;
}

export type TabType = 'manual' | 'review' | 'sync' | 'overview';

export interface EditForm {
  name?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  isActive?: boolean;
  brandId?: string;
}

export interface AddForm {
  name?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  brandId?: string;
}

export interface SyncStatusItem {
  allowed: boolean;
  message: string;
  lastSyncTime?: string;
  hoursSinceLastSync?: number;
}

export interface SyncStatus {
  carquery?: SyncStatusItem;
  syriancars?: SyncStatusItem;
}

export interface TabConfig {
  id: TabType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface UpdateBrandData {
  name?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  isActive?: boolean;
}

export interface UpdateModelData {
  name?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  isActive?: boolean;
  brandId?: string;
}

export interface CreateBrandData {
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface CreateModelData {
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  brandId?: string;
}
