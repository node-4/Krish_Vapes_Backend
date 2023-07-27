const mongoose = require("mongoose");
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
    alias: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    company: {
      type: String,
    },
    vatNumber: {
      type: String,
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
  },
  total: {
    type: Number,
    default: 0
  },
  totalItem: {
    type: Number
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
module.exports = mongoose.model("userOrder", DocumentSchema);