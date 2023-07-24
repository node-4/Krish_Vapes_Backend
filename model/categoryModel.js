const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    status: {
        type: String,
        enum: ["Active", "Block"],
        default: "Active"
    }
},
    { timeseries: true }
);

module.exports = mongoose.model("Category", categorySchema);
