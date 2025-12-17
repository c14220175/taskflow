import { signup } from './actions'
import Link from 'next/link'

type SearchParams = Promise<{
  error?: string
  message?: string
}>

type Props = {
  searchParams?: SearchParams
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams || {};
  const errorMessage = params.error;
  const successMessage = params.message;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">TaskFlow</h2>
          <p className="mt-2 text-sm text-gray-600">Daftar akun baru untuk memulai</p>
        </div>
        
        {/* Error/Success Messages */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form className="mt-8 space-y-6" noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 sm:text-sm invalid:border-red-500"
                placeholder="contoh@email.com"
                title="Masukkan email yang valid"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 sm:text-sm invalid:border-red-500"
                placeholder="Min 6 karakter, huruf besar, kecil, angka"
                title="Password harus minimal 6 karakter dengan huruf besar, kecil, dan angka"
              />
            </div>
            <div className="text-xs text-gray-600">
              <p>Password harus mengandung:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Minimal 6 karakter</li>
                <li>Huruf besar (A-Z)</li>
                <li>Huruf kecil (a-z)</li>
                <li>Angka (0-9)</li>
              </ul>
            </div>
          </div>

          <button
            formAction={signup}
            type="submit"
            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            Sign up
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}