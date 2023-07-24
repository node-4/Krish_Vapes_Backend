const auth = require("../controllers/adminController");
const authJwt = require("../middewares/authJwt");
const authConfig = require("../configs/auth.config");
var multer = require("multer");
const express = require("express");
const router = express()
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
        cloud_name: authConfig.cloud_name,
        api_key: authConfig.api_key,
        api_secret: authConfig.api_secret,
});
const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
                folder: "images/image",
                allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"],
        },
});
const upload = multer({ storage: storage });
router.post("/admin/registration", auth.registration);
router.post("/admin/login", auth.signin);
router.get("/admin/getProfile", [authJwt.verifyToken], auth.getProfile);
router.put("/admin/update", [authJwt.verifyToken], auth.update);
router.post("/Category/addCategory", [authJwt.verifyToken], auth.createCategory);
router.get("/Category/allCategory", auth.getCategories);
router.put("/Category/updateCategory/:id", [authJwt.verifyToken], auth.updateCategory);
router.delete("/Category/deleteCategory/:id", [authJwt.verifyToken], auth.removeCategory);
router.post("/SubCategory/addSubcategory", [authJwt.verifyToken], auth.createSubCategory);
router.get("/SubCategory/:id", auth.getIdSubCategory);
router.put("/SubCategory/updateSubcategory/:id", [authJwt.verifyToken], auth.updateSubCategory);
router.delete("/SubCategory/deleteSubcategory/:id", [authJwt.verifyToken], auth.deleteSubCategory);
router.get("/SubCategory/all/Subcategory", auth.getSubCategory);
router.get("/SubCategory/allSubcategoryById/:categoryId", auth.getSubCategoryByCategoryId);
router.post("/Product/addProduct", [authJwt.verifyToken], upload.array('images'), auth.createProduct);
router.get("/Product/all/Product", auth.getAllProducts);
router.get("/Product/:id", auth.getIdProduct);
router.put("/Product/editProduct/:id", [authJwt.verifyToken], upload.array('images'), auth.editProduct);
router.delete("/Product/deleteProduct/:id", [authJwt.verifyToken], auth.deleteProduct);
router.post("/Banner/addBanner", [authJwt.verifyToken], upload.single('image'), auth.createBanner);

module.exports = router;