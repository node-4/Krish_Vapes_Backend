const mongoose = require("mongoose");
const schema = new mongoose.Schema(
        {
                categoryId: {
                        type: mongoose.SchemaTypes.ObjectId,
                        ref: "Category",
                },
                name: {
                        type: String,
                },
                status: {
                        type: String,
                        enum: ["Active", "Block"],
                        default: "Active"
                }
        },
        { timeseries: true }
);
module.exports = mongoose.model("subcategory", schema);
