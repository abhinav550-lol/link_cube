import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      default: [],
    },

    metadata: {
      fileName: {
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
      page: {
        type: Number,
      },
      preview: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

documentChunkSchema.index({ fileId: 1 });
documentChunkSchema.index({ userId: 1 });

export default mongoose.model("DocumentChunk", documentChunkSchema);