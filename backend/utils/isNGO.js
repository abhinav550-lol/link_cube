import AppError from "../error/appError.js";

function isNGO(req, res, next) {
  if (req.session.user.role !== "ngo") {
    return next(new AppError("Access denied. Only NGOs can perform this action.", 403));
  }
  next();
}

export default isNGO;
