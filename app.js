const express = require('express');
const app  = express();
const port = process.env.PORT || 3000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const Db = require('./server');
const Chat = require('./chat');
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
// Register a new user
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
               // req.session.user = data;
               // res.redirect('/chat')
                req.io.emit('reg user', {message: 'Registered User Successfully'})
                console.log(data)
                res.status(200).json({message: 'Successfully Registered User'})
            })
        }
    })
    .catch((err) => console.log(err))

})
// Get login form
// app.get('/login', sessionChecker, (req, res)=>{
//     res.sendFile(__dirname + '/login.html')
// });
// Get registration form
// app.get('/reg', sessionChecker, (req, res)=>{
//     res.sendFile(__dirname + '/reg.html')
// })
// Get Chat page

// app.get('/chat', (req, res)=>{
//     if(req.session.user && req.session.user_sid){
//         res.sendFile(__dirname + '/chat.html')
//     }else{
//         res.redirect('/login')
//     }
// })

// Login User route
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

                    if(done.user in users){
                        req.io.emit('block', {message: 'User already logged in'})
                     }else{
                        console.log('Login Successful');
                        res.status(200).json({message: 'Login successful'});
                        req.io.emit('new user', {message: 'Logged in Successful', user: done.user})
                        console.log(done.user)
                     }



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
