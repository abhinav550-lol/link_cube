import AppError from "../error/appError.js";
import { askQuestion } from "../ai/ragService.js";

/**
 * Ask a question across all of the user's uploaded files.
 * POST /api/rag/ask
 * Body: { question, fileIds? }
 */
export const askQuestionHandler = async (req, res, next) => {
  try {
    const { question, fileIds } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return next(new AppError("Please provide a question.", 400));
    }

    const userId = req.session.user._id;

    const result = await askQuestion(question.trim(), userId, fileIds);

    res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ask a question scoped to a single file.
 * POST /api/rag/ask-file/:fileId
 * Body: { question }
 */
export const askQuestionByFile = async (req, res, next) => {
  try {
    const { question } = req.body;
    const { fileId } = req.params;

    if (!question || typeof question !== "string" || !question.trim()) {
      return next(new AppError("Please provide a question.", 400));
    }

    if (!fileId) {
      return next(new AppError("File ID is required.", 400));
    }

    const userId = req.session.user._id;

    const result = await askQuestion(question.trim(), userId, [fileId]);

    res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    next(error);
  }
};
