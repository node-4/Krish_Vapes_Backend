const mongoose = require("mongoose");
const schema = mongoose.Schema;
var userSchema = new schema(
        {
                fullName: {
                        type: String,
                },
                firstName: {
                        type: String,
                },
                lastName: {
                        type: String,
                },
                language: {
                        type: String,
                },
                image: {
                        type: String,
                },
                courtesyTitle: {
                        type: String,
                },
                gender: {
                        type: String,
                },
                dob: {
                        type: String,
                },
                phone: {
                        type: String,
                },
                email: {
                        type: String,
                        minLength: 10,
                },
                password: {
                        type: String,
                },
                alias: {
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
                state: {
                        type: String,
                },
                district: {
                        type: String,
                },
                otp: {
                        type: String,
                },
                otpExpiration: {
                        type: Date,
                },
                accountVerification: {
                        type: Boolean,
                        default: false,
                },
                userType: {
                        type: String,
                        enum: ["USER", "VENDOR", "DRIVER", "ADMIN"],
                },
                status: {
                        type: String,
                        enum: ["Approved", "Reject", "Pending"],
                },
                wallet: {
                        type: Number,
                        default: 0,
                },
        },
        { timestamps: true }
);
module.exports = mongoose.model("user", userSchema);
