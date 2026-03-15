import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    fetchMe,
    forgotPassword,
    updateProfile,
  } = useAuthStore()

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    fetchMe,
    forgotPassword,
    updateProfile,
  }
}
