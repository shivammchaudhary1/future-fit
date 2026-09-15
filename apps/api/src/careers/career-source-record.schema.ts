import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  HydratedDocument,
  SchemaTypes,
} from "mongoose";

@Schema({
  timestamps: true,
  collection: "career_source_records",
})
export class CareerSourceRecord {
  @Prop({ required: true, index: true })
  sourceType!: string;

  @Prop({ required: true })
  sourceRecordKey!: string;

  @Prop({ required: true })
  sourceVersion!: string;

  @Prop({ required: true, index: true })
  candidateSlug!: string;

  @Prop({ required: true, index: true })
  normalizedTitle!: string;

  @Prop({ required: true, index: true })
  title!: string;

  @Prop({ type: [String], default: [] })
  aliases!: string[];

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  taxonomy!: Record<string, unknown>;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  sourceCodes!: Array<Record<string, unknown>>;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  legacySignals!: Record<string, unknown>;

  @Prop({
    required: true,
    enum: ["UNVERIFIED", "SOURCE_VERIFIED", "REVIEWED"],
    default: "UNVERIFIED",
    index: true,
  })
  verificationStatus!: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  indiaReview!: Record<string, unknown>;

  @Prop({ type: String, default: null, index: true })
  mappedCareerSlug!: string | null;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  provenance!: Record<string, unknown>;

  @Prop({ required: true })
  fingerprint!: string;
}

export type CareerSourceRecordDocument =
  HydratedDocument<CareerSourceRecord>;

export const CareerSourceRecordSchema =
  SchemaFactory.createForClass(CareerSourceRecord);

CareerSourceRecordSchema.index(
  { sourceType: 1, sourceRecordKey: 1 },
  { unique: true },
);

CareerSourceRecordSchema.index({
  candidateSlug: 1,
  verificationStatus: 1,
});

CareerSourceRecordSchema.index({
  mappedCareerSlug: 1,
  verificationStatus: 1,
});
