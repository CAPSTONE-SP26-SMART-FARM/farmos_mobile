export type DoctorType = 'internal' | 'partner' | 'coordinator'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface DoctorProfile {
  id: string
  userId: string
  doctorType: DoctorType
  licenseNumber: string
  licenseExpiryDate: string
  specialization: string
  bio: string | null
  yearsOfExperience: number | null
  isOnline: boolean
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DoctorRequest {
  id: string
  userId: string
  doctorProfileId: string
  title: string
  description: string
  registrationStatus: RegistrationStatus
  selfRegistered: boolean
  repliedBy: string | null
  repliedAt: string | null
  reason: string | null
  createdAt: string
  updatedAt: string
}

export interface DoctorRequestWithProfile extends DoctorRequest {
  doctorProfile: DoctorProfile
}

export type UpsertDoctorProfileRequest = {
  doctorType: DoctorType
  licenseNumber: string
  licenseExpiryDate: string
  specialization: string
  bio?: string
  yearsOfExperience?: number
}

export type SubmitDoctorRequestRequest = {
  title: string
  description: string
}

export type UpdateDoctorOnlineStatusRequest = {
  isOnline: boolean
}

export interface DoctorAssignment {
  id: string
  doctorId: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface DoctorAssignmentWithOwner extends DoctorAssignment {
  owner: {
    id: string
    fullName: string
    email: string
    phone: string | null
    avatarUrl: string | null
  }
}

export interface ListDoctorRequestsRes {
  data: DoctorRequest[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export interface ListDoctorAssignmentsRes {
  data: DoctorAssignmentWithOwner[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export type DoctorTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'

export interface DoctorDqsSnapshot {
  tier: DoctorTier
  totalScore: number
  ratingScore: number
  frequencyScore: number
  slaScore: number
  acceptanceScore: number
  onlineScore: number
  snapshotDate: string
}

export interface DoctorDqs {
  doctorId: string
  latest: DoctorDqsSnapshot | null
}
