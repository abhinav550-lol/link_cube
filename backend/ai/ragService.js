// ─── RAG Service ────────────────────────────────────────────────────
// Retrieval + Answer generation with Groq + Llama 3.
import dotenv from "dotenv"
dotenv.config()

import Groq from "groq-sdk";
import mongoose from "mongoose";
import DocumentChunk from "../models/chunkModel.js";
import { embedText } from "./embeddingService.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
const DEFAULT_TOP_K = 5;

// ─── Retrieval ──────────────────────────────────────────────────────

/**
 * Search for the most similar chunks using MongoDB Atlas Vector Search.
 *
 * @param {number[]} queryEmbedding — 384-dim vector
 * @param {string} userId
 * @param {string[]} [fileIds] — optional file scope
 * @param {number} [topK=5]
 * @returns {Promise<object[]>} matched chunks with score
 */
export async function retrieveChunks(queryEmbedding, userId, fileIds, topK = DEFAULT_TOP_K) {
  const filter = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (fileIds && fileIds.length > 0) {
    filter.fileId = {
      $in: fileIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  const pipeline = [
    {
      $vectorSearch: {
        index: "chunk_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: topK * 10,
        limit: topK,
        filter: filter,
      },
    },
    {
      $addFields: {
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      $project: {
        embedding: 0, // exclude the large vector array from results
      },
    },
  ];

  const results = await DocumentChunk.aggregate(pipeline);
  return results;
}

// ─── Answer Generation ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based ONLY on the provided context documents.

Rules:
- Answer ONLY using the provided context. Do NOT use outside knowledge.
- If the context does not contain enough information to answer, say: "I don't have enough information in the uploaded documents to answer this question."
- Keep answers concise but comprehensive.
- When citing information, reference the source file name.
- Use bullet points or numbered lists for clarity when appropriate.`;

/**
 * Generate an answer from context chunks using Groq + Llama 3.
 *
 * @param {string} question
 * @param {object[]} chunks — retrieved chunks with text and metadata
 * @returns {Promise<string>} generated answer
 */
export async function generateAnswer(question, chunks) {
  if (!chunks || chunks.length === 0) {
    return "I don't have enough information in the uploaded documents to answer this question.";
  }

  // Build context from chunks
  const contextParts = chunks.map((chunk, i) => {
    const source = chunk.metadata?.fileName || "Unknown file";
    return `[Source ${i + 1}: ${source}]\n${chunk.text}`;
  });

  const contextText = contextParts.join("\n\n---\n\n");

  const userMessage = `Context Documents:\n\n${contextText}\n\n---\n\nQuestion: ${question}`;

  const chatCompletion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  return chatCompletion.choices[0]?.message?.content || "No answer generated.";
}

// ─── End-to-end Ask ─────────────────────────────────────────────────

/**
 * Full RAG flow: embed question → retrieve chunks → generate answer.
 *
 * @param {string} question
 * @param {string} userId
 * @param {string[]} [fileIds] — optional file scope
 * @returns {Promise<{ answer: string, sources: object[] }>}
 */
export async function askQuestion(question, userId, fileIds) {
  // 1. Embed the question
  const queryEmbedding = await embedText(question);

  // 2. Retrieve similar chunks
  const chunks = await retrieveChunks(queryEmbedding, userId, fileIds);

  // 3. Generate answer
  const answer = await generateAnswer(question, chunks);

  // 4. Format sources
  const sources = chunks.map((chunk) => ({
    fileId: chunk.fileId,
    fileName: chunk.metadata?.fileName || "Unknown",
    chunkIndex: chunk.chunkIndex,
    preview: chunk.metadata?.preview || chunk.text?.substring(0, 200),
    score: chunk.score,
  }));

  return { answer, sources };
}
