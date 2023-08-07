const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const banner = require("../model/bannerModel");
const blog = require("../model/blogModel");
const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const contact = require("../model/contactDetail");
const helpandSupport = require("../model/helpAndSupport");
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
                const { firstName, lastName, email, dob, password, courtesyTitle } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                user.firstName = firstName || user.firstName;
                user.lastName = lastName || user.lastName;
                user.email = email || user.email;
                user.dob = dob || user.dob;
                user.courtesyTitle = courtesyTitle || user.courtesyTitle;
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
                const { address, addressComplement, city, pincode, country } = req.body;
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
                const { address, addressComplement, city, pincode, country } = req.body;
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
                                                                                console.log("---------------------------------271------------");
                                                                                if (findColor.size == true) {
                                                                                        console.log("---------------------------------273------------", findColor.colorSize.length);
                                                                                        if (findColor.colorSize.length > 0) {
                                                                                                for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                                                        console.log("---------------------------------275------------");
                                                                                                        if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                                                console.log("---------------------------------277------------");
                                                                                                                let tax = 0, totalTax = 0;
                                                                                                                if (findProduct.taxInclude == true) {
                                                                                                                        tax = findProduct.tax;
                                                                                                                } else {
                                                                                                                        tax = tax;
                                                                                                                }
                                                                                                                let obj = {
                                                                                                                        categoryId: findProduct.categoryId,
                                                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                                                        productId: findProduct._id,
                                                                                                                        productColorId: findColor._id,
                                                                                                                        productSize: req.body.size,
                                                                                                                        productPrice: findProduct.price,
                                                                                                                        quantity: req.body.quantity,
                                                                                                                        tax: tax,
                                                                                                                        totalTax: tax * req.body.quantity,
                                                                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                                        paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                                }
                                                                                                                totalTax = findCart.tax + (tax * req.body.quantity)
                                                                                                                let totalAmount = findCart.totalAmount + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                                                                let paidAmount = findCart.paidAmount + (Number((findProduct.price * req.body.quantity).toFixed(2)) + (tax * req.body.quantity));
                                                                                                                let totalItem = findCart.totalItem + 1;
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
                                                                                        if (findProduct.taxInclude == true) {
                                                                                                tax = findProduct.tax;
                                                                                        } else {
                                                                                                tax = tax;
                                                                                        }
                                                                                        let obj = {
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productColorId: findColor._id,
                                                                                                productPrice: findProduct.price,
                                                                                                quantity: req.body.quantity,
                                                                                                tax: tax,
                                                                                                totalTax: tax * req.body.quantity,
                                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                        }
                                                                                        totalTax = findCart.tax + (tax * req.body.quantity)
                                                                                        let totalAmount = findCart.totalAmount + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                                        let paidAmount = findCart.paidAmount + (Number((findProduct.price * req.body.quantity).toFixed(2)) + (tax * req.body.quantity));
                                                                                        let totalItem = findCart.totalItem + 1;
                                                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: totalTax }, $push: { products: obj } }, { new: true })
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                                }
                                                                        }
                                                                        else {
                                                                                return res.status(404).send({ status: 404, message: "Color not found." });
                                                                        }
                                                                }
                                                                else {
                                                                        console.log("322================");
                                                                        let tax = 0;
                                                                        if (findProduct.taxInclude == true) {
                                                                                tax = findProduct.tax;
                                                                        } else {
                                                                                tax = tax;
                                                                        }
                                                                        let obj = {
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productPrice: findProduct.price,
                                                                                quantity: req.body.quantity,
                                                                                tax: tax,
                                                                                totalTax: tax * req.body.quantity,
                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                        }
                                                                        let update = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $push: { products: obj } }, { new: true });
                                                                        if (update) {
                                                                                let totalAmount = 0, totalTax = 0, paidAmount = 0;
                                                                                for (let j = 0; j < update.products.length; j++) {
                                                                                        totalAmount = totalAmount + update.products[j].total,
                                                                                                totalTax = totalTax + update.products[j].totalTax,
                                                                                                paidAmount = paidAmount + update.products[j].paidAmount
                                                                                }
                                                                                let update1 = await Cart.findByIdAndUpdate({ _id: update._id }, { $set: { totalAmount: totalAmount, paidAmount: paidAmount, tax: totalTax, totalItem: update.products.length } }, { new: true });
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

                                                                console.log("---------------------------------271------------");
                                                                if (findColor.size == true) {
                                                                        console.log("---------------------------------273------------");
                                                                        if (findColor.colorSize.length > 0) {
                                                                                for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                                        console.log("---------------------------------275------------");
                                                                                        if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                                console.log("---------------------------------277------------");
                                                                                                let tax = 0, totalTax = 0;
                                                                                                if (findProduct.taxInclude == true) {
                                                                                                        tax = findProduct.tax;
                                                                                                } else {
                                                                                                        tax = tax;
                                                                                                }
                                                                                                let obj = {
                                                                                                        categoryId: findProduct.categoryId,
                                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                                        productId: findProduct._id,
                                                                                                        productColorId: findColor._id,
                                                                                                        productSize: req.body.size,
                                                                                                        productPrice: findProduct.price,
                                                                                                        quantity: req.body.quantity,
                                                                                                        tax: tax,
                                                                                                        totalTax: tax * req.body.quantity,
                                                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                        paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                }
                                                                                                totalTax = totalTax + (tax * req.body.quantity)
                                                                                                let totalAmount = findCart.totalAmount + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                                                let paidAmount = findCart.paidAmount + (Number((findProduct.price * req.body.quantity).toFixed(2)) + totalTax);
                                                                                                let totalItem = findCart.totalItem + 1;
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
                                                                        let products = [], tax = 0, totalTax = 0;
                                                                        if (findProduct.taxInclude == true) {
                                                                                tax = findProduct.tax;
                                                                        } else {
                                                                                tax = tax;
                                                                        }
                                                                        totalTax = totalTax + (tax * req.body.quantity)
                                                                        let obj = {
                                                                                categoryId: findProduct.categoryId,
                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                productId: findProduct._id,
                                                                                productColorId: findColor._id,
                                                                                productPrice: findProduct.price,
                                                                                quantity: req.body.quantity,
                                                                                tax: tax,
                                                                                totalTax: tax * req.body.quantity,
                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                        }
                                                                        let totalAmount = findCart.totalAmount + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                        let paidAmount = (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                                        let totalItem = findCart.totalItem + 1;
                                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: totalTax }, $push: { products: obj } }, { new: true })
                                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                                }
                                                        }
                                                        else {
                                                                return res.status(404).send({ status: 404, message: "Color not found." });
                                                        }
                                                }
                                                else {
                                                        console.log("322================");
                                                        let products = [], tax = 0, totalTax = 0;
                                                        if (findProduct.taxInclude == true) {
                                                                tax = findProduct.tax;
                                                        } else {
                                                                tax = tax;
                                                        }
                                                        totalTax = totalTax + (tax * req.body.quantity)
                                                        let obj = {
                                                                categoryId: findProduct.categoryId,
                                                                subcategoryId: findProduct.subcategoryId,
                                                                productId: findProduct._id,
                                                                productPrice: findProduct.price,
                                                                quantity: req.body.quantity,
                                                                tax: tax,
                                                                totalTax: tax * req.body.quantity,
                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        }
                                                        let totalAmount = findCart.totalAmount + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                        let paidAmount = (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2));
                                                        let totalItem = findCart.totalItem + 1;
                                                        let updateCart = await Cart.findByIdAndUpdate({ _id: findCart._id }, { $set: { totalAmount: totalAmount, totalItem: totalItem, paidAmount: paidAmount, tax: totalTax }, $push: { products: obj } }, { new: true })
                                                        return res.status(200).send({ message: "Product add to cart.", data: updateCart, });
                                                }
                                        }
                                }
                                else {
                                        return res.status(404).send({ status: 404, message: "Product not found." });
                                }
                        }
                        ///////////////////////////////first time add to cart//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                        else {
                                let findProduct = await Product.findById({ _id: req.body.productId });
                                if (findProduct) {
                                        console.log(findProduct);
                                        if (findProduct.colorActive == true) {
                                                let findColor = await ProductColor.findOne({ productId: findProduct._id, _id: req.body.colorId });
                                                if (findColor) {
                                                        console.log(findColor);
                                                        if (findColor.size == true) {
                                                                if (findColor.colorSize.length > 0) {
                                                                        for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                                if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                        let products = [], tax = 0, totalTax = 0;
                                                                                        if (findProduct.taxInclude == true) {
                                                                                                tax = findProduct.tax;
                                                                                        } else {
                                                                                                tax = tax;
                                                                                        }
                                                                                        let obj = {
                                                                                                categoryId: findProduct.categoryId,
                                                                                                subcategoryId: findProduct.subcategoryId,
                                                                                                productId: findProduct._id,
                                                                                                productColorId: findColor._id,
                                                                                                productSize: req.body.size,
                                                                                                productPrice: findProduct.price,
                                                                                                quantity: req.body.quantity,
                                                                                                tax: tax,
                                                                                                totalTax: tax * req.body.quantity,
                                                                                                total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                        }
                                                                                        totalTax = totalTax + (tax * req.body.quantity)
                                                                                        products.push(obj)
                                                                                        let cartObj = {
                                                                                                userId: user._id,
                                                                                                products: products,
                                                                                                tax: totalTax,
                                                                                                totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                                paidAmount: (Number((findProduct.price * req.body.quantity).toFixed(2)) + totalTax),
                                                                                                totalItem: 1,
                                                                                        }
                                                                                        const cartCreate = await Cart.create(cartObj);
                                                                                        return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                                                                }
                                                                        }
                                                                } else {
                                                                        return res.status(409).send({ status: 409, message: "Currently no size available." });
                                                                }
                                                        }
                                                        else {
                                                                console.log("Color====208====", findColor);
                                                                let products = [], tax = 0, totalTax = 0;
                                                                if (findProduct.taxInclude == true) {
                                                                        tax = findProduct.tax;
                                                                } else {
                                                                        tax = tax;
                                                                }
                                                                totalTax = totalTax + (tax * req.body.quantity)
                                                                let obj = {
                                                                        categoryId: findProduct.categoryId,
                                                                        subcategoryId: findProduct.subcategoryId,
                                                                        productId: findProduct._id,
                                                                        productColorId: findColor._id,
                                                                        productPrice: findProduct.price,
                                                                        quantity: req.body.quantity,
                                                                        tax: tax,
                                                                        totalTax: tax * req.body.quantity,
                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                        paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                }
                                                                products.push(obj)
                                                                let cartObj = {
                                                                        userId: user._id,
                                                                        products: products,
                                                                        tax: totalTax,
                                                                        totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                        paidAmount: (Number((findProduct.price * req.body.quantity).toFixed(2)) + totalTax),
                                                                        totalItem: 1,
                                                                }
                                                                console.log(cartObj);
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
                                                let products = [], tax = 0, totalTax = 0;
                                                if (findProduct.taxInclude == true) {
                                                        tax = findProduct.tax;
                                                } else {
                                                        tax = tax;
                                                }
                                                totalTax = totalTax + (tax * req.body.quantity)
                                                let obj = {
                                                        categoryId: findProduct.categoryId,
                                                        subcategoryId: findProduct.subcategoryId,
                                                        productId: findProduct._id,
                                                        productPrice: findProduct.price,
                                                        quantity: req.body.quantity,
                                                        tax: tax,
                                                        totalTax: tax * req.body.quantity,
                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        paidAmount: (tax * req.body.quantity) + Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                }
                                                products.push(obj)
                                                let cartObj = {
                                                        userId: user._id,
                                                        products: products,
                                                        tax: totalTax,
                                                        totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        paidAmount: (Number((findProduct.price * req.body.quantity).toFixed(2)) + totalTax),
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
                                                                        tax: findCart.tax,
                                                                        total: findCart.totalAmount,
                                                                        totalItem: findCart.totalItem
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
                                                let obj2 = {
                                                        price_data: {
                                                                currency: "inr",
                                                                product_data: {
                                                                        name: `${findProduct.name}`,
                                                                },
                                                                unit_amount: `${findu.paidAmount * 100}`,
                                                        },
                                                        quantity: findu.quantity,
                                                }
                                                line_items.push(obj2)
                                        }
                                }
                        }
                        const session = await stripe.checkout.sessions.create({
                                payment_method_types: ["card"],
                                success_url: `https://krish-vapes.vercel.app/order-success/${findUserOrder.orderId}`,
                                cancel_url: `https://krish-vapes.vercel.app/order-failure/${findUserOrder.orderId}`,
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
                        let update = await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                        if (update) {
                                let line_items = [];
                                for (let i = 0; i < findUserOrder.Orders.length; i++) {
                                        let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
                                        if (findu) {
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
                                                                        paidAmount: findu.paidAmount
                                                                }
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
                                                                paidAmount: findu.paidAmount
                                                        }
                                                        line_items.push(obj2)
                                                }
                                                await order.findByIdAndUpdate({ _id: findUserOrder.Orders[i] }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
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
                                let shipping = {
                                        address: findUserOrder.address,
                                        addressComplement: findUserOrder.addressComplement,
                                        city: findUserOrder.city,
                                        pincode: findUserOrder.pincode,
                                        country: findUserOrder.country
                                };
                                let table1 = [
                                        ["Invoice Number", `${findUserOrder.orderId}`, "", `${req.user.firstName} ${req.user.lastName}`],
                                        ["Invoice Date", `${fullDate} ${hr}:${min}`, "", `${shipping.address} ${shipping.city}`],
                                        ["Total item", line_items.length, "", `${shipping.country} ${shipping.pincode}`],
                                ]
                                const tableArray = {
                                        title: "INVOICE",
                                        headers: ["", "", "", ""],
                                        rows: table1,
                                };
                                doc.table(tableArray, { width: 450 }); // A4 595.28 x 841.89 (portrait) (about width sizes)
                                doc.moveDown();
                                const table = {
                                        headers: [
                                                { label: "Product Name", property: 'product', width: 60, renderer: null },
                                                { label: "Description", property: 'description', width: 250, renderer: null },
                                                { label: "Color", property: 'ProductColor', width: 25, renderer: null },
                                                { label: " Size", property: 'productSize', width: 25, renderer: null },
                                                { label: "Price", property: 'productPrice', width: 25, renderer: null },
                                                { label: "Qty", property: 'quantity', width: 20, renderer: null },
                                                { label: "tax", property: 'tax', width: 20, renderer: null },
                                                { label: "totalTax", property: 'totalTax', width: 35, renderer: null },
                                                {
                                                        label: "Paid Amount", property: 'paidAmount', width: 100,
                                                        renderer: (value, indexColumn, indexRow, row) => { return `U$ ${Number(value).toFixed(2)}` }
                                                },
                                        ],
                                        datas: line_items,
                                };
                                doc.table(table, {
                                        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                                        prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(8),
                                });
                                doc.moveDown();
                                let table2 = [
                                        ["Sub Total", findUserOrder.total],
                                        ["Tax", findUserOrder.tax],
                                        ["Total", findUserOrder.paidAmount],
                                ]
                                const tableArray1 = {
                                        headers: ["", ""],
                                        rows: table2,
                                };
                                doc.table(tableArray1, { width: 150, x: 400, y: 0 });

                                let pdfBuffer = await new Promise((resolve) => {
                                        let chunks = [];
                                        doc.on('data', (chunk) => chunks.push(chunk));
                                        doc.on('end', () => resolve(Buffer.concat(chunks)));
                                        doc.end();
                                });
                                let transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        auth: {
                                                "user": "vcjagal1994@gmail.com",
                                                "pass": "iyekdwwhkrthvklq"
                                        }
                                });
                                var mailOptions = {
                                        from: 'vcjagal1994@gmail.com',
                                        to: 'vcjagal1994@gmail.com',
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
                                        await Cart.findOneAndDelete({ userId: req.user._id });
                                        res.status(200).json({ message: "Payment success.", status: 200, data: update });
                                } else {
                                        await Cart.findOneAndDelete({ userId: req.user._id });
                                        res.status(200).json({ message: "Payment success.", status: 200, data: update });
                                }
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
// exports.successOrder = async (req, res) => {
//         try {
//                 let findUserOrder = await userOrders.findOne({ orderId: req.params.orderId });
//                 if (findUserOrder) {
//                         let update = await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                         if (update) {
//                                 let count = 0, line_items = [];
//                                 for (let i = 0; i < update.Orders.length; i++) {
//                                         let findu = await order.findOne({ _id: findUserOrder.Orders[i] });
//                                         if (findu) {
//                                                 let product, description, color, obj2;
//                                                 let findProduct = await Product.findById({ _id: findu.productId });
//                                                 if (findProduct) {
//                                                         product = findProduct.name;
//                                                         description = findProduct.description;
//                                                 }
//                                                 if (findu.productColorId != (null || undefined)) {
//                                                         let findColor = await ProductColor.findOne({ _id: findu.productColorId });
//                                                         if (findColor) {
//                                                                 color = findColor.color;
//                                                                 obj2 = {
//                                                                         product: product,
//                                                                         description: description,
//                                                                         ProductColor: color,
//                                                                         productSize: findu.productSize || "",
//                                                                         productPrice: findu.productPrice,
//                                                                         quantity: findu.quantity,
//                                                                         tax: findu.tax,
//                                                                         totalTax: findu.totalTax,
//                                                                         paidAmount: findu.paidAmount
//                                                                 }
//                                                                 line_items.push(obj2)
//                                                         }
//                                                 } else {
//                                                         obj2 = {
//                                                                 product: product,
//                                                                 description: description,
//                                                                 productPrice: findu.productPrice,
//                                                                 quantity: findu.quantity,
//                                                                 tax: findu.tax,
//                                                                 totalTax: findu.totalTax,
//                                                                 paidAmount: findu.paidAmount
//                                                         }
//                                                         line_items.push(obj2)
//                                                 }
//                                                 await order.findByIdAndUpdate({ _id: update.Orders[i]._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
//                                                 count++;
//                                         }
//                                 }
//                                 let invoice = {
//                                         shipping: {
//                                                 address: findUserOrder.address.address,
//                                                 addressComplement: findUserOrder.addressComplement,
//                                                 city: findUserOrder.city,
//                                                 pincode: findUserOrder.pincode,
//                                                 country: findUserOrder.country
//                                         },
//                                         items: line_items,
//                                         totalTax: findUserOrder.totalTax,
//                                         subtotal: findUserOrder.total,
//                                         paid: findUserOrder.paidAmount,
//                                         invoice_nr: findUserOrder.orderId,
//                                 };

//                                 await generateInvoiceTable(doc, invoice)
//                                 await generateCustomerInformation(doc, invoice)
//                                 await generateHeader(doc)
//                                 await generateFooter(doc)
//                                 function generateCustomerInformation(doc, invoice) {
//                                         const shipping = invoice.shipping;
//                                         doc.text(`Invoice Number: ${invoice.invoice_nr}`, 50, 200)
//                                                 .text(`Invoice Date: ${new Date()}`, 50, 215)
//                                                 .text(`Tax: ${invoice.totalTax}`, 50, 130)
//                                                 .text(`Sub Total Due: ${invoice.subtotal}`, 50, 130)
//                                                 .text(`Total: ${invoice.paid}`, 50, 130)
//                                                 .text(shipping.name, 400, 200)
//                                                 .text(shipping.address, 400, 215)
//                                                 .text(`${shipping.city}, ${shipping.country} (${shipping.pincode})`, 300, 130,)
//                                                 .moveDown();
//                                 }
//                                 function generateTableRow(doc, y, c1, c2, c3, c4, c5) {
//                                         doc.fontSize(10)
//                                                 .text(c1, 50, y)
//                                                 .text(c2, 150, y)
//                                                 .text(c3, 280, y, { width: 90, align: 'right' })
//                                                 .text(c4, 370, y, { width: 90, align: 'right' })
//                                                 .text(c5, 0, y, { align: 'right' });
//                                 }
//                                 function generateInvoiceTable(doc, invoice) {
//                                         let i, invoiceTableTop = 330;
//                                         for (i = 0; i < invoice.items.length; i++) {
//                                                 const item = invoice.items[i];
//                                                 const position = invoiceTableTop + (i + 1) * 30;
//                                                 generateTableRow(
//                                                         doc,
//                                                         position,
//                                                         item.product,
//                                                         item.ProductColor,
//                                                         item.description,
//                                                         item.productSize,
//                                                         item.productPrice,
//                                                         item.quantity,
//                                                         item.tax,
//                                                         item.totalTax,
//                                                         item.paidAmount,
//                                                 );
//                                         }
//                                 }
//                                 function generateHeader(doc) {
//                                         // doc.image('logo.png', 50, 45, { width: 50 })
//                                         doc.fillColor('#444444')
//                                                 .fontSize(20)
//                                                 .text('ACME Inc.', 110, 57)
//                                                 .fontSize(10)
//                                                 .text('123 Main Street', 200, 65, { align: 'right' })
//                                                 .text('New York, NY, 10025', 200, 80, { align: 'right' })
//                                                 .moveDown();
//                                 }
//                                 function generateFooter(doc) {
//                                         doc.fontSize(
//                                                 10,
//                                         ).text(
//                                                 'Payment is due within 15 days. Thank you for your business.',
//                                                 50,
//                                                 780,
//                                                 { align: 'center', width: 500 },
//                                         );
//                                 }
//                                 const pdfBuffer = await new Promise((resolve) => {
//                                         const chunks = [];
//                                         doc.on('data', (chunk) => chunks.push(chunk));
//                                         doc.on('end', () => resolve(Buffer.concat(chunks)));
//                                         doc.end();
//                                 });
//                                 let transporter = nodemailer.createTransport({
//                                         service: 'gmail',
//                                         auth: {
//                                                 "user": "vcjagal1994@gmail.com",
//                                                 "pass": "iyekdwwhkrthvklq"
//                                         }
//                                 });
//                                 var mailOptions = {
//                                         from: 'vcjagal1994@gmail.com',
//                                         to: 'vcjagal1994@gmail.com',
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
//                                         await Cart.findOneAndDelete({ userId: req.user._id });
//                                         res.status(200).json({ message: "Payment success.", status: 200, data: update });
//                                 } else {
//                                         await Cart.findOneAndDelete({ userId: req.user._id });
//                                         res.status(200).json({ message: "Payment success.", status: 200, data: update });
//                                 }
//                         }
//                 } else {
//                         return res.status(404).json({ message: "No data found", data: {} });
//                 }
//         } catch (error) {
//                 console.log(error);
//                 res.status(501).send({ status: 501, message: "server error.", data: {}, });
//         }
// };
