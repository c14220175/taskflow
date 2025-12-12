import { login, signup } from './actions'

type SearchParams = {
  error?: string
  message?: string
}

type Props = {
  searchParams: SearchParams
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">TaskFlow</h2>
          <p className="mt-2 text-sm text-gray-600">Masuk untuk mengelola tugas tim Anda</p>
        </div>
        
        {/* Error/Success Messages */}
        {searchParams?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {searchParams.error}
          </div>
        )}
        {searchParams?.message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {searchParams.message}
          </div>
        )}
        
        <form className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Password (min 6 characters)"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              formAction={login}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              Sign in
            </button>
            <button
              formAction={signup}
              className="group relative flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}