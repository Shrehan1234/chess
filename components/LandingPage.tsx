'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function LandingPage() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const router = useRouter()

  const createRoom = () => {
    if (name.trim()) {
      const newRoomCode = Math.random().toString(36).substring(7).toUpperCase()
      router.push(`/game/${newRoomCode}?name=${encodeURIComponent(name)}&mode=player`)
    } else {
      toast.error("Please enter your name.")
    }
  }

  const joinRoom = (mode: 'player' | 'spectator') => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code.")
      return
    }

    const nameParam = mode === 'player' && !name.trim() ? 'Anonymous' : name.trim()
    router.push(`/game/${roomCode.toUpperCase()}?name=${encodeURIComponent(nameParam)}&mode=${mode}`)
  }

  return (
    <div className="space-y-4 bg-white p-8 rounded-lg shadow-md w-[400px]">
      <Tabs defaultValue="play" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="spectate">Spectate</TabsTrigger>
        </TabsList>

        <TabsContent value="play" className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
          <div className="space-y-2">
            <Button onClick={createRoom} className="w-full">
              Create Room
            </Button>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={() => joinRoom('player')}>Join Room</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spectate" className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full"
            />
            <Button onClick={() => joinRoom('spectator')} className="w-full">
              Spectate Game
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
