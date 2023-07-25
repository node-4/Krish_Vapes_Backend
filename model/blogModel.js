const mongoose = require('mongoose');
const objectid = mongoose.Types.ObjectId;
const postSchema = mongoose.Schema({
        userId: {
                type: objectid,
                ref: "user"
        },
        image: {
                type: String,
                default: ""
        },
        title: {
                type: String,
        },
        description: {
                type: String,
        },
        likeCount: {
                type: Number,
                default: 0,
        },
        viewCount: {
                type: Number,
                default: 0,
        },
        likeUser: [{
                type: objectid,
                ref: "user",
        }],
        commentCount: {
                type: Number,
                default: 0,
        },
        Comment: [{
                user: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "user",
                },
                Comment: {
                        type: String
                },
                date: {
                        type: Date,
                        default: Date.now,
                },
        }],
        date: {
                type: Date,
                default: Date.now,
        },
}, { timestamps: true });
const postmodel = mongoose.model('blog', postSchema);
module.exports = postmodel;