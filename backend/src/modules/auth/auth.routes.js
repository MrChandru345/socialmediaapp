const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const { login, me, register } = require("./auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);

module.exports = router;
