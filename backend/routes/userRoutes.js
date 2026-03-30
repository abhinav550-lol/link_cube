import express from "express";
import { register, login, logout, fetchMe } from "../controller/userController.js";
import isLoggedIn from '../utils/isLoggedIn.js'

const router = express.Router();

router.post("/register", register); // /api/user/register

router.post("/login", login); //api/user/login

router.post("/logout", isLoggedIn , logout); //api/user/logout

router.get("/me", isLoggedIn, fetchMe); //api/user/me


export default router;
