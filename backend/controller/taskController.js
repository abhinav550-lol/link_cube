import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import AppError from "../error/appError.js";
import { matchVolunteers } from "../services/taskService.js";

// ─── CREATE ──────────────────────────────────────────────────────────

/**
 * POST /api/tasks
 * NGO creates a new task.
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, category, priority, location, requiredSkills, sourceFileId } =
      req.body;

    console.log(req.body);
    if (!title || !description) {
      return next(new AppError("Title and description are required.", 400));
    }

    const task = await Task.create({
      title,
      description,
      category: category || "",
      priority: priority || "medium",
      location: location || "",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      ngoId: req.session.user._id,
      sourceFileId: sourceFileId || null,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// ─── READ ────────────────────────────────────────────────────────────

/**
 * GET /api/tasks/my
 * NGO gets all tasks they created.
 */
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ ngoId: req.session.user._id })
      .populate("assignedVolunteers", "name email skills location")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/assigned/me
 * Volunteer gets all tasks assigned to them.
 */
export const getAssignedToMe = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedVolunteers: req.session.user._id })
      .populate("ngoId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/:taskId
 * Get a single task by ID.
 */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("assignedVolunteers", "name email skills location availability")
      .populate("ngoId", "name email");

    if (!task) return next(new AppError("Task not found.", 404));

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// ─── ASSIGN ──────────────────────────────────────────────────────────

/**
 * PATCH /api/tasks/:taskId/assign/:volunteerId
 * NGO assigns a volunteer to a task.
 */
export const assignVolunteer = async (req, res, next) => {
  try {
    const { taskId, volunteerId } = req.params;

    const [task, volunteer] = await Promise.all([
      Task.findById(taskId),
      User.findById(volunteerId),
    ]);

    if (!task) return next(new AppError("Task not found.", 404));
    if (!volunteer) return next(new AppError("Volunteer not found.", 404));

    // Authorization: only the NGO that owns the task
    if (task.ngoId.toString() !== req.session.user._id.toString()) {
      return next(new AppError("You are not authorized to manage this task.", 403));
    }

    if (task.status === "completed" || task.status === "cancelled") {
      return next(new AppError(`Cannot assign volunteers to a ${task.status} task.`, 400));
    }

    if (volunteer.role !== "volunteer") {
      return next(new AppError("User is not a volunteer.", 400));
    }

    if (!volunteer.availability) {
      return next(new AppError(`${volunteer.name} is currently unavailable.`, 400));
    }

    // Check if already assigned
    if (task.assignedVolunteers.includes(volunteerId)) {
      return next(new AppError("Volunteer is already assigned to this task.", 400));
    }

    // Assign and mark unavailable
    task.assignedVolunteers.push(volunteerId);
    if (task.status === "open") task.status = "in_progress";
    volunteer.availability = false;

    await Promise.all([task.save(), volunteer.save()]);

    res.status(200).json({
      success: true,
      message: `${volunteer.name} assigned successfully.`,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// ─── REMOVE ──────────────────────────────────────────────────────────

/**
 * PATCH /api/tasks/:taskId/remove/:volunteerId
 * NGO removes a volunteer from a task.
 */
export const removeVolunteer = async (req, res, next) => {
  try {
    const { taskId, volunteerId } = req.params;

    const [task, volunteer] = await Promise.all([
      Task.findById(taskId),
      User.findById(volunteerId),
    ]);

    if (!task) return next(new AppError("Task not found.", 404));
    if (!volunteer) return next(new AppError("Volunteer not found.", 404));

    if (task.ngoId.toString() !== req.session.user._id.toString()) {
      return next(new AppError("You are not authorized to manage this task.", 403));
    }

    const wasAssigned = task.assignedVolunteers.includes(volunteerId);
    if (!wasAssigned) {
      return next(new AppError("This volunteer is not assigned to the task.", 400));
    }

    // Remove and restore availability
    task.assignedVolunteers = task.assignedVolunteers.filter(
      (id) => id.toString() !== volunteerId
    );

    // If no volunteers left, revert to open
    if (task.assignedVolunteers.length === 0 && task.status === "in_progress") {
      task.status = "open";
    }

    volunteer.availability = true;

    await Promise.all([task.save(), volunteer.save()]);

    res.status(200).json({
      success: true,
      message: `${volunteer.name} removed from task.`,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// ─── COMPLETE ─────────────────────────────────────────────────────────

/**
 * PATCH /api/tasks/:taskId/complete
 * NGO marks a task as completed and frees all assigned volunteers.
 */
export const completeTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) return next(new AppError("Task not found.", 404));

    if (task.ngoId.toString() !== req.session.user._id.toString()) {
      return next(new AppError("You are not authorized to manage this task.", 403));
    }

    if (task.status === "completed") {
      return next(new AppError("Task is already completed.", 400));
    }

    if (task.status === "cancelled") {
      return next(new AppError("Cannot complete a cancelled task.", 400));
    }

    // Free all assigned volunteers
    if (task.assignedVolunteers.length > 0) {
      await User.updateMany(
        { _id: { $in: task.assignedVolunteers } },
        { availability: true }
      );
    }

    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task marked as completed. Volunteers are now available.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// ─── MATCH ───────────────────────────────────────────────────────────

/**
 * GET /api/tasks/:taskId/matches
 * NGO gets suggested volunteers for a task.
 */
export const getVolunteerMatches = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) return next(new AppError("Task not found.", 404));

    if (task.ngoId.toString() !== req.session.user._id.toString()) {
      return next(new AppError("You are not authorized to view matches for this task.", 403));
    }

    const matches = await matchVolunteers(task);

    // Annotate each volunteer with whether they are skill-matched
    const requiredSkills = task.requiredSkills || [];
    const annotated = matches.map((v) => ({
      _id: v._id,
      name: v.name,
      email: v.email,
      skills: v.skills,
      location: v.location,
      availability: v.availability,
      skillMatch:
        requiredSkills.length > 0 && v.skills.some((s) => requiredSkills.includes(s)),
    }));

    res.status(200).json({
      success: true,
      count: annotated.length,
      data: annotated,
    });
  } catch (error) {
    next(error);
  }
};
