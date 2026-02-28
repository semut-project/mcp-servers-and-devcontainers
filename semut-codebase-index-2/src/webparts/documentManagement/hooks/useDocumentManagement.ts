import * as React from 'react';
import { DocumentService } from '../../../services/DocumentService';
import { WorkflowService } from '../../../services/WorkflowService';
import { Document, KYCCase, ApprovalRecord, User, UserRole } from '../../../types';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface UseDocumentManagementState {
  activeTab: 'upload' | 'documents' | 'approvals' | 'search';
  documents: Document[];
  pendingApprovals: KYCCase[];
  approvalHistory: ApprovalRecord[];
  selectedCaseId: string;
  isLoading: boolean;
  isApprovalLoading: boolean;
  searchQuery: string;
  currentUser: User;
}

export interface UseDocumentManagementActions {
  setActiveTab: (tab: UseDocumentManagementState['activeTab']) => void;
  setSearchQuery: (query: string) => void;
  loadDocuments: () => Promise<void>;
  loadPendingApprovals: () => Promise<void>;
  loadApprovalHistory: (caseId: string) => Promise<void>;
  handleSearch: () => Promise<void>;
  handleApprove: (caseId: string, comments?: string) => Promise<void>;
  handleReject: (caseId: string, comments: string, decisionReason: string) => Promise<void>;
  handleRequestCorrections: (caseId: string, comments: string, requiredActions: string[]) => Promise<void>;
}

export const useDocumentManagement = (context: WebPartContext): [UseDocumentManagementState, UseDocumentManagementActions] => {
  const documentService = React.useMemo(() => new DocumentService(context), [context]);
  const workflowService = React.useMemo(() => new WorkflowService(context), [context]);

  const [state, setState] = React.useState<UseDocumentManagementState>({
    activeTab: 'upload',
    documents: [],
    pendingApprovals: [],
    approvalHistory: [],
    selectedCaseId: 'CASE-2024-001',
    isLoading: false,
    isApprovalLoading: false,
    searchQuery: '',
    currentUser: {
      id: context.pageContext.user.loginName,
      displayName: context.pageContext.user.displayName,
      email: context.pageContext.user.email,
      jobTitle: '',
      department: '',
      roles: [UserRole.FRONT_OFFICE],
      isActive: true
    }
  });

  const setActiveTab = React.useCallback((tab: UseDocumentManagementState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const setSearchQuery = React.useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const loadDocuments = React.useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const documents = await documentService.getDocumentsByCaseId(state.selectedCaseId);
      setState(prev => ({ ...prev, documents, isLoading: false }));
    } catch (error) {
      console.error('Failed to load documents:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [documentService, state.selectedCaseId]);

  const loadPendingApprovals = React.useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isApprovalLoading: true }));
    try {
      const pendingApprovals = await workflowService.getPendingApprovals(state.currentUser.id);
      setState(prev => ({ ...prev, pendingApprovals, isApprovalLoading: false }));
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      setState(prev => ({ ...prev, isApprovalLoading: false }));
    }
  }, [workflowService, state.currentUser.id]);

  const loadApprovalHistory = React.useCallback(async (caseId: string): Promise<void> => {
    try {
      const approvalHistory = await workflowService.getApprovalHistory(caseId);
      setState(prev => ({ ...prev, approvalHistory }));
    } catch (error) {
      console.error('Failed to load approval history:', error);
    }
  }, [workflowService]);

  const handleSearch = React.useCallback(async (): Promise<void> => {
    const { searchQuery, selectedCaseId } = state;
    
    if (!searchQuery.trim()) {
      await loadDocuments();
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const allDocuments = await documentService.getDocumentsByCaseId(selectedCaseId);
      
      const searchTerm = searchQuery.toLowerCase();
      const filteredDocuments = allDocuments.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm) ||
        doc.documentType.toLowerCase().includes(searchTerm) ||
        (doc.metadata?.description && doc.metadata.description.toLowerCase().includes(searchTerm)) ||
        (doc.metadata?.tags && doc.metadata.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm)))
      );
      
      setState(prev => ({ 
        ...prev,
        documents: filteredDocuments,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.searchQuery, state.selectedCaseId, documentService, loadDocuments]);

  const handleApprove = React.useCallback(async (caseId: string, comments: string = ''): Promise<void> => {
    try {
      const response = await workflowService.approveCase(
        caseId,
        state.currentUser,
        comments
      );
      
      if (response.success) {
        console.log('Case approved successfully:', response.message);
        await loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to approve case:', error);
    }
  }, [workflowService, state.currentUser, loadPendingApprovals]);

  const handleReject = React.useCallback(async (caseId: string, comments: string, decisionReason: string): Promise<void> => {
    try {
      const response = await workflowService.rejectCase(
        caseId,
        state.currentUser,
        comments,
        decisionReason
      );
      
      if (response.success) {
        console.log('Case rejected successfully:', response.message);
        await loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to reject case:', error);
    }
  }, [workflowService, state.currentUser, loadPendingApprovals]);

  const handleRequestCorrections = React.useCallback(async (caseId: string, comments: string, requiredActions: string[]): Promise<void> => {
    try {
      const response = await workflowService.requestCorrections(
        caseId,
        state.currentUser,
        comments,
        requiredActions
      );
      
      if (response.success) {
        console.log('Corrections requested successfully:', response.message);
        await loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to request corrections:', error);
    }
  }, [workflowService, state.currentUser, loadPendingApprovals]);

  const actions: UseDocumentManagementActions = React.useMemo(() => ({
    setActiveTab,
    setSearchQuery,
    loadDocuments,
    loadPendingApprovals,
    loadApprovalHistory,
    handleSearch,
    handleApprove,
    handleReject,
    handleRequestCorrections
  }), [
    setActiveTab,
    setSearchQuery,
    loadDocuments,
    loadPendingApprovals,
    loadApprovalHistory,
    handleSearch,
    handleApprove,
    handleReject,
    handleRequestCorrections
  ]);

  return [state, actions];
};
