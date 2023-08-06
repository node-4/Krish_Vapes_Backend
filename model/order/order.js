const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
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
        tax: {
                type: Number,
                default: 0
        },
        totalTax: {
                type: Number,
                default: 0
        },
        total: {
                type: Number,
                default: 0
        },
        paidAmount: {
                type: Number,
                default: 0
        },
        company: {
                type: String,
        },
        vatNumber: {
                type: String,
                minLength: 5,
                maxLength: 17,
        },
        address: {
                type: String,
        },
        addressComplement: {
                type: String,
        },
        city: {
                type: String,
        },
        pincode: {
                type: Number,
        },
        country: {
                type: String,
        },
        phone: {
                type: String,
        },
        orderStatus: {
                type: String,
                enum: ["unconfirmed", "confirmed"],
                default: "unconfirmed",
        },
        paymentStatus: {
                type: String,
                enum: ["pending", "paid", "failed"],
                default: "pending"
        },
}, { timestamps: true });
DocumentSchema.plugin(mongoosePaginate);
DocumentSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("order", DocumentSchema);