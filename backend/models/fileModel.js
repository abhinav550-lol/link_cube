import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["uploaded", "extracting_text", "chunking", "embedding", "ready", "failed"],
      default: "uploaded",
    },

    extractedText: {
      type: String,
      default: "",
    },

    chunkCount: {
      type: Number,
      default: 0,
    },

    embeddingStatus: {
      type: String,
      enum: ["not_started", "processing", "completed", "failed"],
      default: "not_started",
    },

    failureReason: {
      type: String,
      default: "",
    },

    metadata: {
      source: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        default: "",
      },
      category: {
        type: String,
        default: "",
      },
      tags: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true }
);

FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ status: 1 });

export default mongoose.model("File", FileSchema);