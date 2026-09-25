import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    event: {
      type: String,
      enum: [
        "STREAK_CLAIM_REQUEST",
        "STREAK_CLAIM_SUCCESS",
        "STREAK_CLAIM_REJECTED",
        "STREAK_RESET",
        "DUPLICATE_CLAIM",
        "INVALID_CLAIM"
      ],
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ip: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
