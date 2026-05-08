import { apiClient } from './client'
import type {
  DoctorProfile,
  DoctorRequest,
  DoctorRequestWithProfile,
  ListDoctorRequestsRes,
  ListDoctorAssignmentsRes,
  UpsertDoctorProfileRequest,
  SubmitDoctorRequestRequest,
  UpdateDoctorOnlineStatusRequest,
  DoctorDqs,
} from '@/types/doctor'

export const doctorApi = {
  // Upsert doctor profile
  upsertProfile: (body: UpsertDoctorProfileRequest) =>
    apiClient
      .post<{ data: DoctorProfile }>('/doctor-profile/upsert', body)
      .then((r) => r.data.data),

  // Submit doctor registration request
  submitRequest: (body: SubmitDoctorRequestRequest) =>
    apiClient
      .post<{ data: DoctorRequest }>('/doctor-profile/request', body)
      .then((r) => r.data.data),

  // Get my doctor requests (paginated)
  listMyRequests: (page = 1, limit = 20) =>
    apiClient
      .get<{ data: ListDoctorRequestsRes }>(
        `/doctor-profile/my-requests?page=${page}&limit=${limit}`
      )
      .then((r) => r.data.data),

  // Get doctor request detail
  getMyRequestDetail: (id: string) =>
    apiClient
      .get<{ data: DoctorRequestWithProfile }>(`/doctor-profile/my-requests/${id}`)
      .then((r) => r.data.data),

  // Get my doctor profile
  getMyProfile: () =>
    apiClient
      .get<{ data: DoctorProfile }>('/doctor-profile/me')
      .then((r) => r.data.data),

  // Update doctor online status
  updateOnlineStatus: (body: UpdateDoctorOnlineStatusRequest) =>
    apiClient
      .put<{ data: DoctorProfile }>('/doctor-profile/online-status', body)
      .then((r) => r.data.data),

  // List doctor assignments (owners assigned to me)
  listMyAssignments: (page = 1, limit = 20) =>
    apiClient
      .get<{ data: ListDoctorAssignmentsRes }>(
        `/doctor-assignment/doctor/my-assignments?page=${page}&limit=${limit}`
      )
      .then((r) => r.data.data),

  // Get assignment detail
  getMyAssignmentDetail: (id: string) =>
    apiClient
      .get<{ data: any }>(`/doctor-assignment/doctor/my-assignments/${id}`)
      .then((r) => r.data.data),

  getDqs: () =>
    apiClient
      .get<{ data: DoctorDqs }>('/doctor/me/dqs')
      .then((r) => r.data.data),
}
