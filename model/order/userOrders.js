const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = mongoose.Schema;
const DocumentSchema = schema({
  userId: {
    type: schema.Types.ObjectId,
    ref: "user"
  },
  orderId: {
    type: String
  },
  Orders: [{
    type: schema.Types.ObjectId,
    ref: "order",
  }],
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
  tax: {
    type: String,
  },
  total: {
    type: String,
  },
  delivery: {
    type: String
  },
  paidAmount: {
    type: String,
  },
  totalItem: {
    type: Number
  },
  transactionId: {
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
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
DocumentSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("userOrder", DocumentSchema);