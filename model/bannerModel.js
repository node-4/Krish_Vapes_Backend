const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        position: {
                type: String,
                enum: ["TOP", "MID", "BOTTOM"],
                default: "TOP"
        },
        productId: {
                type: schema.Types.ObjectId,
                ref: "Product"
        },
        bannerName: {
                type: String
        },
        bannerImage: {
                type: String
        },
        type: {
                type: String,
                enum: ["Product", "Other"],
                default: "Other"
        },
}, { timestamps: true })
module.exports = mongoose.model("banner", DocumentSchema);