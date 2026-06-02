import type { ImageSourcePropType } from 'react-native'

export const ROLE_LABEL: Record<string, string> = {
  owner: 'Chủ trang trại',
  manager: 'Quản lý',
  farmer: 'Nông dân',
  rancher: 'Chăn nuôi',
  doctor: 'Bác sĩ',
  admin: 'Admin',
}

const DOCTOR_AVATAR = require('../../assets/images/doctor.jpg')
const FARMER_AVATAR = require('../../assets/images/farmer.jpg')

// Ảnh avatar mặc định theo role khi user chưa upload ảnh riêng.
export function getDefaultAvatar(role?: string | null): ImageSourcePropType {
  return role === 'doctor' ? DOCTOR_AVATAR : FARMER_AVATAR
}
