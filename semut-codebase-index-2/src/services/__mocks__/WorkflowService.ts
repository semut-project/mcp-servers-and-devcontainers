import { WebPartContext } from '@microsoft/sp-webpart-base';
import { KYCCase, ApprovalRecord, ApprovalStatus, CaseStatus, User, UserRole, WorkflowResponse, DocumentType } from '../../types';

// Mock implementation of WorkflowService that provides a proper constructor
export class WorkflowService {
  private context: WebPartContext;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  async submitForApproval(caseId: string, submittedBy: User): Promise<WorkflowResponse> {
    return Promise.resolve({
      success: true,
      message: 'Case submitted for approval successfully',
      nextApprover: {
        id: 'front.checker@company.com',
        displayName: 'Front Checker',
        email: 'front.checker@company.com',
        jobTitle: 'Front Office Checker',
        department: 'Front Office',
        roles: [UserRole.FRONT_CHECKER],
        isActive: true
      },
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  }

  async approveCase(
    caseId: string, 
    approver: User, 
    comments: string = '', 
    decisionReason?: string
  ): Promise<WorkflowResponse> {
    return Promise.resolve({
      success: true,
      message: 'Case approved successfully',
      estimatedCompletion: new Date()
    });
  }

  async rejectCase(
    caseId: string, 
    approver: User, 
    comments: string, 
    decisionReason: string
  ): Promise<WorkflowResponse> {
    return Promise.resolve({
      success: true,
      message: 'Case rejected successfully',
      estimatedCompletion: new Date()
    });
  }

  async requestCorrections(
    caseId: string, 
    approver: User, 
    comments: string, 
    requiredActions: string[]
  ): Promise<WorkflowResponse> {
    return Promise.resolve({
      success: true,
      message: 'Corrections requested successfully',
      estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
  }

  async getPendingApprovals(userId: string): Promise<KYCCase[]> {
    return Promise.resolve([
      {
        id: 'CASE-2024-001',
        companyId: 'COMP-001',
        caseNumber: 'CASE-2024-001',
        status: CaseStatus.SUBMITTED,
        currentApprover: {
          id: 'front.checker@company.com',
          displayName: 'Front Checker',
          email: 'front.checker@company.com',
          jobTitle: 'Front Office Checker',
          department: 'Front Office',
          roles: [UserRole.FRONT_CHECKER],
          isActive: true
        },
        approvalLevel: 1,
        deadlineDate: new Date('2024-01-20'),
        createdBy: {
          id: 'user1@company.com',
          displayName: 'Test User',
          email: 'user1@company.com',
          jobTitle: '',
          department: '',
          roles: [],
          isActive: true
        },
        createdDate: new Date('2024-01-15'),
        modifiedBy: {
          id: 'user1@company.com',
          displayName: 'Test User',
          email: 'user1@company.com',
          jobTitle: '',
          department: '',
          roles: [],
          isActive: true
        },
        modifiedDate: new Date('2024-01-15'),
        documents: [
          {
            id: '1',
            caseId: 'CASE-2024-001',
            fileName: 'passport.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            uploadDate: new Date('2024-01-15'),
            uploadedBy: {
              id: 'user1@company.com',
              displayName: 'Test User',
              email: 'user1@company.com',
              jobTitle: '',
              department: '',
              roles: [],
              isActive: true
            },
            version: 1,
            documentType: DocumentType.ID_DOCUMENT,
            metadata: {
              description: 'Passport copy',
              confidential: false,
              retentionPeriod: 365,
              tags: ['id', 'passport']
            }
          },
          {
            id: '2',
            caseId: 'CASE-2024-001',
            fileName: 'bank_statement.pdf',
            fileType: 'application/pdf',
            fileSize: 2048,
            uploadDate: new Date('2024-01-16'),
            uploadedBy: {
              id: 'user1@company.com',
              displayName: 'Test User',
              email: 'user1@company.com',
              jobTitle: '',
              department: '',
              roles: [],
              isActive: true
            },
            version: 1,
            documentType: DocumentType.FINANCIAL_STATEMENT,
            metadata: {
              description: 'Bank statement for verification',
              confidential: true,
              retentionPeriod: 365,
              tags: ['financial', 'statement']
            }
          }
        ],
        approvalHistory: []
      }
    ]);
  }

  async getApprovalHistory(caseId: string): Promise<ApprovalRecord[]> {
    return Promise.resolve([]);
  }

  async getCasesByStatus(status: CaseStatus): Promise<KYCCase[]> {
    return Promise.resolve([]);
  }

  async getCaseStats(): Promise<{
    total: number;
    byStatus: Record<CaseStatus, number>;
    pendingApprovals: number;
    overdue: number;
  }> {
    return Promise.resolve({
      total: 3,
      byStatus: {
        [CaseStatus.DRAFT]: 0,
        [CaseStatus.SUBMITTED]: 2,
        [CaseStatus.IN_REVIEW]: 0,
        [CaseStatus.APPROVED]: 1,
        [CaseStatus.REJECTED]: 0,
        [CaseStatus.PENDING_CORRECTION]: 0
      },
      pendingApprovals: 2,
      overdue: 1
    });
  }
}

// Export as default for Jest auto-mocking
export default WorkflowService;
