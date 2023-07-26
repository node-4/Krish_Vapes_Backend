const mongoose = require('mongoose');
const schema = mongoose.Schema;
const DocumentSchema = schema({
        userId: {
                type: schema.Types.ObjectId,
                ref: "user"
        },
        products: [{
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
        }],
        totalAmount: {
                type: Number,
                default: 0
        },
        discountPrice: {
                type: Number,
                default: 0
        },
        paidAmount: {
                type: Number,
                default: 0
        },
        totalItem: {
                type: Number
        },
}, { timestamps: true })
module.exports = mongoose.model("cart", DocumentSchema);