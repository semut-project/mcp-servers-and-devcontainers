import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseRepository } from './BaseRepository';
import { 
  KYCCase, 
  ApprovalRecord, 
  ApprovalStatus, 
  CaseStatus, 
  User, 
  UserRole,
  WorkflowResponse 
} from '../types';

interface SharePointApprovalItem {
  Id: number;
  CaseId: string;
  Approver?: { Id: string; Name: string; Email: string } | string;
  ApprovalLevel: number;
  Status: string;
  Comments?: string;
  DecisionReason?: string;
  ApprovalDate?: string;
}

/**
 * Workflow Service for handling approval workflow operations
 * Manages the multi-level approval process for KYC cases
 */
export class WorkflowService extends BaseRepository<KYCCase> {
  protected listName = 'KYC Cases';
  protected approvalsListName = 'Approval Records';
  protected siteUrl?: string;

  constructor(context: WebPartContext) {
    super(context);
  }

  /**
   * Submit a case for approval
   */
  async submitForApproval(caseId: string, submittedBy: User): Promise<WorkflowResponse> {
    try {
      this.validateRequiredParams({ caseId }, 'submitForApproval');

      // Get the case
      const kycCase = await this.getCaseById(caseId);
      if (!kycCase) {
        throw new Error(`Case not found: ${caseId}`);
      }

      // Validate case can be submitted
      if (kycCase.status !== CaseStatus.DRAFT) {
        throw new Error(`Case cannot be submitted. Current status: ${kycCase.status}`);
      }

      // Get next approver based on workflow rules
      const nextApprover = await this.getNextApprover(kycCase, 1); // Start from level 1

      // Update case status
      const updateData = {
        status: CaseStatus.SUBMITTED,
        currentApprover: nextApprover,
        approvalLevel: 1,
        modifiedBy: submittedBy,
        modifiedDate: new Date()
      };

      await this.updateItem(parseInt(caseId, 10), updateData);

      // Create initial approval record
      await this.createApprovalRecord({
        caseId,
        approver: nextApprover,
        approvalLevel: 1,
        status: ApprovalStatus.PENDING,
        comments: 'Case submitted for initial review',
        approvalDate: new Date()
      });

      return {
        success: true,
        message: 'Case submitted for approval successfully',
        nextApprover,
        estimatedCompletion: this.calculateEstimatedCompletion(1)
      };
    } catch (error: any) {
      this.handleError('submitForApproval', error, `Failed to submit case for approval: ${caseId}`);
    }
  }

  /**
   * Approve a case at current level and move to next level
   */
  async approveCase(
    caseId: string, 
    approver: User, 
    comments: string = '', 
    decisionReason?: string
  ): Promise<WorkflowResponse> {
    try {
      this.validateRequiredParams({ caseId }, 'approveCase');

      const kycCase = await this.getCaseById(caseId);
      if (!kycCase) {
        throw new Error(`Case not found: ${caseId}`);
      }

      // Validate approver has permission
      if (kycCase.currentApprover.id !== approver.id) {
        throw new Error('User is not the current approver for this case');
      }

      // Update approval record
      const updateData: Partial<ApprovalRecord> = {
        status: ApprovalStatus.APPROVED,
        comments,
        approvalDate: new Date()
      };

      if (decisionReason !== undefined) {
        updateData.decisionReason = decisionReason;
      }

      await this.updateApprovalRecord(caseId, kycCase.approvalLevel, updateData);

      // Check if this is the final approval level
      const nextLevel = kycCase.approvalLevel + 1;
      const maxLevel = this.getMaxApprovalLevel('Medium'); // Default to Medium risk for demo

      if (nextLevel > maxLevel) {
        // Final approval - case is complete
        await this.updateItem(parseInt(caseId, 10), {
          status: CaseStatus.APPROVED,
          modifiedBy: approver,
          modifiedDate: new Date()
        });

        return {
          success: true,
          message: 'Case fully approved and completed',
          estimatedCompletion: new Date()
        };
      } else {
        // Move to next approval level
        const nextApprover = await this.getNextApprover(kycCase, nextLevel);

        await this.updateItem(parseInt(caseId, 10), {
          currentApprover: nextApprover,
          approvalLevel: nextLevel,
          modifiedBy: approver,
          modifiedDate: new Date()
        });

        // Create new approval record for next level
        await this.createApprovalRecord({
          caseId,
          approver: nextApprover,
          approvalLevel: nextLevel,
          status: ApprovalStatus.PENDING,
          comments: `Approved by level ${kycCase.approvalLevel}, moved to level ${nextLevel}`,
          approvalDate: new Date()
        });

        return {
          success: true,
          message: `Case approved at level ${kycCase.approvalLevel}, moved to level ${nextLevel}`,
          nextApprover,
          estimatedCompletion: this.calculateEstimatedCompletion(nextLevel)
        };
      }
    } catch (error: any) {
      this.handleError('approveCase', error, `Failed to approve case: ${caseId}`);
    }
  }

  /**
   * Reject a case and return to submitter
   */
  async rejectCase(
    caseId: string, 
    approver: User, 
    comments: string, 
    decisionReason: string
  ): Promise<WorkflowResponse> {
    try {
      this.validateRequiredParams({ caseId, comments }, 'rejectCase');

      const kycCase = await this.getCaseById(caseId);
      if (!kycCase) {
        throw new Error(`Case not found: ${caseId}`);
      }

      // Validate approver has permission
      if (kycCase.currentApprover.id !== approver.id) {
        throw new Error('User is not the current approver for this case');
      }

      // Update approval record
      await this.updateApprovalRecord(caseId, kycCase.approvalLevel, {
        status: ApprovalStatus.REJECTED,
        comments,
        decisionReason,
        approvalDate: new Date()
      });

      // Update case status to rejected
      await this.updateItem(parseInt(caseId, 10), {
        status: CaseStatus.REJECTED,
        modifiedBy: approver,
        modifiedDate: new Date()
      });

      return {
        success: true,
        message: 'Case rejected successfully',
        estimatedCompletion: new Date()
      };
    } catch (error: any) {
      this.handleError('rejectCase', error, `Failed to reject case: ${caseId}`);
    }
  }

  /**
   * Request corrections for a case
   */
  async requestCorrections(
    caseId: string, 
    approver: User, 
    comments: string, 
    requiredActions: string[]
  ): Promise<WorkflowResponse> {
    try {
      this.validateRequiredParams({ caseId, comments }, 'requestCorrections');

      const kycCase = await this.getCaseById(caseId);
      if (!kycCase) {
        throw new Error(`Case not found: ${caseId}`);
      }

      // Update approval record
      await this.updateApprovalRecord(caseId, kycCase.approvalLevel, {
        status: ApprovalStatus.DEFERRED,
        comments: `${comments}\n\nRequired actions:\n${requiredActions.map(a => `- ${a}`).join('\n')}`,
        approvalDate: new Date()
      });

      // Update case status to pending correction
      await this.updateItem(parseInt(caseId, 10), {
        status: CaseStatus.PENDING_CORRECTION,
        modifiedBy: approver,
        modifiedDate: new Date()
      });

      return {
        success: true,
        message: 'Corrections requested successfully',
        estimatedCompletion: this.calculateEstimatedCompletion(kycCase.approvalLevel, true)
      };
    } catch (error: any) {
      this.handleError('requestCorrections', error, `Failed to request corrections for case: ${caseId}`);
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string): Promise<KYCCase[]> {
    try {
      this.validateRequiredParams({ userId }, 'getPendingApprovals');

      const filter = `CurrentApprover/Id eq '${userId}' and Status eq '${CaseStatus.SUBMITTED}'`;
      return await this.getItemsWithQuery(filter, 'CreatedDate desc');
    } catch (error: any) {
      this.handleError('getPendingApprovals', error, `Failed to get pending approvals for user: ${userId}`);
    }
  }

  /**
   * Get approval history for a case
   */
  async getApprovalHistory(caseId: string): Promise<ApprovalRecord[]> {
    try {
      this.validateRequiredParams({ caseId }, 'getApprovalHistory');

      const filter = `CaseId eq '${caseId}'`;
      const items = await this.sp.web.lists
        .getByTitle(this.approvalsListName)
        .items
        .filter(filter)
        .orderBy('ApprovalLevel')();

      return items.map((item: any) => this.mapSharePointItemToApprovalRecord(item));
    } catch (error: any) {
      this.handleError('getApprovalHistory', error, `Failed to get approval history for case: ${caseId}`);
    }
  }

  /**
   * Get cases by status
   */
  async getCasesByStatus(status: CaseStatus): Promise<KYCCase[]> {
    try {
      this.validateRequiredParams({ status }, 'getCasesByStatus');

      const filter = `Status eq '${status}'`;
      return await this.getItemsWithQuery(filter, 'ModifiedDate desc');
    } catch (error: any) {
      this.handleError('getCasesByStatus', error, `Failed to get cases by status: ${status}`);
    }
  }

  /**
   * Get case statistics
   */
  async getCaseStats(): Promise<{
    total: number;
    byStatus: Record<CaseStatus, number>;
    pendingApprovals: number;
    overdue: number;
  }> {
    try {
      const allCases = await this.getAllItems();
      
      const stats = {
        total: allCases.length,
        byStatus: {} as Record<CaseStatus, number>,
        pendingApprovals: 0,
        overdue: 0
      };

      allCases.forEach(kycCase => {
        // Count by status
        stats.byStatus[kycCase.status] = (stats.byStatus[kycCase.status] || 0) + 1;
        
        // Count pending approvals
        if (kycCase.status === CaseStatus.SUBMITTED || kycCase.status === CaseStatus.IN_REVIEW) {
          stats.pendingApprovals++;
        }

        // Count overdue cases (simplified logic)
        if (kycCase.deadlineDate && new Date(kycCase.deadlineDate) < new Date()) {
          stats.overdue++;
        }
      });

      return stats;
    } catch (error: any) {
      this.handleError('getCaseStats', error, 'Failed to get case statistics');
    }
  }

  // Private helper methods

  private async getCaseById(caseId: string): Promise<KYCCase | null> {
    const numericId = parseInt(caseId, 10);
    if (isNaN(numericId)) {
      throw new Error(`Invalid case ID: ${caseId}`);
    }
    return await this.getItemById(numericId);
  }

  private async getNextApprover(kycCase: KYCCase, level: number): Promise<User> {
    // This is a simplified implementation - in a real system, this would
    // involve complex business logic to determine the next approver based on:
    // - User roles and permissions
    // - Department hierarchy
    // - Case risk level
    // - Approver availability
    
    // For demo purposes, return a mock user based on approval level
    const mockApprovers: Record<number, User> = {
      1: {
        id: 'front.checker@company.com',
        displayName: 'Front Checker',
        email: 'front.checker@company.com',
        jobTitle: 'Front Office Checker',
        department: 'Front Office',
        roles: [UserRole.FRONT_CHECKER],
        isActive: true
      },
      2: {
        id: 'middle.manager@company.com',
        displayName: 'Middle Manager',
        email: 'middle.manager@company.com',
        jobTitle: 'Middle Management',
        department: 'Operations',
        roles: [UserRole.MIDDLE_MANAGEMENT],
        isActive: true
      },
      3: {
        id: 'compliance.officer@company.com',
        displayName: 'Compliance Officer',
        email: 'compliance.officer@company.com',
        jobTitle: 'Compliance Specialist',
        department: 'Compliance',
        roles: [UserRole.COMPLIANCE_OFFICER],
        isActive: true
      }
    };

    return mockApprovers[level] || mockApprovers[1] || {
      id: 'default.approver@company.com',
      displayName: 'Default Approver',
      email: 'default.approver@company.com',
      jobTitle: 'Approver',
      department: 'Operations',
      roles: [UserRole.FRONT_CHECKER],
      isActive: true
    };
  }

  private getMaxApprovalLevel(riskLevel: string): number {
    // Determine max approval levels based on risk
    const riskLevels: Record<string, number> = {
      'Low': 2,
      'Medium': 3,
      'High': 4
    };
    return riskLevels[riskLevel] || 2;
  }

  private calculateEstimatedCompletion(level: number, isCorrection: boolean = false): Date {
    const now = new Date();
    if (isCorrection) {
      // Corrections typically take longer
      now.setDate(now.getDate() + 3);
    } else {
      // Each approval level adds 1-2 days
      const daysToAdd = level * (1 + Math.random());
      now.setDate(now.getDate() + Math.ceil(daysToAdd));
    }
    return now;
  }

  private async createApprovalRecord(record: Omit<ApprovalRecord, 'id'>): Promise<void> {
    await this.sp.web.lists
      .getByTitle(this.approvalsListName)
      .items
      .add({
        CaseId: record.caseId,
        Approver: {
          Id: record.approver.id,
          Name: record.approver.displayName,
          Email: record.approver.email
        },
        ApprovalLevel: record.approvalLevel,
        Status: record.status,
        Comments: record.comments,
        DecisionReason: record.decisionReason,
        ApprovalDate: record.approvalDate?.toISOString() || new Date().toISOString()
      });
  }

  private async updateApprovalRecord(
    caseId: string, 
    level: number, 
    updates: Partial<ApprovalRecord>
  ): Promise<void> {
    // Find the approval record to update
    const filter = `CaseId eq '${caseId}' and ApprovalLevel eq ${level}`;
    const items = await this.sp.web.lists
      .getByTitle(this.approvalsListName)
      .items
      .filter(filter)();

    if (items.length === 0) {
      throw new Error(`Approval record not found for case ${caseId}, level ${level}`);
    }

    const recordId = items[0].Id;
    
    await this.sp.web.lists
      .getByTitle(this.approvalsListName)
      .items
      .getById(recordId)
      .update({
        Status: updates.status,
        Comments: updates.comments,
        DecisionReason: updates.decisionReason,
        ApprovalDate: updates.approvalDate?.toISOString()
      });
  }

  private mapSharePointItemToApprovalRecord(item: SharePointApprovalItem): ApprovalRecord {
    // Handle both string and object formats for Approver field
    const approverId = typeof item.Approver === 'string' ? item.Approver : item.Approver?.Id || '';
    const approverName = typeof item.Approver === 'string' ? '' : item.Approver?.Name || '';
    const approverEmail = typeof item.Approver === 'string' ? '' : item.Approver?.Email || '';
    
    return {
      id: item.Id.toString(),
      caseId: item.CaseId,
      approver: {
        id: approverId,
        displayName: approverName,
        email: approverEmail,
        jobTitle: '',
        department: '',
        roles: [],
        isActive: true
      },
      approvalLevel: item.ApprovalLevel,
      status: item.Status as ApprovalStatus,
      comments: item.Comments || '',
      decisionReason: item.DecisionReason || '',
      approvalDate: new Date(item.ApprovalDate || new Date())
    };
  }

  protected mapSharePointItemToEntity(item: any): KYCCase {
    return {
      id: item.Id.toString(),
      companyId: item.CompanyId,
      caseNumber: item.CaseNumber,
      status: item.Status as CaseStatus,
      currentApprover: {
        id: item.CurrentApprover?.Id || item.CurrentApprover,
        displayName: item.CurrentApprover?.Name || '',
        email: item.CurrentApprover?.Email || '',
        jobTitle: '',
        department: '',
        roles: [],
        isActive: true
      },
      approvalLevel: item.ApprovalLevel,
      deadlineDate: new Date(item.DeadlineDate),
      createdBy: {
        id: item.CreatedBy?.Id || item.CreatedBy,
        displayName: item.CreatedBy?.Name || '',
        email: item.CreatedBy?.Email || '',
        jobTitle: '',
        department: '',
        roles: [],
        isActive: true
      },
      createdDate: new Date(item.Created),
      modifiedBy: {
        id: item.ModifiedBy?.Id || item.ModifiedBy,
        displayName: item.ModifiedBy?.Name || '',
        email: item.ModifiedBy?.Email || '',
        jobTitle: '',
        department: '',
        roles: [],
        isActive: true
      },
      modifiedDate: new Date(item.Modified),
      documents: [],
      approvalHistory: []
    };
  }

  protected mapEntityToSharePointItem(entity: Partial<KYCCase>): any {
    const result: any = {};

    if (entity.companyId !== undefined) result.CompanyId = entity.companyId;
    if (entity.caseNumber !== undefined) result.CaseNumber = entity.caseNumber;
    if (entity.status !== undefined) result.Status = entity.status;
    if (entity.currentApprover !== undefined) result.CurrentApprover = {
      Id: entity.currentApprover.id,
      Name: entity.currentApprover.displayName,
      Email: entity.currentApprover.email
    };
    if (entity.approvalLevel !== undefined) result.ApprovalLevel = entity.approvalLevel;
    if (entity.deadlineDate !== undefined) result.DeadlineDate = entity.deadlineDate.toISOString();
    if (entity.modifiedBy !== undefined) result.ModifiedBy = {
      Id: entity.modifiedBy.id,
      Name: entity.modifiedBy.displayName,
      Email: entity.modifiedBy.email
    };
    if (entity.modifiedDate !== undefined) result.ModifiedDate = entity.modifiedDate.toISOString();

    return result;
  }
}
