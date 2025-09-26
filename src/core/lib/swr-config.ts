import { SWRConfiguration } from 'swr'
import { fetcher } from './fetcher'

export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  dedupingInterval: 2000,
  shouldRetryOnError: true,
  errorRetryInterval: 5000,
  errorRetryCount: 3,
  onError: (error, key) => {
    console.error(`SWR Error for ${key}:`, error)
    // If unauthorized, could redirect to login
    if (error?.status === 401) {
      // User will be redirected by middleware
      window.location.href = '/auth/login'
    }
  }
}