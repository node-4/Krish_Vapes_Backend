const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const productSchema = mongoose.Schema({
        categoryId: {
                type: mongoose.Schema.ObjectId,
                ref: "Category",
        },
        subcategoryId: {
                type: mongoose.Schema.ObjectId,
                ref: "subcategory",
        },
        name: {
                type: String,
        },
        description: {
                type: String,
        },
        price: {
                type: Number,
        },
        quantity: {
                type: Number,
                default: 0,
        },
        discount: {
                type: Boolean,
                default: false
        },
        discountPrice: {
                type: Number,
        },
        taxInclude: {
                type: Boolean,
                default: true
        },
        color: {
                type: Boolean,
                default: false
        },
        tax: {
                type: Number,
                default: 0,
        },
        ratings: {
                type: Number,
                default: 0,
        },
        img: {
                type: String
        },
        publicId: {
                type: String
        },
        colors: [{
                type: mongoose.Schema.ObjectId,
                ref: "ProductColor"
        }],
        numOfReviews: {
                type: Number,
                default: 0,
        },
        reviews: [
                {
                        user: {
                                type: mongoose.Schema.ObjectId,
                                ref: "user",
                        },
                        name: {
                                type: String,
                        },
                        rating: {
                                type: Number,
                        },
                        comment: {
                                type: String,
                        },
                },
        ],
        status: {
                type: String,
                enum: ["OUTOFSTOCK", "STOCK"],
        },
},
        { timestamps: true });

productSchema.plugin(mongoosePaginate);
productSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("Product", productSchema);
