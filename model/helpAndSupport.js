const mongoose = require('mongoose');
const helpandSupport = mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String
    },
    mobile: {
        type: String
    },
    query: {
        type: String
    }
})
const help = mongoose.model('help&suuport', helpandSupport);
module.exports = help