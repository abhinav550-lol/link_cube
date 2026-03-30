import express from "express";
import isLoggedIn from "../utils/isLoggedIn.js";
import isVolunteer from "../utils/isVolunteer.js";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  getFilesByLocation,
  getFilesByVolunteer,
  getFileById,
} from "../controller/fileController.js";

const router = express.Router();

// POST /api/files/upload       — single file upload
router.post("/upload", isLoggedIn, isVolunteer, uploadSingleFile);

// POST /api/files/upload-multiple — multiple file upload
router.post("/upload-multiple", isLoggedIn, isVolunteer, uploadMultipleFiles);

// GET /api/files/location/:location — files by location
router.get("/location/:location", isLoggedIn, getFilesByLocation);

// GET /api/files/my-uploads — files uploaded by the logged-in volunteer
router.get("/my-uploads", isLoggedIn, isVolunteer, getFilesByVolunteer);

// GET /api/files/:id — single file by ID
router.get("/:id", isLoggedIn, getFileById);

export default router;
