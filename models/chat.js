const mongoose = require('mongoose');

let chatSchema = mongoose.Schema({
    user: String,
    msg: String,
    password: String || Number,
    created: { type: Date, default: Date.now}
})

let Chat = mongoose.model('Message', chatSchema);

module.exports = Chat;
