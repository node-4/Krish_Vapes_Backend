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
const doc = new PDFDocument({ autoFirstPage: true, margin: 10, size: 'A4' });
const nodemailer = require('nodemailer')
var paypal = require("paypal-rest-sdk");
// paypal.configure({
//         mode: "sandbox", //sandbox or live
//         client_id: "AfrwGgPhrZF75g-lnWIEZCMz-0zvxaFJSsEL2oaSHJ7JOEUDwv3WTtvzXyxJfowuVOty7AjhTC3TWWq9",
//         client_secret: "EJmUs61eKjJOkKE937qEQT7MCuKakPmpcrZ19jhm6X5orw7dI24YsK5kde_wOg4YhrosTSAsHIomcSGP",
// }); // varun

// paypal.configure({
//         mode: "sandbox", //sandbox or live
//         client_id: "AZsmV_dtdB09wyYw4diPR_RlSo-Rw6s0vV8CQumZ-PG5kKAi-k0wFtsMOVc0hNF4rb4bTWNLUzxa3ri0",
//         client_secret: "EPzm9lyRnSGp2npsQS57aGBLju7QfPNJwMKpaXT8ikVD3JA7DRsx32ETulF580r6tPydoPA2DKdyXSyz",
// }); // Client

paypal.configure({
        mode: "live", //sandbox or live
        client_id: "AeJKJyRbJ7O63oYfwD903--O4mAnT1yOpk3rIhn7Cbtf45669Gg0i_jMUnPqzUSiyhx695AvoDhzjdFE",
        client_secret: "EBfiXipIyxOc8mmF1iT-YRD08SrwrUxDkpRIuixaY7lpdts09lLwGbCavtfYT1aiKaOkw1a2ch778yyy",
}); // Client
// const stripe = require("stripe")('pk_live_51NYCJcArS6Dr0SQYUKlqAd37V2GZMbxBL6OGM9sZi8CY6nv6H7TUJcjfMiepBmkIdSdn1bUCo855sQuKb66oiM4j00PRLQzvUc'); // live
// const stripe = require("stripe")('sk_test_51NYCJcArS6Dr0SQY0UJ5ZOoiPHQ8R5jNOyCMOkjxpl4BHkG4DcAGAU8tjBw6TSOSfimDSELa6BVyCVSo9CGLXlyX00GkGDAQFo'); // test
const stripe = require("stripe")('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'); // live
exports.registration = async (req, res) => {
        const { courtesyTitle, dob, email, firstName, lastName, password, company, vatNumber, vatUsed, country, phone, registrationNo, address, addressComplement, city, pincode, addressCountry } = req.body;
        try {
                let userEmail = email.toLowerCase();
                let user = await User.findOne({ email: userEmail, userType: "USER" });
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
                        req.body.email = userEmail;
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
                        req.body.registrationNo = registrationNo;
                        const userCreate = await User.create(req.body);
                        if (userCreate) {
                                let obj = {
                                        userId: userCreate._id,
                                        address: address,
                                        addressComplement: addressComplement,
                                        city: city,
                                        pincode: pincode,
                                        country: addressCountry,
                                        phone: phone,
                                        type: "Registration"
                                }
                                const userCreate1 = await userAddress.create(obj);
                                if (userCreate1) {
                                        return res.status(200).send({ message: "registered successfully ", data: userCreate, });
                                }
                        }
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
                let userEmail = email.toLowerCase();
                const user = await User.findOne({ $or: [{ email: userEmail }, { email: email }], userType: "USER" });
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
                                let findAddress = await userAddress.findOne({ userId: user._id, type: "Registration" });
                                return res.status(200).send({ status: 200, data: user, Address: findAddress, accessToken: accessToken });
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
                                        return res.status(200).json({ message: "Otp send to your email.", status: 200, data: {} });
                                }
                        } else {
                                return res.status(200).json({ message: "Otp not send on your mail please check.", status: 200, data: {} });
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
                const { firstName, lastName, email, dob, password, courtesyTitle, company, vatNumber, phone, registrationNo } = req.body;
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
                user.registrationNo = registrationNo || user.registrationNo;
                user.fullName = `${firstName || user.firstName} ${lastName || user.lastName}`;
                if (phone != (null || undefined)) {
                        user.phone = phone || user.phone;
                        let findAddress = await userAddress.findOne({ userId: user._id, type: "Registration" });
                        if (findAddress) {
                                await userAddress.findByIdAndUpdate({ _id: findAddress._id }, { $set: { phone: phone || findAddress.phone } }, { new: true })
                        }
                } else {
                        user.phone = user.phone;
                }
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
                        if (findData.type == 'Registration') {
                                return res.status(201).send({ message: "Registration address can not update.", data: {} });
                        } else {
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
                        } else {
                                if (findData.type == 'Registration') {
                                        return res.status(201).send({ message: "Registration address not delete.", data: {} });
                                } else {
                                        const userCreate = await userAddress.findByIdAndDelete({ _id: findData._id })
                                        return res.status(200).send({ message: "Address delete successfully.", data: {} });
                                }
                        }
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
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                return res.status(200).json({ status: 200, message: "product add to wishlist Successfully", });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.removeFromWishlist = async (req, res, next) => {
        try {
                const wishlist = await Wishlist.findOne({ user: req.user._id });
                if (!wishlist) {
                        return res.status(404).json({ message: "Wishlist not found", status: 404 });
                }
                const product = req.params.id;
                wishlist.products.pull(product);
                await wishlist.save();
                return res.status(200).json({ status: 200, message: "Removed From Wishlist", });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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

                return res.status(200).json({ status: 200, wishlist: obj, });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                                                                                                let price, discount = 0, delivery;
                                                                                                                if (findProduct.discount == true) {
                                                                                                                        price = findProduct.discountPrice;
                                                                                                                        discount = findProduct.price - findProduct.discountPrice;
                                                                                                                } else {
                                                                                                                        price = findProduct.price
                                                                                                                }
                                                                                                                let tax = 0, totalTax = 0, productTotalTax = 0;
                                                                                                                if (findProduct.taxInclude == true) {
                                                                                                                        tax = findProduct.tax;
                                                                                                                        productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                                                } else {
                                                                                                                        tax = tax;
                                                                                                                }
                                                                                                                let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                                                let obj = {
                                                                                                                        categoryId: findProduct.categoryId,
                                                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                                                        productId: findProduct._id,
                                                                                                                        productColorId: findColor._id,
                                                                                                                        productSize: req.body.size,
                                                                                                                        productPrice: price,
                                                                                                                        quantity: req.body.quantity,
                                                                                                                        tax: tax,
                                                                                                                        discount: Number(discount).toFixed(2),
                                                                                                                        totalTax: productTotalTax,
                                                                                                                        total: Number((price * req.body.quantity).toFixed(2)),
                                                                                                                        paidAmount: productPaid,
                                                                                                                }
                                                                                                                totalTax = Number(findCart.tax) + Number(productTotalTax);
                                                                                                                let totalItem = findCart.totalItem + Number(req.body.quantity);
                                                                                                                let c = Number(findCart.totalAmount).toFixed(2);
                                                                                                                let totalAmount = Number(c) + Number((price * req.body.quantity).toFixed(2));
                                                                                                                let b = Number(findCart.paidAmount).toFixed(2);
                                                                                                                let d = Number(productPaid).toFixed(2);
                                                                                                                let paidAmount = Number(b) + Number(d);
                                                                                                                let x = Number(findCart.discount).toFixed(2);
                                                                                                                let z = Number(x) + Number(discount).toFixed(2);
                                                                                                                if (totalAmount > 250) {
                                                                                                                        delivery = "0";
                                                                                                                        paidAmount = totalAmount + Number(delivery) + Number(productTotalTax);
                                                                                                                } else {
                                                                                                                        delivery = "5.99";
                                                                                                                        paidAmount = totalAmount + Number(delivery) + Number(productTotalTax);
                                                                                                                }
                                                                                                                if (z == (null || undefined)) {
                                                                                                                        z = 0;
                                                                                                                }
                                                                                                                let totalAmount1 = Number(totalAmount).toFixed(2);
                                                                                                                let paidAmount1 = Number(paidAmount).toFixed(2);
                                                                                                                let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { delivery: delivery, totalAmount: totalAmount1, totalItem: totalItem, discount: z, paidAmount: paidAmount1, tax: totalTax }, $push: { products: obj } }, { new: true })
                                                                                                                return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                                        }
                                                                                                }
                                                                                        } else {
                                                                                                return res.status(409).send({ status: 409, message: "Currently no size available." });
                                                                                        }
                                                                                }
                                                                                else {
                                                                                        console.log("---------------------------------280------------");
                                                                                        let price, discount = 0, delivery, x = 0, z = 0;
                                                                                        if (findProduct.discount == true) {
                                                                                                price = findProduct.discountPrice;
                                                                                                discount = ((findProduct.price - findProduct.discountPrice) * req.body.quantity);
                                                                                        } else {
                                                                                                price = findProduct.price
                                                                                        }
                                                                                        let tax = 0, totalTax = 0;
                                                                                        let productTotalTax = 0;
                                                                                        if (findProduct.taxInclude == true) {
                                                                                                tax = findProduct.tax;
                                                                                                productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                        } else {
                                                                                                tax = tax;
                                                                                        }
                                                                                        totalTax = totalTax + productTotalTax;
                                                                                        let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                        let obj = {
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productColorId: findColor._id,
                                                                                                productPrice: price,
                                                                                                quantity: req.body.quantity,
                                                                                                tax: tax,
                                                                                                discount: Number(discount).toFixed(2),
                                                                                                totalTax: productTotalTax,
                                                                                                total: Number((price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: Number(productPaid).toFixed(2),
                                                                                        }
                                                                                        let c = Number(findCart.totalAmount).toFixed(2);
                                                                                        let totalAmount = Number(c) + Number((price * req.body.quantity).toFixed(2));
                                                                                        let totalItem = findCart.totalItem + Number(req.body.quantity);
                                                                                        if (findCart.discount == (null || undefined)) {
                                                                                                x = 0;
                                                                                                z = Number(x) + Number(discount).toFixed(2) || 0;
                                                                                        } else {
                                                                                                x = Number(findCart.discount).toFixed(2);
                                                                                                z = Number(x) + (Number(discount).toFixed(2) || 0);
                                                                                        }
                                                                                        if (totalAmount > 250) {
                                                                                                delivery = "0";
                                                                                                paidAmount = totalAmount + Number(delivery) + Number(productTotalTax);
                                                                                        } else {
                                                                                                delivery = "5.99";
                                                                                                paidAmount = totalAmount + Number(delivery) + Number(productTotalTax);
                                                                                        }
                                                                                        if (z == (null || undefined)) {
                                                                                                z = 0;
                                                                                        }
                                                                                        let totalAmount1 = Number(totalAmount).toFixed(2);
                                                                                        let paidAmount1 = Number(paidAmount).toFixed(2);
                                                                                        let totalTax2 = Number(totalTax).toFixed(2);
                                                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { discount: z, delivery: delivery, totalAmount: totalAmount1, totalItem: totalItem, paidAmount: paidAmount1, tax: Number(totalTax2) }, $push: { products: obj } }, { new: true })
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                }
                                                                        }
                                                                        else {
                                                                                return res.status(404).send({ status: 404, message: "Color not found." });
                                                                        }
                                                                }
                                                                else {
                                                                        let price, discount;
                                                                        if (findProduct.discount == true) {
                                                                                price = findProduct.discountPrice;
                                                                                discount = ((findProduct.price - findProduct.discountPrice) * req.body.quantity);
                                                                        } else {
                                                                                price = findProduct.price
                                                                        }
                                                                        let tax = 0, totalTax = 0, productTotalTax = 0;
                                                                        if (findProduct.taxInclude == true) {
                                                                                tax = findProduct.tax;
                                                                                productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                        } else {
                                                                                tax = tax;
                                                                        }
                                                                        totalTax = totalTax + productTotalTax;
                                                                        if (discount == (null || undefined)) {
                                                                                discount = 0;
                                                                        }
                                                                        let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                        let obj = {
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productPrice: price,
                                                                                quantity: req.body.quantity,
                                                                                tax: tax,
                                                                                totalTax: productTotalTax,
                                                                                discount: Number(discount).toFixed(2),
                                                                                total: Number((price * req.body.quantity).toFixed(2)),
                                                                                paidAmount: productPaid,
                                                                        }
                                                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                        if (update) {
                                                                                let totalAmount = 0, totalTax1 = 0, paidAmount = 0, discount = 0, totalItem = 0, delivery;
                                                                                for (let j = 0; j < update.products.length; j++) {
                                                                                        totalAmount = Number(totalAmount) + Number(update.products[j].total);
                                                                                        totalTax1 = Number(totalTax1) + Number(update.products[j].totalTax);
                                                                                        paidAmount = Number(paidAmount) + Number(update.products[j].paidAmount)
                                                                                        discount = Number(discount) + Number(update.products[j].discount)
                                                                                        totalItem = Number(totalItem) + Number(update.products[j].quantity)
                                                                                }
                                                                                if (paidAmount > 250) {
                                                                                        delivery = "0";
                                                                                        paidAmount = paidAmount + Number(delivery);
                                                                                } else {
                                                                                        delivery = "5.99";
                                                                                        paidAmount = paidAmount + Number(delivery);
                                                                                }
                                                                                let totalAmount1 = Number(totalAmount).toFixed(2);
                                                                                let paidAmount1 = Number(paidAmount).toFixed(2);
                                                                                let totalTax2 = Number(totalTax1).toFixed(2);
                                                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { discount: Number(discount).toFixed(2), delivery: delivery, totalAmount: totalAmount1, paidAmount: paidAmount1, tax: totalTax2, totalItem: totalItem } }, { new: true });
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
                                                                                                let price, discount = 0, delivery;
                                                                                                if (findProduct.discount == true) {
                                                                                                        price = findProduct.discountPrice;
                                                                                                        discount = findProduct.price - findProduct.discountPrice;
                                                                                                } else {
                                                                                                        price = findProduct.price
                                                                                                }
                                                                                                let tax = 0, totalTax = 0, productTotalTax = 0;
                                                                                                if (findProduct.taxInclude == true) {
                                                                                                        tax = findProduct.tax;
                                                                                                        productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                                } else {
                                                                                                        tax = tax;
                                                                                                }
                                                                                                totalTax = totalTax + productTotalTax;
                                                                                                let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                                let obj = {
                                                                                                        categoryId: findProduct.categoryId,
                                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                                        productId: findProduct._id,
                                                                                                        productColorId: findColor._id,
                                                                                                        productSize: req.body.size,
                                                                                                        productPrice: price,
                                                                                                        quantity: req.body.quantity,
                                                                                                        tax: tax,
                                                                                                        discount: Number(discount).toFixed(2),
                                                                                                        totalTax: productTotalTax,
                                                                                                        total: Number((price * req.body.quantity).toFixed(2)),
                                                                                                        paidAmount: productPaid,
                                                                                                }
                                                                                                if (productPaid > 250) {
                                                                                                        delivery = "0";
                                                                                                        productPaid = productPaid + Number(delivery);
                                                                                                } else {
                                                                                                        delivery = "5.99";
                                                                                                        productPaid = productPaid + Number(delivery);
                                                                                                }
                                                                                                let totalAmount = Number((price * req.body.quantity).toFixed(2));
                                                                                                let paidAmount = productPaid;
                                                                                                let totalItem = findCart.totalItem + 1;
                                                                                                if (discount == (null || undefined)) {
                                                                                                        discount = 0;
                                                                                                }
                                                                                                let totalAmount1 = Number(totalAmount).toFixed(2);
                                                                                                let paidAmount1 = Number(paidAmount).toFixed(2);
                                                                                                let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { delivery: delivery, discount: Number(discount).toFixed(2), totalAmount: totalAmount1, totalItem: totalItem, paidAmount: paidAmount1, tax: Number(totalTax).toFixed(2) }, $push: { products: obj } }, { new: true })
                                                                                                return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                        }
                                                                                }
                                                                        } else {
                                                                                return res.status(409).send({ status: 409, message: "Currently no size available." });
                                                                        }
                                                                }
                                                                else {
                                                                        console.log("---------------------------------280------------");
                                                                        let price, discount = 0, delivery;
                                                                        if (findProduct.discount == true) {
                                                                                price = findProduct.discountPrice;
                                                                                discount = findProduct.price - findProduct.discountPrice;
                                                                        } else {
                                                                                price = findProduct.price
                                                                        }
                                                                        let tax = 0, totalTax = 0;
                                                                        let productTotalTax = 0;
                                                                        if (findProduct.taxInclude == true) {
                                                                                tax = findProduct.tax;
                                                                                productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                        } else {
                                                                                tax = tax;
                                                                        }
                                                                        totalTax = totalTax + productTotalTax;
                                                                        let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                        let obj = {
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productColorId: findColor._id,
                                                                                productPrice: price,
                                                                                quantity: req.body.quantity,
                                                                                tax: tax,
                                                                                discount: Number(discount).toFixed(2),
                                                                                totalTax: productTotalTax,
                                                                                total: Number((price * req.body.quantity).toFixed(2)),
                                                                                paidAmount: Number(productPaid).toFixed(2),
                                                                        }
                                                                        if (productPaid > 250) {
                                                                                delivery = "0";
                                                                                productPaid = productPaid + Number(delivery);
                                                                        } else {
                                                                                delivery = "5.99";
                                                                                productPaid = productPaid + Number(delivery);
                                                                        }
                                                                        let totalAmount = Number((price * req.body.quantity).toFixed(2));
                                                                        let paidAmount = Number(productPaid).toFixed(2);
                                                                        let totalAmount1 = Number(totalAmount).toFixed(2);
                                                                        let paidAmount1 = Number(paidAmount).toFixed(2);
                                                                        let totalItem = findCart.totalItem + 1;
                                                                        if (discount == (null || undefined)) {
                                                                                discount = 0;
                                                                        }
                                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { delivery: delivery, discount: Number(discount).toFixed(2), totalAmount: totalAmount1, totalItem: totalItem, paidAmount: paidAmount1, tax: Number(totalTax) }, $push: { products: obj } }, { new: true })
                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                }
                                                        }
                                                        else {
                                                                return res.status(404).send({ status: 404, message: "Color not found." });
                                                        }
                                                }
                                                else {
                                                        console.log("322================");
                                                        let price, discount = 0, delivery;
                                                        if (findProduct.discount == true) {
                                                                price = findProduct.discountPrice;
                                                                discount = findProduct.price - findProduct.discountPrice;
                                                        } else {
                                                                price = findProduct.price
                                                        }
                                                        let tax = 0, totalTax = 0, productTotalTax = 0;
                                                        if (findProduct.taxInclude == true) {
                                                                tax = findProduct.tax;
                                                                productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                        } else {
                                                                tax = tax;
                                                        }
                                                        totalTax = totalTax + productTotalTax;
                                                        let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                        let obj = {
                                                                categoryId: findProduct.categoryId,
                                                                subcategoryId: findProduct.subcategoryId,
                                                                productId: findProduct._id,
                                                                productPrice: price,
                                                                quantity: req.body.quantity,
                                                                tax: tax,
                                                                discount: Number(discount).toFixed(2),
                                                                totalTax: productTotalTax,
                                                                total: Number((price * req.body.quantity).toFixed(2)),
                                                                paidAmount: productPaid,
                                                        }
                                                        if (productPaid > 250) {
                                                                delivery = "0";
                                                                productPaid = productPaid + Number(delivery);
                                                        } else {
                                                                delivery = "5.99";
                                                                productPaid = productPaid + Number(delivery);
                                                        }
                                                        let totalAmount = Number((price * req.body.quantity).toFixed(2));
                                                        let paidAmount = Number(productPaid).toFixed(2);
                                                        let totalAmount1 = Number(totalAmount).toFixed(2);
                                                        let paidAmount1 = Number(paidAmount).toFixed(2);
                                                        let totalItem = findCart.totalItem + Number(req.body.quantity);
                                                        if (discount == (null || undefined)) {
                                                                discount = 0;
                                                        }
                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { discount: Number(discount).toFixed(2), delivery: delivery, totalAmount: totalAmount1, totalItem: totalItem, paidAmount: paidAmount1, tax: Number(totalTax) }, $push: { products: obj } }, { new: true })
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
                                                                                        let price, discount = 0, delivery;
                                                                                        if (findProduct.discount == true) {
                                                                                                price = findProduct.discountPrice;
                                                                                                discount = Number(findProduct.price).toFixed(2) - Number(findProduct.discountPrice).toFixed(2);
                                                                                        } else {
                                                                                                price = findProduct.price
                                                                                        }
                                                                                        let products = [], tax = 0, totalTax = 0, productTotalTax = 0;
                                                                                        if (findProduct.taxInclude == true) {
                                                                                                tax = findProduct.tax;
                                                                                                productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                                        } else {
                                                                                                tax = tax;
                                                                                        }
                                                                                        totalTax = totalTax + productTotalTax;
                                                                                        let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                                        if (productPaid > 250) {
                                                                                                delivery = "0";
                                                                                                productPaid = productPaid + Number(delivery);
                                                                                        } else {
                                                                                                delivery = "5.99";
                                                                                                productPaid = productPaid + Number(delivery);
                                                                                        }
                                                                                        let obj = {
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productColorId: findColor._id,
                                                                                                productSize: req.body.size,
                                                                                                productPrice: price,
                                                                                                quantity: req.body.quantity,
                                                                                                tax: tax,
                                                                                                totalTax: productTotalTax,
                                                                                                discount: Number(discount).toFixed(2),
                                                                                                total: Number((price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: productPaid,
                                                                                        }
                                                                                        totalTax = totalTax + (tax * req.body.quantity)
                                                                                        products.push(obj)
                                                                                        if (productPaid > 250) {
                                                                                                delivery = "0";
                                                                                                productPaid = productPaid + Number(delivery);
                                                                                        } else {
                                                                                                delivery = "5.99";
                                                                                                productPaid = productPaid + Number(delivery);
                                                                                        }
                                                                                        if (discount == (null || undefined)) {
                                                                                                discount = 0;
                                                                                        }
                                                                                        let cartObj = {
                                                                                                userId: user._id,
                                                                                                products: products,
                                                                                                tax: Number(totalTax).toFixed(2),
                                                                                                discount: Number(discount).toFixed(2),
                                                                                                totalAmount: Number((price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: Number(productPaid).toFixed(2),
                                                                                                delivery: Number(delivery),
                                                                                                totalItem: req.body.quantity,
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
                                                                let price, discount = 0, delivery;
                                                                if (findProduct.discount == true) {
                                                                        price = findProduct.discountPrice;
                                                                        discount = Number(findProduct.price).toFixed(2) - Number(findProduct.discountPrice).toFixed(2);
                                                                } else {
                                                                        price = findProduct.price
                                                                }
                                                                let products = [], tax = 0, totalTax = 0;
                                                                let productTotalTax = 0;
                                                                if (findProduct.taxInclude == true) {
                                                                        tax = findProduct.tax;
                                                                        productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                                } else {
                                                                        tax = tax;
                                                                }
                                                                if (discount == (null || undefined)) {
                                                                        discount = 0;
                                                                }
                                                                totalTax = totalTax + productTotalTax;
                                                                let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax))
                                                                let obj = {
                                                                        categoryId: findProduct.categoryId,
                                                                        subcategoryId: findProduct.subcategoryId,
                                                                        productId: findProduct._id,
                                                                        productColorId: findColor._id,
                                                                        productPrice: price,
                                                                        quantity: req.body.quantity,
                                                                        discount: Number(discount).toFixed(2),
                                                                        tax: tax,
                                                                        totalTax: productTotalTax,
                                                                        total: Number((price * req.body.quantity).toFixed(2)),
                                                                        paidAmount: Number(productPaid).toFixed(2),
                                                                }
                                                                products.push(obj)
                                                                if (productPaid > 250) {
                                                                        delivery = "0";
                                                                        productPaid = productPaid + Number(delivery);
                                                                } else {
                                                                        delivery = "5.99";
                                                                        productPaid = productPaid + Number(delivery);
                                                                }
                                                                if (discount == (null || undefined)) {
                                                                        discount = 0;
                                                                }
                                                                let cartObj = {
                                                                        userId: user._id,
                                                                        products: products,
                                                                        tax: Number(totalTax).toFixed(2),
                                                                        discount: Number(discount).toFixed(2),
                                                                        delivery: delivery,
                                                                        totalAmount: Number((price * req.body.quantity).toFixed(2)),
                                                                        paidAmount: Number(productPaid).toFixed(2),
                                                                        totalItem: req.body.quantity,
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
                                                let price, discount = 0, delivery;
                                                if (findProduct.discount == true) {
                                                        price = findProduct.discountPrice;
                                                        discount = Number(findProduct.price).toFixed(2) - Number(findProduct.discountPrice).toFixed(2);
                                                } else {
                                                        price = findProduct.price
                                                }
                                                console.log("214================");
                                                let products = [], tax = 0, totalTax = 0, productTotalTax = 0;
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                        productTotalTax = Number((((price * req.body.quantity)) * tax) / 100).toFixed(2)
                                                } else {
                                                        tax = tax;
                                                }
                                                totalTax = totalTax + productTotalTax;
                                                let productPaid = (Number((price * req.body.quantity).toFixed(2)) + Number(productTotalTax));
                                                if (discount == (null || undefined)) {
                                                        discount = 0;
                                                }
                                                let obj = {
                                                        categoryId: findProduct.categoryId,
                                                        subcategoryId: findProduct.subcategoryId,
                                                        productId: findProduct._id,
                                                        productPrice: price,
                                                        quantity: req.body.quantity,
                                                        tax: tax,
                                                        totalTax: productTotalTax,
                                                        discount: Number(discount).toFixed(2),
                                                        total: Number((price * req.body.quantity).toFixed(2)),
                                                        paidAmount: productPaid,
                                                }
                                                products.push(obj)
                                                if (productPaid > 250) {
                                                        delivery = "0";
                                                        productPaid = productPaid + Number(delivery);
                                                } else {
                                                        delivery = "5.99";
                                                        productPaid = productPaid + Number(delivery);
                                                }
                                                let cartObj = {
                                                        userId: user._id,
                                                        products: products,
                                                        tax: Number(totalTax).toFixed(2),
                                                        discount: Number(discount).toFixed(2),
                                                        totalAmount: Number((price * req.body.quantity).toFixed(2)),
                                                        paidAmount: Number(productPaid).toFixed(2),
                                                        delivery: delivery,
                                                        totalItem: req.body.quantity,
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
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                return res.status(200).send({ status: 200, message: "Cart detail not found.", data: {} });
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                                                        delivery: findCart.delivery,
                                                                        paidAmount: findCart.paidAmount
                                                                };
                                                                await userOrders.create(obj1);
                                                        }
                                                }
                                        }
                                        let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                        return res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                                } else {
                                        return res.status(404).json({ status: 404, message: "Address not found. ", data: {} })
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
                                                                        total: findCart.totalAmount,
                                                                        totalItem: findCart.totalItem,
                                                                        tax: findCart.tax,
                                                                        delivery: findCart.delivery,
                                                                        paidAmount: findCart.paidAmount
                                                                };
                                                                await userOrders.create(obj1);
                                                        }
                                                }
                                        }
                                        let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                        return res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                                } else {
                                        return res.status(404).json({ status: 404, message: "Address not found. ", data: {} })
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.getAllOrders = async (req, res, next) => {
        try {
                const orders = await userOrders.find({ userId: req.user._id, orderStatus: "confirmed" })
                        .populate([{ path: 'userId', select: 'fullName firstName lastName courtesyTitle email' }, {
                                path: 'Orders',
                                populate: [
                                        {
                                                path: "categoryId",
                                                model: "Category",
                                                select: "name image",
                                        },
                                        {
                                                path: "subcategoryId",
                                                model: "subcategory",
                                                select: "name categoryId",
                                        },
                                        {
                                                path: "productId",
                                                model: "Product",
                                                select: "categoryId subcategoryId name description price quantity discount discountPrice taxInclude colorActive tax ratings colors numOfReviews img publicId",
                                        },
                                        {
                                                path: "productColorId",
                                                model: "ProductColor",
                                                select: "productId size img publicId color uantity colorSize",
                                        },
                                ],
                        }])
                if (orders.length == 0) {
                        return res.status(404).json({ status: 404, message: "Orders not found", data: {} });
                }
                return res.status(200).json({ status: 200, msg: "orders of user", data: orders })
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                        if ((findCart.products[i].productId).toString() === req.body.products_id) {
                                                let tax = 0, totalTax = 0, total = 0, paidAmount = 0, price, discount = 0;
                                                let findProduct = await Product.findById({ _id: (findCart.products[i].productId).toString() });
                                                if (findProduct.discount == true) {
                                                        price = findProduct.discountPrice;
                                                        discount = ((findProduct.price - findProduct.discountPrice) * req.body.quantity);
                                                } else {
                                                        price = findProduct.price
                                                }
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                        totalTax = Number((((price * req.body.quantity)) * Number(tax)) / 100).toFixed(2);
                                                        total = Number((price * req.body.quantity).toFixed(2));
                                                        let totalTax1 = Number(totalTax)
                                                        paidAmount = total + totalTax1
                                                } else {
                                                        tax = tax;
                                                        totalTax = totalTax;
                                                        total = Number((price * req.body.quantity).toFixed(2));
                                                        let totalTax1 = Number(totalTax)
                                                        paidAmount = total + totalTax1
                                                        console.log("==================")
                                                }
                                                let obj = {
                                                        categoryId: findCart.products[i].categoryId,
                                                        subcategoryId: findCart.products[i].subcategoryId,
                                                        productId: findCart.products[i].productId,
                                                        productColorId: findCart.products[i].productColorId,
                                                        productSize: findCart.products[i].productSize,
                                                        productPrice: price,
                                                        discount: Number(discount).toFixed(2),
                                                        quantity: req.body.quantity,
                                                        tax: tax,
                                                        totalTax: totalTax,
                                                        total: total,
                                                        paidAmount: paidAmount,
                                                }
                                                products.push(obj)
                                                count++
                                        } else {
                                                let tax = 0, totalTax = 0, total = 0, paidAmount = 0, price, discount = 0;
                                                let findProduct = await Product.findById({ _id: (findCart.products[i].productId).toString() });
                                                if (findProduct.discount == true) {
                                                        price = findProduct.discountPrice;
                                                        discount = ((findProduct.price - findProduct.discountPrice) * findCart.products[i].quantity);
                                                } else {
                                                        price = findProduct.price
                                                }
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                        totalTax = Number((((price * findCart.products[i].quantity)) * tax) / 100).toFixed(2);
                                                        total = Number((price * findCart.products[i].quantity).toFixed(2));
                                                        let totalTax1 = Number(totalTax)
                                                        paidAmount = total + totalTax1
                                                } else {
                                                        tax = tax;
                                                        totalTax = totalTax;
                                                        total = Number((price * findCart.products[i].quantity).toFixed(2));
                                                        let totalTax1 = Number(totalTax)
                                                        paidAmount = total + totalTax1
                                                }
                                                let obj = {
                                                        categoryId: findCart.products[i].categoryId,
                                                        subcategoryId: findCart.products[i].subcategoryId,
                                                        productId: findCart.products[i].productId,
                                                        productColorId: findCart.products[i].productColorId,
                                                        productSize: findCart.products[i].productSize,
                                                        productPrice: price,
                                                        quantity: findCart.products[i].quantity,
                                                        tax: tax,
                                                        discount: Number(discount).toFixed(2),
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
                                                let totalAmount = 0, totalTax = 0, paidAmount2 = 0, delivery = 0, discount = 0, totalItem = 0;
                                                for (let j = 0; j < update.products.length; j++) {
                                                        totalAmount = Number(totalAmount) + Number(update.products[j].total);
                                                        totalTax = Number(totalTax) + Number(update.products[j].totalTax);
                                                        paidAmount2 = Number(paidAmount2) + Number(update.products[j].paidAmount);
                                                        discount = Number(discount) + Number(update.products[j].discount)
                                                        totalItem = Number(totalItem) + Number(update.products[j].quantity)
                                                }
                                                if (paidAmount2 > 250) {
                                                        delivery = "0";
                                                        paidAmount2 = Number(paidAmount2) + Number(delivery);
                                                } else {
                                                        delivery = "5.99";
                                                        paidAmount2 = Number(paidAmount2) + Number(delivery);
                                                }
                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { delivery: delivery, discount: Number(discount).toFixed(2), totalAmount: Number(totalAmount).toFixed(2), paidAmount: Number(paidAmount2).toFixed(2), tax: Number(totalTax).toFixed(2), totalItem: totalItem } }, { new: true });
                                                return res.status(200).json({ status: 200, message: "cart update Successfully.", data: update1 })
                                        }
                                }
                        } else {
                                return res.status(404).send({ status: 404, message: "Cart not found." });
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                                let products = [], count = 0, paidAmount = 0, totalTax = 0, totals = 0, delivery = 0, discount = 0, totalItem = 0;
                                for (let i = 0; i < findCart.products.length; i++) {
                                        if ((findCart.products[i]._id).toString() != req.params.cartProductId) {
                                                products.push(findCart.products[i])
                                                paidAmount = paidAmount + Number(findCart.products[i].paidAmount);
                                                totals = totals + Number(findCart.products[i].total);
                                                discount = discount + Number(findCart.products[i].discount);
                                                totalTax = totalTax + Number(findCart.products[i].totalTax)
                                                totalItem = totalItem + Number(findCart.products[i].quantity)
                                                count++
                                        }
                                }
                                if (paidAmount > 250) {
                                        delivery = "0";
                                        paidAmount = Number(paidAmount) + Number(delivery);
                                } else {
                                        delivery = "5.99";
                                        paidAmount = Number(paidAmount) + Number(delivery);
                                }
                                if (products.length > 0) {
                                        if (count == findCart.products.length - 1) {
                                                let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, {
                                                        $set: {
                                                                products: products,
                                                                totalAmount: Number(totals).toFixed(2),
                                                                tax: Number(totalTax).toFixed(2),
                                                                discount: Number(discount).toFixed(2),
                                                                delivery: Number(delivery).toFixed(2),
                                                                paidAmount: Number(paidAmount).toFixed(2),
                                                                totalItem: totalItem
                                                        }
                                                }, { new: true });
                                                if (update) {
                                                        return res.status(200).json({ status: 200, message: "Product delete from cart Successfully.", data: update })
                                                }
                                        }
                                } else {
                                        await Cart.findByIdAndDelete({ _id: findCart._id });
                                        return res.status(200).json({ status: 200, message: "cart delete Successfully.", data: {} })
                                }

                        } else {
                                return res.status(404).send({ status: 404, message: "Cart not found." });
                        }
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.placeOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let delivery = Number(findUserOrder.delivery);
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
                        let obj3 = {
                                price_data: {
                                        currency: "gbp",
                                        product_data: {
                                                name: `Delivery Charge`,
                                        },
                                        unit_amount: `${Math.round(delivery * 100)}`,
                                },
                                quantity: 1,
                        }
                        line_items.push(obj3)
                        const session = await stripe.checkout.sessions.create({
                                payment_method_types: ["card"],
                                success_url: `https://krishwholesale.co.uk/order-success/${findUserOrder.orderId}`,
                                cancel_url: `https://krishwholesale.co.uk/order-failure/${findUserOrder.orderId}`,
                                customer_email: req.user.email,
                                client_reference_id: findUserOrder.orderId,
                                line_items: line_items,
                                mode: "payment",
                        });
                        return res.status(200).json({ status: "success", session: session, });
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: error.raw.message, });
        }
};
exports.cancelOrder = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        return res.status(201).json({ message: "Payment failed.", status: 201, orderId: req.params.orderId });
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
                        let bsa64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAbMAAAG5CAYAAAAEdtrhAAEAAElEQVR4Xuz9B4Cm51XejZ+39za97sxs75JWdSVZspqLbLlgm2oMDqGEOPDxTzCQ/AOBfB8JCclHqAkJ4OAYjAFX3OSiYvW6u9rep/e39/r9zv3MSLLBaCWtysr3K7+e2Zm3PM953rmv+zrnOtcRsTcbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEbARsBGwEb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W8fio49/44n7H7jvp3ft3ZMEqthdrZaV14/qh1VXFdRFBBEpCiBWQM/MClNTU4PlMvIj5jARWGERMMlshV1QczrXVgROZuuoMtYv9kWCUx7X54v4bH+94vUHyz6PpQLlU1hy6jMq5r7viS0uqcIXv/jQX6xas+pPOnxd7VRigWbTxvKsgY9Zma8o6zM0Y1ZWdhz//KlTp85BTUNixBwmAisrAiaZrazrac7mGo1AuopUx7cOGWm9tuJpBFWsz33+4KE73/Pe53ftCUZD0dDWar0SdNDQCqBaVajmgeeH7UKhlvb6omODQyPnlwA7XqNhMi/bROBVI2DQjObNYSJwjUdgyla1T3/6r/6EGm+4XKhdtKp2JugG8/VSI0uKTIfDiaFAMH78iade/Jzl9SNnbA4TgZUXAcM3WXnX1JzRWzACG9u93g898P6dv/bxX/79UMDbixaj/9ChQ9O1hpUtVeuzZy+MPvvCoeOnTg7OZt+C4TGn/BaIgElmb4GLbE7xrRGB1QmP/8MPfnBVWzS4amZmSo2NjeVGxmcLjaaqF6uqWEGi8a0RCXOWJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAiYCJgImAm9WBP4/rjS2dMAEIYwAAAAASUVORK5CYII='
                        doc.image(`${bsa64}`, 0, 15, { width: 100 }).text('KRISH BUSINESS SERVICE LTD', 200, 45);
                        doc.moveDown();
                        doc.moveDown();
                        doc.text('UNIT 7, NEW MAN ROAD CROYDON CR0 3JX Mob:07472078196', 100, 60)
                        doc.moveDown();
                        let table1 = [
                                ["Day: 1", "", "", "", "", "Invoice No: ", `${findUserOrder.orderId}`],
                                [`${findUserOrder.address}${findUserOrder.city}`, "", "", "", "", "Invoice Date :", `${fullDate} ${hr}:${min}`],
                                [`${findUserOrder.country} ${findUserOrder.pincode}`, "", "", "", "", "Cusstomer Acc :", `233445`],
                                [`Tel: ${user.phone || "XXXXX"}`, "", "", "", "", "Cashier :", `SS`],
                                [`VAT NO:${user.vatNumber || "XXXXX"}`, "", "", "", "", "POS ID :", `0`],
                        ]
                        const tableArray = {
                                headers: ["INVOICE To", "", "", "", "", "", "INVOICE", ""],
                                rows: table1,
                        };
                        doc.moveDown();
                        doc.moveDown();
                        doc.moveDown();
                        doc.table(tableArray, { width: 550, x: 15, y: 0 }); // A4 595.28 x 841.89 (portrait) (about width sizes)
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
                        doc.table(table, {
                                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(6),
                                prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(6),
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
                        let table13 = [
                                ["HSBC", "Z=0 % S=20 %", "R=5 %", "", "", "AMOUNT", "", "VAT AMOUNT"],
                                ["KRISH Business", "Service Ltd", "", "", "", `£${findUserOrder?.total}`, "", `£${findUserOrder?.tax}`],
                                ["Sort Code:", "40-46-15", "", "", "", "Delivery Charges", "", `TOTAL TO PAY`],
                                ["Acc No:81440977", "", "", "", "", `${findUserOrder?.delivery}`, "", `£${findUserOrder?.paidAmount}`],
                        ]
                        const tableArray4 = {
                                headers: ["", "", "", "", "", "", "", ""],
                                rows: table13,
                        };
                        doc.table(tableArray4, { width: 550, x: 10, y: 0 });
                        doc.text('VAT NO: GB350971689    CO RegNo:1139394    AWRS NO: XVAW00000113046', 115, 690).font("Helvetica").fontSize(16);
                        doc.text('THANK YOU FOR YOUR VALUE CUSTOM', 100, 710).font("Helvetica").fontSize(8);
                        doc.text('GOODS WITHOUT ENGLISH INGREDIENTS SHOULD BE LABELLED ACCORDINGLY BEFORE SALE', 98, 725).font("Helvetica").fontSize(5);
                        doc.text('The goods once sold will not be returnable unless agreed. Pallet must be returned or a charge will be made', 110, 735).font("Helvetica").fontSize(35);
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
                                        let deleteCart = await Cart.findOneAndDelete({ userId: findUserOrder.userId });
                                        if (deleteCart) {
                                                return res.status(200).json({ message: "Payment success.", status: 200, data: {} });
                                        }
                                }
                        } else {
                                let deleteCart = await Cart.findOneAndDelete({ userId: findUserOrder.userId });
                                if (deleteCart) {
                                        return res.status(200).json({ message: "Payment success.", status: 200, data: {} });
                                }
                        }
                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
                }

        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
};
exports.successOrderForPaypal = async (req, res) => {
        try {
                const payerId = req.query.PayerID;
                const paymentId = req.query.paymentId;
                const execute_payment_json = {
                        "payer_id": payerId,
                        "transactions": [{
                                "amount": {
                                        "currency": "GBP",
                                        "total": req.query.amount
                                }
                        }]
                };
                paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
                        if (error) {
                                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
                        } else {
                                return res.status(200).send({ status: 200, message: "Payment success..", data: payment, });
                        }
                });
        } catch (error) {
                console.log(error);
                return res.status(501).send({ status: 501, message: "server error.", data: {}, });
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
exports.placeOrderPaypalPayment1 = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let delivery = Number(findUserOrder.delivery);
                        let line_items = [];
                        let totalAmount = 0;
                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                if (findu) {
                                        let findProduct = await Product.findById(findu.productId);
                                        if (findProduct) {
                                                let price = Number(findu.paidAmount)
                                                totalAmount = totalAmount + price;
                                                console.log(price);
                                                let obj2 = {
                                                        "name": findProduct.name,
                                                        "price": Number(price).toFixed(2),
                                                        "currency": "GBP",
                                                        "quantity": 1
                                                };
                                                line_items.push(obj2);
                                        }
                                }
                        }
                        totalAmount = totalAmount + delivery;
                        let deliveryItem = {
                                "name": 'Delivery Charge',
                                "price": delivery,
                                "currency": "GBP",
                                "quantity": 1
                        };
                        line_items.push(deliveryItem);
                        console.log(line_items)
                        const create_payment_json = {
                                "intent": "sale",
                                "payer": {
                                        "payment_method": "paypal"
                                },
                                "redirect_urls": {
                                        'return_url': `https://krish-vapes.vercel.app/order-success/${findUserOrder.orderId}`,
                                        'cancel_url': `https://krish-vapes.vercel.app/order-failure/${findUserOrder.orderId}`,
                                },
                                "transactions": [{
                                        "item_list": {
                                                "items": line_items
                                        },
                                        "amount": {
                                                "currency": "GBP",
                                                "total": Number(totalAmount).toFixed(2)
                                        },
                                        "description": "Hat for the best team ever"
                                }]
                        };
                        paypal.payment.create(create_payment_json, async (error, payData) => {
                                if (error) {
                                        return res.status(500).json({ status: 'error', message: 'Server error.', data: error });
                                } else {
                                        for (let i = 0; i < payData.links.length; i++) {
                                                if (payData.links[i].rel === 'approval_url') {
                                                        var tokenId = payData.links[i].href.split('&token=');
                                                        let url = payData.links[i].href;
                                                        return res.status(200).json({ status: 'success', session: url });
                                                }
                                        }
                                }
                        });
                } else {
                        return res.status(404).json({ message: 'No data found', data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(500).json({ status: 'error', message: 'Server error.', data: error.message });
        }
};
exports.placeOrderPaypalPayment = async (req, res) => {
        try {
                let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
                if (findUserOrder) {
                        let delivery = 0;
                        let line_items = [];
                        let totalAmount = 0;
                        for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                if (findu) {
                                        let findProduct = await Product.findById(findu.productId);
                                        if (findProduct) {
                                                totalAmount = 1;
                                                let obj2 = {
                                                        "name": findProduct.name,
                                                        "price": 1,
                                                        "currency": "GBP",
                                                        "quantity": 1
                                                };
                                                line_items.push(obj2);
                                        }
                                }
                        }
                        totalAmount = totalAmount;
                        // let deliveryItem = {
                        //         "name": 'Delivery Charge',
                        //         "price": delivery,
                        //         "currency": "GBP",
                        //         "quantity": 1
                        // };
                        // line_items.push(deliveryItem);
                        console.log(line_items)
                        const create_payment_json = {
                                "intent": "sale",
                                "payer": {
                                        "payment_method": "paypal"
                                },
                                "redirect_urls": {
                                        'return_url': `https://krish-vapes.vercel.app/order-success/${findUserOrder.orderId}-amount=${totalAmount}`,
                                        'cancel_url': `https://krish-vapes.vercel.app/order-failure/${findUserOrder.orderId}`,
                                },
                                "transactions": [{
                                        "item_list": {
                                                "items": line_items
                                        },
                                        "amount": {
                                                "currency": "GBP",
                                                "total": Number(totalAmount).toFixed(2)
                                        },
                                        "description": "Hat for the best team ever"
                                }]
                        };
                        paypal.payment.create(create_payment_json, async (error, payData) => {
                                if (error) {
                                        return res.status(500).json({ status: 'error', message: 'Server error.', data: error });
                                } else {
                                        for (let i = 0; i < payData.links.length; i++) {
                                                if (payData.links[i].rel === 'approval_url') {
                                                        var tokenId = payData.links[i].href.split('&token=');
                                                        let url = payData.links[i].href;
                                                        await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { transactionId: payData.id } }, { new: true })
                                                        console.log(payData)
                                                        return res.status(200).json({ status: 'success', session: url });
                                                }
                                        }
                                }
                        });
                } else {
                        return res.status(404).json({ message: 'No data found', data: {} });
                }
        } catch (error) {
                console.log(error);
                return res.status(500).json({ status: 'error', message: 'Server error.', data: error.message });
        }
};