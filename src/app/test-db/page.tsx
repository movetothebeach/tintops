export default function TestDbPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <div className="text-sm space-y-1">
            <div>NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? '✅ Set' : '❌ Missing'}</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseKey ? '✅ Set' : '❌ Missing'}</div>
            {supabaseUrl && (
              <div className="text-xs text-gray-500 mt-2">URL: {supabaseUrl}</div>
            )}
            {supabaseKey && (
              <div className="text-xs text-gray-500">Key: {supabaseKey.substring(0, 20)}...</div>
            )}
          </div>
        </div>

        {!supabaseUrl || !supabaseKey ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h2 className="text-xl font-semibold mb-2 text-red-800">Configuration Error</h2>
            <p className="text-red-600">Missing required Supabase environment variables. Check Vercel dashboard.</p>
          </div>
        ) : (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <h2 className="text-xl font-semibold mb-2 text-green-800">Environment OK</h2>
            <p className="text-green-600">Supabase configuration appears to be set correctly.</p>
            <p className="text-sm text-gray-600 mt-2">
              Note: This is a simplified test. The full connection test was causing client-side errors.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}