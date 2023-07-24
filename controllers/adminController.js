const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/auth.config");
const User = require("../model/userModel");
const Category = require("../model/categoryModel");
const subCategory = require("../model/subCategoryModel");
const Product = require("../model/productModel");
const banner = require("../model/bannerModel");
exports.registration = async (req, res) => {
        const { phone, email } = req.body;
        try {
                req.body.email = email.split(" ").join("").toLowerCase();
                let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "ADMIN" });
                if (!user) {
                        req.body.password = bcrypt.hashSync(req.body.password, 8);
                        req.body.userType = "ADMIN";
                        req.body.accountVerification = true;
                        const userCreate = await User.create(req.body);
                        res.status(200).send({ message: "registered successfully ", data: userCreate, });
                } else {
                        res.status(409).send({ message: "Already Exist", data: [] });
                }
        } catch (error) {

                res.status(500).json({ message: "Server error" });
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
                res.status(201).send({ data: user, accessToken: accessToken });
        } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" + error.message });
        }
};
exports.getProfile = async (req, res) => {
        try {
                const user = await User.findById(req.user.id);
                if (!user) {
                        return res.status(404).send({ message: "not found" });
                }
                res.status(200).send({ message: "Get user details.", data: user });
        } catch (err) {
                console.log(err);
                res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.update = async (req, res) => {
        try {
                const { fullName, firstName, lastName, email, phone, password } = req.body;
                const user = await User.findById(req.user.id);
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
                res.status(200).send({ message: "updated", data: updated });
        } catch (err) {
                console.log(err);
                res.status(500).send({
                        message: "internal server error " + err.message,
                });
        }
};
exports.createCategory = async (req, res) => {
        try {
                let findCategory = await Category.findOne({ name: req.body.name });
                if (findCategory) {
                        res.status(409).json({ message: "category already exit.", status: 404, data: {} });
                } else {
                        const data = { name: req.body.name };
                        const category = await Category.create(data);
                        res.status(200).json({ message: "category add successfully.", status: 200, data: category });
                }

        } catch (error) {
                res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};
exports.getCategories = async (req, res) => {
        const categories = await Category.find({});
        if (categories.length == 0) {
                res.status(404).json({ message: "category not found.", status: 404, data: {} });
        }
        res.status(200).json({ status: 200, message: "Category data found.", data: categories });
};
exports.updateCategory = async (req, res) => {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
                res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        }
        category.name = req.body.name || category.name;
        let update = await category.save();
        res.status(200).json({ status: 200, message: "Updated Successfully", data: update });
};
exports.removeCategory = async (req, res) => {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
                res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        } else {
                await Category.findByIdAndDelete(category._id);
                res.status(200).json({ message: "Category Deleted Successfully !" });
        }
};
exports.createSubCategory = async (req, res) => {
        try {
                const data = await Category.findById(req.body.categoryId);
                if (!data || data.length === 0) {
                        return res.status(400).send({ status: 404, msg: "not found" });
                }
                const subcategoryCreated = await subCategory.create({ name: req.body.name, categoryId: data._id });
                res.status(201).send({ status: 200, message: "Sub Category add successfully", data: subcategoryCreated, });
        } catch (err) {
                res.status(500).send({ message: "Internal server error while creating sub category", });
        }
};
exports.getSubCategory = async (req, res) => {
        try {
                const data = await subCategory.find().populate('categoryId');
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.getIdSubCategory = async (req, res) => {
        try {
                const data = await subCategory.findById(req.params.id);
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.updateSubCategory = async (req, res) => {
        try {
                let id = req.params.id
                const findSubCategory = await subCategory.findById(id);
                if (!findSubCategory) {
                        res.status(404).json({ status: 404, message: "Sub Category Not Found", data: {} });
                }
                const findCategory = await Category.findById(req.body.categoryId);
                if (!findCategory || findCategory.length === 0) {
                        return res.status(400).send({ status: 404, msg: "Category not found" });
                }
                req.body.categoryId = findCategory._id || findSubCategory.categoryId;
                req.body.name = req.body.name || findSubCategory.name;
                const data = await subCategory.findByIdAndUpdate(findSubCategory._id, req.body, { new: true });
                if (data) {
                        res.status(200).send({ status: 200, msg: "updated", data: data });
                }
        } catch (err) {
                console.log(err.message);
                res.status(500).send({
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
                res.status(200).send({ msg: "deleted", data: data });
        } catch (err) {
                console.log(err.message);
                res.status(500).send({
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
                res.status(200).json({ status: 200, message: "Sub Category data found.", data: data });
        } catch (err) {
                res.status(500).send({ msg: "internal server error ", error: err.message, });
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
                let images = []
                if (req.files) {
                        for (let i = 0; i < req.files.length; i++) {
                                let obj = {
                                        img: req.files[i].path,
                                        color: req.body.color[i]
                                }
                                images.push(obj)
                        }
                }
                req.body.images = images;
                const ProductCreated = await Product.create(req.body);
                res.status(201).send({ status: 200, message: "Product add successfully", data: ProductCreated, });
        } catch (err) {
                console.log(err);
                res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.getAllProducts = async (req, res, next) => {
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
                                }
                        ]
                        apiFeature = await Product.aggregate(data1);
                        res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                } else {
                        let apiFeature = await Product.aggregate([
                                { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" } },
                                { $unwind: "$categoryId" },
                                { $lookup: { from: "subcategories", localField: "subcategoryId", foreignField: "_id", as: "subcategoryId", }, },
                                { $unwind: "$subcategoryId" },
                        ]);
                        res.status(200).json({ status: 200, message: "Product data found.", data: apiFeature, count: productsCount });
                }
        } catch (err) {
                console.log(err);
                res.status(500).send({ message: "Internal server error while creating Product", });
        }
};
exports.getIdProduct = async (req, res) => {
        try {
                const data = await Product.findById(req.params.id).populate('categoryId subcategoryId');
                if (!data || data.length === 0) {
                        return res.status(400).send({ msg: "not found" });
                }
                res.status(200).json({ status: 200, message: "Product data found.", data: data });
        } catch (err) {
                res.status(500).send({ msg: "internal server error ", error: err.message, });
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
                let images = []
                if (req.files) {
                        for (let i = 0; i < req.files.length; i++) {
                                let obj = {
                                        img: req.files[i].path,
                                        color: req.body.color[i]
                                }
                                images.push(obj)
                        }
                }
                req.body.images = images;
                let obj = {
                        categoryId: req.body.categoryId || data.categoryId,
                        subcategoryId: req.body.subcategoryId || data.subcategoryId,
                        name: req.body.name || data.name,
                        description: req.body.description || data.description,
                        price: req.body.price || data.price,
                        taxInclude: req.body.taxInclude || data.taxInclude,
                        tax: req.body.tax || data.tax,
                        images: images || data.images,
                        discount: req.body.discount || data.discount,
                        discountPrice: req.body.discountPrice || data.discountPrice
                }
                let update = await Product.findByIdAndUpdate({ _id: data._id }, { $set: obj }, { new: true })
                res.status(200).json({ status: 200, message: "Product update successfully.", data: update });
        } catch (err) {
                res.status(500).send({ msg: "internal server error ", error: err.message, });
        }
};
exports.deleteProduct = async (req, res) => {
        try {
                const data = await Product.findById(req.params.id);
                if (!data) {
                        return res.status(400).send({ msg: "not found" });
                } else {
                        const data1 = await Product.findByIdAndDelete(data._id);
                        res.status(200).json({ status: 200, message: "Product delete successfully.", data: {} });
                }
        } catch (err) {
                res.status(500).send({ msg: "internal server error ", error: err.message, });
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
                res.status(200).json({ message: "Banner add successfully.", status: 200, data: Banner });
        } catch (error) {
                res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
        }
};