const mongoose = require('mongoose');
const url =  'mongodb://localhost:27017/chatapp';

   const Db =   mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log('Successfully Connected to the Data Base');
}).catch(()=>{
    console.log('An Error Occured while connecting to the Data Base');
})

module.exports = Db;
