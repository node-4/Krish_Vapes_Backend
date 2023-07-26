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
                const { firstName, lastName, alias, company, vatNumber, address, addressComplement, city, pincode, country, phone } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                } else {
                        let obj = {
                                userId: user._id,
                                firstName: firstName,
                                lastName: lastName,
                                alias: alias,
                                company: company,
                                vatNumber: vatNumber,
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
                const { firstName, lastName, alias, company, vatNumber, address, addressComplement, city, pincode, country, phone } = req.body;
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
                                firstName: firstName || findData.firstName,
                                lastName: lastName || findData.lastName,
                                alias: alias || findData.alias,
                                company: company || findData.company,
                                vatNumber: vatNumber || findData.vatNumber,
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
                                return res.status(400).send({ status: 400, message: "Address detail not found.", data: {} });
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
                                        if (findProduct.colorActive == true) {
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
                                                                console.log("Color====208====", findColor);
                                                                let products = []
                                                                let obj = {
                                                                        categoryId: findProduct.categoryId,
                                                                        subcategoryId: findProduct.subcategoryId,
                                                                        productId: findProduct._id,
                                                                        productColorId: findColor._id,
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
                let findOrder = await userOrders.find({ user: req.user.id, orderStatus: "unconfirmed" });
                if (findOrder.length > 0) {
                        for (let i = 0; i < findOrder.length; i++) {
                                await userOrders.findOneAndDelete({ orderId: findOrder[i].orderId });
                                let findOrders = await userOrders.find({ orderId: findOrder[i].orderId });
                                if (findOrders.length > 0) {
                                        for (let i = 0; i < findOrders.length; i++) {
                                                await userOrders.findByIdAndDelete({ _id: findOrders[i]._id });
                                        }
                                }
                        }
                        let findCart = await Cart.findOne({ userId: req.user.id });
                        if (findCart) {
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
                                                total: findCart.products[i].total,
                                                address: {
                                                        street1: req.body.street1,
                                                        street2: req.body.street2,
                                                        city: req.body.city,
                                                        state: req.body.state,
                                                        country: req.body.country
                                                },
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
                                                                address: {
                                                                        street1: req.body.street1,
                                                                        street2: req.body.street2,
                                                                        city: req.body.city,
                                                                        state: req.body.state,
                                                                        country: req.body.country
                                                                },
                                                                total: findCart.totalAmount,
                                                                totalItem: findCart.totalItem
                                                        };
                                                        await userOrders.create(obj1);
                                                }
                                        }
                                }
                                let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
                        }
                } else {
                        let findCart = await Cart.findOne({ userId: req.user.id });
                        if (findCart) {
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
                                                total: findCart.products[i].total,
                                                address: {
                                                        street1: req.body.street1,
                                                        street2: req.body.street2,
                                                        city: req.body.city,
                                                        state: req.body.state,
                                                        country: req.body.country
                                                },
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
                                                                address: {
                                                                        street1: req.body.street1,
                                                                        street2: req.body.street2,
                                                                        city: req.body.city,
                                                                        state: req.body.state,
                                                                        country: req.body.country
                                                                },
                                                                total: findCart.totalAmount,
                                                                totalItem: findCart.totalItem
                                                        };
                                                        await userOrders.create(obj1);
                                                }
                                        }
                                }
                                let findUserOrder = await userOrders.findOne({ orderId: orderId }).populate('Orders');
                                res.status(200).json({ status: 200, message: "Order create successfully. ", data: findUserOrder })
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
                        if (req.body.paymentStatus == "paid") {
                                let update = await userOrders.findByIdAndUpdate({ _id: findUserOrder._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                if (update) {
                                        for (let i = 0; i < update.Orders.length; i++) {
                                                await order.findByIdAndUpdate({ _id: update.Orders[i]._id }, { $set: { orderStatus: "confirmed", paymentStatus: "paid" } }, { new: true });
                                        }
                                        res.status(200).json({ message: "Payment success.", status: 200, data: update });
                                }
                        }
                        if (req.body.paymentStatus == "failed") {
                                res.status(201).json({ message: "Payment failed.", status: 201, orderId: req.params.orderId });
                        }

                } else {
                        return res.status(404).json({ message: "No data found", data: {} });
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
const reffralCode = async () => {
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let OTP = '';
        for (let i = 0; i < 9; i++) {
                OTP += digits[Math.floor(Math.random() * 36)];
        }
        return OTP;
}