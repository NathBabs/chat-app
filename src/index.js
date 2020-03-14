const path = require('path');
const http =  require('http');

const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersinRoom } = require ('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, '../public');

app.use(express.static(publicDirectory));



//server(emit) -> client (recieve) - countUpdated
//client(emit) -> server (receive) - increment
//socket.emit, io.emit, socket.broadcast.emit
//io.to.emit, socket.broadcast.to.emit

const str = 'Welcome';

io.on('connection', (socket) => {
    console.log('New Websocket connection')


    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username, room });

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersinRoom(user.room)
        })

        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })

    socket.on('sendLocation', ({lat, long}, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${lat},${long}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersinRoom(user.room)
            });
        }
    });
    
    //socket.emit('message', str );

  /*   socket.emit('countUpdated', count);

    socket.on('increment', () => {
        count++;
        //socket.emit('countUpdated', count);//emits to that specific connection
        io.emit('countUpdated', count);//emits to all clients connected
    }) */
})


server.listen(port, () => {
    console.log(`Now listening on ${port}`)
})