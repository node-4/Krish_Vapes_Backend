const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const banner = require("../model/bannerModel");
const blog = require("../model/blogModel");
const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const contact = require("../model/contactDetail");
const helpandSupport = require("../model/helpAndSupport");
var newOTP = require("otp-generators");
const order = require("../model/order/order");
const userOrders = require("../model/order/userOrders");
const ProductColor = require("../model/ProductColor");
const Product = require("../model/productModel");
const staticContent = require("../model/staticContent");
const subCategory = require("../model/subCategoryModel");
const User = require("../model/userModel");
const userAddress = require("../model/userAddress");
const visitorSubscriber = require("../model/visitorSubscriber");
const Wishlist = require("../model/WishlistModel");
const PDFDocument = require("pdfkit-table");
const doc = new PDFDocument({ margin: 30, size: 'A4' });
const nodemailer = require('nodemailer')
var html_to_pdf = require('html-pdf-node');
// const stripe = require("stripe")('pk_live_51NYCJcArS6Dr0SQYUKlqAd37V2GZMbxBL6OGM9sZi8CY6nv6H7TUJcjfMiepBmkIdSdn1bUCo855sQuKb66oiM4j00PRLQzvUc'); // live
const stripe = require("stripe")('sk_test_51NYCJcArS6Dr0SQY0UJ5ZOoiPHQ8R5jNOyCMOkjxpl4BHkG4DcAGAU8tjBw6TSOSfimDSELa6BVyCVSo9CGLXlyX00GkGDAQFo'); // test
exports.registration = async (req, res) => {
        const { courtesyTitle, dob, email, firstName, lastName, password, company, vatNumber, vatUsed, country, phone } = req.body;
        try {
                let user = await User.findOne({ email: email, userType: "USER" });
                if (!user) {
                        let fullName = `${req.body.firstName} ${req.body.lastName}`;
                        if (vatUsed == "true") {
                                if (vatNumber != (null || undefined)) {
                                        req.body.vatNumber = vatNumber
                                } else {
                                        return res.status(404).send({ message: "Vat number Not provided", data: [] });
                                }
                        } else {
                                if (vatNumber != (null || undefined)) {
                                        return res.status(404).send({ message: "Then first chose yes", data: [] });
                                }
                        }
                        req.body.courtesyTitle = courtesyTitle;
                        req.body.dob = dob;
                        req.body.email = email;
                        req.body.firstName = firstName;
                        req.body.lastName = lastName;
                        req.body.password = bcrypt.hashSync(password, 8);
                        req.body.company = company;
                        req.body.vatUsed = vatUsed;
                        req.body.country = country;
                        req.body.phone = phone;
                        req.body.accountVerification = true;
                        req.body.fullName = fullName;
                        req.body.userType = "USER";
                        req.body.status = "Pending"
                        const userCreate = await User.create(req.body);
                        return res.status(200).send({ message: "registered successfully ", data: userCreate, });
                } else {
                        console.log(user);
                        return res.status(409).send({ message: "Already Exist", data: [] });
                }
        } catch (error) {

                return res.status(500).json({ message: "Server error" });
        }
};
exports.signin = async (req, res) => {
        try {
                const { email, password } = req.body;
                const user = await User.findOne({ email: email, userType: "USER" });
                if (!user) {
                        return res.status(404).send({ status: 404, message: "user not found ! not registered" });
                } else {
                        if (user.status == "Pending") {
                                return res.status(201).send({ status: 201, message: "User verification is pending login after some time." });
                        } else {
                                const isValidPassword = bcrypt.compareSync(password, user.password);
                                if (!isValidPassword) {
                                        return res.status(401).send({ status: 401, message: "Wrong password" });
                                }
                                const accessToken = jwt.sign({ id: user._id }, authConfig.secret, { expiresIn: authConfig.accessTokenTime, });
                                return res.status(200).send({ status: 200, data: user, accessToken: accessToken });
                        }
                }

        } catch (error) {
                console.error(error);
                return res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.forgetPassword = async (req, res) => {
        try {
                const data = await User.findOne({ email: req.body.email });
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                } else {
                        let otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                        var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                        "user": "krishvapes@gmail.com",
                                        "pass": "fggmdyhrilxhmyig"
                                }
                        });
                        let mailOptions;
                        mailOptions = {
                                from: 'krishvapes@gmail.com',
                                to: req.body.email,
                                subject: 'Forget password verification',
                                text: `Your Account Verification Code is ${otp}`,
                        };
                        let info = await transporter.sendMail(mailOptions);
                        if (info) {
                                let accountVerification = false;
                                let otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
                                const updated = await User.findOneAndUpdate({ _id: data._id }, { $set: { accountVerification: accountVerification, otp: otp, otpExpiration: otpExpiration } }, { new: true, });
                                if (updated) {
                                        res.status(200).json({ message: "Otp send to your email.", status: 200, data: {} });
                                }
                        } else {
                                res.status(200).json({ message: "Otp not send on your mail please check.", status: 200, data: {} });
                        }
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.changePassword = async (req, res) => {
        try {
                const user = await User.findOne({ email: req.body.email });
                if (user) {
                        if (user.otp !== req.body.otp || user.otpExpiration < Date.now()) {
                                return res.status(400).json({ message: "Invalid OTP" });
                        }
                        if (req.body.newPassword == req.body.confirmPassword) {
                                const updated = await User.findOneAndUpdate({ _id: user._id }, { $set: { password: bcrypt.hashSync(req.body.newPassword), accountVerification: true } }, { new: true });
                                return res.status(200).send({ message: "Password update successfully.", data: updated, });
                        } else {
                                return res.status(501).send({ message: "Password Not matched.", data: {}, });
                        }
                } else {
                        return res.status(404).json({ status: 404, message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                return res.status(200).send({ message: "Get user details.", data: user });
        } catch (err) {
                console.log(err);
                return res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.update = async (req, res) => {
        try {
                const { firstName, lastName, email, dob, password, courtesyTitle, company, vatNumber } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                user.firstName = firstName || user.firstName;
                user.lastName = lastName || user.lastName;
                user.email = email || user.email;
                user.dob = dob || user.dob;
                user.courtesyTitle = courtesyTitle || user.courtesyTitle;
                user.company = company || user.company;
                user.vatNumber = vatNumber || user.vatNumber;
                user.fullName = `${firstName || user.firstName} ${lastName || user.lastName}`;
                if (req.body.password) {
                        user.password = bcrypt.hashSync(password, 8) || user.password;
                } else {
                        user.password = user.password;
                }
                const updated = await user.save();
                const findData = await User.findById(updated._id).select('firstName lastName email dob password');
                return res.status(200).send({ message: "updated", data: findData });
        } catch (err) {
                console.log(err);
                return res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.addAdress = async (req, res) => {
        try {
                const { address, addressComplement, city, pincode, country, phone } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                } else {
                        let obj = {
                                userId: user._id,
                                address: address,
                                addressComplement: addressComplement,
                                city: city,
                                pincode: pincode,
                                country: country,
                                phone: phone
                        }
                        const userCreate = await userAddress.create(obj);
                        return res.status(200).send({ message: "Address add successfully.", data: userCreate });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "internal server error " + err.message, });
        }
};
exports.updateAdress = async (req, res) => {
        try {
                const { address, addressComplement, city, pincode, country, phone } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                } else {
                        const findData = await userAddress.findById(req.params.id);
                        if (!findData) {
                                return res.status(400).send({ msg: "not found" });
                        }
                        let obj = {
                                userId: user._id,
                                address: address || findData.address,
                                addressComplement: addressComplement || findData.addressComplement,
                                city: city || findData.city,
                                pincode: pincode || findData.pincode,
                                country: country || findData.country,
                                phone: phone || findData.phone
                        }
                        const userCreate = await userAddress.findByIdAndUpdate({ _id: findData._id }, { $set: obj }, { new: true })
                        return res.status(200).send({ message: "Address update successfully.", data: userCreate });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "internal server error " + err.message, });
        }
};
exports.deleteAdress = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                } else {
                        const findData = await userAddress.findById(req.params.id);
                        if (!findData) {
                                return res.status(400).send({ msg: "not found" });
                        }
                        const userCreate = await userAddress.findByIdAndDelete({ _id: findData._id })
                        return res.status(200).send({ message: "Address delete successfully.", data: {} });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "internal server error " + err.message, });
        }
};
exports.getAdress = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findAddress = await userAddress.find({ userId: user._id });
                        if (findAddress.length > 0) {
                                return res.status(200).send({ status: 200, message: "Address detail found.", data: findAddress });
                        } else {
                                return res.status(200).send({ status: 200, message: "Address detail not found.", data: [] });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
}
exports.createWishlist = async (req, res, next) => {
        try {
                const product = req.params.id;
                let wishList = await Wishlist.findOne({ user: req.user._id });
                if (!wishList) {
                        wishList = new Wishlist({ user: req.user._id, });
                }
                wishList.products.addToSet(product);
                await wishList.save();
                res.status(200).json({ status: 200, message: "product add to wishlist Successfully", });
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.removeFromWishlist = async (req, res, next) => {
        try {
                const wishlist = await Wishlist.findOne({ user: req.user._id });
                if (!wishlist) {
                        res.status(404).json({ message: "Wishlist not found", status: 404 });
                }
                const product = req.params.id;
                wishlist.products.pull(product);
                await wishlist.save();
                res.status(200).json({ status: 200, message: "Removed From Wishlist", });
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.myWishlist = async (req, res, next) => {
        try {
                let myList = await Wishlist.findOne({ user: req.user._id }).populate('products');
                if (!myList) {
                        myList = await Wishlist.create({ user: req.user._id });
                }
                let array = []
                for (let i = 0; i < myList.products.length; i++) {
                        const data = await Product.findById(myList.products[i]._id).populate('categoryId subcategoryId').populate('colors')
                        array.push(data)
                }
                let obj = {
                        _id: myList._id,
                        user: myList.user,
                        products: array,
                        __v: myList.__v
                }

                res.status(200).json({ status: 200, wishlist: obj, });
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.addToCart = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await Cart.findOne({ userId: user._id });
                        if (findCart) {
                                let findProduct = await Product.findById({ _id: req.body.productId });
                                if (findProduct) {
                                        if (findCart.products.length > 0) {
                                                for (let i = 0; i < findCart.products.length; i++) {
                                                        if ((findCart.products[i].productId).toString() == req.body.productId) {
                                                                return res.status(409).send({ status: 409, message: "Product already exit in cart." });
                                                        } else {
                                                                if (findProduct.colorActive == true) {
                                                                        let findColor = await ProductColor.findOne({ productId: findProduct._id, _id: req.body.colorId });
                                                                        if (findColor) {
                                                                                // done
                                                                                if (findColor.size == true) {
                                                                                        if (findColor.colorSize.length > 0) {
                                                                                                for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                                                        if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                                                let products = [], tax = 0, totalTax = 0, productTotalTax = 0;
                                                                                                                if (findProduct.taxInclude == true) {
                                                                                                                        tax = findProduct.tax;
                                                                                                                        productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                                                } else {
                                                                                                                        tax = tax;
                                                                                                                }
                                                                                                                let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                                                let obj = {
                                                                                                                        categoryId: findProduct.categoryId,
                                                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                                                        productId: findProduct._id,
                                                                                                                        productColorId: findColor._id,
                                                                                                                        productSize: req.body.size,
                                                                                                                        productPrice: findProduct.price,
                                                                                                                        quantity: req.body.quantity,
                                                                                                                        tax: tax,
                                                                                                                        totalTax: productTotalTax,
                                                                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                                        paidAmount: productPaid,
                                                                                                                }
                                                                                                                totalTax = Number(findCart.tax) + Number(productTotalTax);
                                                                                                                let totalItem = findCart.totalItem + 1;
                                                                                                                let c = Number(findCart.totalAmount).toFixed(2);
                                                                                                                let totalAmount = Number(c) + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                                                                let b = Number(findCart.paidAmount).toFixed(2);
                                                                                                                let d = Number(productPaid).toFixed(2);
                                                                                                                let paidAmount = Number(b) + Number(d);
                                                                                                                let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: totalTax }, $push: { products: obj } }, { new: true })
                                                                                                                return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                                        }
                                                                                                }
                                                                                        } else {
                                                                                                return res.status(409).send({ status: 409, message: "Currently no size available." });
                                                                                        }
                                                                                }
                                                                                else {
                                                                                        console.log("---------------------------------280------------");
                                                                                        let tax = 0, totalTax = 0;
                                                                                        let productTotalTax = 0;
                                                                                        if (findProduct.taxInclude == true) {
                                                                                                tax = findProduct.tax;
                                                                                                productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                        } else {
                                                                                                tax = tax;
                                                                                        }
                                                                                        totalTax = totalTax + productTotalTax;
                                                                                        let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                        let obj = {
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productColorId: findColor._id,
                                                                                                productPrice: findProduct.price,
                                                                                                quantity: req.body.quantity,
                                                                                                tax: tax,
                                                                                                totalTax: productTotalTax,
                                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: Number(productPaid).toFixed(2),
                                                                                        }
                                                                                        console.log(obj);
                                                                                        let c = Number(findCart.totalAmount).toFixed(2);
                                                                                        let totalAmount = Number(c) + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                                        let b = Number(findCart.paidAmount).toFixed(2);
                                                                                        let d = Number(productPaid).toFixed(2);
                                                                                        let paidAmount = Number(b) + Number(d);
                                                                                        let totalItem = findCart.totalItem + 1;
                                                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: Number(totalAmount).toFixed(2), totalItem: totalItem, paidAmount: paidAmount, tax: Number(totalTax) }, $push: { products: obj } }, { new: true })
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                }
                                                                        }
                                                                        else {
                                                                                return res.status(404).send({ status: 404, message: "Color not found." });
                                                                        }
                                                                }
                                                                else {
                                                                        let tax = 0, totalTax = 0, productTotalTax = 0;
                                                                        if (findProduct.taxInclude == true) {
                                                                                tax = findProduct.tax;
                                                                                productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                        } else {
                                                                                tax = tax;
                                                                        }
                                                                        totalTax = totalTax + productTotalTax;
                                                                        let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                        let obj = {
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productPrice: findProduct.price,
                                                                                quantity: req.body.quantity,
                                                                                tax: tax,
                                                                                totalTax: productTotalTax,
                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                paidAmount: productPaid,
                                                                        }
                                                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                        if (update) {
                                                                                let totalAmount = 0, totalTax1 = 0, paidAmount = 0;
                                                                                for (let j = 0; j < update.products.length; j++) {
                                                                                        totalAmount = Number(totalAmount) + Number(update.products[j].total);
                                                                                        totalTax1 = Number(totalTax1) + Number(update.products[j].totalTax);
                                                                                        paidAmount = Number(paidAmount) + Number(update.products[j].paidAmount)
                                                                                }
                                                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { totalAmount: totalAmount, paidAmount: paidAmount, tax: totalTax1, totalItem: update.products.length } }, { new: true });
                                                                                return res.status(200).json({ status: 200, message: "Product add to cart.", data: update1 })
                                                                        }
                                                                }
                                                        }
                                                }
                                        }
                                        else {
                                                if (findProduct.colorActive == true) {
                                                        let findColor = await ProductColor.findOne({ productId: findProduct._id, _id: req.body.colorId });
                                                        if (findColor) {
                                                                if (findColor.size == true) {
                                                                        if (findColor.colorSize.length > 0) {
                                                                                for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                                        if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                                let tax = 0, totalTax = 0, productTotalTax = 0;
                                                                                                if (findProduct.taxInclude == true) {
                                                                                                        tax = findProduct.tax;
                                                                                                        productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                                } else {
                                                                                                        tax = tax;
                                                                                                }
                                                                                                totalTax = totalTax + productTotalTax;
                                                                                                let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                                let obj = {
                                                                                                        categoryId: findProduct.categoryId,
                                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                                        productId: findProduct._id,
                                                                                                        productColorId: findColor._id,
                                                                                                        productSize: req.body.size,
                                                                                                        productPrice: findProduct.price,
                                                                                                        quantity: req.body.quantity,
                                                                                                        tax: tax,
                                                                                                        totalTax: productTotalTax,
                                                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                        paidAmount: productPaid,
                                                                                                }
                                                                                                let totalAmount = Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                                                let paidAmount = productPaid;
                                                                                                let totalItem = findCart.totalItem + 1;
                                                                                                let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: Number(totalTax).toFixed(2) }, $push: { products: obj } }, { new: true })
                                                                                                return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                        }
                                                                                }
                                                                        } else {
                                                                                return res.status(409).send({ status: 409, message: "Currently no size available." });
                                                                        }
                                                                }
                                                                else {
                                                                        console.log("---------------------------------280------------");
                                                                        let tax = 0, totalTax = 0;
                                                                        let productTotalTax = 0;
                                                                        if (findProduct.taxInclude == true) {
                                                                                tax = findProduct.tax;
                                                                                productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                        } else {
                                                                                tax = tax;
                                                                        }
                                                                        totalTax = totalTax + productTotalTax;
                                                                        let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                        let obj = {
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productColorId: findColor._id,
                                                                                productPrice: findProduct.price,
                                                                                quantity: req.body.quantity,
                                                                                tax: tax,
                                                                                totalTax: productTotalTax,
                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                paidAmount: Number(productPaid).toFixed(2),
                                                                        }
                                                                        let totalAmount = Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                        let paidAmount = Number(productPaid).toFixed(2);
                                                                        let totalItem = findCart.totalItem + 1;
                                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: Number(totalTax) }, $push: { products: obj } }, { new: true })
                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                }
                                                        }
                                                        else {
                                                                return res.status(404).send({ status: 404, message: "Color not found." });
                                                        }
                                                }
                                                else {
                                                        console.log("322================");
                                                        let tax = 0, totalTax = 0, productTotalTax = 0;
                                                        if (findProduct.taxInclude == true) {
                                                                tax = findProduct.tax;
                                                                productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                        } else {
                                                                tax = tax;
                                                        }
                                                        totalTax = totalTax + productTotalTax;
                                                        let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                        let obj = {
                                                                categoryId: findProduct.categoryId,
                                                                subcategoryId: findProduct.subcategoryId,
                                                                productId: findProduct._id,
                                                                productPrice: findProduct.price,
                                                                quantity: req.body.quantity,
                                                                tax: tax,
                                                                totalTax: productTotalTax,
                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                paidAmount: productPaid,
                                                        }
                                                        let totalAmount = Number((findProduct.price * req.body.quantity).toFixed(2));
                                                        let paidAmount = Number(productPaid).toFixed(2);
                                                        let totalItem = findCart.totalItem + 1;
                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: Number(totalTax) }, $push: { products: obj } }, { new: true })
                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                }
                                        }
                                } else {
                                        return res.status(404).send({ status: 404, message: "Product not found." });
                                }
                        }
                        ///////////////////////////////first time add to cart//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                        else {
                                let findProduct = await Product.findById({ _id: req.body.productId });
                                if (findProduct) {
                                        if (findProduct.colorActive == true) {
                                                let findColor = await ProductColor.findOne({ productId: findProduct._id, _id: req.body.colorId });
                                                if (findColor) {
                                                        if (findColor.size == true) {
                                                                if (findColor.colorSize.length > 0) {
                                                                        for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                                if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                        let products = [], tax = 0, totalTax = 0, productTotalTax = 0;
                                                                                        if (findProduct.taxInclude == true) {
                                                                                                tax = findProduct.tax;
                                                                                                productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                        } else {
                                                                                                tax = tax;
                                                                                        }
                                                                                        totalTax = totalTax + productTotalTax;
                                                                                        let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                        let obj = {
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productColorId: findColor._id,
                                                                                                productSize: req.body.size,
                                                                                                productPrice: findProduct.price,
                                                                                                quantity: req.body.quantity,
                                                                                                tax: tax,
                                                                                                totalTax: productTotalTax,
                                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: productPaid,
                                                                                        }
                                                                                        totalTax = totalTax + (tax * req.body.quantity)
                                                                                        products.push(obj)
                                                                                        let cartObj = {
                                                                                                userId: user._id,
                                                                                                products: products,
                                                                                                tax: Number(totalTax).toFixed(2),
                                                                                                totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: Number(productPaid).toFixed(2),
                                                                                                totalItem: 1,
                                                                                        }
                                                                                        console.log(cartObj);
                                                                                        const cartCreate = await Cart.create(cartObj);
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                                                                }
                                                                        }
                                                                } else {
                                                                        return res.status(409).send({ status: 409, message: "Currently no size available." });
                                                                }
                                                        }
                                                        else {
                                                                let products = [], tax = 0, totalTax = 0;
                                                                let productTotalTax = 0;
                                                                if (findProduct.taxInclude == true) {
                                                                        tax = findProduct.tax;
                                                                        productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                } else {
                                                                        tax = tax;
                                                                }
                                                                totalTax = totalTax + productTotalTax;
                                                                let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                let obj = {
                                                                        categoryId: findProduct.categoryId,
                                                                        subcategoryId: findProduct.subcategoryId,
                                                                        productId: findProduct._id,
                                                                        productColorId: findColor._id,
                                                                        productPrice: findProduct.price,
                                                                        quantity: req.body.quantity,
                                                                        tax: tax,
                                                                        totalTax: productTotalTax,
                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                        paidAmount: Number(productPaid).toFixed(2),
                                                                }
                                                                products.push(obj)
                                                                let cartObj = {
                                                                        userId: user._id,
                                                                        products: products,
                                                                        tax: Number(totalTax).toFixed(2),
                                                                        totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                        paidAmount: Number(productPaid).toFixed(2),
                                                                        totalItem: 1,
                                                                }
                                                                const cartCreate = await Cart.create(cartObj);
                                                                return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                                        }
                                                }
                                                else {
                                                        return res.status(404).send({ status: 404, message: "Color not found." });
                                                }
                                        }
                                        else {
                                                console.log("214================");
                                                let products = [], tax = 0, totalTax = 0, productTotalTax = 0;
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                        productTotalTax = Number((((findProduct.price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                } else {
                                                        tax = tax;
                                                }
                                                totalTax = totalTax + productTotalTax;
                                                let productPaid = (Number((findProduct.price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                let obj = {
                                                        categoryId: findProduct.categoryId,
                                                        subcategoryId: findProduct.subcategoryId,
                                                        productId: findProduct._id,
                                                        productPrice: findProduct.price,
                                                        quantity: req.body.quantity,
                                                        tax: tax,
                                                        totalTax: productTotalTax,
                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        paidAmount: productPaid,
                                                }
                                                products.push(obj)
                                                let cartObj = {
                                                        userId: user._id,
                                                        products: products,
                                                        tax: Number(totalTax).toFixed(2),
                                                        totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        paidAmount: Number(productPaid).toFixed(2),
                                                        totalItem: 1,
                                                }
                                                console.log(cartObj);
                                                const cartCreate = await Cart.create(cartObj);
                                                return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                        }
                                }
                                else {
                                        return res.status(404).send({ status: 404, message: "Product not found." });
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getCart = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await Cart.findOne({ userId: user._id }).populate('products.categoryId products.subcategoryId products.productId products.productColorId');
                        if (findCart) {
                                return res.status(200).send({ status: 200, message: "Cart detail found.", data: findCart });
                        } else {
                                return res.status(400).send({ status: 400, message: "Cart detail not found.", data: {} });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.checkout = async (req, res) => {
        try {
                console.log(req.user._id);
                let findOrder = await userOrders.find({ user: req.user._id, orderStatus: "unconfirmed" });
                if (findOrder.length == 0) {
                        let findCart = await Cart.findOne({ userId: req.user._id });
                        if (findCart) {
                                let findAddress = await userAddress.findById({ _id: req.body.addressId });
                                if (findAddress) {
                                        console.log(findAddress);
                                        let orderId = await reffralCode();
                                        for (let i = 0; i < findCart.products.length; i++) {
                                                let obj = {
                                                        orderId: orderId,
                                                        userId: findCart.userId,
                                                        categoryId: findCart.products[i].categoryId,
                                                        subcategoryId: findCart.products[i].subcategoryId,
                                                        productId: findCart.products[i].productId,
                                                        productColorId: findCart.products[i].productColorId,
                                                        productSize: findCart.products[i].productSize,
                                                        productPrice: findCart.products[i].productPrice,
                                                        quantity: findCart.products[i].quantity,
                                                        tax: findCart.products[i].tax,
                                                        totalTax: findCart.products[i].totalTax,
                                                        total: findCart.products[i].total,
                                                        paidAmount: findCart.products[i].paidAmount,
                                                        company: req.user.company,
                                                        vatNumber: req.user.vatNumber,
                                                        address: findAddress.address,
                                                        addressComplement: findAddress.addressComplement,
                                                        city: findAddress.city,
                                                        pincode: findAddress.pincode,
                                                        country: findAddress.country,
                                                }
                                                const Data = await order.create(obj);
                                                if (Data) {
                                                        let findUserOrder = await userOrders.findOne({ orderId: orderId });
                                                        if (findUserOrder) {
                                                                await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $push: { Orders: Data._id } }, { new: true });
                                                        } else {
                                                                let Orders = [];
                                                                Orders.push(Data._id)
                                                                let obj1 = {
                                                                        userId: findCart.userId,
                                                                        orderId: orderId,
                                                                        Orders: Orders,
                                                                        address: findAddress.address,
                                                                        addressComplement: findAddress.addressComplement,
                                                                        city: findAddress.city,
                                                                        pincode: findAddress.pincode,
                                                                        country: findAddress.country,
                                                                        phone: findAddress.phone,
                                                                        total: findCart.totalAmount,
                                                                        totalItem: findCart.totalItem,
                                                                        tax: findCart.tax,
                                                                        paidAmount: findCart.paidAmount
                                                                };
                                                                await userOrders.create(obj1);
                                                        }
                                                }
                                        }
                                        let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                        res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                                } else {
                                        res.status(404).json({ status: 404, message: "Address not found. ", data: {} })
                                }
                        }
                } else {
                        for (let i = 0; i < findOrder.length; i++) {
                                await userOrders.findOneAndDelete({ orderId: findOrder[i].orderId });
                                let findOrders = await order.find({ orderId: findOrder[i].orderId });
                                if (findOrders.length > 0) {
                                        for (let j = 0; j < findOrders.length; j++) {
                                                await order.findByIdAndDelete({ _id: findOrders[j]._id });
                                        }
                                }
                        }
                        let findCart = await Cart.findOne({ userId: req.user._id });
                        if (findCart) {
                                let findAddress = await userAddress.find({ _id: req.body.addressId });
                                if (findAddress) {
                                        let orderId = await reffralCode();
                                        for (let i = 0; i < findCart.products.length; i++) {
                                                let obj = {
                                                        orderId: orderId,
                                                        userId: findCart.userId,
                                                        categoryId: findCart.products[i].categoryId,
                                                        subcategoryId: findCart.products[i].subcategoryId,
                                                        productId: findCart.products[i].productId,
                                                        productColorId: findCart.products[i].productColorId,
                                                        productSize: findCart.products[i].productSize,
                                                        productPrice: findCart.products[i].productPrice,
                                                        quantity: findCart.products[i].quantity,
                                                        tax: findCart.products[i].tax,
                                                        totalTax: findCart.products[i].totalTax,
                                                        total: findCart.products[i].total,
                                                        paidAmount: findCart.products[i].paidAmount,
                                                        company: req.user.company,
                                                        vatNumber: req.user.vatNumber,
                                                        address: findAddress.address,
                                                        addressComplement: findAddress.addressComplement,
                                                        city: findAddress.city,
                                                        pincode: findAddress.pincode,
                                                        country: findAddress.country,
                                                }
                                                const Data = await order.create(obj);
                                                if (Data) {
                                                        let findUserOrder = await userOrders.findOne({ orderId: orderId });
                                                        if (findUserOrder) {
                                                                await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $push: { Orders: Data._id } }, { new: true });
                                                        } else {
                                                                let Orders = [];
                                                                Orders.push(Data._id)
                                                                let obj1 = {
                                                                        userId: findCart.userId,
                                                                        orderId: orderId,
                                                                        Orders: Orders,
                                                                        address: findAddress.address,
                                                                        addressComplement: findAddress.addressComplement,
                                                                        city: findAddress.city,
                                                                        pincode: findAddress.pincode,
                                                                        country: findAddress.country,
                                                                        total: findCart.totalAmount,
                                                                        totalItem: findCart.totalItem,
                                                                        tax: findCart.tax,
                                                                        paidAmount: findCart.paidAmount
                                                                };
                                                                await userOrders.create(obj1);
                                                        }
                                                }
                                        }
                                        let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                        res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                                } else {
                                        res.status(404).json({ status: 404, message: "Address not found. ", data: {} })
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getAllOrders = async (req, res, next) => {
        try {
                const orders = await userOrders.find({ userId: req.user._id, orderStatus: "confirmed" }).populate('Orders')
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOrders = async (req, res, next) => {
        try {
                const orders = await order.find({ userId: req.user._id, orderStatus: "confirmed" }).populate([{ path: 'userId', select: 'fullName firstName lastName courtesyTitle email' }, { path: 'categoryId', select: 'name image' }, { path: 'subcategoryId', select: 'name categoryId' }, { path: 'productId', select: 'categoryId subcategoryId name description price quantity discount discountPrice taxInclude colorActive tax ratings colors numOfReviews img publicId' }, { path: 'productColorId', select: 'productId size img publicId color uantity colorSize' }])
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getOrderbyId = async (req, res, next) => {
        try {
                const orders = await order.findById({ _id: req.params.id }).populate([{ path: 'userId', select: 'fullName firstName lastName courtesyTitle email' }, { path: 'categoryId', select: 'name image' }, { path: 'subcategoryId', select: 'name categoryId' }, { path: 'productId', select: 'categoryId subcategoryId name description price quantity discount discountPrice taxInclude colorActive tax ratings colors numOfReviews img publicId' }, { path: 'productColorId', select: 'productId size img publicId color uantity colorSize' }])
                if (!orders) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.updateQuantity = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await Cart.findOne({ userId: user._id });
                        if (findCart) {
                                let products = [], count = 0, productLength = findCart.products.length;
                                for (var i = 0; i < findCart.products.length; i++) {
                                        if ((findCart.products[i]._id).toString() === req.body.products_id) {
                                                let tax = 0, totalTax = 0, total = 0, paidAmount = 0;
                                                let findProduct = await Product.findById({ _id: (findCart.products[i].productId).toString() });
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                        totalTax = findProduct.tax * req.body.quantity;
                                                        total = Number((findProduct.price * req.body.quantity).toFixed(2));
                                                        paidAmount = (findProduct.tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2))
                                                } else {
                                                        tax = tax;
                                                        totalTax = totalTax;
                                                        total = Number((findProduct.price * req.body.quantity).toFixed(2));
                                                        paidAmount = Number((findProduct.price * req.body.quantity).toFixed(2))
                                                }
                                                let obj = {
                                                        categoryId: findCart.products[i].categoryId,
                                                        subcategoryId: findCart.products[i].subcategoryId,
                                                        productId: findCart.products[i].productId,
                                                        productColorId: findCart.products[i].productColorId,
                                                        productSize: findCart.products[i].productSize,
                                                        productPrice: findCart.products[i].productPrice,
                                                        quantity: req.body.quantity,
                                                        tax: tax,
                                                        totalTax: totalTax,
                                                        total: total,
                                                        paidAmount: paidAmount,
                                                }
                                                products.push(obj)
                                                count++
                                        } else {
                                                let tax = 0, totalTax = 0, total = 0, paidAmount = 0;
                                                let findProduct = await Product.findById({ _id: (findCart.products[i].productId).toString() });
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                        totalTax = findProduct.tax * findCart.products[i].quantity;
                                                        total = Number((findProduct.price * findCart.products[i].quantity).toFixed(2));
                                                        paidAmount = (findProduct.tax * findCart.products[i].quantity) + Number((findProduct.price * findCart.products[i].quantity).toFixed(2))
                                                } else {
                                                        tax = tax;
                                                        totalTax = totalTax;
                                                        total = Number((findProduct.price * findCart.products[i].quantity).toFixed(2));
                                                        paidAmount = Number((findProduct.price * findCart.products[i].quantity).toFixed(2))
                                                }
                                                let obj = {
                                                        categoryId: findCart.products[i].categoryId,
                                                        subcategoryId: findCart.products[i].subcategoryId,
                                                        productId: findCart.products[i].productId,
                                                        productColorId: findCart.products[i].productColorId,
                                                        productSize: findCart.products[i].productSize,
                                                        productPrice: findCart.products[i].productPrice,
                                                        quantity: findCart.products[i].quantity,
                                                        tax: tax,
                                                        totalTax: totalTax,
                                                        total: total,
                                                        paidAmount: paidAmount,
                                                }
                                                products.push(obj)
                                                count++
                                        }
                                }
                                console.log(products);
                                if (count == productLength) {
                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { products: products } }, { new: true });
                                        if (update) {
                                                let totalAmount = 0, totalTax = 0, paidAmount = 0;
                                                for (let j = 0; j < update.products.length; j++) {
                                                        totalAmount = totalAmount + update.products[j].total,
                                                                totalTax = totalTax + update.products[j].totalTax,
                                                                paidAmount = paidAmount + update.products[j].paidAmount
                                                }
                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { totalAmount: totalAmount, paidAmount: paidAmount, tax: totalTax, totalItem: update.products.length } }, { new: true });
                                                return res.status(200).json({ status: 200, message: "cart update Successfully.", data: update1 })
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Cart not found." });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.deleteProductfromCart = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await Cart.findOne({ userId: user._id });
                        if (findCart) {
                                let products = [], count = 0;
                                for (let i = 0; i < findCart.products.length; i++) {
                                        if ((findCart.products[i]._id).toString() != req.params.cartProductId) {
                                                products.push(findCart.products[i])
                                                count++
                                        }
                                }
                                if (count == findCart.products.length - 1) {
                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { products: products } }, { new: true });
                                        if (update) {
                                                let totals = 0;
                                                for (let j = 0; j < update.products.length; j++) {
                                                        totals = totals + update.products[j].total
                                                }
                                                console.log(totals);
                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { totalAmount: totals, paidAmount: totals, totalItem: products.length } }, { new: true });
                                                return res.status(200).json({ status: 200, message: "Product delete from cart Successfully.", data: update1 })
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Cart not found." });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.deleteCart = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ status: 404, message: "User not found or token expired." });
                } else {
                        let findCart = await Cart.findOne({ userId: user._id });
                        if (findCart) {
                                await Cart.findByIdAndDelete({ _id: findCart._id });
                                let findCarts = await Cart.findOne({ userId: user._id });
                                if (findCarts) {
                                        return res.status(200).json({ status: 200, message: "cart not delete.", data: findCarts })
                                } else {
                                        return res.status(200).json({ status: 200, message: "cart delete Successfully.", data: {} })
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Cart not found." });
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.placeOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let line_items = [];
                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                if (findu) {
                                        let findProduct = await Product.findById({ _id: findu.productId });
                                        if (findProduct) {
                                                let price = Number(findu.paidAmount);
                                                console.log(price);
                                                let obj2 = {
                                                        price_data: {
                                                                currency: "gbp",
                                                                product_data: {
                                                                        name: `${findProduct.name}`,
                                                                },
                                                                unit_amount: `${Math.round(price * 100)}`,
                                                        },
                                                        quantity: 1,
                                                }
                                                line_items.push(obj2)
                                        }
                                }
                        }
                        const session = await stripe.checkout.sessions.create({
                                payment_method_types: ["card"],
                                success_url: `https://krishwholesale.co.uk/order-success/${findUserOrder.orderId}`,
                                cancel_url: `https://krishwholesale.co.uk/order-failure/${findUserOrder.orderId}`,
                                customer_email: req.user.email,
                                client_reference_id: findUserOrder.orderId,
                                line_items: line_items,
                                mode: "payment",
                        });
                        res.status(200).json({ status: "success", session: session, });
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.cancelOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        res.status(201).json({ message: "Payment failed.", status: 201, orderId: req.params.orderId });
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.successOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        const user = await User.findById({ _id: findUserOrder.userId });
                        if (!user) {
                                return res.status(404).send({ status: 404, message: "User not found or token expired." });
                        }
                        await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                        let line_items = [], TotalQua = 0;
                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                if (findu) {
                                        await order.findByIdAndUpdate({ _id: findu._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                        let product, description, color, obj2;
                                        let findProduct = await Product.findById({ _id: findu.productId });
                                        if (findProduct) {
                                                product = findProduct.name;
                                                description = findProduct.description;
                                        }
                                        if (findu.productColorId != (null || undefined)) {
                                                let findColor = await ProductColor.findOne({ _id: findu.productColorId });
                                                if (findColor) {
                                                        color = findColor.color;
                                                        obj2 = {
                                                                product: product,
                                                                description: description,
                                                                ProductColor: color,
                                                                productSize: findu.productSize || "",
                                                                productPrice: findu.productPrice,
                                                                quantity: findu.quantity,
                                                                tax: findu.tax,
                                                                totalTax: findu.totalTax,
                                                                paidAmount: findu.paidAmount,
                                                                total: findu.total,
                                                        }
                                                        TotalQua = TotalQua + findu.quantity;
                                                        line_items.push(obj2)
                                                }
                                        } else {
                                                obj2 = {
                                                        product: product,
                                                        description: description,
                                                        productPrice: findu.productPrice,
                                                        quantity: findu.quantity,
                                                        tax: findu.tax,
                                                        totalTax: findu.totalTax,
                                                        paidAmount: findu.paidAmount,
                                                        total: findu.total
                                                }
                                                line_items.push(obj2)
                                                TotalQua = TotalQua + findu.quantity;
                                        }
                                }
                        }
                        let hr = new Date(Date.now()).getHours();
                        let date = new Date(Date.now()).getDate();
                        if (date < 10) {
                                date = '' + 0 + parseInt(date);
                        } else {
                                date = parseInt(date);
                        }
                        let month = new Date(Date.now()).getMonth() + 1;
                        if (month < 10) {
                                month = '' + 0 + parseInt(month);
                        } else {
                                month = parseInt(month);
                        }
                        let year = new Date(Date.now()).getFullYear();
                        let fullDate = (`${date}/${month}/${year}`).toString();
                        let min = new Date(Date.now()).getMinutes();
                        if (hr < 10) {
                                hr = '' + 0 + parseInt(hr);
                        } else {
                                hr = parseInt(hr);
                        }
                        if (min < 10) {
                                min = '' + 0 + parseInt(min);
                        } else {
                                min = parseInt(min);
                        }
                        let findcontactDetails = await contact.findOne({});
                        if (!findcontactDetails) {
                                return res.status(404).json({ message: "Contact detail not found.", status: 404, data: {} });
                        }
                        const tableArray0 = {
                                headers: ["", "","","",""],
                                title: "KRISH BUSINESS SERVICE LTD",
                                subtitle: "UNIT 7, NEW MAN ROAD CROYDON CR0 3JX Mob:07472078196",
                        };
                        doc.table(tableArray0, { Height: 250, width: 560 }); // A4 595.28 x 841.89 (portrait) (about width sizes)
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        let table1 = [
                                ["Day: 1", "", "", "", "", "Invoice No: ", `${findUserOrder.orderId}`],
                                [`${findUserOrder.address}${findUserOrder.city}`, "", "", "", "", "Invoice Date :", `${fullDate} ${hr}:${min}`],
                                [`${findUserOrder.country} ${findUserOrder.pincode}`, "", "", "", "", "Cusstomer Acc :", `233445`],
                                [`Tel: ${user.phone|| "XXXXX"}`, "", "","", "", "Cashier :", `SS`],
                                [`VAT NO:${user.vatNumber || "XXXXX"}`, "", "", "", "", "POS ID :", `0`],
                        ]
                        const tableArray = {
                                headers: ["INVOICE To", "", "", "", "", "", "INVOICE", ""],
                                rows: table1,
                        };
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.table(tableArray, { width: 536 }); // A4 595.28 x 841.89 (portrait) (about width sizes)
                        const table = {
                                headers: [
                                        { label: "#", property: 'Sno', width: 15, renderer: null },
                                        { label: "Description", property: 'product', width: 200, renderer: null },
                                        { label: "Color", property: 'ProductColor', width: 55, renderer: null },
                                        { label: "Qty", property: 'quantity', width: 55, renderer: null },
                                        {
                                                label: "Price", property: 'productPrice', width: 35,
                                                renderer: (value, indexColumn, indexRow, row) => { return `${Number(value).toFixed(2)}` }
                                        },
                                        {
                                                label: "Amount", property: 'total', width: 55,
                                                renderer: (value, indexColumn, indexRow, row) => { return `${Number(value).toFixed(2)}` }
                                        },
                                        {
                                                label: "VAT", property: 'totalTax', width: 55,
                                                renderer: (value, indexColumn, indexRow, row) => { return `${Number(value).toFixed(2)}` }
                                        },
                                        { label: "V Code", property: 'productSize', width: 55, renderer: null },
                                ],
                                datas: line_items,
                        };
                        doc.moveDown();
                        doc.moveDown();
                        doc.table(table, {
                                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                                prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(8),
                        });
                        let table3 = [
                                ["On Trolley", "1", "Items Type", `${line_items.length}`, "Total", `${TotalQua}`],
                        ]
                        const tableArray3 = {
                                headers: ["", "", "", "", "", ""],
                                rows: table3,
                        };
                        doc.table(tableArray3, { width: 250, x: 300, y: 0 });
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();     
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        let table13 = [  
                                 ["HSBC",  "Z=0 % S=20 %", "R=5 %", "",  "",  "AMOUNT","","VAT AMOUNT"],
                                 ["KRISH Business", "Service Ltd", "", "",  "", `£${findUserOrder?.total}`,"",`£${findUserOrder?.tax}`],
                                 ["Sort Code:","40-46-15", "", "", "", "Delivery Charges", "", `TOTAL TO PAY`],
                                 ["Acc No:81440977", "", "", "","",  "0", "", `£${findUserOrder?.paidAmount}`],
                        ]
                        const tableArray4 = {
                                headers: ["", "", "", "", "", "", "", ""],
                                rows: table13,
                        };
                        doc.table(tableArray4, { width: 550, x: 10, y: 0 }); 
                        let table14 = [  
                                ["","VAT NO: GB", "350971689", "CO RegNo:", "1139394", "AWRS NO:", "XVAW00000113046", ""]
                                               ]
                       const tableArray5 = {
                        headers: ["", "", "", "", "", "", "", ""],
                        rows: table14,
                       };
                       doc.table(tableArray5, { width: 550, x: 10, y: 0 }); 
                       let table15 = [  
                        ["GOODS WITHOUT ENGLISH INGREDIENTS","SHOULD BE LABELLED ACCORDINGLY","BEFORE SALE"],
                        ["The goods once sold will not be returnable unless" ,"agreed. Pallet must be returned or a charge will be","made"]
                                       ]
               const tableArray6 = {
                headers: [ "","THANK YOU FOR YOUR VALUE CUSTOM","",  ""],
                rows: table15,
               };
               doc.table(tableArray6, { width: 550, x: 10, y: 0 }); 

                        let pdfBuffer = await new Promise((resolve) => {
                                let chunks = [];
                                doc.on('data', (chunk) => chunks.push(chunk));
                                doc.on('end', () => resolve(Buffer.concat(chunks)));
                                doc.end();
                        });
                        let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                        "user": "krishvapes@gmail.com",
                                        "pass": "fggmdyhrilxhmyig"
                                }
                        });
                        var mailOptions = {
                                from: "<do_not_reply@gmail.com>",
                                to: `${user.email}`,
                                subject: 'PDF Attachment',
                                text: 'Please find the attached PDF.',
                                attachments: {
                                        filename: 'document.pdf',
                                        content: pdfBuffer,
                                        contentType: 'application/pdf',
                                },
                        };
                        let info = await transporter.sendMail(mailOptions);
                        if (info) {
                                var mailOptions1 = {
                                        from: "<do_not_reply@gmail.com>",
                                        to: `krishvapes@gmail.com`,
                                        subject: 'Order Received',
                                        text: `New order has been recived orderId ${findUserOrder.orderId}`,
                                };
                                let info1 = await transporter.sendMail(mailOptions1);
                                if (info1) {
                                        await Cart.findOneAndDelete({ userId: req.user._id });
                                        res.status(200).json({ message: "Payment success.", status: 200, data: {} });
                                }
                        } else {
                                await Cart.findOneAndDelete({ userId: req.user._id });
                                res.status(200).json({ message: "Payment success.", status: 200, data: {} });
                        }
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }

        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let OTP = '';
        for (let i = 0; i < 9; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}

// exports.successOrder1 = async (req, res) => {
//         try {
//                 let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
//                 if (findUserOrder) {
//                         const user = await User.findById({ _id: req.user._id });
//                         if (!user) {
//                                 return res.status(404).send({ status: 404, message: "User not found or token expired." });
//                         }
//                         await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                         let line_items = [], total = findUserOrder.paidAmount, paidAmount = findUserOrderpaidAmount, tax = findUserOrder.tax, TotalQua = 0, address = findUserOrder.address, pincode = findUserOrder?.pincode, city = findUserOrder?.city, country = findUserOrder?.country;
//                         let date = "35+";
//                         for (let i = 0; i < findUserOrder.Orders.length; i++) {
//                                 let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
//                                 if (findu) {
//                                         await order.findByIdAndUpdate({ _id: findu._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                                         let product, description, color, obj2;
//                                         let findProduct = await Product.findById({ _id: findu.productId });
//                                         if (findProduct) {
//                                                 product = findProduct.name;
//                                                 description = findProduct.description;
//                                         }
//                                         if (findu.productColorId != (null || undefined)) {
//                                                 let findColor = await ProductColor.findOne({ _id: findu.productColorId });
//                                                 if (findColor) {
//                                                         color = findColor.color;
//                                                         obj2 = {
//                                                                 Sno: i + 1,
//                                                                 product: product,
//                                                                 description: description,
//                                                                 ProductColor: color,
//                                                                 productSize: findu.productSize || "",
//                                                                 productPrice: findu.productPrice,
//                                                                 quantity: findu.quantity,
//                                                                 tax: findu.tax,
//                                                                 totalTax: findu.totalTax,
//                                                                 paidAmount: findu.paidAmount,
//                                                                 total: findu.total,
//                                                         }
//                                                         TotalQua = TotalQua + findu.quantity;
//                                                         line_items.push(obj2)
//                                                 }
//                                         } else {
//                                                 obj2 = {
//                                                         Sno: i + 1,
//                                                         product: product,
//                                                         description: description,
//                                                         productPrice: findu.productPrice,
//                                                         quantity: findu.quantity,
//                                                         tax: findu.tax,
//                                                         totalTax: findu.totalTax,
//                                                         paidAmount: findu.paidAmount,
//                                                         total: findu.total
//                                                 }
//                                                 line_items.push(obj2)
//                                                 TotalQua = TotalQua + findu.quantity;
//                                         }
//                                 }
//                         }
//                         let html = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
//                         <head>
//                         <!--[if gte mso 9]>
//                         <xml>
//                           <o:OfficeDocumentSettings>
//                             <o:AllowPNG/>
//                             <o:PixelsPerInch>96</o:PixelsPerInch>
//                           </o:OfficeDocumentSettings>
//                         </xml>
//                         <![endif]-->
//                           <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
//                           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                           <meta name="x-apple-disable-message-reformatting">
//                           <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
//                           <title></title>
                          
//                             <style type="text/css">
//                               table, td { color: #000000; } @media only screen and (min-width: 670px) {
//                           .u-row {
//                             width: 650px !important;
//                           }
//                           .u-row .u-col {
//                             vertical-align: top;
//                           }
                        
//                           .u-row .u-col-100 {
//                             width: 650px !important;
//                           }
                        
//                         }
                        
//                         @media (max-width: 670px) {
//                           .u-row-container {
//                             max-width: 100% !important;
//                             padding-left: 0px !important;
//                             padding-right: 0px !important;
//                           }
//                           .u-row .u-col {
//                             min-width: 320px !important;
//                             max-width: 100% !important;
//                             display: block !important;
//                           }
//                           .u-row {
//                             width: calc(100% - 40px) !important;
//                           }
//                           .u-col {
//                             width: 100% !important;
//                           }
//                           .u-col > div {
//                             margin: 0 auto;
//                           }
//                         }
//                         body {
//                           margin: 0;
//                           padding: 0;
//                         }
                        
//                         table,
//                         tr,
//                         td {
//                           vertical-align: top;
//                           border-collapse: collapse;
//                         }
                        
//                         p {
//                           margin: 0;
//                         }
                        
//                         .ie-container table,
//                         .mso-container table {
//                           table-layout: fixed;
//                         }
                        
//                         * {
//                           line-height: inherit;
//                         }
                        
//                         a[x-apple-data-detectors='true'] {
//                           color: inherit !important;
//                           text-decoration: none !important;
//                         }
                        
//                         </style>
                          
                          
                        
//                         <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->
                        
//                         </head>
                        
//                         <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #ffffff;color: #000000">
//                           <!--[if IE]><div class="ie-container"><![endif]-->
//                           <!--[if mso]><div class="mso-container"><![endif]-->
//                           <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ffffff;width:100%" cellpadding="0" cellspacing="0">
//                           <tbody>
//                           <tr style="vertical-align: top">
//                             <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
//                             <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #ffffff;"><![endif]-->
                            
                        
//                         <div class="u-row-container" style="padding: 0px;background-color: transparent">
//                           <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 650px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #dff1ff;">
//                             <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
//                               <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:650px;"><tr style="background-color: #dff1ff;"><![endif]-->
                              
//                         <!--[if (mso)|(IE)]><td align="center" width="650" style="background-color: #ffffff;width: 650px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
//                         <div class="u-col u-col-100" style="max-width: 320px;min-width: 650px;display: table-cell;vertical-align: top;">
//                           <div style="background-color: #ffffff;width: 100% !important;">
//                           <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
                          
//                         <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
//                           <tbody>
//                             <tr>
//                               <td style="overflow-wrap:break-word;word-break:break-word;padding:13px 0px 15px;font-family:'Montserrat',sans-serif;" align="left">
                                
//                         <table width="100%" cellpadding="0" cellspacing="0" border="0">
//                           <tr>
//                             <td style="padding-right: 0px;padding-left: 0px;" align="center">
                             
//                             <img align="center" border="0"
//                             src="https://res.cloudinary.com/listyourpics/image/upload/v1653630166/i0fugotwu56jouwyrmje.png"
//                             alt="Image" title="Image"
//                             style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 54%;max-width: 100px;"
//                             width="100" />
                              
//                             </td>
//                           </tr>
//                         </table>
                        
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
                        
//                           <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
//                           </div>
//                         </div>
//                         <!--[if (mso)|(IE)]></td><![endif]-->
//                               <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
//                             </div>
//                           </div>
//                         </div>
                        
                        
                        
//                         <div class="u-row-container" style="padding: 0px;background-color: transparent">
//                           <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 650px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #f3fbfd;">
//                             <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
//                               <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:650px;"><tr style="background-color: #f3fbfd;"><![endif]-->
                              
//                         <!--[if (mso)|(IE)]><td align="center" width="650" style="width: 650px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
//                         <div class="u-col u-col-100" style="max-width: 320px;min-width: 650px;display: table-cell;vertical-align: top;">
//                           <div style="width: 100% !important;">
//                           <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
                          
//                         <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
//                           <tbody>
//                             <tr>
//                               <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Montserrat',sans-serif;" align="left">
                                
//                           <div style="color: #1b262c; line-height: 140%; text-align: center; word-wrap: break-word;">
//                             <p style="font-size: 14px; line-height: 140%;"><strong><span style="font-size: 24px; line-height: 33.6px;">Welcome to ListYourPics</span></strong></p>
//                           </div>
                        
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
                        
//                         <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
//                           <tbody>
//                             <tr>
//                               <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 50px 20px;font-family:'Montserrat',sans-serif;" align="left">
                                
//                           <div style="color: #1b262c; line-height: 140%; text-align: left; word-wrap: break-word;">
//                             <p style="font-size: 14px; line-height: 140%;">
//                             Dear ${userName},
//                             <br><br>
//                             OTP for your E-mail verification is  ${text}. Please use this  OTP (One-Time-Password) to login to your own ListYourPics and access the unlimited possibilities of ListYourPics.
//                             <br><br>
//                             This OTP is valid for the next 05 minutes and can be used only once.<br><br>
                    
//                             <br><br>
//                             Thanks and regards <br>
//                             Team Listyourpic
//                             </p>
//                           </div>
                        
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
                        
//                           <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
//                           </div>
//                         </div>
//                         <!--[if (mso)|(IE)]></td><![endif]-->
//                               <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
//                             </div>
//                           </div>
//                         </div>
                        
                        
                        
//                         <div class="u-row-container" style="padding: 0px;background-color: transparent">
//                           <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 650px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #151418;">
//                             <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
//                               <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:650px;"><tr style="background-color: #151418;"><![endif]-->
                              
//                         <!--[if (mso)|(IE)]><td align="center" width="650" style="width: 650px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
//                         <div class="u-col u-col-100" style="max-width: 320px;min-width: 650px;display: table-cell;vertical-align: top;">
//                           <div style="width: 100% !important;">
//                           <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
                          
//                         <table style="font-family:'Montserrat',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
//                           <tbody>
//                             <tr>
//                               <td style="overflow-wrap:break-word;word-break:break-word;padding:18px;font-family:'Montserrat',sans-serif;" align="left">
                                
//                           <div style="color: #ffffff; line-height: 140%; text-align: center; word-wrap: break-word;">
//                             <p dir="rtl" style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;">Copyright @ 2022 ListYourPics | All RIghts Reserved</span></p>
//                           </div>
                        
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
                        
//                           <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
//                           </div>
//                         </div>
//                         <!--[if (mso)|(IE)]></td><![endif]-->
//                               <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
//                             </div>
//                           </div>
//                         </div>
                        
                        
//                             <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
//                             </td>
//                           </tr>
//                           </tbody>
//                           </table>
//                           <!--[if mso]></div><![endif]-->
//                           <!--[if IE]></div><![endif]-->
//                         </body>
//                         </html>`

//                         let options = { format: 'A4' };
//                         let file = { content: html };
//                         html_to_pdf.generatePdf(file, options).then(async pdfBuffer => {
//                                 let transporter = nodemailer.createTransport({
//                                         service: 'gmail',
//                                         auth: {
//                                                 "user": "krishvapes@gmail.com",
//                                                 "pass": "fggmdyhrilxhmyig"
//                                         }
//                                 });
//                                 var mailOptions = {
//                                         from: "<do_not_reply@gmail.com>",
//                                         to: `vcjagal1994@gmail.com`,
//                                         subject: 'PDF Attachment',
//                                         text: 'Please find the attached PDF.',
//                                         attachments: {
//                                                 filename: 'document.pdf',
//                                                 content: pdfBuffer,
//                                                 contentType: 'application/pdf',
//                                         },
//                                 };
//                                 let info = await transporter.sendMail(mailOptions);
//                                 if (info) {
//                                         var mailOptions1 = {
//                                                 from: "<do_not_reply@gmail.com>",
//                                                 to: `krishvapes@gmail.com`,
//                                                 subject: 'Order Received',
//                                                 text: `New order has been recived orderId`,
//                                         };
//                                         let info1 = await transporter.sendMail(mailOptions1);
//                                         if (info1) {
//                                                 res.status(200).json({ message: "Payment success.", status: 200, data: {} });
//                                         }
//                                 } else {
//                                         res.status(200).json({ message: "Payment success.", status: 200, data: {} });
//                                 }
//                         });
//                 } else {
//                         return res.status(404).json({ message: "No data found", data: {} });
//                 }


//         } catch (error) {
//                 console.log(error);
//                 res.status(501).send({ status: 501, message: "server error.", data: {}, });
//         }
// };
// exports.successOrder3 = async (req, res) => {
//         try {
//                 let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
//                 if (findUserOrder) {
//                         const user = await User.findById({ _id: req.user._id });
//                         if (!user) {
//                                 return res.status(404).send({ status: 404, message: "User not found or token expired." });
//                         }
//                         await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                         let line_items = [], total = findUserOrder.paidAmount, paidAmount = findUserOrder.paidAmount, tax = findUserOrder.tax, TotalQua = 0, address = findUserOrder.address, pincode = findUserOrder?.pincode, city = findUserOrder?.city, country = findUserOrder?.country;
//                         let date = "35+", orderId = req.params.orderId;
//                         for (let i = 0; i < findUserOrder.Orders.length; i++) {
//                                 let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
//                                 if (findu) {
//                                         await order.findByIdAndUpdate({ _id: findu._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                                         let product, description, color, obj2;
//                                         let findProduct = await Product.findById({ _id: findu.productId });
//                                         if (findProduct) {
//                                                 product = findProduct.name;
//                                                 description = findProduct.description;
//                                         }
//                                         if (findu.productColorId != (null || undefined)) {
//                                                 let findColor = await ProductColor.findOne({ _id: findu.productColorId });
//                                                 if (findColor) {
//                                                         color = findColor.color;
//                                                         obj2 = {
//                                                                 Sno: i + 1,
//                                                                 product: product,
//                                                                 description: description,
//                                                                 ProductColor: color,
//                                                                 productSize: findu.productSize || "",
//                                                                 productPrice: findu.productPrice,
//                                                                 quantity: findu.quantity,
//                                                                 tax: findu.tax,
//                                                                 totalTax: findu.totalTax,
//                                                                 paidAmount: findu.paidAmount,
//                                                                 total: findu.total,
//                                                         }
//                                                         TotalQua = TotalQua + findu.quantity;
//                                                         line_items.push(obj2)
//                                                 }
//                                         } else {
//                                                 obj2 = {
//                                                         Sno: i + 1,
//                                                         product: product,
//                                                         description: description,
//                                                         productPrice: findu.productPrice,
//                                                         quantity: findu.quantity,
//                                                         tax: findu.tax,
//                                                         totalTax: findu.totalTax,
//                                                         paidAmount: findu.paidAmount,
//                                                         total: findu.total
//                                                 }
//                                                 line_items.push(obj2)
//                                                 TotalQua = TotalQua + findu.quantity;
//                                         }
//                                 }
//                         }
//                         let html = `<!DOCTYPE HTML
//                         PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
//                       <head>
//                         <style type="text/css">
//                           body {
//                             margin: 0;
//                             padding: 0;
//                           }
                      
//                           @media screen {
//                             .Heading-Container {
//                               display: flex;
//                               align-items: center;
//                             }
                      
//                             .Heading-Container img {
//                               width: 100px;
//                             }
                      
//                             .Heading-Container .content {
//                                 width: 80%;
//                                 text-align: center;
//                               }
                      
//                             .Heading-Container .content1 {
//                               width: 10%;
//                               text-align: center;
//                             }
                      
//                             .Heading-Container .content2 {
//                               width: 10%;
//                               text-align: center;
//                               padding-left: 50rem;
//                             }
                      
//                             .Heading-Container .content h2 {
//                               margin: 0;
//                               font-weight: bold;
//                               font-size: 25px;
//                             }
                      
//                             .Heading-Container .content p {
//                               margin: 0;
//                               font-size: 14px;
//                               font-weight: 600;
//                               color: #a8a1a1;
//                             }
                      
//                             .two-cont {
//                               display: flex;
//                               justify-content: space-between;
//                               padding-top: 10px;
//                               gap: 50px;
//                               padding-left: 3rem;
//                               padding-right: 3rem;
//                             }
                      
//                             .two-cont p {
//                               margin: 0;
//                             }
                      
//                             .two-cont .left {
//                               width: 40%;
//                             }
                      
//                             .two-cont .left h6 {
//                               font-size: 14px;
//                               font-weight: bold;
//                             }
                      
//                             .two-cont .left .box {
//                               border: 2px solid black;
//                               width: 100%;
//                               padding: 8px;
//                             }
                      
//                             .two-cont .left .box p {
//                               font-size: 15px;
//                             }
                      
//                             .two-cont .left .box .strong {
//                               font-weight: bold;
//                             }
                      
//                             .two-cont .left .box p {
//                               font-weight: 600;
//                             }
                      
//                             .two-cont .right {
//                               width: 60%;
//                               border: 2px solid black;
//                               padding: 10px;
//                             }
                      
//                             .two-cont .right table {
//                               width: 100%;
//                               table-layout: fixed;
//                             }
                      
//                             .two-cont .right td {
//                               font-weight: 900 !important;
//                               padding: 5px;
//                             }
                      
//                             .empty {
//                               background-color: #000;
//                               height: 2px;
//                               margin-top: 20px;
//                             }
                      
//                             .Table {
//                               width: 100%;
//                               margin-top: 0px;
//                               padding-left: 3rem;
//                               padding-right: 3rem;
//                             }
                      
//                             .Table tbody tr {
//                               border: 1px solid black;
//                             }
                      
//                             .Table tbody tr td {
//                               padding: 5px;
//                               padding-bottom: 10px;
//                             }
                      
//                             .Main_Table {
//                               display: flex;
//                               justify-content: flex-end;
//                               align-items: center;
//                               padding-top: 10px;
//                               gap: 49px;
//                               align-items: center;
//                               padding-right: 10rem;
//                             }
                      
//                             .Main_Table p {
//                               font-weight: 900;
//                             }
//                             .below_Div .four-sec {
//                               display: flex;
//                               justify-content: space-evenly;
//                               border-top: 2px solid black;
//                               border-bottom: 2px solid black;
//                               padding: 4px;
//                             }
                      
//                             .below_Div .four-sec p {
//                               margin: 0;
//                               font-size: 13px;
//                               text-align: center;
//                             }
                      
//                             .below_Div .four-sec .stronger {
//                               font-weight: bold;
//                             }
                      
                      
//                             .below_Div .four-sec1 {
//                               display: flex;
//                               justify-content: space-evenly;
//                               border-top: 2px solid black;
//                               border-bottom: 2px solid black;
//                               padding: 10px;
//                               margin-top: 16rem;
//                             }
                      
//                             .below_Div .four-sec1 p {
//                               margin: 0;
//                               font-size: 13px;
//                               text-align: center;
//                             }
                      
//                             .below_Div .four-sec1 .stronger {
//                               font-weight: bold;
//                             }
                      
//                             .below_Div .big_Head {
//                               font-size: 25px;
//                               background-color: #85827b;
//                               text-align: center;
//                               font-weight: bold;
//                               color: #fff;
//                               padding: 0;
//                               margin: 0;
//                               padding-bottom: 10px;
//                             }
                      
//                             .below_Div .text-cont p {
//                               margin: 0;
//                               font-weight: 700;
//                               font-size: 14px;
//                               color: #85827b;
//                             }
                      
//                             .below_Div .text-cont {
//                               text-align: center;
//                             }
                      
//                             .below_Div .text-cont h5 {
//                               margin: 0;
//                               font-weight: 900;
//                             }
                      
//                             .so2 {
//                               width: 100%;
//                             }
                      
//                             .so4 {
//                               display: flex;
//                               justify-content: space-between;
//                             }
                      
//                             .so4 p {
//                               margin: 0;
//                             }
                      
//                             .so5 {
//                               margin-top: 20px;
//                               width: 98;
//                               margin-left: 1%;
//                             }
                      
//                             .so5 table {
//                               width: 100%;
//                             }
                      
//                             .so5 table th,
//                             td {
//                               font-size: 13px;
//                               font-weight: 600;
//                             }
                      
//                             .so6 {
//                               margin-top: 40px;
//                               margin-left: 65%;
//                               width: 30%;
//                             }
                      
//                             .so7 {
//                               display: flex;
//                               justify-content: space-between;
//                               width: 80%;
//                             }
                      
//                             .so7 p {
//                               margin: 0;
//                             }
                      
                      
                      
//                           }
//                         </style>
//                       </head>
                      
//                       <body>
//                         <div class="upper-div">
//                           <div class="Heading-Container">
//                             <img class="content1"
//                               src='https://res.cloudinary.com/djgrqoefp/image/upload/v1691481341/images/banner/yi9qnnqetchhn7n5ogr9.png'
//                               alt="" />
//                             <div class="content">
//                               <h2>KRISH BUSINESS SERVICE LTD</h2>
//                               <p>UNIT 7, NEW MAN ROAD CROYDON CR0 3JX Mob:07472078196</p>
//                             </div>
//                           </div>
//                           <div class="Heading-Container">
//                             <!-- <img src="" alt="" /> -->
//                             <div class="content2">
//                               <h2>INVOICE</h2>
//                             </div>
//                           </div>
                      
//                           <div class="two-cont">
//                             <div class="left">
//                               <h6>INVOICE TO </h6>
//                               <div class="box">
//                                 <p class="strong">Address : </p>
//                                 <p style={{ textTransform: "capitalize" }}>
//                                   {" "}
//                                   ${address} , ${pincode} , ${city} ,{" "}
//                                   ${country}{" "}
//                                 </p>
//                                 <p class="strong"> Tel : </p>
//                                 <p class="strong"> VAT Number : </p>
//                               </div>
//                             </div>
                      
//                             <div class="right">
//                               <table>
//                                 <tbody>
//                                   <tr>
//                                     <td class="bordererd">INVOICE NO </td>
//                                     <td class="text-center"> ${orderId} </td>
//                                   </tr>
//                                   <tr>
//                                     <td class="bordererd">INVOICE DATE </td>
//                                     <td class="text-center">
//                                       {" "}
//                                       ${date}{" "}
//                                     </td>
//                                   </tr>
//                                   <tr>
//                                     <td class="bordererd">CUSTOMER ACC </td>
//                                     <td class="text-center">10307</td>
//                                   </tr>
//                                   <tr>
//                                     <td class="bordererd">CASHIER </td>
//                                     <td class="text-center"> SS </td>
//                                   </tr>
//                                   <tr>
//                                     <td class="bordererd">POS ID </td>
//                                     <td class="text-center">0 </td>
//                                   </tr>
//                                 </tbody>
//                               </table>
//                             </div>
//                           </div>
                      
//                           <div class="empty"></div>
                      
//                           <table class="Table">
//                             <thead>
//                               <tr>
//                                 <th style={{ padding: "10px" }}>#</th>
//                                 <th>DESCRIPTION</th>
//                                 <th>QTY</th>
//                                 <th>PRICE</th>
//                                 <th>AMOUNT</th>
//                                 <th>VAT</th>
//                                 <th>V CODE </th>
//                               </tr>
//                             </thead>
//                             <tbody>
                           
//                             </tbody>
//                           </table>
                      
//                           <div class="Main_Table">
//                             <p>On Trolley </p>
//                             <p>1</p>
//                             <p>Item Type</p>
//                             <p> ${TotalQua} </p>
//                             <p>Total</p>
//                             <p>{calculateTotalQuantity()}</p>
//                           </div>
//                         </div>
                      
//                         <div class="below_Div">
//                           <div class="four-sec1">
//                             <p class="stronger">
//                               HSBC <br />
//                               KRISH Business Service Ltd
//                               <br />
//                               Sort Code:40-46-15
//                               <br />
//                               Acc No:81440977
//                             </p>
                      
//                             <p> Z=0 % S=20 % R=5 % </p>
                      
//                             <p class="stronger">
//                               AMOUNT <br />£${total}
//                               <br />
//                               DELIVERY CHARGES
//                               <br />0
//                             </p>
                      
//                             <p class="stronger">
//                               VAT AMOUNT <br />£${tax}
//                               <br />
//                               TOTAL TO PAY
//                               <br />£${paidAmount}
//                             </p>
//                           </div>
//                           <div class="four-sec">
//                             <p> VAT NO: GB 350971689 </p>
//                             <p>CO RegNo : 1139394 </p>
//                             <p> AWRS NO:XVAW00000113046 </p>
//                           </div>
                      
//                           <p class="big_Head">THANK YOU FOR YOUR VALUED CUSTOM</p>
                      
//                           <div class="text-cont">
//                             <h5>
//                               GOODS WITHOUT ENGLISH INGREDIENTS SHOULD BE LABELLED ACCORDINGLY
//                               BEFORE SALE
//                             </h5>
//                             <p>
//                               The goods once sold will not be returnable unless agreed. Pallet
//                               must be returned or a charge will be made
//                             </p>
//                           </div>
//                         </div>
//                         </div>
//                       </body>
                      
//                       </html>`



//                         let options = { format: 'A4' };
//                         let file = { content: html };

//                         html_to_pdf.create(file, options).toBuffer((err, buffer) => {
//                                 if (err) {
//                                         res.json(responses.genericError(500, 'Internal server error.'));
//                                 } else {
//                                         console.log("---------------------------------------");
//                                         res.type('application/pdf');

//                                 }
//                         })







//                         html_to_pdf.generatePdf(file, options)
//                                 .then(async pdfBuffer => {
//                                         console.log("---------------------------------------");
//                                         // let transporter = nodemailer.createTransport({
//                                         //         service: 'gmail',
//                                         //         auth: {
//                                         //                 "user": "krishvapes@gmail.com",
//                                         //                 "pass": "fggmdyhrilxhmyig"
//                                         //         }
//                                         // });
//                                         // var mailOptions = {
//                                         //         from: "<do_not_reply@gmail.com>",
//                                         //         to: `vcjagal1994@gmail.com`,
//                                         //         subject: 'PDF Attachment',
//                                         //         text: 'Please find the attached PDF.',
//                                         //         attachments: {
//                                         //                 filename: 'document.pdf',
//                                         //                 content: pdfBuffer,
//                                         //                 contentType: 'application/pdf',
//                                         //         },
//                                         // };
//                                         // let info = await transporter.sendMail(mailOptions);
//                                         // if (info) {
//                                         //         var mailOptions1 = {
//                                         //                 from: "<do_not_reply@gmail.com>",
//                                         //                 to: `krishvapes@gmail.com`,
//                                         //                 subject: 'Order Received',
//                                         //                 text: `New order has been recived orderId`,
//                                         //         };
//                                         //         let info1 = await transporter.sendMail(mailOptions1);
//                                         //         if (info1) {
//                                         //                 res.status(200).json({ message: "Payment success.", status: 200, data: {} });
//                                         //         }
//                                         // } else {
//                                         //         res.status(200).json({ message: "Payment success.", status: 200, data: {} });
//                                         // }
//                                 }).catch(async error => {
//                                         console.log("error", error);
//                                 });
//                 } else {
//                         return res.status(404).json({ message: "No data found", data: {} });
//                 }


//         } catch (error) {
//                 console.log(error);
//                 res.status(501).send({ status: 501, message: "server error.", data: {}, });
//         }
// };

// exports.successOrder2 = async (req, res) => {
//         try {
//                 let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
//                 if (findUserOrder) {
//                         const user = await User.findById({ _id: req.user._id });
//                         if (!user) {
//                                 return res.status(404).send({ status: 404, message: "User not found or token expired." });
//                         }
//                         await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                         let line_items = [], total = findUserOrder.total, paidAmount = findUserOrder.paidAmount, tax = findUserOrder.tax, TotalQua = 0, address = findUserOrder.address, pincode = findUserOrder?.pincode, city = findUserOrder?.city, country = findUserOrder?.country;
//                         let hr = new Date(findUserOrder.updatedAt).getHours();
//                         let date = new Date(findUserOrder.updatedAt).getDate();
//                         if (date < 10) {
//                                 date = '' + 0 + parseInt(date);
//                         } else {
//                                 date = parseInt(date);
//                         }
//                         let month = new Date(findUserOrder.updatedAt).getMonth() + 1;
//                         if (month < 10) {
//                                 month = '' + 0 + parseInt(month);
//                         } else {
//                                 month = parseInt(month);
//                         }
//                         let year = new Date(findUserOrder.updatedAt).getFullYear();
//                         let fullDate = (`${date}/${month}/${year}`).toString();
//                         let min = new Date(Date.now()).getMinutes();
//                         if (hr < 10) {
//                                 hr = '' + 0 + parseInt(hr);
//                         } else {
//                                 hr = parseInt(hr);
//                         }
//                         if (min < 10) {
//                                 min = '' + 0 + parseInt(min);
//                         } else {
//                                 min = parseInt(min);
//                         }
//                        let orderId = req.params.orderId;
//                         for (let i = 0; i < findUserOrder.Orders.length; i++) {
//                                 let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
//                                 if (findu) {
//                                         await order.findByIdAndUpdate({ _id: findu._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                                         let product, description, color, obj2;
//                                         let findProduct = await Product.findById({ _id: findu.productId });
//                                         if (findProduct) {
//                                                 product = findProduct.name;
//                                                 description = findProduct.description;
//                                         }
//                                         if (findu.productColorId != (null || undefined)) {
//                                                 let findColor = await ProductColor.findOne({ _id: findu.productColorId });
//                                                 if (findColor) {
//                                                         color = findColor.color;
//                                                         obj2 = {
//                                                                 Sno: i + 1,
//                                                                 product: product,
//                                                                 description: description,
//                                                                 ProductColor: color,
//                                                                 productSize: findu.productSize || "",
//                                                                 productPrice: findu.productPrice,
//                                                                 quantity: findu.quantity,
//                                                                 tax: findu.tax,
//                                                                 totalTax: findu.totalTax,
//                                                                 paidAmount: findu.paidAmount,
//                                                                 total: findu.total,
//                                                         }
//                                                         TotalQua = TotalQua + findu.quantity;
//                                                         line_items.push(obj2)
//                                                 }
//                                         } else {
//                                                 obj2 = {
//                                                         Sno: i + 1,
//                                                         product: product,
//                                                         description: description,
//                                                         productPrice: findu.productPrice,
//                                                         quantity: findu.quantity,
//                                                         tax: findu.tax,
//                                                         totalTax: findu.totalTax,
//                                                         paidAmount: findu.paidAmount,
//                                                         total: findu.total
//                                                 }
//                                                 line_items.push(obj2)
//                                                 TotalQua = TotalQua + findu.quantity;
//                                         }
//                                 }
//                         }

//                         let htmlContent = `<!DOCTYPE HTML
//                         PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
//                         <head>
//                         <style type="text/css">
//                                 body {
//                                         margin: 0;
//                                         padding: 0;
//                                 }
                
//                                 @media screen {
//                                         .Heading-Container {
//                                                 display: flex;
//                                                 align-items: center;
//                                         }
                
//                                         .Heading-Container img {
//                                                 width: 100px;
//                                         }
                
//                                         .Heading-Container .content {
//                                                 width: 80%;
//                                                 text-align: center;
//                                                 padding-right: 15rem;
//                                         }
                
//                                         .Heading-Container .content1 {
//                                                 width: 10%;
//                                                 text-align: center;
//                                                 padding-left: 100px;
//                                         }
                
//                                         .Heading-Container .content2 {
//                                                 width: 10%;
//                                                 text-align: center;
//                                                 padding-left: 50rem;
//                                         }
                
//                                         .Heading-Container .content h2 {
//                                                 margin: 0;
//                                                 font-weight: bold;
//                                                 font-size: 25px;
//                                         }
                
//                                         .Heading-Container .content p {
//                                                 margin: 0;
//                                                 font-size: 14px;
//                                                 font-weight: 600;
//                                                 color: #a8a1a1;
//                                         }
                
//                                         .two-cont {
//                                                 display: flex;
//                                                 justify-content: space-between;
//                                                 padding-top: 10px;
//                                                 gap: 50px;
//                                                 padding-left: 3rem;
//                                                 padding-right: 3rem;
//                                         }
                
//                                         .two-cont p {
//                                                 margin: 0;
//                                         }
                
//                                         .two-cont .left {
//                                                 width: 40%;
//                                         }
                
//                                         .two-cont .left h6 {
//                                                 font-size: 14px;
//                                                 font-weight: bold;
//                                         }
                
//                                         .two-cont .left .box {
//                                                 border: 2px solid black;
//                                                 width: 100%;
//                                                 padding: 8px;
//                                         }
                
//                                         .two-cont .left .box p {
//                                                 font-size: 15px;
//                                         }
                
//                                         .two-cont .left .box .strong {
//                                                 font-weight: bold;
//                                         }
                
//                                         .two-cont .left .box p {
//                                                 font-weight: 600;
//                                         }
                
//                                         .two-cont .right {
//                                                 width: 60%;
//                                                 border: 2px solid black;
//                                                 padding: 10px;
//                                         }
                
//                                         .two-cont .right table {
//                                                 width: 100%;
//                                                 table-layout: fixed;
//                                         }
                
//                                         .two-cont .right td {
//                                                 font-weight: 900 !important;
//                                                 padding: 5px;
//                                         }
                
//                                         .empty {
//                                                 background-color: #000;
//                                                 height: 2px;
//                                                 margin-top: 20px;
//                                         }
                
//                                         .Table {
//                                                 width: 100%;
//                                                 margin-top: 0px;
//                                                 padding-left: 3rem;
//                                                 padding-right: 3rem;
//                                         }
                
//                                         .Table tbody tr {
//                                                 border: 1px solid black;
//                                         }
                
//                                         .Table tbody tr td {
//                                                 padding: 5px;
//                                                 padding-bottom: 10px;
//                                         }
                
//                                         .Main_Table {
//                                                 display: flex;
//                                                 justify-content: flex-end;
//                                                 align-items: center;
//                                                 padding-top: 10px;
//                                                 gap: 49px;
//                                                 align-items: center;
//                                                 padding-right: 10rem;
//                                         }
                
//                                         .Main_Table p {
//                                                 font-weight: 900;
//                                         }
                
                
                
                
                
                
                
                
//                                         .below_Div .four-sec {
//                                                 display: flex;
//                                                 justify-content: space-evenly;
//                                                 border-top: 2px solid black;
//                                                 border-bottom: 2px solid black;
//                                                 padding: 4px;
//                                         }
                
//                                         .below_Div .four-sec p {
//                                                 margin: 0;
//                                                 font-size: 13px;
//                                                 text-align: center;
//                                         }
                
//                                         .below_Div .four-sec .stronger {
//                                                 font-weight: bold;
//                                         }
                
                
//                                         .below_Div .four-sec1 {
//                                                 display: flex;
//                                                 justify-content: space-evenly;
//                                                 border-top: 2px solid black;
//                                                 border-bottom: 2px solid black;
//                                                 padding: 10px;
//                                                 margin-top: 16rem;
//                                         }
                
//                                         .below_Div .four-sec1 p {
//                                                 margin: 0;
//                                                 font-size: 13px;
//                                                 text-align: center;
//                                         }
                
//                                         .below_Div .four-sec1 .stronger {
//                                                 font-weight: bold;
//                                         }
                
//                                         .below_Div .big_Head {
//                                                 font-size: 25px;
//                                                 background-color: #85827b;
//                                                 text-align: center;
//                                                 font-weight: bold;
//                                                 color: #fff;
//                                                 padding: 0;
//                                                 margin: 0;
//                                                 padding-bottom: 10px;
//                                         }
                
//                                         .below_Div .text-cont p {
//                                                 margin: 0;
//                                                 font-weight: 700;
//                                                 font-size: 14px;
//                                                 color: #85827b;
//                                         }
                
//                                         .below_Div .text-cont {
//                                                 text-align: center;
//                                         }
                
//                                         .below_Div .text-cont h5 {
//                                                 margin: 0;
//                                                 font-weight: 900;
//                                         }
                
//                                         .so2 {
//                                                 width: 100%;
//                                         }
                
//                                         .so4 {
//                                                 display: flex;
//                                                 justify-content: space-between;
//                                         }
                
//                                         .so4 p {
//                                                 margin: 0;
//                                         }
                
//                                         .so5 {
//                                                 margin-top: 20px;
//                                                 width: 98;
//                                                 margin-left: 1%;
//                                         }
                
//                                         .so5 table {
//                                                 width: 100%;
//                                         }
                
//                                         .so5 table th,
//                                         td {
//                                                 font-size: 13px;
//                                                 font-weight: 600;
//                                         }
                
//                                         .so6 {
//                                                 margin-top: 40px;
//                                                 margin-left: 65%;
//                                                 width: 30%;
//                                         }
                
//                                         .so7 {
//                                                 display: flex;
//                                                 justify-content: space-between;
//                                                 width: 80%;
//                                         }
                
//                                         .so7 p {
//                                                 margin: 0;
//                                         }
                
                
                
//                                 }
//                         </style>
//                 </head>
                
//                 <body>
//                         <div class="upper-div">
//                                 <div class="Heading-Container">
//                                         <img class="content1"
//                                                 src='https://res.cloudinary.com/djgrqoefp/image/upload/v1691481341/images/banner/yi9qnnqetchhn7n5ogr9.png'
//                                                 alt="" />
//                                         <div class="content">
//                                                 <h2>KRISH BUSINESS SERVICE LTD</h2>
//                                                 <p>UNIT 7, NEW MAN ROAD CROYDON CR0 3JX Mob:07472078196</p>
//                                         </div>
//                                 </div>
//                                 <div class="Heading-Container">
//                                         <!-- <img src="" alt="" /> -->
//                                         <div class="content2">
//                                                 <h2>INVOICE</h2>
//                                         </div>
//                                 </div>
                
//                                 <div class="two-cont">
//                                         <div class="left">
//                                                 <h6>INVOICE TO </h6>
//                                                 <div class="box">
//                                                         <p class="strong">Address : </p>
//                                                         <p style={{ textTransform: "capitalize" }}>
//                                                                 ${address} , ${pincode} , ${city},
//                                                                 ${country}
//                                                         </p>
//                                                         <p class="strong"> Tel : </p>
//                                                         <p class="strong"> VAT Number : </p>
//                                                 </div>
//                                         </div>
                
//                                         <div class="right">
//                                                 <table>
//                                                         <tbody>
//                                                                 <tr>
//                                                                         <td class="bordererd">INVOICE NO </td>
//                                                                         <td class="text-center"> ${orderId} </td>
//                                                                 </tr>
//                                                                 <tr>
//                                                                         <td class="bordererd">INVOICE DATE </td>
//                                                                         <td class="text-center">
//                                                                                 ${fullDate} ${hr}:${min}
//                                                                         </td>
//                                                                 </tr>
//                                                                 <tr>
//                                                                         <td class="bordererd">CUSTOMER ACC </td>
//                                                                         <td class="text-center">10307</td>
//                                                                 </tr>
//                                                                 <tr>
//                                                                         <td class="bordererd">CASHIER </td>
//                                                                         <td class="text-center"> SS </td>
//                                                                 </tr>
//                                                                 <tr>
//                                                                         <td class="bordererd">POS ID </td>
//                                                                         <td class="text-center">0 </td>
//                                                                 </tr>
//                                                         </tbody>
//                                                 </table>
//                                         </div>
//                                 </div>
                
//                                 <div class="empty"></div>
                
//                                 <table class="Table">
//                                         <thead>
//                                                 <tr>
//                                                         <th style={{ padding: "10px" }}>#</th>
//                                                         <th>DESCRIPTION</th>
//                                                         <th>QTY</th>
//                                                         <th>PRICE</th>
//                                                         <th>AMOUNT</th>
//                                                         <th>VAT</th>
//                                                         <th>V CODE </th>
//                                                 </tr>
//                                         </thead>
//                                         <tbody>
//                                                 {orders?.map((i, index) => (
//                                                 <tr key={index}>
//                                                         <td> {index + 1} </td>
//                                                         <td> {i.productId?.name} </td>
//                                                         <td> {i.quantity} </td>
//                                                         <td> {i.productId?.price} </td>
//                                                         <td> {i.total} </td>
//                                                         <td> {i.totalTax} </td>
//                                                         <td> {i.productSize} </td>
//                                                 </tr>
//                                                 ))}
//                                         </tbody>
//                                 </table>
                
//                                 <div class="Main_Table">
//                                         <p>On Trolley </p>
//                                         <p>1</p>
//                                         <p>Item Type</p>
//                                         <p> ${line_items.length} </p>
//                                         <p>Total</p>
//                                         <p>${TotalQua}</p>
//                                 </div>
//                         </div>
                
//                         <div class="below_Div">
//                                 <div class="four-sec1">
//                                         <p class="stronger" style={{ border: "1px solid black" , padding: "5px" }}>
//                                                 HSBC <br />
//                                                 KRISH Business Service Ltd
//                                                 <br />
//                                                 Sort Code:40-46-15
//                                                 <br />
//                                                 Acc No:81440977
//                                         </p>
                
//                                         <p> Z=0 % S=20 % R=5 % </p>
                
//                                         <p class="stronger">
//                                                 AMOUNT <br />£${total}
//                                                 <br />
//                                                 DELIVERY CHARGES
//                                                 <br />0
//                                         </p>
                
//                                         <p class="stronger">
//                                                 VAT AMOUNT <br />£${tax}
//                                                 <br />
//                                                 TOTAL TO PAY
//                                                 <br />£${paidAmount}
//                                         </p>
//                                 </div>
//                                 <div class="four-sec" style={{ border: "none" , padding: "5px" }}>
//                                         <p> VAT NO: GB 350971689 </p>
//                                         <p>CO RegNo : 1139394 </p>
//                                         <p> AWRS NO:XVAW00000113046 </p>
//                                 </div>
                
//                                 <p class="big_Head">THANK YOU FOR YOUR VALUED CUSTOM</p>
                
//                                 <div class="text-cont">
//                                         <h5>
//                                                 GOODS WITHOUT ENGLISH INGREDIENTS SHOULD BE LABELLED ACCORDINGLY
//                                                 BEFORE SALE
//                                         </h5>
//                                         <p>
//                                                 The goods once sold will not be returnable unless agreed. Pallet
//                                                 must be returned or a charge will be made
//                                         </p>
//                                 </div>
//                         </div>
//                         </div>
//                 </body>
                      
//                       </html>`
//                         generatePDFFromHTML(htmlContent)
//                                 .then(async pdfBuffer => {
//                                         // Now you have the PDF buffer to work with
//                                         // For example, you can send the buffer over a network, manipulate it, etc.
//                                         // const dataUrl = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');
//                                         // console.log('PDF generated as buffer:', dataUrl);
//                                         // return res.status(404).json({ message: "No data found", data: dataUrl });
//                                         let transporter = nodemailer.createTransport({
//                                                 service: 'gmail',
//                                                 auth: {
//                                                         "user": "krishvapes@gmail.com",
//                                                         "pass": "fggmdyhrilxhmyig"
//                                                 }
//                                         });
//                                         var mailOptions = {
//                                                 from: "<do_not_reply@gmail.com>",
//                                                 to: `vcjagal1994@gmail.com`,
//                                                 subject: 'PDF Attachment',
//                                                 text: 'Please find the attached PDF.',
//                                                 attachments: {
//                                                         filename: 'document.pdf',
//                                                         content: pdfBuffer,
//                                                         contentType: 'application/pdf',
//                                                 },
//                                         };
//                                         let info = await transporter.sendMail(mailOptions);
//                                         if (info) {
//                                                 var mailOptions1 = {
//                                                         from: "<do_not_reply@gmail.com>",
//                                                         to: `krishvapes@gmail.com`,
//                                                         subject: 'Order Received',
//                                                         text: `New order has been recived orderId ${findUserOrder.orderId}`,
//                                                 };
//                                                 let info1 = await transporter.sendMail(mailOptions1);
//                                                 if (info1) {
//                                                         // await Cart.findOneAndDelete({ userId: req.user._id });
//                                                         res.status(200).json({ message: "Payment success.", status: 200, data: {} });
//                                                 }
//                                         } else {
//                                                 // await Cart.findOneAndDelete({ userId: req.user._id });
//                                                 res.status(200).json({ message: "Payment success.", status: 200, data: {} });
//                                         }
//                                 })
//                                 .catch(err => {
//                                         console.error('Error generating PDF:', err);
//                                 });

//                         // .then(() => { console.log(`PDF generated and saved to ${outputPath}`); }).catch(err => { console.error('Error generating PDF:', err); });
//                 } else {
//                         return res.status(404).json({ message: "No data found", data: {} });
//                 }


//         } catch (error) {
//                 console.log(error);
//                 res.status(501).send({ status: 501, message: "server error.", data: {}, });
//         }
// };
// async function generatePDFFromHTML(htmlContent) {
//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();
//         await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
//         await page.setViewport({
//                 width: 1920, // Adjust the width as needed
//                 height: 1080, // Adjust the height as needed
//                 deviceScaleFactor: 1,
//         });
//         const pdfBuffer = await page.pdf({
//                 format: 'A4', width: '210mm',  // Adjust the width
//                 height: '297mm', // Adjust the height
//                 margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
//         });

//         return pdfBuffer;
// }

