import User from "../models/userModel.js";

/**
 * Find volunteers suitable for a task.
 *
 * Strategy:
 * 1. Skill-matched + available (preferred)
 * 2. If none found, fall back to all available volunteers
 *
 * @param {object} task — Task document
 * @returns {Promise<object[]>} array of volunteer User documents
 */
export async function matchVolunteers(task) {
  const requiredSkills = task.requiredSkills || [];

  // Step 1: try skill-matched available volunteers
  if (requiredSkills.length > 0) {
    const skillMatched = await User.find({
      role: "volunteer",
      availability: true,
      skills: { $in: requiredSkills },
    });

    if (skillMatched.length > 0) return skillMatched;
  }

  // Step 2: fall back to all available volunteers
  const available = await User.find({
    role: "volunteer",
    availability: true,
  });

  return available;
}

/**
 * Helper for future RAG integration.
 * Accepts structured output from the RAG pipeline and shapes it into a task.
 *
 * Expected `data` shape (from RAG output):
 * {
 *   title, description, category, priority,
 *   location, requiredSkills, sourceFileId
 * }
 *
 * @param {object} data     — RAG-extracted task data
 * @param {string} ngoId    — ID of the NGO creating the task
 * @returns {object}        — task document shape (ready to pass to Task.create())
 */
export function createTaskFromRagOutput(data, ngoId) {
  return {
    title: data.title || "Untitled Task",
    description: data.description || "",
    category: data.category || "",
    priority: ["low", "medium", "high", "critical"].includes(data.priority)
      ? data.priority
      : "medium",
    location: data.location || "",
    requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
    ngoId,
    sourceFileId: data.sourceFileId || null,
    status: "open",
  };
}
