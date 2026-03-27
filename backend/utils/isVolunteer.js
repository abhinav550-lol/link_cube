import AppError from "../error/appError.js";

function isVolunteer(req, res, next) {
  if (req.session.user.role !== "volunteer") {
    return next(
      new AppError("Access denied. Only volunteers can upload files.", 403)
    );
  }
  next();
}

export default isVolunteer;
