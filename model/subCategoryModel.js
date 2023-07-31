const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
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
schema.plugin(mongoosePaginate);
schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("subcategory", schema);
