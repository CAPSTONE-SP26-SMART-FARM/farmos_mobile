import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { doctorApi } from '@/services/api/doctor'
import { incidentApi } from '@/services/api/incident'
import type {
  UpsertDoctorProfileRequest,
  SubmitDoctorRequestRequest,
  UpdateDoctorOnlineStatusRequest,
} from '@/types/doctor'

// Get my doctor profile
export function useDoctorProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.doctor.myProfile,
    queryFn: () => doctorApi.getMyProfile(),
    retry: 1,
    enabled,
  })
}

// Upsert doctor profile
export function useUpsertDoctorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertDoctorProfileRequest) => doctorApi.upsertProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.doctor.myProfile })
      qc.invalidateQueries({ queryKey: queryKeys.doctor.myRequests() })
    },
  })
}

// Submit doctor registration request
export function useSubmitDoctorRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitDoctorRequestRequest) => doctorApi.submitRequest(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.doctor.myRequests() })
    },
  })
}

// List doctor requests
export function useDoctorRequestsList(page = 1) {
  return useQuery({
    queryKey: queryKeys.doctor.myRequests(page),
    queryFn: () => doctorApi.listMyRequests(page),
  })
}

// Get doctor request detail
export function useDoctorRequestDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.doctor.requestDetail(id),
    queryFn: () => doctorApi.getMyRequestDetail(id),
    enabled: !!id,
  })
}

// Update doctor online status
export function useUpdateDoctorOnlineStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateDoctorOnlineStatusRequest) =>
      doctorApi.updateOnlineStatus(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.doctor.myProfile })
      qc.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

// List doctor assignments (owners assigned to me)
export function useDoctorAssignmentsList(page = 1) {
  return useQuery({
    queryKey: queryKeys.doctor.myAssignments(page),
    queryFn: () => doctorApi.listMyAssignments(page),
  })
}

// Get doctor assignment detail
export function useDoctorAssignmentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.doctor.assignmentDetail(id),
    queryFn: () => doctorApi.getMyAssignmentDetail(id),
    enabled: !!id,
  })
}

// List incidents for doctor. `ended` === true → chỉ đã kết thúc; false → chỉ đang mở; undefined → tất cả.
export function useDoctorIncidentList(page = 1, ended?: boolean, enabled = true) {
  return useQuery({
    queryKey: queryKeys.incident.doctorList(page, ended),
    queryFn: () => incidentApi.doctorList(page, 20, ended),
    enabled,
  })
}

// Get doctor incident detail
export function useDoctorIncidentDetail(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.incident.doctorDetail(ticketId),
    queryFn: () => incidentApi.detail(ticketId), // v2 endpoint — supports doctor broadcast/accepted access
    enabled: !!ticketId,
    // Race condition: broadcast dispatcher tạo TicketBroadcast async,
    // doctor click broadcast quá nhanh → 403. Retry để chờ dispatcher commit.
    retry: (failureCount, error: any) => {
      if (failureCount >= 3) return false
      return error?.response?.status === 403
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  })
}

// Get doctor DQS tier snapshot
export function useDoctorDqs() {
  return useQuery({
    queryKey: queryKeys.doctor.dqs,
    queryFn: () => doctorApi.getDqs(),
    staleTime: 5 * 60_000,
  })
}

// Accept incident ticket
export function useAcceptIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => incidentApi.acceptIncident(ticketId),
    onSuccess: (_data, ticketId) => {
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(ticketId) })
    },
  })
}
