export type OrgKind = 'private_clinic' | 'hospital';

export interface Service {
  id: string;
  name: string;
  suburb?: string;
  specialty?: string;
  orgKind: OrgKind;           // 'private_clinic' | 'hospital'
  createdAt: string;          // ISO date for "Recently Added"
  // future fields (Sprint 4): distanceKm?: number; timings?: { mon?: string; ... }
}