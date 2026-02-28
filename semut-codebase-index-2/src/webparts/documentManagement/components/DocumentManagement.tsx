import * as React from 'react';
import { 
  Text,
  Input,
  Button,
  makeStyles,
  tokens,
  Spinner
} from '@fluentui/react-components';
import type { IDocumentManagementProps } from './IDocumentManagementProps';
import { FluentUploadZone } from './FluentUploadZone';
import { FluentTabs } from './FluentTabs';
import { FluentDocumentTable } from './FluentDocumentTable';
import { FluentApprovalCard } from './FluentApprovalCard';
import { useDocumentManagement } from '../hooks/useDocumentManagement';
import { useFluentTheme } from './FluentThemeProvider';

const useStyles = makeStyles({
  documentManagement: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '500px'
  },
  header: {
    marginBottom: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  contentArea: {
    marginTop: tokens.spacingVerticalL
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  searchBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-start'
  },
  searchInput: {
    flex: 1
  },
  searchResults: {
    marginTop: tokens.spacingVerticalM
  },
  searchStats: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px dashed ${tokens.colorNeutralStroke2}`
  },
  approvalQueue: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  queueStats: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  statItem: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    '& strong': {
      color: tokens.colorNeutralForeground1,
      fontWeight: tokens.fontWeightSemibold
    }
  }
});

export default function DocumentManagement(props: IDocumentManagementProps) {
  const styles = useStyles();
  const { theme } = useFluentTheme();
  const [state, actions] = useDocumentManagement(props.context);

  const handleUploadComplete = React.useCallback((document: any): void => {
    console.log('Document uploaded successfully:', document);
    actions.loadDocuments().catch(error => {
      console.error('Failed to load documents after upload:', error);
    });
  }, [actions]);

  const handleUploadError = React.useCallback((error: string): void => {
    console.error('Document upload failed:', error);
  }, []);

  const handleTabChange = React.useCallback((tabId: string): void => {
    actions.setActiveTab(tabId as any);
    if (tabId === 'documents') {
      void actions.loadDocuments().catch(error => {
        console.error('Failed to load documents:', error);
      });
    } else if (tabId === 'approvals') {
      void actions.loadPendingApprovals().catch(error => {
        console.error('Failed to load pending approvals:', error);
      });
    }
  }, [actions]);

  const tabs = [
    { id: 'upload', label: '📁 Upload Documents' },
    { id: 'documents', label: '📋 View Documents' },
    { id: 'approvals', label: '✅ Approval Queue' },
    { id: 'search', label: '🔍 Search' }
  ];

  const urgentApprovalsCount = state.pendingApprovals.filter(c => 
    c.deadlineDate && new Date(c.deadlineDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)
  ).length;

  return (
    <section className={styles.documentManagement}>
      <div className={styles.header}>
        <Text size={600} weight="semibold">KYC Document Management System</Text>
        <Text size={300} color="neutral">Welcome, {props.userDisplayName}</Text>
      </div>

      <FluentTabs
        activeTab={state.activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />

      <div className={styles.contentArea}>
        {state.activeTab === 'upload' && (
          <div className={styles.uploadSection}>
            <Text size={500} weight="semibold">Upload KYC Documents</Text>
            <Text size={300} color="neutral">
              Select files to upload for case: <strong>{state.selectedCaseId}</strong>
            </Text>
            
            <FluentUploadZone
              caseId={state.selectedCaseId}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={false}
            />
          </div>
        )}

        {state.activeTab === 'documents' && (
          <div>
            <Text size={500} weight="semibold" style={{ marginBottom: tokens.spacingVerticalM }}>
              Case Documents: {state.selectedCaseId}
            </Text>
            
            <FluentDocumentTable
              documents={state.documents}
              isLoading={state.isLoading}
              emptyMessage="No documents found for this case. Upload documents using the 'Upload Documents' tab."
            />
          </div>
        )}

        {state.activeTab === 'approvals' && (
          <div>
            <Text size={500} weight="semibold" style={{ marginBottom: tokens.spacingVerticalM }}>
              Approval Queue
            </Text>
            
            {state.isApprovalLoading ? (
              <div className={styles.loadingContainer}>
                <Spinner size="medium" />
                <Text style={{ marginLeft: tokens.spacingHorizontalS }}>Loading pending approvals...</Text>
              </div>
            ) : (
              <div className={styles.approvalQueue}>
                {state.pendingApprovals.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Text>No pending approvals at this time.</Text>
                    <Text>You're all caught up! New approval requests will appear here.</Text>
                  </div>
                ) : (
                  <>
                    <div className={styles.queueStats}>
                      <Text className={styles.statItem}>
                        📋 Total Pending: <strong>{state.pendingApprovals.length}</strong>
                      </Text>
                      <Text className={styles.statItem}>
                        ⏰ Urgent: <strong>{urgentApprovalsCount}</strong>
                      </Text>
                    </div>

                    {state.pendingApprovals.map((kycCase) => (
                      <FluentApprovalCard
                        key={kycCase.id}
                        kycCase={kycCase}
                        onApprove={actions.handleApprove}
                        onReject={actions.handleReject}
                        onRequestCorrections={actions.handleRequestCorrections}
                        isLoading={state.isApprovalLoading}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'search' && (
          <div className={styles.searchSection}>
            <Text size={500} weight="semibold">Document Search</Text>
            
            <div className={styles.searchBox}>
              <Input
                type="text"
                placeholder="Search by file name, document type, description, or tags..."
                value={state.searchQuery}
                onChange={(e) => actions.setSearchQuery(e.target.value)}
                className={styles.searchInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    void actions.handleSearch();
                  }
                }}
              />
              <Button
                appearance="primary"
                onClick={() => void actions.handleSearch()}
                disabled={state.isLoading}
              >
                {state.isLoading ? 'Searching...' : '🔍 Search'}
              </Button>
            </div>
            
            <div className={styles.searchResults}>
              {state.isLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="medium" />
                  <Text style={{ marginLeft: tokens.spacingHorizontalS }}>Searching documents...</Text>
                </div>
              ) : (
                <>
                  {state.documents.length > 0 && state.searchQuery && (
                    <div className={styles.searchStats}>
                      Found {state.documents.length} document{state.documents.length !== 1 ? 's' : ''} matching "{state.searchQuery}"
                    </div>
                  )}
                  
                  <FluentDocumentTable
                    documents={state.documents}
                    isLoading={false}
                    emptyMessage={
                      state.searchQuery 
                        ? `No documents found matching "${state.searchQuery}"`
                        : 'Enter search terms above to find documents'
                    }
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
