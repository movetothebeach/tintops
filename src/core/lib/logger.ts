// Production-ready logging utility
export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...data
    }))
  },

  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      ...data
    }))
  },

  webhook: (eventType: string, action: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      type: 'webhook',
      eventType,
      action,
      timestamp: new Date().toISOString(),
      ...data
    }))
  }
}