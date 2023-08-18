const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        position: {
                type: String,
                enum: ["TOP", "MID", "BOTTOM"],
                default: "TOP"
        },
        subcategoryId: {
                type: schema.Types.ObjectId,
                ref: "subcategory"
        },
        bannerName: {
                type: String
        },
        bannerImage: {
                type: String
        },
        type: {
                type: String,
                enum: ["SubCategory", "Other"],
                default: "Other"
        },
}, { timestamps: true })
module.exports = mongoose.model("banner", DocumentSchema);