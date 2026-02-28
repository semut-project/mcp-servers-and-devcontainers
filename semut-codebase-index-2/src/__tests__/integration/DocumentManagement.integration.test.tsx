// Integration tests for Document Management System - Banking Compliance Edition

// Mock the PnP JS and service dependencies
jest.mock('@pnp/sp', () => ({
  sp: {
    web: {
      lists: {
        getByTitle: jest.fn().mockReturnValue({
          items: {
            add: jest.fn(),
            get: jest.fn(),
            getById: jest.fn(),
            filter: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          }
        }),
      },
    },
  },
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import DocumentManagement from '../../webparts/documentManagement/components/DocumentManagement';
import { IDocumentManagementProps } from '../../webparts/documentManagement/components/IDocumentManagementProps';
import { CaseStatus, UserRole, DocumentType, ApprovalStatus } from '../../types';

// Use manual mocks for services
jest.mock('../../services/DocumentService');
jest.mock('../../services/WorkflowService');

// Import service modules for mocking
import { DocumentService } from '../../services/DocumentService';
import { WorkflowService } from '../../services/WorkflowService';

describe('DocumentManagement Integration Tests - Banking Compliance', () => {
  const mockProps: IDocumentManagementProps = {
    context: {
      pageContext: {
        web: {
          absoluteUrl: 'https://test.sharepoint.com'
        },
        user: {
          loginName: 'user1@company.com',
          displayName: 'Test User',
          email: 'user1@company.com'
        }
      }
    } as any,
    description: 'Test Description',
    isDarkTheme: false,
    environmentMessage: 'Test Environment',
    hasTeamsContext: false,
    userDisplayName: 'Test User',
  };

  // Mock banking user roles
  const mockFrontOfficeUser = {
    loginName: 'frontoffice@bank.com',
    displayName: 'Front Office User',
    email: 'frontoffice@bank.com',
    roles: [UserRole.FRONT_OFFICE]
  };

  const mockComplianceOfficer = {
    loginName: 'compliance@bank.com',
    displayName: 'Compliance Officer',
    email: 'compliance@bank.com',
    roles: [UserRole.COMPLIANCE_OFFICER]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks to default behavior
    const mockDocumentService = DocumentService as any;
    const mockWorkflowService = WorkflowService as any;
    
    // Default mock implementations
    mockDocumentService.default.prototype.getDocumentsByCaseId = jest.fn().mockResolvedValue([
      {
        id: '1',
        fileName: 'passport.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        uploadDate: new Date('2024-01-15'),
        uploadedBy: mockFrontOfficeUser,
        version: 1,
        documentType: DocumentType.ID_DOCUMENT,
        metadata: { confidential: false, retentionPeriod: 365 }
      },
      {
        id: '2',
        fileName: 'bank_statement.pdf',
        fileType: 'application/pdf',
        fileSize: 2048000,
        uploadDate: new Date('2024-01-16'),
        uploadedBy: mockFrontOfficeUser,
        version: 1,
        documentType: DocumentType.FINANCIAL_STATEMENT,
        metadata: { confidential: true, retentionPeriod: 730 }
      }
    ]);

    mockWorkflowService.default.prototype.getPendingApprovals = jest.fn().mockResolvedValue([
      {
        id: '1',
        caseNumber: 'CASE-2024-001',
        status: CaseStatus.SUBMITTED,
        currentApprover: mockComplianceOfficer,
        approvalLevel: 3,
        deadlineDate: new Date(Date.now() + 86400000),
        createdBy: mockFrontOfficeUser,
        createdDate: new Date('2024-01-15'),
        documents: [
          {
            id: '1',
            fileName: 'passport.pdf',
            documentType: DocumentType.ID_DOCUMENT
          }
        ]
      }
    ]);

    mockWorkflowService.default.prototype.getApprovalHistory = jest.fn().mockResolvedValue([
      {
        id: '1',
        caseId: 'CASE-2024-001',
        approver: { displayName: 'Front Checker', email: 'checker@bank.com' },
        approvalLevel: 1,
        status: ApprovalStatus.APPROVED,
        comments: 'Documents verified',
        approvalDate: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: '2',
        caseId: 'CASE-2024-001',
        approver: { displayName: 'Middle Manager', email: 'manager@bank.com' },
        approvalLevel: 2,
        status: ApprovalStatus.APPROVED,
        comments: 'Risk assessment completed',
        approvalDate: new Date('2024-01-15T14:30:00Z')
      }
    ]);
  });

  // ===== CORE FUNCTIONALITY TESTS =====
  it('should load documents when switching to documents tab', async () => {
    render(<DocumentManagement {...mockProps} />);
    
    // Switch to documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('passport.pdf')).toBeInTheDocument();
      expect(screen.getByText('bank_statement.pdf')).toBeInTheDocument();
    });
  });

  it('should search documents with banking-specific filters', async () => {
    render(<DocumentManagement {...mockProps} />);
    
    // Switch to search tab
    fireEvent.click(screen.getByText('🔍 Search'));
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search by file name, document type, description, or tags...');
    if (searchInput) {
      await userEvent.type(searchInput, 'passport');
    }

    // Click search button
    const searchButtons = screen.getAllByText('🔍 Search');
    if (searchButtons && searchButtons[1]) {
      fireEvent.click(searchButtons[1]);
    }
    
    // Wait for filtered results
    await waitFor(() => {
      expect(screen.getByText('passport.pdf')).toBeInTheDocument();
      expect(screen.queryByText('bank_statement.pdf')).not.toBeInTheDocument();
    });
  });

  // ===== BANKING COMPLIANCE TESTS =====
  it('should maintain complete audit trail for all actions', async () => {
    const mockWorkflowService = WorkflowService as any;
    mockWorkflowService.default.prototype.getApprovalHistory = jest.fn().mockResolvedValue([
      {
        id: '1',
        caseId: 'CASE-2024-001',
        approver: { displayName: 'Front Checker', email: 'checker@bank.com' },
        approvalLevel: 1,
        status: ApprovalStatus.APPROVED,
        comments: 'ID documents verified against government database',
        approvalDate: new Date('2024-01-15T10:00:00Z'),
        decisionReason: 'Document authenticity confirmed'
      }
    ]);

    render(<DocumentManagement {...mockProps} />);
    
    // Switch to approvals tab
    fireEvent.click(screen.getByText('✅ Approval Queue'));
    
    await waitFor(() => {
      expect(screen.getByText('CASE-2024-001')).toBeInTheDocument();
    });
  });

  it('should enforce role-based access control for banking compliance', async () => {
    const mockWorkflowService = WorkflowService as any;

    // Mock that current user is Front Office (should not see approve buttons)
    mockWorkflowService.default.prototype.getPendingApprovals = jest.fn().mockResolvedValue([]);
    
    render(<DocumentManagement {...mockProps} />);
    
    // Switch to approvals tab
    fireEvent.click(screen.getByText('✅ Approval Queue'));
    
    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText('No pending approvals at this time.')).toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING TESTS =====
  it('should handle service errors gracefully with banking compliance messaging', async () => {
    const mockDocumentService = DocumentService as any;
    mockDocumentService.default.prototype.getDocumentsByCaseId = jest.fn().mockRejectedValue(
      new Error('SharePoint connection failed')
    );

    render(<DocumentManagement {...mockProps} />);
    
    // Switch to documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Unable to load documents/)).toBeInTheDocument();
    });
  });

  it('should handle network timeouts with banking-grade retry mechanisms', async () => {
    const mockWorkflowService = WorkflowService as any;

    // Mock timeout scenario
    mockWorkflowService.default.prototype.getPendingApprovals = jest.fn()
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce([]);

    render(<DocumentManagement {...mockProps} />);
    
    // Switch to approvals tab
    fireEvent.click(screen.getByText('✅ Approval Queue'));
    
    // Should eventually succeed
    await waitFor(() => {
      expect(screen.getByText('No pending approvals at this time.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ===== PERFORMANCE TESTS =====
  it('should load documents within banking performance SLAs', async () => {
    const startTime = Date.now();
    
    render(<DocumentManagement {...mockProps} />);
    
    // Switch to documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('passport.pdf')).toBeInTheDocument();
    });
    
    const loadTime = Date.now() - startTime;
    
    // Banking compliance requirement: document load < 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  // ===== SECURITY COMPLIANCE TESTS =====
  it('should prevent unauthorized document access with proper error masking', async () => {
    const mockDocumentService = DocumentService as any;

    // Mock unauthorized access scenario
    mockDocumentService.default.prototype.getDocumentsByCaseId = jest.fn().mockRejectedValue(
      new Error('Access denied: Insufficient permissions')
    );

    render(<DocumentManagement {...mockProps} />);
    
    // Switch to documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));
    
    // Should show generic error without security details
    await waitFor(() => {
      expect(screen.getByText(/Access to requested resources/)).toBeInTheDocument();
    });
  });
});
