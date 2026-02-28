import { ValidationRules } from '../types';
import { DocumentType } from '../types';

/**
 * Validation utilities for the Document Management System
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate company name against business rules
 */
export function validateCompanyName(name: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Company name is required');
    return { isValid: false, errors, warnings };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < ValidationRules.companyName.minLength) {
    errors.push(`Company name must be at least ${ValidationRules.companyName.minLength} characters long`);
  }

  if (trimmedName.length > ValidationRules.companyName.maxLength) {
    errors.push(`Company name cannot exceed ${ValidationRules.companyName.maxLength} characters`);
  }

  if (!ValidationRules.companyName.pattern.test(trimmedName)) {
    errors.push('Company name contains invalid characters. Only letters, numbers, spaces, hyphens, ampersands, commas, periods, and parentheses are allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate document type
 */
export function validateDocumentType(documentType: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!documentType) {
    errors.push('Document type is required');
    return { isValid: false, errors, warnings };
  }

  if (ValidationRules.documentType.allowedValues.indexOf(documentType as DocumentType) === -1) {
    errors.push(`Invalid document type. Must be one of: ${ValidationRules.documentType.allowedValues.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate file against size and type restrictions
 */
export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors, warnings };
  }

  // Check file size
  if (file.size > ValidationRules.fileSize.max) {
    const maxSizeMB = ValidationRules.fileSize.max / (1024 * 1024);
    errors.push(`File size cannot exceed ${maxSizeMB}MB`);
  }

  // Check file type
  if (ValidationRules.fileSize.allowedTypes.indexOf(file.type) === -1) {
    warnings.push(`File type ${file.type} may not be supported. Supported types: ${ValidationRules.fileSize.allowedTypes.join(', ')}`);
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email) {
    errors.push('Email address is required');
    return { isValid: false, errors, warnings };
  }

  if (!ValidationRules.email.pattern.test(email)) {
    errors.push('Please enter a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate approval comments (required for rejections)
 */
export function validateApprovalComments(comments: string, isRejection: boolean = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isRejection && (!comments || comments.trim().length === 0)) {
    errors.push('Comments are required when rejecting a case');
  }

  if (comments && comments.length > ValidationRules.approvalComments.maxLength) {
    errors.push(`Comments cannot exceed ${ValidationRules.approvalComments.maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate deadline date (must be in the future)
 */
export function validateDeadlineDate(date: Date): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!date) {
    errors.push('Deadline date is required');
    return { isValid: false, errors, warnings };
  }

  const now = new Date();
  if (date <= now) {
    errors.push('Deadline date must be in the future');
  }

  // Warning if deadline is too far in the future (more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (date > oneYearFromNow) {
    warnings.push('Deadline is set more than 1 year in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate registration number format
 */
export function validateRegistrationNumber(regNumber: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!regNumber || regNumber.trim().length === 0) {
    errors.push('Registration number is required');
    return { isValid: false, errors, warnings };
  }

  const trimmedRegNumber = regNumber.trim();

  // Basic validation - can be extended based on specific country formats
  if (trimmedRegNumber.length < 5) {
    warnings.push('Registration number seems unusually short');
  }

  if (trimmedRegNumber.length > 50) {
    errors.push('Registration number cannot exceed 50 characters');
  }

  // Check for common invalid characters
  const invalidChars = /[!@#$%^&*()_+={}\[\]:";'<>,?\\|~`]/;
  if (invalidChars.test(trimmedRegNumber)) {
    errors.push('Registration number contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a unique case number
 */
export function generateCaseNumber(): string {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString();
  const paddedRandom = ('000' + random).slice(-3); // Manual padding instead of padStart
  return `KYC-${timestamp}-${paddedRandom}`;
}

/**
 * Calculate deadline date based on base date and deadline type
 */
export function calculateDeadline(baseDate: Date, daysToAdd: number): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Validate complete KYC case data
 */
export function validateKYCCase(caseData: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate company name
  const companyNameValidation = validateCompanyName(caseData.companyName);
  errors.push(...companyNameValidation.errors);
  warnings.push(...companyNameValidation.warnings);

  // Validate registration number
  const regNumberValidation = validateRegistrationNumber(caseData.registrationNumber);
  errors.push(...regNumberValidation.errors);
  warnings.push(...regNumberValidation.warnings);

  // Validate risk level
  if (!caseData.riskLevel) {
    errors.push('Risk level is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Helper function to display validation results
 */
export function displayValidationResults(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'Validation passed';
  }

  const messages: string[] = [];

  if (!result.isValid) {
    messages.push('Validation errors:');
    messages.push(...result.errors.map(error => `• ${error}`));
  }

  if (result.warnings.length > 0) {
    if (messages.length > 0) messages.push('');
    messages.push('Validation warnings:');
    messages.push(...result.warnings.map(warning => `• ${warning}`));
  }

  return messages.join('\n');
}
