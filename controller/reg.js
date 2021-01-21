const express = require('express');
const router = express();
const Chat = require('../models/chat');
const bcrypt = require('bcrypt');



// Register a new user
router.post('/reg', async(req, res)=>{
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


module.exports = router
