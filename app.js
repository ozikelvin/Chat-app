const express = require('express');
const app  = express();
const port = process.env.PORT || 3000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const Db = require('./models/server');
const Chat = require('./models/chat');
const login = require('./controller/login');
const reg = require('./controller/reg')
const bcrypt = require('bcrypt');
const path = require('path');
let connection = [];
let users = {};

app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser());
app.use(
    session({
        key: 'user_sid',
        secret: 'something',
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 20000
        }
    })
)
app.use(express.json());
app.use((req, res, next)=>{
    req.io = io;
    if(req.session.user && req.cookies.user_sid){
        req.io.emit('back to chat', {message: 'Back to chat'})
    }
    next();
})

let sessionChecker = (req, res, next)=>{
    if(req.session.user && req.session.user_sid){
        req.io.emit('back to chat', {message: 'Back to chat'})
    //    res.redirect('/chat')
    }else{
        next()
    }
}

app.get('/', sessionChecker, (req, res)=>{
    //res.redirect('/login')
    res.sendFile(__dirname + '/index.html')
})
app.use(login);
app.use(reg);


io.on('connection', (socket)=>{

    connection.push(socket);
    console.log('New connetion : ' + connection.length);

    socket.on('disconnect', (sockets)=>{
       // users.splice(users.indexOf(socket.username), 1)
        delete users[socket.username]
        getUsers();
        connection.splice(connection.indexOf(socket), 1)
        console.log('Disconnected: %s sockets Connected', connection.length)
    })

   socket.on('send message', (data, cb)=>{
       let msg = data.trim();
        if(msg.substr(0,2)==="@ "){
            msg = msg.substr(2);
           let ind = msg.indexOf(' ');
           if(ind !== 1){
            var name = msg.substr(0, ind);
            msg = msg.substr(ind + 1);

            if(name in users){
               users[name].emit('whisper', {msg: msg, user: socket.username})
            }else{
                cb('Message not sent! User Not Found')
            }
           }else{
               cb('Error enter a valid user');
           }
        }else{
            let chat = new Chat({msg: msg, user: socket.username});

            chat.save(function(err){
                if(err){
                    throw err
                }else{
                    socket.broadcast.emit('new message', {msg: msg, user: socket.username});
                }
            })


        }

   })
        // socket.on('log user', (data)=>{
        //     socket.username = data;
        //     users[socket.username]= socket;
        //     getUsers()

        //   })

   socket.on('log user', (data, callback)=>{
       if(data in users){
           //console.log(data)
           callback(false)
       }else{
        callback(true)
        socket.username = data;
        users[socket.username]= socket;
        getUsers()
       }

   })

        function getUsers(){
            socket.emit('get users', Object.keys(users))

        }
});

http.listen(port, ()=>{
    console.log(`Server has started at port ${port}`)
});
