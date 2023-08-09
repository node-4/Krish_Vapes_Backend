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
                        type: String,
                },
                country: {
                        type: String,
                },
                phone: {
                        type: String,
                        minLength: 8,
                        maxLength: 12,
                },
        },
        { timestamps: true }
);
module.exports = mongoose.model("userAddress", userSchema);
