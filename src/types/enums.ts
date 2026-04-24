export const CheckStatus = {
  PASS: "PASS",
  FAIL: "FAIL",
  NA: "NA",
} as const;
export type CheckStatus = (typeof CheckStatus)[keyof typeof CheckStatus];

export const Severity = {
  CRITICAL: "CRITICAL",
  MAJOR: "MAJOR",
  MINOR: "MINOR",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const SnagFixStatus = {
  OPEN: "OPEN",
  FIXED: "FIXED",
  VERIFIED: "VERIFIED",
} as const;
export type SnagFixStatus = (typeof SnagFixStatus)[keyof typeof SnagFixStatus];

export const InspectionStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;
export type InspectionStatus =
  (typeof InspectionStatus)[keyof typeof InspectionStatus];

export const UserRole = {
  MANAGER: "MANAGER",
  INSPECTOR: "INSPECTOR",
  CONTRACTOR: "CONTRACTOR",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Trade = {
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  PAINTING: "PAINTING",
  CARPENTRY: "CARPENTRY",
  TILING: "TILING",
  CIVIL: "CIVIL",
  HVAC: "HVAC",
  MISC: "MISC",
} as const;
export type Trade = (typeof Trade)[keyof typeof Trade];

export const SnagImageKind = {
  NC: "NC",
  CLOSURE: "CLOSURE",
} as const;
export type SnagImageKind = (typeof SnagImageKind)[keyof typeof SnagImageKind];

export const ChecklistCategory = {
  ELECTRICAL: "ELECTRICAL",
  PLUMBING: "PLUMBING",
  CIVIL: "CIVIL",
  PAINT: "PAINT",
  DOORS_WINDOWS: "DOORS_WINDOWS",
  FIXTURES: "FIXTURES",
} as const;
export type ChecklistCategory =
  (typeof ChecklistCategory)[keyof typeof ChecklistCategory];

export const RoomType = {
  LIVING_ROOM: "LIVING_ROOM",
  BEDROOM: "BEDROOM",
  KITCHEN: "KITCHEN",
  BATHROOM: "BATHROOM",
  BALCONY: "BALCONY",
  COMMON_AREA: "COMMON_AREA",
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];
