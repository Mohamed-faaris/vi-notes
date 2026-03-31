import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

type WritingEvent = {
  id: string;
  seq: number;
  clientTs: number;
  t: number;
  type: "insert" | "delete" | "paste";
  start: number;
  end: number;
  length: number;
  delta: number;
  delay: number;
};

type SessionSnapshot = {
  id: string;
  seq: number;
  clientTs: number;
  t: number;
  text: string;
};

type WritingSessionDocument = {
  sessionId: string;
  userId: string;
  title: string;
  events: WritingEvent[];
  snapshots: SessionSnapshot[];
  startTime: number;
  endTime?: number;
  lastSeq: number;
};

const writingEventSchema = new Schema(
  {
    id: { type: String, required: true },
    seq: { type: Number, required: true, min: 0 },
    clientTs: { type: Number, required: true },
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
    id: { type: String, required: true },
    seq: { type: Number, required: true, min: 0 },
    clientTs: { type: Number, required: true },
    t: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const writingSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, default: "New Note" },
    events: { type: [writingEventSchema], default: [] },
    snapshots: { type: [snapshotSchema], default: [] },
    startTime: { type: Number, required: true },
    endTime: { type: Number },
    lastSeq: { type: Number, required: true, default: 0 },
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
