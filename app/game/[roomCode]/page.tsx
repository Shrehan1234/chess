import ChessGame from '@/components/ChessGame'

export default function GamePage({ params }: { params: { roomCode: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <ChessGame roomCode={params.roomCode} />
    </main>
  )
}

