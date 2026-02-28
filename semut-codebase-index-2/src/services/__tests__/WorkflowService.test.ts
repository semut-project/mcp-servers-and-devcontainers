// Mock the PnP JS dependencies
jest.mock('@pnp/sp', () => {
  const mockSpfi = jest.fn().mockReturnValue({
    using: jest.fn().mockReturnThis()
  });
  
  return {
    spfi: mockSpfi,
    SPFx: jest.fn().mockReturnValue({}),
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
  };
});

jest.mock('@pnp/graph', () => {
  const mockGraphfi = jest.fn().mockReturnValue({
    using: jest.fn().mockReturnThis()
  });
  
  return {
    graphfi: mockGraphfi,
    SPFx: jest.fn().mockReturnValue({}),
  };
});

import { WorkflowService } from '../WorkflowService';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { CaseStatus, ApprovalStatus, UserRole } from '../../types';

// Mock the WebPartContext
const mockContext: Partial<WebPartContext> = {
  pageContext: {
    web: {
      absoluteUrl: 'https://test.sharepoint.com'
    }
  } as any
};

// Mock user data
const mockUser = {
  id: 'user1@company.com',
  displayName: 'Test User',
  email: 'user1@company.com',
  jobTitle: 'Tester',
  department: 'QA',
  roles: [UserRole.FRONT_OFFICE],
  isActive: true
};

describe('WorkflowService', () => {
  let workflowService: WorkflowService;

  beforeEach(() => {
    workflowService = new WorkflowService(mockContext as WebPartContext);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(workflowService).toBeDefined();
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals for a user', async () => {
      const mockItems = [{ 
        Id: 1, 
        CaseNumber: 'CASE-001', 
        Status: CaseStatus.SUBMITTED,
        CurrentApprover: { Id: 'user1@company.com' }
      }];
      
      const mockGetItemsWithQuery = jest.fn().mockResolvedValue(mockItems);
      workflowService['getItemsWithQuery'] = mockGetItemsWithQuery;

      const result = await workflowService.getPendingApprovals('user1@company.com');
      
      expect(result).toEqual(mockItems);
      expect(mockGetItemsWithQuery).toHaveBeenCalledWith(
        "CurrentApprover/Id eq 'user1@company.com' and Status eq 'Submitted'", 
        'CreatedDate desc'
      );
    });

    it('should handle errors when getting pending approvals', async () => {
      const mockGetItemsWithQuery = jest.fn().mockRejectedValue(new Error('Network error'));
      workflowService['getItemsWithQuery'] = mockGetItemsWithQuery;

      await expect(workflowService.getPendingApprovals('user1@company.com'))
        .rejects.toThrow('Network error');
    });
  });

  describe('getCasesByStatus', () => {
    it('should return cases by status', async () => {
      const mockItems = [{ 
        Id: 1, 
        CaseNumber: 'CASE-001', 
        Status: CaseStatus.APPROVED
      }];
      
      const mockGetItemsWithQuery = jest.fn().mockResolvedValue(mockItems);
      workflowService['getItemsWithQuery'] = mockGetItemsWithQuery;

      const result = await workflowService.getCasesByStatus(CaseStatus.APPROVED);
      
      expect(result).toEqual(mockItems);
      expect(mockGetItemsWithQuery).toHaveBeenCalledWith(
        "Status eq 'Approved'", 
        'ModifiedDate desc'
      );
    });
  });

  describe('getCaseStats', () => {
    it('should return case statistics', async () => {
      const mockCases = [
        { Id: 1, Status: CaseStatus.SUBMITTED, deadlineDate: new Date(Date.now() + 86400000) },
        { Id: 2, Status: CaseStatus.APPROVED, deadlineDate: new Date(Date.now() - 86400000) },
        { Id: 3, Status: CaseStatus.SUBMITTED, deadlineDate: new Date(Date.now() + 86400000) }
      ];
      
      const mockGetAllItems = jest.fn().mockResolvedValue(mockCases);
      workflowService['getAllItems'] = mockGetAllItems;

      const result = await workflowService.getCaseStats();
      
      expect(result.total).toBe(3);
      expect(result.byStatus[CaseStatus.SUBMITTED]).toBe(2);
      expect(result.byStatus[CaseStatus.APPROVED]).toBe(1);
      expect(result.pendingApprovals).toBe(2);
      expect(result.overdue).toBe(1);
    });
  });

  describe('approveCase', () => {
    it('should approve a case and move to next level', async () => {
      const mockCase = {
        id: '1',
        caseNumber: 'CASE-001',
        status: CaseStatus.SUBMITTED,
        currentApprover: mockUser,
        approvalLevel: 1
      };

      const mockGetCaseById = jest.fn().mockResolvedValue(mockCase);
      workflowService['getCaseById'] = mockGetCaseById;

      const mockUpdateItem = jest.fn().mockResolvedValue({});
      workflowService['updateItem'] = mockUpdateItem;

      const mockUpdateApprovalRecord = jest.fn().mockResolvedValue({});
      workflowService['updateApprovalRecord'] = mockUpdateApprovalRecord;

      const mockCreateApprovalRecord = jest.fn().mockResolvedValue({});
      workflowService['createApprovalRecord'] = mockCreateApprovalRecord;

      const result = await workflowService.approveCase('1', mockUser, 'Approved');
      
      expect(result.success).toBe(true);
      expect(mockUpdateApprovalRecord).toHaveBeenCalled();
      expect(mockUpdateItem).toHaveBeenCalled();
    });

    it('should handle case not found error', async () => {
      const mockGetCaseById = jest.fn().mockResolvedValue(null);
      workflowService['getCaseById'] = mockGetCaseById;

      await expect(workflowService.approveCase('999', mockUser, 'Approved'))
        .rejects.toThrow('Case not found: 999');
    });
  });

  describe('rejectCase', () => {
    it('should reject a case', async () => {
      const mockCase = {
        id: '1',
        caseNumber: 'CASE-001',
        status: CaseStatus.SUBMITTED,
        currentApprover: mockUser,
        approvalLevel: 1
      };

      const mockGetCaseById = jest.fn().mockResolvedValue(mockCase);
      workflowService['getCaseById'] = mockGetCaseById;

      const mockUpdateItem = jest.fn().mockResolvedValue({});
      workflowService['updateItem'] = mockUpdateItem;

      const mockUpdateApprovalRecord = jest.fn().mockResolvedValue({});
      workflowService['updateApprovalRecord'] = mockUpdateApprovalRecord;

      const result = await workflowService.rejectCase('1', mockUser, 'Rejected', 'Does not meet requirements');
      
      expect(result.success).toBe(true);
      expect(mockUpdateApprovalRecord).toHaveBeenCalledWith('1', 1, {
        status: ApprovalStatus.REJECTED,
        comments: 'Rejected',
        decisionReason: 'Does not meet requirements',
        approvalDate: expect.any(Date)
      });
    });
  });
});
