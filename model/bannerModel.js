const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        position: {
                type: String,
                enum: ["TOP", "MID", "BOTTOM"],
                default: "TOP"
        },
        bannerName: {
                type: String
        },
        bannerImage: {
                type: String
        },
}, { timestamps: true })
module.exports = mongoose.model("banner", DocumentSchema);