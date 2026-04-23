import { useAuth } from '@/hooks/useAuth'
import DoctorProfileScreen from './doctor-profile'
import FarmerProfileScreen from './farmer-profile'

export default function ProfileScreen() {
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'

  return isDoctor ? <DoctorProfileScreen /> : <FarmerProfileScreen />
}
