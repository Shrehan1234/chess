import LandingPage from '@/components/LandingPage'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Multiplayer Chess</h1>
      <LandingPage />
    </main>
  )
}

