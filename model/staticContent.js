const mongoose = require('mongoose');
const staticContent = mongoose.Schema({
    aboutusImage: {
        type: String,
    },
    aboutusImages: {
        type: Array,
    },
    desc: [{
        title: {
            type: String
        },
        desc: {
            type: String
        },
    }],
    type: {
        type: String,
        enum: ["ABOUTUS", "TERMS", "PRIVACY"],
    },
    terms: {
        type: String,
    },
    privacy: {
        type: String,
    },
}, {
    timestamps: true
})
module.exports = mongoose.model('staticContent', staticContent);