const auth = require("../controllers/userController");
const authJwt = require("../middewares/authJwt");
const express = require("express");
const router = express()
const { upload, upload1, upload2, cpUpload } = require('../middewares/imageUpload')
router.post("/user/registration", auth.registration);
router.post("/user/login", auth.signin);
router.get("/user/getProfile", [authJwt.verifyToken], auth.getProfile);
router.put("/user/update", [authJwt.verifyToken], auth.update);
router.post("/user/addAdress", [authJwt.verifyToken], auth.addAdress);
router.get("/user/getAdress", [authJwt.verifyToken], auth.getAdress);
router.put("/user/updateAdress/:id", [authJwt.verifyToken], auth.updateAdress);
router.delete("/user/deleteAdress/:id", [authJwt.verifyToken], auth.deleteAdress);
router.post("/user/createWishlist/:id", [authJwt.verifyToken], auth.createWishlist);
router.post("/user/removeFromWishlist/:id", [authJwt.verifyToken], auth.removeFromWishlist);
router.get("/user/myWishlist", [authJwt.verifyToken], auth.myWishlist);
router.post("/user/addToCart", [authJwt.verifyToken], auth.addToCart);
router.get("/user/getCart", [authJwt.verifyToken], auth.getCart);
module.exports = router;