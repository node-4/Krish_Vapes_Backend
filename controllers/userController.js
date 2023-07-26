const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const banner = require("../model/bannerModel");
const blog = require("../model/blogModel");
const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const contact = require("../model/contactDetail");
const helpandSupport = require("../model/helpAndSupport");
const ProductColor = require("../model/ProductColor");
const Product = require("../model/productModel");
const staticContent = require("../model/staticContent");
const subCategory = require("../model/subCategoryModel");
const User = require("../model/userModel");
const visitorSubscriber = require("../model/visitorSubscriber");
const Wishlist = require("../model/WishlistModel");
exports.registration = async (req, res) => {
        const { phone, email } = req.body;
        try {
                req.body.email = email.split(" ").join("").toLowerCase();
                let user = await User.findOne({ email: req.body.email, userType: "USER" });
                if (!user) {
                        req.body.password = bcrypt.hashSync(req.body.password, 8);
                        req.body.userType = "USER";
                        req.body.accountVerification = true;
                        req.body.fullName = `${req.body.firstName} ${req.body.lastName}`;
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
                req.body.email = email.split(" ").join("").toLowerCase();
                const user = await User.findOne({ email: req.body.email, userType: "USER" });
                if (!user) {
                        return res.status(404).send({ message: "user not found ! not registered" });
                }
                const isValidPassword = bcrypt.compareSync(password, user.password);
                if (!isValidPassword) {
                        return res.status(401).send({ message: "Wrong password" });
                }
                const accessToken = jwt.sign({ id: user._id }, authConfig.secret, { expiresIn: authConfig.accessTokenTime, });
                return res.status(201).send({ data: user, accessToken: accessToken });
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
                const { alias, company, vatNumber, address, addressComplement, city, pincode, country, phone } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                user.alias = alias || user.alias;
                user.company = company || user.company;
                user.vatNumber = vatNumber || user.vatNumber;
                user.address = address || user.address;
                user.addressComplement = addressComplement || user.addressComplement;
                user.city = city || user.city;
                user.pincode = pincode || user.pincode;
                user.country = country || user.country;
                user.phone = phone || user.phone;
                const updated = await user.save();
                const findData = await User.findById(updated._id).select('alias company vatNumber address addressComplement city pincode country phone');
                return res.status(200).send({ message: "updated", data: findData });
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "internal server error " + err.message, });
        }
};
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
                res.status(200).json({ status: 200, wishlist: myList, });
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

                        } else {
                                let findProduct = await Product.findById({ _id: req.body.productId });
                                if (findProduct) {
                                        if (findProduct.color == true) {
                                                let findColor = await ProductColor.findOne({ productId: findProduct._id, _id: req.body.colorId });
                                                if (findColor) {
                                                        if (findColor.size == true) {
                                                                for (let i = 0; i < findColor.colorSize.length; i++) {
                                                                        if ((findColor.colorSize[i].size == req.body.size) == true) {
                                                                                let products = []
                                                                                let obj = {
                                                                                        categoryId: findProduct.categoryId,
                                                                                        subcategoryId: findProduct.subcategoryId,
                                                                                        productId: findProduct._id,
                                                                                        productColorId: findColor._id,
                                                                                        productSize: req.body.size,
                                                                                        productPrice: findProduct.price,
                                                                                        quantity: req.body.quantity,
                                                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                }
                                                                                products.push(obj)
                                                                                let cartObj = {
                                                                                        userId: user._id,
                                                                                        products: products,
                                                                                        totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                        paidAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                                                        totalItem: 1,
                                                                                }
                                                                                console.log(cartObj);
                                                                                const cartCreate = await Cart.create(cartObj);
                                                                                return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                                                        }
                                                                }
                                                        } else {
                                                                console.log("Color========", findColor);
                                                        }
                                                } else {
                                                        return res.status(404).send({ status: 404, message: "Color not found." });
                                                }
                                        } else {
                                                console.log("214================");
                                                let products = []
                                                let obj = {
                                                        categoryId: findProduct.categoryId,
                                                        subcategoryId: findProduct.subcategoryId,
                                                        productId: findProduct._id,
                                                        productPrice: findProduct.price,
                                                        quantity: req.body.quantity,
                                                        total: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                }
                                                products.push(obj)
                                                let cartObj = {
                                                        userId: user._id,
                                                        products: products,
                                                        totalAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        paidAmount: Number((findProduct.price * req.body.quantity).toFixed(2)),
                                                        totalItem: 1,
                                                }
                                                console.log(cartObj);
                                                const cartCreate = await Cart.create(cartObj);
                                                return res.status(200).send({ message: "Product add to cart.", data: cartCreate, });
                                        }
                                } else {
                                        return res.status(404).send({ status: 404, message: "Product not found." });
                                }
                        }
                }
        } catch (error) {
                console.log(error);
                res.status(501).send({ status: 501, message: "server error.", data: {}, });
        }
}