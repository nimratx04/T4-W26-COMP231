export type RoleKey = "affected" | "organization" | "volunteer" | "admin" | "reporter";

export type HelpType = "Shelter" | "Food" | "Water" | "Medical" | "Transportation";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type HelpRequestStatus = "Pending" | "Active" | "Resolved";

export interface HelpRequest {
  id: string;
  type: HelpType;
  location: string;
  description: string;
  priority: Priority;
  status: HelpRequestStatus;
  createdAt: string;
  updatedAt: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
}

export interface ResourceAvailability {
  beds: number;
  food: number;
  water: number;
  blanketsSupplies: string;
  medicalSupport: string;
  contactNumber: string;
  operatingHours: string;
  updatedAt: string;
}

export type OrganizationStatusValue = "Open" | "Limited" | "Full" | "Closed";

export interface OrganizationStatusRecord {
  status: OrganizationStatusValue;
  note: string;
  updatedAt: string;
}

export type VerificationStatus = "Pending" | "Verified" | "Rejected" | "Expired";

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  idDocument: string;
  policeCheck: string;
  emergencyContact: string;
  safetyAgreement: boolean;
  status: VerificationStatus;
  resultMessage: string;
  submittedAt?: string;
}

export type TaskStatus = "Available" | "Accepted" | "Active" | "Completed";

export interface VolunteerTask {
  id: string;
  title: string;
  type: string;
  priority: Priority;
  location: string;
  urgency: string;
  description: string;
  status: TaskStatus;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
}

export type AlertType = "Emergency" | "Resource" | "Safety" | "Update";

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  area: string;
  priority: Priority;
  type: AlertType;
  createdAt: string;
  instructions?: string;
}

export type IncidentStatus =
  | "Pending Verification"
  | "Verified"
  | "Responding"
  | "Resolved"
  | "Rejected";

export interface IncidentReport {
  id: string;
  type: string;
  description: string;
  location: string;
  urgency: Priority;
  photoName?: string;
  status: IncidentStatus;
  createdAt: string;
}

export interface NearbyResource {
  id: string;
  name: string;
  category: "Shelter" | "Food" | "Water" | "Medical";
  distance: string;
  availability: string;
  status: OrganizationStatusValue;
  address: string;
}

export interface ReportDraft {
  type: string;
  description: string;
  location: string;
  urgency: Priority | "";
  photoName: string;
}
