// Core interfaces for Document Management System

export interface KYCCompany {
  id: string;
  name: string;
  registrationNumber: string;
  industry: string;
  riskLevel: RiskLevel;
  createdDate: Date;
  modifiedDate: Date;
}

export interface KYCCase {
  id: string;
  companyId: string;
  caseNumber: string;
  status: CaseStatus;
  currentApprover: User;
  approvalLevel: number;
  deadlineDate: Date;
  createdBy: User;
  createdDate: Date;
  modifiedBy: User;
  modifiedDate: Date;
  documents: Document[];
  approvalHistory: ApprovalRecord[];
}

export interface Document {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  uploadedBy: User;
  version: number;
  documentType: DocumentType;
  metadata: Record<string, any>;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  roles: UserRole[];
  isActive: boolean;
}

export interface ApprovalRecord {
  id: string;
  caseId: string;
  approver: User;
  approvalLevel: number;
  status: ApprovalStatus;
  comments: string;
  approvalDate: Date;
  decisionReason?: string;
}

export interface Deadline {
  id: string;
  caseId: string;
  deadlineType: DeadlineType;
  dueDate: Date;
  notificationSent: boolean;
  reminderFrequency: number;
  completed: boolean;
}

export interface DocumentMetadata {
  caseId?: string;
  documentType: DocumentType;
  description?: string;
  tags?: string[];
  confidential: boolean;
  retentionPeriod?: number; // in days
}

export interface DocumentVersion {
  version: number;
  modifiedBy: User;
  modifiedDate: Date;
  changes: string;
  size: number;
}

export interface WorkflowResponse {
  success: boolean;
  message: string;
  nextApprover?: User;
  estimatedCompletion?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Enums
export enum CaseStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PENDING_CORRECTION = 'Pending Correction'
}

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  DEFERRED = 'Deferred'
}

export enum UserRole {
  FRONT_OFFICE = 'Front Office',
  FRONT_CHECKER = 'Front Checker',
  MIDDLE_MANAGEMENT = 'Middle Management',
  COMPLIANCE_OFFICER = 'Compliance Officer',
  DEPUTY_MANAGER = 'Deputy Manager',
  BRANCH_MANAGER = 'Branch Manager',
  SYSTEM_ADMIN = 'System Administrator'
}

export enum DocumentType {
  APPLICATION_FORM = 'Application Form',
  ID_DOCUMENT = 'ID Document',
  FINANCIAL_STATEMENT = 'Financial Statement',
  PROOF_OF_ADDRESS = 'Proof of Address',
  BUSINESS_REGISTRATION = 'Business Registration',
  COMPLIANCE_CERTIFICATE = 'Compliance Certificate',
  OTHER = 'Other'
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum DeadlineType {
  ANNUAL_REVIEW = 'Annual Review',
  DOCUMENT_EXPIRY = 'Document Expiry',
  COMPLIANCE_DEADLINE = 'Compliance Deadline'
}

export enum NotificationType {
  APPROVAL_REQUEST = 'Approval Request',
  DEADLINE_REMINDER = 'Deadline Reminder',
  DOCUMENT_UPLOAD = 'Document Upload',
  CASE_STATUS_CHANGE = 'Case Status Change'
}

// Type guards
export function isKYCCompany(obj: any): obj is KYCCompany {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function isKYCCase(obj: any): obj is KYCCase {
  return obj && typeof obj.id === 'string' && typeof obj.caseNumber === 'string';
}

export function isDocument(obj: any): obj is Document {
  return obj && typeof obj.id === 'string' && typeof obj.fileName === 'string';
}

export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

// Validation utilities
export const ValidationRules = {
  companyName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-&.,()]+$/
  },
  documentType: {
    required: true,
    allowedValues: [
      DocumentType.APPLICATION_FORM,
      DocumentType.ID_DOCUMENT,
      DocumentType.FINANCIAL_STATEMENT,
      DocumentType.PROOF_OF_ADDRESS,
      DocumentType.BUSINESS_REGISTRATION,
      DocumentType.COMPLIANCE_CERTIFICATE,
      DocumentType.OTHER
    ]
  },
  fileSize: {
    max: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'text/plain'
    ]
  },
  approvalComments: {
    requiredForRejection: true,
    maxLength: 500
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;
