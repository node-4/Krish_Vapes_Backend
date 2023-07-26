const mongoose = require("mongoose");
const schema = mongoose.Schema;
var userSchema = new schema(
        {
                userId: {
                        type: schema.Types.ObjectId,
                        ref: "user"
                },
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
        { timestamps: true }
);
module.exports = mongoose.model("userAddress", userSchema);
