const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const productSchema = mongoose.Schema({
        productId: {
                type: mongoose.Schema.ObjectId,
                ref: "Product",
        },
        colorSize: [{
                size: {
                        type: String
                },
                quantity: {
                        type: Number,
                        default: 0,
                },
                status: {
                        type: String,
                        enum: ["OUTOFSTOCK", "STOCK"],
                },
        }],
        img: {
                type: String
        },
        publicId:{
                type: String
        },
        color: {
                type: String
        },
        quantity:{
                type: Number,
                default: 0,
        },
        status: {
                type: String,
                enum: ["OUTOFSTOCK", "STOCK"],
        },
},
        { timestamps: true });

productSchema.plugin(mongoosePaginate);
productSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("ProductColor", productSchema);
