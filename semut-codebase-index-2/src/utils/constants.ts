// Application constants for Document Management System

/**
 * SharePoint list names
 */
export const LIST_NAMES = {
  KYC_CASES: 'KYC Cases',
  APPROVAL_HISTORY: 'Approval History',
  DOCUMENTS: 'KYC Documents',
  DEADLINES: 'Deadlines'
};

/**
 * Document library settings
 */
export const DOCUMENT_LIBRARY = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  VERSIONING: {
    ENABLED: true,
    MAJOR_VERSIONS: 10,
    MINOR_VERSIONS: 5
  }
};

/**
 * Approval workflow constants
 */
export const APPROVAL_WORKFLOW = {
  LEVELS: 6,
  ROLES: {
    FRONT_OFFICE: 'Front Office',
    FRONT_CHECKER: 'Front Checker',
    MIDDLE_MANAGEMENT: 'Middle Management',
    COMPLIANCE_OFFICER: 'Compliance Officer',
    DEPUTY_MANAGER: 'Deputy Manager',
    BRANCH_MANAGER: 'Branch Manager'
  },
  STATUS: {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING_CORRECTION: 'Pending Correction'
  }
};

/**
 * Deadline types and settings
 */
export const DEADLINE_SETTINGS = {
  TYPES: {
    ANNUAL_REVIEW: 'Annual Review',
    DOCUMENT_EXPIRY: 'Document Expiry',
    COMPLIANCE_DEADLINE: 'Compliance Deadline'
  },
  DEFAULT_REMINDER_FREQUENCY: 7, // days
  MAX_REMINDER_FREQUENCY: 30, // days
  NOTIFICATION_DAYS_BEFORE: [30, 15, 7, 3, 1] // days before deadline to send notifications
};

/**
 * User roles and permissions
 */
export const USER_ROLES = {
  FRONT_OFFICE: 'Front Office',
  FRONT_CHECKER: 'Front Checker',
  MIDDLE_MANAGEMENT: 'Middle Management',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  DEPUTY_MANAGER: 'Deputy Manager',
  BRANCH_MANAGER: 'Branch Manager',
  SYSTEM_ADMIN: 'System Administrator'
};

/**
 * Risk levels
 */
export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

/**
 * Document types
 */
export const DOCUMENT_TYPES = {
  APPLICATION_FORM: 'Application Form',
  ID_DOCUMENT: 'ID Document',
  FINANCIAL_STATEMENT: 'Financial Statement',
  PROOF_OF_ADDRESS: 'Proof of Address',
  BUSINESS_REGISTRATION: 'Business Registration',
  COMPLIANCE_CERTIFICATE: 'Compliance Certificate',
  OTHER: 'Other'
};

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  APPROVAL_REQUEST: 'Approval Request',
  DEADLINE_REMINDER: 'Deadline Reminder',
  DOCUMENT_UPLOAD: 'Document Upload',
  CASE_STATUS_CHANGE: 'Case Status Change',
  APPROVAL_COMPLETE: 'Approval Complete',
  REJECTION_NOTICE: 'Rejection Notice'
};

/**
 * Email templates
 */
export const EMAIL_TEMPLATES = {
  APPROVAL_REQUEST: {
    SUBJECT: 'Approval Required: KYC Case #{caseNumber}',
    BODY: 'You have been assigned to review KYC Case #{caseNumber} for {companyName}. Please review and take action by {deadlineDate}.'
  },
  DEADLINE_REMINDER: {
    SUBJECT: 'Reminder: Deadline Approaching for KYC Case #{caseNumber}',
    BODY: 'This is a reminder that the deadline for KYC Case #{caseNumber} is approaching on {deadlineDate}. Please take necessary action.'
  },
  APPROVAL_COMPLETE: {
    SUBJECT: 'Approval Complete: KYC Case #{caseNumber}',
    BODY: 'KYC Case #{caseNumber} for {companyName} has been successfully approved and completed.'
  },
  REJECTION_NOTICE: {
    SUBJECT: 'Rejection Notice: KYC Case #{caseNumber}',
    BODY: 'KYC Case #{caseNumber} for {companyName} has been rejected. Reason: {rejectionReason}'
  }
};

/**
 * Validation constants
 */
export const VALIDATION = {
  COMPANY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-&.,()]+$/
  },
  REGISTRATION_NUMBER: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 50
  },
  COMMENTS: {
    MAX_LENGTH: 500
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

/**
 * API endpoints and URLs
 */
export const API_ENDPOINTS = {
  SHAREPOINT: {
    BASE: '/_api/web',
    LISTS: '/_api/web/lists',
    FILES: '/_api/web/GetFileByServerRelativeUrl'
  },
  GRAPH: {
    BASE: 'https://graph.microsoft.com/v1.0',
    ME: '/me',
    USERS: '/users',
    GROUPS: '/groups'
  },
  POWER_AUTOMATE: {
    APPROVAL_FLOW: '/api/approval/workflow',
    NOTIFICATION: '/api/notification/send'
  }
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'documentManagement_userPreferences',
  RECENT_CASES: 'documentManagement_recentCases',
  FAVORITES: 'documentManagement_favorites',
  SEARCH_HISTORY: 'documentManagement_searchHistory'
};

/**
 * UI constants
 */
export const UI = {
  PAGE_SIZES: [10, 25, 50, 100],
  DEFAULT_PAGE_SIZE: 25,
  MAX_UPLOAD_FILES: 10,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  DEBOUNCE_TIME: 500, // milliseconds
  NOTIFICATION_TIMEOUT: 5000 // 5 seconds
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  ACCESS_DENIED: 'You do not have permission to perform this action.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  TIMEOUT: 'The operation timed out. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'File type is not supported.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  DOCUMENT_UPLOADED: 'Document uploaded successfully.',
  CASE_CREATED: 'KYC case created successfully.',
  CASE_UPDATED: 'KYC case updated successfully.',
  APPROVAL_SUBMITTED: 'Approval submitted successfully.',
  DOCUMENT_DELETED: 'Document deleted successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.'
};

/**
 * Date formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  FILENAME: 'yyyyMMdd_HHmmss'
};

/**
 * Environment settings
 */
export const ENVIRONMENT = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  VERSION: '1.0.0'
};
