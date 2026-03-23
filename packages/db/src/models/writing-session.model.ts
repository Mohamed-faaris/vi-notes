import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

type WritingEvent = {
  t: number;
  type: "insert" | "delete" | "paste";
  start: number;
  end: number;
  length: number;
  delta: number;
  delay: number;
};

type SessionSnapshot = {
  t: number;
  text: string;
};

type WritingSessionDocument = {
  sessionId: string;
  userId: string;
  events: WritingEvent[];
  snapshots: SessionSnapshot[];
  startTime: number;
  endTime?: number;
};

const writingEventSchema = new Schema(
  {
    t: { type: Number, required: true },
    type: { type: String, enum: ["insert", "delete", "paste"], required: true },
    start: { type: Number, required: true, min: 0 },
    end: { type: Number, required: true, min: 0 },
    length: { type: Number, required: true, min: 0 },
    delta: { type: Number, required: true },
    delay: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const snapshotSchema = new Schema(
  {
    t: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const writingSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    events: { type: [writingEventSchema], default: [] },
    snapshots: { type: [snapshotSchema], default: [] },
    startTime: { type: Number, required: true },
    endTime: { type: Number },
  },
  {
    collection: "writing_session",
    timestamps: true,
  },
);

const WritingSession =
  (models.WritingSession as mongoose.Model<WritingSessionDocument>) ||
  model<WritingSessionDocument>("WritingSession", writingSessionSchema);

export { WritingSession };
