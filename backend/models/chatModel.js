import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "New Chat",
    },
    // Restrict RAG retrieval to these files (empty = search all user files)
    fileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1 });

export default mongoose.model("Chat", chatSchema);
