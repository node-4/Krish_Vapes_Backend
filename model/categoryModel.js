const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const categorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    image: {
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
categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("Category", categorySchema);
