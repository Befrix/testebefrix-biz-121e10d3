/**
 * Shared domain types for BEFRIX.
 * Extend per feature module (campaigns, contacts, sequences, etc.).
 */

export type ID = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export type Status = "idle" | "loading" | "success" | "error";
