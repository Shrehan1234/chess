'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatProps {
  socket: any
  roomCode: string
  playerName: string
}

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
}

export function Chat({ socket, roomCode, playerName }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (socket) {
      socket.on('chatMessage', (message: ChatMessage) => {
        setMessages((prevMessages) => {
          // Check if message with this ID already exists
          if (prevMessages.some(msg => msg.id === message.id)) {
            return prevMessages
          }
          return [...prevMessages, message]
        })
      })
    }
  }, [socket])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() !== '') {
      const newMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: playerName,
        message: inputMessage.trim(),
        timestamp: Date.now()
      }
      socket.emit('sendMessage', { roomCode, message: newMessage })
      setInputMessage('')
    }
  }

  return (
    <div className="w-64 h-[400px] flex flex-col bg-white rounded-lg shadow-md">
      <div className="p-2 bg-gray-100 rounded-t-lg">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>
      <ScrollArea className="flex-grow p-2" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-semibold">{msg.sender}: </span>
            <span>{msg.message}</span>
          </div>
        ))}
      </ScrollArea>
      <form onSubmit={sendMessage} className="p-2 bg-gray-100 rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow"
          />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  )
}

