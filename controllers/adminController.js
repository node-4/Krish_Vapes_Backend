const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary");
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
                let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "ADMIN" });
                if (!user) {
                        req.body.password = bcrypt.hashSync(req.body.password, 8);
                        req.body.userType = "ADMIN";
                        req.body.accountVerification = true;
                        req.body.fullName = `${req.body.firstName} ${req.body.lastName}`
                        const userCreate = await User.create(req.body);
                        return res.status(200).send({ message: "registered successfully ", data: userCreate, });
                } else {
                        return res.status(409).send({ message: "Already Exist", data: [] });
                }
        } catch (error) {

                return res.status(500).json({ message: "Server error" });
        }
};
exports.signin = async (req, res) => {
        try {
                const { email, password } = req.body;
                const user = await User.findOne({ email: email, userType: "ADMIN" });
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
                const { fullName, firstName, lastName, email, phone, password } = req.body;
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                user.fullName = fullName || user.fullName;
                user.firstName = firstName || user.firstName;
                user.lastName = lastName || user.lastName;
                user.email = email || user.email;
                user.phone = phone || user.phone;
                if (req.body.password) {
                        user.password = bcrypt.hashSync(password, 8) || user.password;
                }
                const updated = await user.save();
                return res.status(200).send({ message: "updated", data: updated });
        } catch (err) {
                console.log(err);
                return res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.createCategory = async (req, res) => {
        try {
                let findCategory = await Category.findOne({ name: req.body.name });
                if (findCategory) {
                        return res.status(409).json({ message: "category already exit.", status: 404, data: {} });
                } else {
                        const data = { name: req.body.name };
                        const category = await Category.create(data);
                        return res.status(200).json({ message: "category add successfully.", status: 200, data: category });
                }

        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({});
        if (categories.length == 0) {
                return res.status(404).json({ message: "category not found.", status: 404, data: {} });
        }
        res.status(200).json({ status: 200, message: "Category data found.", data: categories });
};
exports.updateCategory = async (req, res) => {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
                return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        }
        category.name = req.body.name || category.name;
        let update = await category.save();
        res.status(200).json({ status: 200, message: "Updated Successfully", data: update });
};
exports.removeCategory = async (req, res) => {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
                return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        } else {
                await Category.findByIdAndDelete(category._id);
                return res.status(200).json({ message: "Category Deleted Successfully !" });
        }
};
exports.createSubCategory = async (req, res) => {
        try {
                const data = await Category.findById(req.body.categoryId);
                if (!data || data.length === 0) {
                        return res.status(400).send({ status: 404, msg: "not found" });
                }
                const subcategoryCreated = await subCategory.create({ name: req.body.name, categoryId: data._id });
                return res.status(201).send({ status: 200, message: "Sub Category add successfully", data: subcategoryCreated, });
        } catch (err) {
                return res.status(500).send({ message: "Internal server error while creating sub category", });
        }
};
exports.getSubCategory = async (req, res) => {
        try {
                const data = await subCategory.find().populate('categoryId');
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getIdSubCategory = async (req, res) => {
        try {
                const data = await subCategory.findById(req.params.id);
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.updateSubCategory = async (req, res) => {
        try {
                let id = req.params.id
                const findSubCategory = await subCategory.findById(id);
                if (!findSubCategory) {
                        return res.status(404).json({ status: 404, message: "Sub Category Not Found", data: {} });
                }
                const findCategory = await Category.findById(req.body.categoryId);
                if (!findCategory || findCategory.length === 0) {
                        return res.status(400).send({ status: 404, msg: "Category not found" });
                }
                req.body.categoryId = findCategory._id || findSubCategory.categoryId;
                req.body.name = req.body.name || findSubCategory.name;
                const data = await subCategory.findByIdAndUpdate(findSubCategory._id, req.body, { new: true });
                if (data) {
                        return res.status(200).send({ status: 200, msg: "updated", data: data });
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({
                        msg: "internal server error ",
                        error: err.message,
                });
        }
};
exports.deleteSubCategory = async (req, res) => {
        try {
                const data = await subCategory.findByIdAndDelete(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({
                        msg: "internal server error",
                        error: err.message,
                });
        }
};
exports.getSubCategoryByCategoryId = async (req, res) => {
        try {
                const data = await subCategory.find({ categoryId: req.params.categoryId }).populate('categoryId');
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.createProduct = async (req, res) => {
        try {
                const data = await Category.findById(req.body.categoryId);
                if (!data || data.length === 0) {
                        return res.status(400).send({ status: 404, msg: "not found" });
                }
                const findsubCategory = await subCategory.findById(req.body.subcategoryId);
                if (!findsubCategory || findsubCategory.length === 0) {
                        return res.status(400).send({ status: 404, msg: "not found" });
                }
                if (req.body.color == true) {
                        let images = [];
                        if (req.files['images']) {
                                let Image = req.files['images'];
                                for (let i = 0; i < Image.length; i++) {
                                        let obj = {
                                                img: Image[i].path,
                                                publicId: Image[i].filename,
                                                color: req.body.color[i]
                                        }
                                        images.push(obj)
                                }
                        }
                } else {
                        if (req.files['image']) {
                                req.body.img = req.files['image'].path;
                                req.body.publicId = req.files['image'].filename;
                        }
                }
                const ProductCreated = await Product.create(req.body);
                if (ProductCreated) {
                        if (req.body.color == true) {
                                let count = 0;
                                for (let k = 0; k < images.length; k++) {
                                        let obj = {
                                                productId: ProductCreated._id,
                                                img: images[k].img,
                                                publicId: images[k].publicId,
                                                color: images[k].color
                                        }
                                        let x = await ProductColor.create(obj);
                                        await Product.findByIdAndUpdate({ _id: ProductCreated._id }, { $push: { colors: x._id } }, { new: true })
                                        count++;
                                }
                                if (count == images.length) {
                                        let b = await Product.findById({ _id: ProductCreated._id }).populate('colors')
                                        return res.status(201).send({ status: 200, message: "Product add successfully", data: b, });
                                }
                        } else {
                                return res.status(201).send({ status: 200, message: "Product add successfully", data: ProductCreated, });
                        }
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.getBestSeller = async (req, res, next) => {
        try {
                const productsCount = await Product.count();
                if (req.query.search != (null || undefined)) {
                        let data1 = [
                                {
                                        $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" },
                                },
                                { $unwind: "$categoryId" },
                                {
                                        $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", },
                                },
                                { $unwind: "$subcategoryId" },
                                {
                                        $match: {
                                                $or: [
                                                        { "categoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "subcategoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "name": { $regex: req.query.search, $options: "i" }, },
                                                        { "description": { $regex: req.query.search, $options: "i" }, },
                                                ]
                                        }
                                },
                                { $sort: { ratings: -1 } }
                        ]
                        apiFeature = await Product.aggregate(data1);
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                } else {
                        let apiFeature = await Product.aggregate([
                                { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" } },
                                { $unwind: "$categoryId" },
                                { $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", }, },
                                { $unwind: "$subcategoryId" },
                                { $sort: { ratings: -1 } }
                        ]);
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.getNewArrival = async (req, res, next) => {
        try {
                const productsCount = await Product.count();
                if (req.query.search != (null || undefined)) {
                        let data1 = [
                                {
                                        $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" },
                                },
                                { $unwind: "$categoryId" },
                                {
                                        $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", },
                                },
                                { $unwind: "$subcategoryId" },
                                {
                                        $match: {
                                                $or: [
                                                        { "categoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "subcategoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "name": { $regex: req.query.search, $options: "i" }, },
                                                        { "description": { $regex: req.query.search, $options: "i" }, },
                                                ]
                                        }
                                }, { $sort: { createdAt: -1 } },
                        ]
                        apiFeature = await Product.aggregate(data1);
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                } else {
                        let apiFeature = await Product.aggregate([
                                { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" } },
                                { $unwind: "$categoryId" },
                                { $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", }, },
                                { $unwind: "$subcategoryId" }, { $sort: { createdAt: -1 } },
                        ]);
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.getOnSale = async (req, res, next) => {
        try {
                const productsCount = await Product.count();
                if (req.query.search != (null || undefined)) {
                        let data1 = [
                                {
                                        $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" },
                                },
                                { $unwind: "$categoryId" },
                                {
                                        $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", },
                                },
                                { $unwind: "$subcategoryId" },
                                {
                                        $match: {
                                                $or: [
                                                        { "categoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "subcategoryId.name": { $regex: req.query.search, $options: "i" }, },
                                                        { "name": { $regex: req.query.search, $options: "i" }, },
                                                        { "description": { $regex: req.query.search, $options: "i" }, },
                                                ]
                                        },
                                        $match: { "discount": true },
                                },
                        ]
                        apiFeature = await Product.aggregate(data1);
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                } else {
                        let apiFeature = await Product.aggregate([
                                { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" } },
                                { $unwind: "$categoryId" },
                                { $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", }, },
                                { $unwind: "$subcategoryId" }, { $match: { "discount": true } },
                        ]);
                        return res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.getIdProduct = async (req, res) => {
        try {
                const data = await Product.findById(req.params.id).populate('categoryId subcategoryId').populate('colors')
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Product data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.editProduct = async (req, res) => {
        try {
                const data = await Product.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                if (req.body.categoryId != (null || undefined)) {
                        const findCategory = await Category.findById(req.body.categoryId);
                        if (!findCategory || findCategory.length === 0) {
                                return res.status(400).send({ status: 404, msg: "not found" });
                        }
                }
                if (req.body.subcategoryId != (null || undefined)) {
                        const findsubCategory = await subCategory.findById(req.body.subcategoryId);
                        if (!findsubCategory || findsubCategory.length === 0) {
                                return res.status(400).send({ status: 404, msg: "not found" });
                        }
                }
                let images = [];
                if (req.files) {
                        if (req.files.length == req.body.color.length) {
                                for (let i = 0; i < req.files.length; i++) {
                                        let obj = {
                                                img: req.files[i].path,
                                                publicId: req.files[i].filename,
                                                color: req.body.color[i]
                                        }
                                        images.push(obj)
                                }
                        } else {
                                return res.status(201).send({ status: 201, msg: "color and image length not matched." });
                        }
                }
                let obj = {
                        categoryId: req.body.categoryId || data.categoryId,
                        subcategoryId: req.body.subcategoryId || data.subcategoryId,
                        name: req.body.name || data.name,
                        description: req.body.description || data.description,
                        price: req.body.price || data.price,
                        taxInclude: req.body.taxInclude || data.taxInclude,
                        tax: req.body.tax || data.tax,
                        discount: req.body.discount || data.discount,
                        discountPrice: req.body.discountPrice || data.discountPrice,
                }
                let update = await Product.findByIdAndUpdate({ _id: data._id }, { $set: obj }, { new: true })
                if (update) {
                        if (images.length > 0) {
                                let count = 0;
                                for (let k = 0; k < images.length; k++) {
                                        let findColor = await ProductColor.findOne({ color: images[k].color });
                                        if (findColor) {
                                                await cloudinary.v2.api.delete_resources([`${findColor.publicId}`], { type: 'upload', resource_type: 'image' })
                                                await ProductColor.findByIdAndUpdate({ _id: findColor._id }, { $set: { img: images[k].img, publicId: images[k].publicId, } }, { new: true })
                                                count++;
                                        } else {
                                                let obj = {
                                                        productId: update._id,
                                                        img: images[k].img,
                                                        publicId: images[k].publicId,
                                                        color: images[k].color
                                                }
                                                let x = await ProductColor.create(obj);
                                                await Product.findByIdAndUpdate({ _id: update._id }, { $push: { colors: x._id } }, { new: true })
                                                count++;
                                        }
                                }
                                if (count == images.length) {
                                        let b = await Product.findById({ _id: update._id }).populate('colors')
                                        return res.status(200).send({ status: 200, message: "Product update successfully", data: b, });
                                }
                        } else {
                                let b = await Product.findById({ _id: update._id }).populate('colors')
                                return res.status(200).send({ status: 200, message: "Product update successfully", data: b, });
                        }
                }
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.deleteProduct = async (req, res) => {
        try {
                const data = await Product.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                } else {
                        const data1 = await Product.findByIdAndDelete(data._id);
                        return res.status(200).json({ status: 200, message: "Product delete successfully.", data: {} });
                }
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.addProductColorSize = async (req, res) => {
        try {
                const data = await ProductColor.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                } else {
                        if (data.colorSize.length == 0) {
                                let colorSize = [], quantity = 0;
                                if (req.body.size.length == req.body.quantity.length) {
                                        for (let i = 0; i < req.body.size.length; i++) {
                                                let status;
                                                if (req.body.quantity[i] > 0) { status = "STOCK" }
                                                if (req.body.quantity[i] <= 0) { status = "OUTOFSTOCK" }
                                                let obj = {
                                                        size: req.body.size[i],
                                                        quantity: req.body.quantity[i],
                                                        status: status
                                                }
                                                colorSize.push(obj)
                                                quantity = quantity + req.body.quantity[i];
                                        }
                                        let statu;
                                        if (quantity > 0) { statu = "STOCK" }
                                        if (quantity <= 0) { statu = "OUTOFSTOCK" }
                                        let update = await ProductColor.findByIdAndUpdate({ _id: data._id }, { $set: { colorSize: colorSize, quantity: quantity, status: statu } }, { new: true });
                                        if (update) {
                                                let findProduct = await Product.findById({ _id: data.productId });
                                                if (findProduct) {
                                                        let status;
                                                        const productQuantity = findProduct.quantity + quantity;
                                                        if (productQuantity > 0) { status = "STOCK" }
                                                        if (productQuantity <= 0) { status = "OUTOFSTOCK" }
                                                        let updated = await Product.findByIdAndUpdate({ _id: findProduct._id }, { $set: { quantity: productQuantity, status: status } }, { new: true });
                                                        return res.status(200).send({ status: 200, message: "Product color update successfully", data: update, });
                                                }
                                        }
                                } else {
                                        return res.status(201).send({ status: 201, msg: "Size Array and quantity array not matched." });
                                }
                        } else {
                                let saveExitSize = [], colorSize = [], quantity = 0;
                                data.colorSize.map(i => { saveExitSize.push(i.size) })
                                if (req.body.size.length == req.body.quantity.length) {
                                        let newSize = [];
                                        let unique1 = req.body.size.filter((o) => saveExitSize.indexOf(o) === -1);
                                        let unique2 = saveExitSize.filter((o) => req.body.size.indexOf(o) === -1);
                                        newSize = unique1.concat(unique2);
                                        if (newSize.length == 0 && unique1.length == 0) {
                                                console.log("545======================");
                                                let colorSize = [], quantity = 0;
                                                if (req.body.size.length == req.body.quantity.length) {
                                                        for (let i = 0; i < req.body.size.length; i++) {
                                                                let status;
                                                                if (req.body.quantity[i] > 0) { status = "STOCK" }
                                                                if (req.body.quantity[i] <= 0) { status = "OUTOFSTOCK" }
                                                                let obj = {
                                                                        size: req.body.size[i],
                                                                        quantity: req.body.quantity[i],
                                                                        status: status
                                                                }
                                                                colorSize.push(obj)
                                                                quantity = quantity + req.body.quantity[i];
                                                        }
                                                        let statu;
                                                        if (quantity > 0) { statu = "STOCK" }
                                                        if (quantity <= 0) { statu = "OUTOFSTOCK" }
                                                        let update = await ProductColor.findByIdAndUpdate({ _id: data._id }, { $set: { colorSize: colorSize, quantity: quantity, status: statu } }, { new: true });
                                                        if (update) {
                                                                let findProduct = await Product.findById({ _id: data.productId });
                                                                if (findProduct) {
                                                                        let productQuantity = 0;
                                                                        for (let x = 0; x < findProduct.colors.length; x++) {
                                                                                let data = await ProductColor.findById(findProduct.colors[x]);
                                                                                productQuantity = productQuantity + data.quantity;
                                                                        }
                                                                        console.log("-----------------571----------------", productQuantity);
                                                                        let status;
                                                                        if (productQuantity > 0) { status = "STOCK" }
                                                                        if (productQuantity <= 0) { status = "OUTOFSTOCK" }
                                                                        let updated = await Product.findByIdAndUpdate({ _id: findProduct._id }, { $set: { quantity: productQuantity, status: status } }, { new: true });
                                                                        return res.status(200).send({ status: 200, message: "Product color update successfully", data: update, });
                                                                }
                                                        }
                                                } else {
                                                        return res.status(201).send({ status: 201, msg: "Size Array and quantity array not matched." });
                                                }
                                        } else if (newSize.length > 0 && unique1.length == 0) {
                                                console.log("595======================");
                                                let colorSize = [], quantity = 0;
                                                if (req.body.size.length == req.body.quantity.length) {
                                                        for (let i = 0; i < req.body.size.length; i++) {
                                                                let status;
                                                                if (req.body.quantity[i] > 0) { status = "STOCK" }
                                                                if (req.body.quantity[i] <= 0) { status = "OUTOFSTOCK" }
                                                                let obj = {
                                                                        size: req.body.size[i],
                                                                        quantity: req.body.quantity[i],
                                                                        status: status
                                                                }
                                                                colorSize.push(obj)
                                                                quantity = quantity + req.body.quantity[i];
                                                        }
                                                        let statu;
                                                        if (quantity > 0) { statu = "STOCK" }
                                                        if (quantity <= 0) { statu = "OUTOFSTOCK" }
                                                        let update = await ProductColor.findByIdAndUpdate({ _id: data._id }, { $set: { colorSize: colorSize, quantity: quantity, status: statu } }, { new: true });
                                                        if (update) {
                                                                let findProduct = await Product.findById({ _id: data.productId });
                                                                if (findProduct) {
                                                                        let productQuantity = 0;
                                                                        for (let x = 0; x < findProduct.colors.length; x++) {
                                                                                let data = await ProductColor.findById(findProduct.colors[x]);
                                                                                productQuantity = productQuantity + data.quantity;
                                                                        }
                                                                        console.log("-----------------571----------------", productQuantity);
                                                                        let status;
                                                                        if (productQuantity > 0) { status = "STOCK" }
                                                                        if (productQuantity <= 0) { status = "OUTOFSTOCK" }
                                                                        let updated = await Product.findByIdAndUpdate({ _id: findProduct._id }, { $set: { quantity: productQuantity, status: status } }, { new: true });
                                                                        return res.status(200).send({ status: 200, message: "Product color update successfully", data: update, });
                                                                }
                                                        }
                                                } else {
                                                        return res.status(201).send({ status: 201, msg: "Size Array and quantity array not matched." });
                                                }
                                        } else {
                                                for (let k = 0; k < req.body.size.length; k++) {
                                                        for (let j = 0; j < unique1.length; j++) {
                                                                if (req.body.size[k] == unique1[j]) {
                                                                        let status;
                                                                        if (req.body.quantity[k] > 0) { status = "STOCK" }
                                                                        if (req.body.quantity[k] <= 0) { status = "OUTOFSTOCK" }
                                                                        let obj = { size: req.body.size[k], quantity: req.body.quantity[k], status: status }
                                                                        colorSize.push(obj)
                                                                } else {
                                                                        let status;
                                                                        if (req.body.quantity[k] > 0) { status = "STOCK" }
                                                                        if (req.body.quantity[k] <= 0) { status = "OUTOFSTOCK" }
                                                                        let obj = { size: req.body.size[k], quantity: req.body.quantity[k], status: status }
                                                                        colorSize.push(obj)
                                                                }
                                                        }
                                                }
                                                for (let z = 0; z < colorSize.length; z++) {
                                                        quantity = quantity + colorSize[z].quantity
                                                }
                                                let status;
                                                if (quantity > 0) { status = "STOCK" }
                                                if (quantity <= 0) { status = "OUTOFSTOCK" }
                                                console.log(colorSize, quantity, status);
                                                let update = await ProductColor.findByIdAndUpdate({ _id: data._id }, { $set: { colorSize: colorSize, quantity: quantity, status: status } }, { new: true });
                                                if (update) {
                                                        let findProduct = await Product.findById({ _id: data.productId });
                                                        if (findProduct) {
                                                                let productQuantity = 0;
                                                                for (let x = 0; x < findProduct.colors.length; x++) {
                                                                        let data = await ProductColor.findById(findProduct.colors[x]);
                                                                        productQuantity = productQuantity + data.quantity;
                                                                }
                                                                console.log("---------------------------------", productQuantity);
                                                                let status;
                                                                if (productQuantity > 0) { status = "STOCK" }
                                                                if (productQuantity <= 0) { status = "OUTOFSTOCK" }
                                                                let updated = await Product.findByIdAndUpdate({ _id: findProduct._id }, { $set: { quantity: productQuantity, status: status } }, { new: true });
                                                                return res.status(200).send({ status: 200, message: "Product color update successfully", data: update, });
                                                        }
                                                }
                                        }
                                } else {
                                        return res.status(201).send({ status: 201, msg: "Size Array and quantity array not matched." });
                                }
                        }
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.editProductColorSize = async (req, res) => {
        try {
                const data = await ProductColor.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                } else {
                        for (let i = 0; i < data.colorSize.length; i++) {
                                if (((data.colorSize[i]._id).toString() == req.body.sizeId)) {
                                        if ((data.colorSize[i].size == req.body.size)) {
                                                let status;
                                                if (req.body.quantity > 0) { status = "STOCK" }
                                                if (req.body.quantity <= 0) { status = "OUTOFSTOCK" }
                                                let update = await ProductColor.findOneAndUpdate({ _id: data._id, 'colorSize._id': data.colorSize[i]._id }, { $set: { 'colorSize.$.size': req.body.size, 'colorSize.$.quantity': req.body.quantity, 'colorSize.$.status': status } }, { new: true });
                                                if (update) {
                                                        let quantity = 0
                                                        for (let k = 0; k < update.colorSize.length; k++) {
                                                                quantity = quantity + update.colorSize[k].quantity
                                                        }
                                                        let statu;
                                                        if (quantity > 0) { statu = "STOCK" }
                                                        if (quantity <= 0) { statu = "OUTOFSTOCK" }
                                                        let update1 = await ProductColor.findByIdAndUpdate({ _id: data._id }, { $set: { quantity: quantity, status: statu } }, { new: true });
                                                        if (update1) {
                                                                let findProduct = await Product.findById({ _id: data.productId });
                                                                if (findProduct) {
                                                                        let productQuantity = 0;
                                                                        for (let x = 0; x < findProduct.colors.length; x++) {
                                                                                let data = await ProductColor.findById(findProduct.colors[x]);
                                                                                productQuantity = productQuantity + data.quantity;
                                                                        }
                                                                        let status;
                                                                        if (productQuantity > 0) { status = "STOCK" }
                                                                        if (productQuantity <= 0) { status = "OUTOFSTOCK" }
                                                                        let updated = await Product.findByIdAndUpdate({ _id: findProduct._id }, { $set: { quantity: productQuantity, status: status } }, { new: true });
                                                                        return res.status(200).send({ status: 200, message: "Product color update successfully", data: update1, });
                                                                }
                                                        }
                                                }
                                        } else {
                                                return res.status(409).send({ status: 409, msg: "Size Already exit" });
                                        }
                                }
                        }
                        return res.status(404).send({ status: 404, msg: "Size id not found" });
                }
        } catch (err) {
                console.log(err);
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.createBanner = async (req, res) => {
        try {
                let bannerImage;
                if (req.file.path) {
                        bannerImage = req.file.path
                }
                const data = {
                        bannerName: req.body.bannerName,
                        bannerImage: bannerImage,
                        position: req.body.position
                };
                const Banner = await banner.create(data);
                return res.status(200).json({ message: "Banner add successfully.", status: 200, data: Banner });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getTopBanner = async (req, res) => {
        try {
                const data = await banner.find({ position: "TOP" });
                if (data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getMidBanner = async (req, res) => {
        try {
                const data = await banner.find({ position: "MID" });
                if (data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getBottomBanner = async (req, res) => {
        try {
                const data = await banner.find({ position: "BOTTOM" });
                if (data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getIdBanner = async (req, res) => {
        try {
                const data = await banner.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Banner data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
}
exports.deleteBanner = async (req, res) => {
        try {
                const data = await banner.findByIdAndDelete(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.updateBanner = async (req, res) => {
        try {
                const findData = await banner.findById(req.params.id);
                if (!findData) {
                        return res.status(400).send({ msg: "not found" });
                }
                let bannerImage;
                if (req.file.path) {
                        bannerImage = req.file.path
                }
                const data = { bannerName: req.body.bannerName || findData.bannerName, bannerImage: bannerImage || findData.bannerImage, position: req.body.position || findData.position, };
                const Banner = await banner.findByIdAndUpdate({ _id: findData._id }, { $set: data }, { new: true })
                return res.status(200).json({ message: "Banner update successfully.", status: 200, data: Banner });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.createBlog = async (req, res) => {
        try {
                let image;
                if (req.file.path) {
                        image = req.file.path
                }
                const data = {
                        title: req.body.title,
                        image: image,
                        description: req.body.description,
                        userId: req.user._id
                };
                const Blog = await blog.create(data);
                return res.status(200).json({ message: "Blog add successfully.", status: 200, data: Blog });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.updateBlog = async (req, res) => {
        try {
                const findData = await blog.findById(req.params.id);
                if (!findData) {
                        return res.status(400).send({ msg: "not found" });
                }
                let image;
                if (req.file.path) {
                        image = req.file.path
                }
                const data = {
                        title: req.body.title || findData.title,
                        image: image || findData.image,
                        description: req.body.description || findData.description,
                        userId: req.user._id
                };
                const Blog = await blog.findByIdAndUpdate({ _id: findData._id }, { $set: data }, { new: true })
                return res.status(200).json({ message: "Blog update successfully.", status: 200, data: Blog });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getBlog = async (req, res) => {
        try {
                const data = await blog.find({}).populate({ path: "userId", select: 'fullName firstName lastName' });
                if (data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "blog data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getBlogByToken = async (req, res) => {
        try {
                const data = await blog.find({ userId: req.user._id }).populate({ path: "userId", select: 'fullName firstName lastName' });
                if (data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "blog data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getIdBlog = async (req, res) => {
        try {
                const data = await blog.findById(req.params.id).populate({ path: "userId", select: 'fullName firstName lastName' });
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).json({ status: 200, message: "Blog data found.", data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
}
exports.deleteBlog = async (req, res) => {
        try {
                const data = await blog.findByIdAndDelete(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                }
                return res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.addContactDetails = async (req, res) => {
        try {
                const user = await User.findById(req.user._id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                } else {
                        if (user.userType == "ADMIN") {
                                let findContact = await contact.findOne();
                                if (findContact) {
                                        req.body.fb = req.body.fb || findContact.fb;
                                        req.body.twitter = req.body.twitter || findContact.twitter;
                                        req.body.google = req.body.google || findContact.google;
                                        req.body.instagram = req.body.instagram || findContact.instagram;
                                        req.body.basketball = req.body.basketball || findContact.basketball;
                                        req.body.behance = req.body.behance || findContact.behance;
                                        req.body.dribbble = req.body.dribbble || findContact.dribbble;
                                        req.body.pinterest = req.body.pinterest || findContact.pinterest;
                                        req.body.linkedIn = req.body.linkedIn || findContact.linkedIn;
                                        req.body.youtube = req.body.youtube || findContact.youtube;
                                        req.body.map = req.body.map || findContact.map;
                                        req.body.address = req.body.address || findContact.address;
                                        req.body.phone = req.body.phone || findContact.phone;
                                        req.body.supportEmail = req.body.supportEmail || findContact.supportEmail;
                                        req.body.openingTime = req.body.openingTime || findContact.openingTime;
                                        req.body.infoEmail = req.body.infoEmail || findContact.infoEmail;
                                        req.body.contactAddress = req.body.contactAddress || findContact.contactAddress;
                                        req.body.tollfreeNo = req.body.tollfreeNo || findContact.tollfreeNo;
                                        let updateContact = await contact.findByIdAndUpdate({ _id: findContact._id }, { $set: req.body }, { new: true });
                                        if (updateContact) {
                                                return res.status(200).json({ message: "Contact detail update successfully.", status: 200, data: updateContact });
                                        }
                                } else {
                                        let result2 = await contact.create(req.body);
                                        if (result2) {
                                                return res.status(200).json({ message: "Contact detail add successfully.", status: 200, data: result2 });
                                        }
                                }
                        } else {
                                return res.status(404).send({ message: "You are not Authorised user." });
                        }
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.viewContactDetails = async (req, res) => {
        try {
                let findcontactDetails = await contact.findOne({});
                if (!findcontactDetails) {
                        return res.status(404).json({ message: "Contact detail not found.", status: 404, data: {} });
                } else {
                        return res.status(200).json({ message: "Contact detail found successfully.", status: 200, data: findcontactDetails });
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.addQuery = async (req, res) => {
        try {
                if ((req.body.name == (null || undefined)) || (req.body.email == (null || undefined)) || (req.body.name == "") || (req.body.email == "")) {
                        return res.status(404).json({ message: "name and email provide!", status: 404, data: {} });
                } else {
                        const Data = await helpandSupport.create(req.body);
                        return res.status(200).json({ message: "Help and Support  create.", status: 200, data: Data });
                }

        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.getAllHelpandSupport = async (req, res) => {
        try {
                const data = await helpandSupport.find();
                if (data.length == 0) {
                        return res.status(404).json({ message: "Help and Support not found.", status: 404, data: {} });
                }
                return res.status(200).json({ message: "Help and Support  found.", status: 200, data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.getHelpandSupportById = async (req, res) => {
        try {
                const data = await helpandSupport.findById(req.params.id);
                if (!data) {
                        return res.status(404).json({ message: "Help and Support not found.", status: 404, data: {} });
                }
                return res.status(200).json({ message: "Help and Support  found.", status: 200, data: data });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.deleteHelpandSupport = async (req, res) => {
        try {
                const data = await helpandSupport.findById(req.params.id);
                if (!data) {
                        return res.status(404).json({ message: "Help and Support not found.", status: 404, data: {} });
                }
                await helpandSupport.deleteOne({ _id: req.params.id });
                return res.status(200).json({ message: "Help and Support  delete.", status: 200, data: {} });
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.createAboutUs = async (req, res) => {
        try {
                let aboutusImagesArray = [], aboutusImage;
                if (req.files['aboutusImages']) {
                        let aboutusImages = req.files['aboutusImages'];
                        for (let i = 0; i < aboutusImages.length; i++) {
                                aboutusImagesArray.push(aboutusImages[i].path)
                        }
                }
                if (req.files['aboutusImage']) {
                        aboutusImage = req.files['aboutusImage'];
                }
                let desc = [];
                for (let k = 0; k < req.body.desc.length; k++) {
                        let obj = {
                                title: req.body.title[k],
                                desc: req.body.desc[k]
                        }
                        desc.push(obj)
                }
                const data = {
                        aboutusImage: aboutusImage[0].path,
                        aboutusImages: aboutusImagesArray,
                        desc: desc,
                        type: "ABOUTUS"
                };
                const Blog = await staticContent.create(data);
                return res.status(200).json({ message: "About us add successfully.", status: 200, data: Blog });
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.viewAboutus = async (req, res) => {
        try {
                let findstaticContent = await staticContent.findOne({ type: "ABOUTUS" });
                if (!findstaticContent) {
                        return res.status(404).json({ message: "About us detail not found.", status: 404, data: {} });
                } else {
                        return res.status(200).json({ message: "About us detail found successfully.", status: 200, data: findstaticContent });
                }
        } catch (err) {
                console.log(err.message);
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.editAboutUs = async (req, res) => {
        try {
                let findstaticContent = await staticContent.findOne({ type: "ABOUTUS" });
                if (!findstaticContent) {
                        return res.status(404).json({ message: "About us detail not found.", status: 404, data: {} });
                } else {
                        let aboutusImagesArray = [], aboutusImage;
                        if (req.files['aboutusImages']) {
                                let aboutusImages = req.files['aboutusImages'];
                                for (let i = 0; i < aboutusImages.length; i++) {
                                        aboutusImagesArray.push(aboutusImages[i].path)
                                }
                        } else {
                                aboutusImagesArray = findstaticContent.aboutusImagesArray;
                        }
                        if (req.files['aboutusImage']) {
                                let aboutusImag = req.files['aboutusImage'];
                                aboutusImage = aboutusImag[0].path
                        } else {
                                aboutusImage = findstaticContent.aboutusImage;
                        }
                        let desc = [];
                        if (req.body.desc.length > 0) {
                                for (let k = 0; k < req.body.desc.length; k++) {
                                        let obj = {
                                                title: req.body.title[k],
                                                desc: req.body.desc[k]
                                        }
                                        desc.push(obj)
                                }
                        } else {
                                desc = findstaticContent.desc;
                        }
                        const data = {
                                aboutusImage: aboutusImage,
                                aboutusImages: aboutusImagesArray,
                                desc: desc,
                        };
                        const Blog = await staticContent.findByIdAndUpdate({ _id: findstaticContent._id }, { $set: data }, { new: true });
                        return res.status(200).json({ message: "About us update successfully.", status: 200, data: Blog });
                }
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.deleteAboutUs = async (req, res) => {
        try {
                let findstaticContent = await staticContent.findOne({ type: "ABOUTUS" });
                if (!findstaticContent) {
                        return res.status(404).json({ message: "About us detail not found.", status: 404, data: {} });
                } else {
                        await staticContent.deleteOne({ _id: findstaticContent._id });
                        return res.status(200).json({ message: "About us delete.", status: 200, data: {} });
                }
        } catch (err) {
                return res.status(500).send({ msg: "internal server error", error: err.message, });
        }
};
exports.subscribeUnsubscribe = async (req, res) => {
        try {
                if (req.body.type == "SUBSCRIBE") {
                        const result = await visitorSubscriber.findOne({ email: req.body.email })
                        if (result) {
                                let updateResult = await visitorSubscriber.findOneAndUpdate({ _id: result._id }, { $set: { subscribeNow: true } }, { new: true });
                                if (updateResult) {
                                        return res.status(200).json({ message: "SubscribeNow.", status: 200, data: updateResult });
                                }
                        } else {
                                let obj = {
                                        email: req.body.email,
                                        subscribeNow: true,
                                }
                                let result2 = await visitorSubscriber.create(obj);
                                if (result2) {
                                        return res.status(200).json({ message: "SubscribeNow.", status: 200, data: result2 });
                                }
                        }
                } else if (req.body.type == "UNSUBSCRIBE") {
                        const result = await visitorSubscriber.findOne({ email: req.body.email, subscribeNow: true })
                        if (result) {
                                let updateResult = await visitorSubscriber.findOneAndUpdate({ _id: result._id }, { $set: { subscribeNow: false } }, { new: true });
                                if (updateResult) {
                                        return res.status(200).json({ message: "Unsubscribe.", status: 200, data: updateResult });
                                }
                        } else {
                                return res.status(409).json({ message: "You already Unsubscribe.", status: 409, data: {} });
                        }
                }
        } catch (error) {
                return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
}