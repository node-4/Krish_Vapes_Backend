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
                        type: String
                },
                quantity: {
                        type: Number,
                },
                tax: {
                        type: String,
                },
                discount: {
                        type: String,
                },
                totalTax: {
                        type: String,
                },
                total: {
                        type: String,
                },
                paidAmount: {
                        type: String,
                },
        }],
        totalAmount: {
                type: String,
        },
        tax: {
                type: String
        },
        discount: {
                type: String,
        },
        delivery: {
                type: String,
        },
        paidAmount: {
                type: String,
        },
        totalItem: {
                type: Number
        },
}, { timestamps: true })
module.exports = mongoose.model("cart", DocumentSchema);