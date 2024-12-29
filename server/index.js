const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { Chess } = require('chess.js')

const app = express()
app.use(cors())
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const rooms = new Map()

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomCode, playerName, mode }) => {
    socket.join(roomCode)

    if (!rooms.has(roomCode)) {
      if (mode === 'spectator') {
        socket.emit('error', 'Room does not exist')
        return
      }
      rooms.set(roomCode, {
        players: [{ id: socket.id, name: playerName }],
        spectators: new Set(),
        game: new Chess(),
        messages: [],
      })
      socket.emit('playerColor', 'w')
    } else {
      const room = rooms.get(roomCode)
      
      if (mode === 'spectator') {
        room.spectators.add(socket.id)
        socket.emit('gameState', room.game.fen())
        io.to(roomCode).emit('spectatorCount', room.spectators.size)
      
        // Send previous messages to the spectator
        room.messages.forEach((message) => {
          socket.emit('chatMessage', message)
        })
      } else {
        if (room.players.length < 2) {
          room.players.push({ id: socket.id, name: playerName })
          socket.emit('playerColor', 'b')
          socket.to(roomCode).emit('opponentJoined', playerName)
          io.to(roomCode).emit('gameState', room.game.fen())
          io.to(roomCode).emit('spectatorCount', room.spectators.size)
          
          // Send previous messages to the new player
          room.messages.forEach((message) => {
            socket.emit('chatMessage', message)
          })
        } else {
          socket.emit('error', 'Room is full')
          return
        }
      }
    }
    
    // Emit spectator count to all clients in the room
    const room = rooms.get(roomCode)
    io.to(roomCode).emit('spectatorCount', room.spectators.size)
  })

  socket.on('move', ({ roomCode, move }) => {
    const room = rooms.get(roomCode)
    if (room) {
      try {
        room.game.move(move)
        io.to(roomCode).emit('gameState', room.game.fen())
        
        // Check for game over conditions
        if (room.game.isGameOver()) {
          let gameOverMessage = ''
          if (room.game.isCheckmate()) {
            gameOverMessage = `Checkmate! ${room.game.turn() === 'w' ? 'Black' : 'White'} wins!`
          } else if (room.game.isDraw()) {
            gameOverMessage = 'The game has ended in a draw.'
          }
          io.to(roomCode).emit('gameOver', gameOverMessage)
        }
      } catch (error) {
        socket.emit('error', 'Invalid move')
      }
    }
  })

  socket.on('resetGame', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (room) {
      room.game = new Chess()
      io.to(roomCode).emit('gameState', room.game.fen())
    }
  })

  socket.on('sendMessage', ({ roomCode, message }) => {
    const room = rooms.get(roomCode)
    if (room) {
      if (!room.messages.some(msg => msg.id === message.id)) {
        room.messages.push(message)
        io.to(roomCode).emit('chatMessage', message)
      }
    }
  })

  socket.on('disconnect', () => {
    for (const [roomCode, room] of rooms.entries()) {
      // Check if disconnecting socket was a player
      const playerIndex = room.players.findIndex((p) => p.id === socket.id)
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1)
        if (room.players.length === 0 && room.spectators.size === 0) {
          rooms.delete(roomCode)
        } else {
          io.to(roomCode).emit('error', 'Opponent disconnected')
          io.to(roomCode).emit('spectatorCount', room.spectators.size)
        }
        break
      }
      
      // Check if disconnecting socket was a spectator
      if (room.spectators.has(socket.id)) {
        room.spectators.delete(socket.id)
        io.to(roomCode).emit('spectatorCount', room.spectators.size)
        if (room.players.length === 0 && room.spectators.size === 0) {
          rooms.delete(roomCode)
        }
        break
      }
    }
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
