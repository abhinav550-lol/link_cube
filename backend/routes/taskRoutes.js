import express from "express";
import isLoggedIn from "../utils/isLoggedIn.js";
import isNGO from "../utils/isNGO.js";
import {
  createTask,
  getMyTasks,
  getAssignedToMe,
  getTaskById,
  assignVolunteer,
  removeVolunteer,
  completeTask,
  getVolunteerMatches,
} from "../controller/taskController.js";

const router = express.Router();

// ── NGO-only ─────────────────────────────────────────────────────────

// Create a new task
router.post("/", isLoggedIn, isNGO, createTask);

// Get all tasks created by this NGO
router.get("/my", isLoggedIn, isNGO, getMyTasks);

// Suggest matching volunteers for a task
router.get("/:taskId/matches", isLoggedIn, isNGO, getVolunteerMatches);

// Assign a volunteer to a task
router.patch("/:taskId/assign/:volunteerId", isLoggedIn, isNGO, assignVolunteer);

// Remove a volunteer from a task
router.patch("/:taskId/remove/:volunteerId", isLoggedIn, isNGO, removeVolunteer);

// Mark a task as completed
router.patch("/:taskId/complete", isLoggedIn, isNGO, completeTask);

// ── Volunteer ─────────────────────────────────────────────────────────

// Get all tasks assigned to the logged-in volunteer
router.get("/assigned/me", isLoggedIn, getAssignedToMe);

// ── Shared ────────────────────────────────────────────────────────────

// Get a single task by ID (any authenticated user)
router.get("/:taskId", isLoggedIn, getTaskById);

export default router;
