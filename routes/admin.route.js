const auth = require("../controllers/adminController");
const authJwt = require("../middewares/authJwt");
const express = require("express");
const router = express()
const { cpUpload0, upload, upload1, upload2, cpUpload, categoryUpload } = require('../middewares/imageUpload')
router.post("/admin/registration", auth.registration);
router.post("/admin/login", auth.signin);
router.get("/admin/getProfile", [authJwt.verifyToken], auth.getProfile);
router.get("/admin/getAllUser", [authJwt.verifyToken], auth.getAllUser);
router.put("/admin/update", [authJwt.verifyToken], auth.update);
router.post("/Category/addCategory", [authJwt.verifyToken], categoryUpload.single('image'), auth.createCategory);
router.get("/Category/allCategory", auth.getCategories);
router.get("/Category/paginateCategoriesSearch", auth.paginateCategoriesSearch);
router.put("/Category/updateCategory/:id", [authJwt.verifyToken], categoryUpload.single('image'), auth.updateCategory);
router.delete("/Category/deleteCategory/:id", [authJwt.verifyToken], auth.removeCategory);
router.post("/SubCategory/addSubcategory", [authJwt.verifyToken], auth.createSubCategory);
router.get("/SubCategory/:id", auth.getIdSubCategory);
router.put("/SubCategory/updateSubcategory/:id", [authJwt.verifyToken], auth.updateSubCategory);
router.delete("/SubCategory/deleteSubcategory/:id", [authJwt.verifyToken], auth.deleteSubCategory);
router.get("/SubCategory/all/Subcategory", auth.getSubCategory);
router.get("/SubCategory/all/SubCategoryForAdmin", auth.getSubCategoryForAdmin);
router.get("/SubCategory/paginate/SubCategoriesSearch", auth.paginateSubCategoriesSearch);
router.get("/SubCategory/allSubcategoryById/:categoryId", auth.getSubCategoryByCategoryId);
router.post("/Product/addProduct", [authJwt.verifyToken], cpUpload0, auth.createProduct);
router.get("/Product/all/BestSeller", auth.getBestSeller);
router.get("/Product/all/paginateProductSearch", auth.paginateProductSearch);
router.get("/Product/all/NewArrival", auth.getNewArrival);
router.get("/Product/all/getOnSale", auth.getOnSale);
router.get("/Product/:id", auth.getIdProduct);
router.get("/Product/color/:id", auth.getIdProductColor);
router.put("/Product/editProduct/:id", [authJwt.verifyToken], cpUpload0, auth.editProduct);
router.put("/Product/addProductColorSize/:id", [authJwt.verifyToken], auth.addProductColorSize);
router.put("/Product/editProductColorSize/:id", [authJwt.verifyToken], auth.editProductColorSize);
router.delete("/Product/deleteProduct/:id", [authJwt.verifyToken], auth.deleteProduct);
router.post("/Banner/addBanner", [authJwt.verifyToken], upload1.single('image'), auth.createBanner);
router.get("/Banner/getTopBanner", auth.getTopBanner);
router.get("/Banner/getMidBanner", auth.getMidBanner);
router.get("/Banner/getBottomBanner", auth.getBottomBanner);
router.get("/Banner/:id", auth.getIdBanner);
router.delete("/Banner/:id", [authJwt.verifyToken], auth.deleteBanner);
router.put("/Banner/updateBanner/:id", [authJwt.verifyToken], upload1.single('image'), auth.updateBanner);
router.post("/Blog/addBlog", [authJwt.verifyToken], upload2.single('image'), auth.createBlog);
router.get("/Blog/all", auth.getBlog);
router.get("/Blog/getBlogByToken", [authJwt.verifyToken], auth.getBlogByToken);
router.get("/Blog/:id", auth.getIdBlog);
router.put("/Blog/updateBlog/:id", [authJwt.verifyToken], upload2.single('image'), auth.updateBlog);
router.delete("/Blog/:id", [authJwt.verifyToken], auth.deleteBlog);
router.post("/ContactDetails/addContactDetails", [authJwt.verifyToken], auth.addContactDetails);
router.get("/ContactDetails/viewContactDetails", auth.viewContactDetails);
router.post("/help/addQuery", auth.addQuery);
router.get("/help/all", auth.getAllHelpandSupport);
router.get("/help/:id", auth.getHelpandSupportById);
router.delete("/help/:id", auth.deleteHelpandSupport);
router.post("/AboutUs/addAboutUs", [authJwt.verifyToken], cpUpload, auth.createAboutUs);
router.get("/AboutUs/all", auth.viewAboutus);
router.put("/AboutUs/editAboutUs", [authJwt.verifyToken], cpUpload, auth.editAboutUs);
router.delete("/AboutUs/deleteAboutUs", [authJwt.verifyToken], auth.deleteAboutUs);
router.post("/NewsLetter/subscribeUnsubscribe", auth.subscribeUnsubscribe);
router.get("/admin/allOrders", [authJwt.verifyToken], auth.getAllOrders);
router.get("/admin/Orders", [authJwt.verifyToken], auth.getOrders);
router.get("/admin/paginate/OrdersSearch", auth.paginateOrdersSearch);
router.get("/NewsLetter/allNewsLetter", auth.allNewsLetter);

module.exports = router;