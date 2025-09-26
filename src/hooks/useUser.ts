import useSWR from 'swr'

export interface User {
  id: string
  email: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface UserResponse {
  user: User
}

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<UserResponse>('/api/user')

  return {
    user: data?.user,
    isLoading,
    isError: error,
    mutate,
  }
}