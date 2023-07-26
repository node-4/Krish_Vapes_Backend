const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        orderId: {
                type: String,
        },
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        categoryId: {
                type: mongoose.Schema.ObjectId,
                ref: "Category",
        },
        subcategoryId: {
                type: mongoose.Schema.ObjectId,
                ref: "subcategory",
        },
        productId: {
                type: schema.Types.ObjectId,
                ref: "Product"
        },
        productColorId: {
                type: schema.Types.ObjectId,
                ref: "ProductColor"
        },
        productSize: {
                type: String,
        },
        productPrice: {
                type: Number
        },
        quantity: {
                type: Number,
                default: 1
        },
        total: {
                type: Number,
                default: 0
        },
}, { timestamps: true })
module.exports = mongoose.model("order", DocumentSchema);