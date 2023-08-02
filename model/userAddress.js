const mongoose = require("mongoose");
const schema = mongoose.Schema;
var userSchema = new schema(
        {
                userId: {
                        type: schema.Types.ObjectId,
                        ref: "user"
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
        },
        { timestamps: true }
);
module.exports = mongoose.model("userAddress", userSchema);
