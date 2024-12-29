'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Chat } from '@/components/Chat'
import { Badge } from '@/components/ui/badge'

interface ChessGameProps {
  roomCode: string
}

export default function ChessGame({ roomCode }: ChessGameProps) {
  const [game, setGame] = useState(new Chess())
  const [socket, setSocket] = useState<Socket | null>(null)
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const searchParams = useSearchParams()
  const playerName = searchParams.get('name') || 'Anonymous'
  const mode = searchParams.get('mode') || 'player'

  useEffect(() => {
    const newSocket = io('http://localhost:3001')
    setSocket(newSocket)

    newSocket.emit('joinRoom', { roomCode, playerName, mode })

    newSocket.on('playerColor', (color: 'w' | 'b') => {
      setPlayerColor(color)
    })

    newSocket.on('opponentJoined', (opponentName: string) => {
      setOpponent(opponentName)
      toast(`${opponentName} has joined the game`)
    })

    newSocket.on('spectatorCount', (count: number) => {
      setSpectatorCount(count)
    })

    newSocket.on('gameState', (fen: string) => {
      const newGame = new Chess(fen)
      setGame(newGame)
      if (newGame.isGameOver()) {
        setIsGameOver(true)
        if (newGame.isCheckmate()) {
          toast(`${newGame.turn() === 'w' ? 'Black' : 'White'} wins by checkmate!`)
        } else if (newGame.isDraw()) {
          toast("The game has ended in a draw.")
        }
      }
    })

    newSocket.on('error', (message: string) => {
      toast.error(message)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [roomCode, playerName, mode])

  const makeMove = (move: any) => {
    if (mode === 'spectator') return false
    if (game.turn() === playerColor && !isGameOver) {
      const gameCopy = new Chess(game.fen())
      const result = gameCopy.move(move)
      if (result) {
        setGame(gameCopy)
        socket?.emit('move', { roomCode, move, fen: gameCopy.fen() })
        return true
      }
    }
    return false
  }

  const resetGame = () => {
    if (mode !== 'spectator') {
      socket?.emit('resetGame', { roomCode })
    }
  }

  return (
    <div className="flex space-x-8">
      <div className="space-y-4 bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Room Code: {roomCode}</h1>
          <Badge variant="secondary">
            {spectatorCount} {spectatorCount === 1 ? 'Spectator' : 'Spectators'}
          </Badge>
        </div>
        {mode === 'spectator' ? (
          <Badge>Spectator Mode</Badge>
        ) : (
          <p>You are playing as: {playerColor === 'w' ? 'White' : 'Black'}</p>
        )}
        {opponent && mode !== 'spectator' && <p>Opponent: {opponent}</p>}
        <Chessboard
          position={game.fen()}
          onPieceDrop={(sourceSquare, targetSquare) =>
            makeMove({
              from: sourceSquare,
              to: targetSquare,
              promotion: 'q',
            })
          }
          boardOrientation={mode === 'spectator' ? 'white' : playerColor === 'b' ? 'black' : 'white'}
        />
        {isGameOver && mode !== 'spectator' && (
          <Button onClick={resetGame} className="mt-4">
            Play Again
          </Button>
        )}
      </div>
      {mode !== 'spectator' && socket && (
        <Chat socket={socket} roomCode={roomCode} playerName={playerName} />
      )}
    </div>
  )
}
