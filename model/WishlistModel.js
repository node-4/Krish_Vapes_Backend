const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  },
  products: {
    type: [mongoose.Types.ObjectId],
    ref: "Product"
  }
});

wishlistSchema.plugin(mongoosePaginate);
wishlistSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("Wishlist", wishlistSchema);