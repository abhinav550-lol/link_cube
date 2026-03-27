import File from "../models/fileModel.js";
import AppError from "../error/appError.js";
import { uploadSingle, uploadMultiple } from "../middleware/multerConfig.js";
import { ingestFile } from "../ai/ingestionService.js";

/**
 * Upload a single file
 * POST /api/files/upload
 */
export const uploadSingleFile = (req, res, next) => {
  uploadSingle(req, res, (err) => {

    if (err) {
      return next(new AppError(err.message, err.statusCode || 400));
    }

    if (!req.file) {
      return next(new AppError("No file provided. Please attach a file.", 400));
    }

    const { originalname, filename, path: filePath, mimetype, size } = req.file;
    const { location } = req.body;

    File.create({
      originalName: originalname,
      storedName: filename,
      filePath: filePath,
      mimeType: mimetype,
      size: size,
      uploadedBy: req.session.user._id,
      status: "uploaded",
      metadata: { location: location || "" },
    })
      .then((savedFile) => {
        // Trigger ingestion asynchronously (don't block the response)
        ingestFile(savedFile._id).catch((err) =>
          console.error(`[Ingestion] async trigger failed: ${err.message}`)
        );

        res.status(201).json({
          success: true,
          message: "File uploaded successfully. Ingestion started.",
          data: savedFile,
        });
      })
      .catch((error) => next(error));
  });
};

/**
 * Upload multiple files
 * POST /api/files/upload-multiple
 */
export const uploadMultipleFiles = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      return next(new AppError(err.message, err.statusCode || 400));
    }

    if (!req.files || req.files.length === 0) {
      return next(
        new AppError("No files provided. Please attach at least one file.", 400)
      );
    }

    const { location } = req.body;

    const fileDocs = req.files.map((file) => ({
      originalName: file.originalname,
      storedName: file.filename,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.session.user._id,
      status: "uploaded",
      metadata: { location: location || "" },
    }));

    File.insertMany(fileDocs)
      .then((savedFiles) => {
        // Trigger ingestion for each file asynchronously
        for (const file of savedFiles) {
          ingestFile(file._id).catch((err) =>
            console.error(`[Ingestion] async trigger failed for ${file._id}: ${err.message}`)
          );
        }

        res.status(201).json({
          success: true,
          message: `${savedFiles.length} file(s) uploaded successfully. Ingestion started.`,
          data: savedFiles,
        });
      })
      .catch((error) => next(error));
  });
};

/**
 * Get all files by location
 * GET /api/files/location/:location
 */
export const getFilesByLocation = async (req, res, next) => {
  try {
    const { location } = req.params;
    const files = await File.find({ "metadata.location": location });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all files submitted by the logged-in volunteer
 * GET /api/files/my-uploads
 */
export const getFilesByVolunteer = async (req, res, next) => {
  try {
    const files = await File.find({ uploadedBy: req.session.user._id });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single file by ID
 * GET /api/files/:id
 */
export const getFileById = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};
