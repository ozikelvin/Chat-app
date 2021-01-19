const express = require('express');
const app  = express();
const port = process.env.PORT || 3000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const Db = require('./server');
const Chat = require('./chat');
const bcrypt = require('bcrypt');
const path = require('path');
let connection = [];
let users = {};

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use((req, res, next)=>{
    req.io = io;
    next();
})

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html')
})
app.post('/reg', async(req, res)=>{
    let user = req.body.user;
    let password =await bcrypt.hash(req.body.password, 10);
    let newUser = new Chat({user: user, password:password});
    Chat.findOne({user: user})
    .exec()
    .then(done => {
        if(done){
            console.log('User with username has been choosen select another user')
        }else{
            newUser.save((err, data)=>{
                if(err)  throw err ;
                req.io.emit('reg user', {message: 'Registered User Successfully'})
                console.log(data)
                res.status(200).json({message: 'Successfully Registered User'})
            })
        }
    })
    .catch((err) => console.log(err))

})
app.post('/newUser', async(req, res)=>{

    Chat.findOne({user: req.body.user}).exec()
     .then(async(done) =>{
         if(!done) {
             req.io.emit('wrong username', {message: 'Wrong Username or Password'})
             console.log('Wrong User name ')
         }else{
             console.log(done.password);
             let login = await bcrypt.compare(req.body.password, done.password)
             if(!login){
                req.io.emit('wrong username', {message: 'Wrong Username or Password'})
                 console.log('Wrong password try Again')
             }else{
                    console.log('Login Successful');
                    res.status(200).json({message: 'Login successful'});
                    req.io.emit('new user', {message: 'Login Successful', user: done.user})

                    Chat.find({}).limit(1)
    .exec()
    .then((data)=>{
        if(data){
            console.log('Gotten All messages');
            req.io.emit('load message', data)
        }

    })
    .catch((err) =>{
        throw err
    })
             }
         }
     })
})

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
   socket.on('log user', (data, callback)=>{
       if(data in users){
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
