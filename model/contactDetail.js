const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        fb: {
                type: String
        },
        twitter: {
                type: String
        },
        google: {
                type: String
        },
        instagram: {
                type: String
        },
        basketball: {
                type: String
        },
        behance: {
                type: String
        },
        dribbble: {
                type: String
        },
        pinterest: {
                type: String
        },
        linkedIn: {
                type: String
        },
        youtube: {
                type: String
        },
        map: {
                type: String
        },
        address: {
                type: String
        },
        phone: {
                type: String
        },
        supportEmail: {
                type: String
        },
        openingTime: {
                type: String
        },
        infoEmail: {
                type: String
        },
        contactAddress: {
                type: String
        },
        tollfreeNo: {
                type: String
        },
}, { timestamps: true })
module.exports = mongoose.model("contactDetails", DocumentSchema);