const auth = require("../controllers/userController");
const authJwt = require("../middewares/authJwt");
const express = require("express");
const router = express()
const { upload, upload1, upload2, cpUpload } = require('../middewares/imageUpload')
router.post("/user/registration", auth.registration);
router.post("/user/login", auth.signin);
router.get("/user/getProfile", [authJwt.verifyToken], auth.getProfile);
router.put("/user/update", [authJwt.verifyToken], auth.update);
router.put("/user/addAdress", [authJwt.verifyToken], auth.addAdress);
router.post("/user/createWishlist/:id", [authJwt.verifyToken], auth.createWishlist);
router.post("/user/removeFromWishlist/:id", [authJwt.verifyToken], auth.removeFromWishlist);
router.get("/user/myWishlist", [authJwt.verifyToken], auth.myWishlist);
module.exports = router;