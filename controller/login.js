const express = require('express');
const router = express();
const Chat = require('../models/chat');
const bcrypt = require('bcrypt');
let users = {};


router.post('/newUser', async(req, res)=>{

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

module.exports = router
