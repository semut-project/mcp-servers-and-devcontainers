import * as React from 'react';
import {
  Card,
  CardHeader,
  Button,
  Badge,
  makeStyles,
  tokens,
  Text,
  Divider
} from '@fluentui/react-components';
import { KYCCase, Document } from '../../../types';

export interface FluentApprovalCardProps {
  kycCase: KYCCase;
  onApprove: (caseId: string, comments?: string) => void;
  onReject: (caseId: string, comments: string, decisionReason: string) => void;
  onRequestCorrections: (caseId: string, comments: string, requiredActions: string[]) => void;
  isLoading?: boolean;
}

const useStyles = makeStyles({
  card: {
    marginBottom: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4
  },
  caseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalM
  },
  caseInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  caseNumber: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase500,
    color: tokens.colorNeutralForeground1
  },
  approvalLevel: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium
  } as any,
  deadline: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    border: `1px solid ${tokens.colorStatusWarningBorder1}`
  } as any,
  deadlineOverdue: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    borderColor: tokens.colorStatusDangerBorder1
  } as any,
  caseStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  caseDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM
  },
  documentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  documentItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  docName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300
  },
  docType: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  docDate: {
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase100
  },
  approvalActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  actionButton: {
    justifyContent: 'flex-start'
  },
  emptyDocuments: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    padding: tokens.spacingVerticalS
  }
});

export const FluentApprovalCard: React.FC<FluentApprovalCardProps> = ({
  kycCase,
  onApprove,
  onReject,
  onRequestCorrections,
  isLoading = false
}) => {
  const styles = useStyles();

  const isOverdue = kycCase.deadlineDate && new Date(kycCase.deadlineDate) < new Date();

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <div className={styles.caseHeader}>
            <div className={styles.caseInfo}>
              <Text className={styles.caseNumber}>{kycCase.caseNumber}</Text>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
                <Badge appearance="filled" className={styles.approvalLevel}>
                  Level {kycCase.approvalLevel} Approval
                </Badge>
                {kycCase.deadlineDate && (
                  <Badge
                    appearance="filled"
                    className={`${styles.deadline} ${isOverdue ? styles.deadlineOverdue : ''}`}
                  >
                    ⏰ {new Date(kycCase.deadlineDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <div className={styles.caseStatus}>
              <Badge appearance="outline" color="brand">
                {kycCase.status}
              </Badge>
            </div>
          </div>
        }
      />

      <Divider />

      <div className={styles.caseDetails}>
        <div className={styles.documentList}>
          <Text weight="semibold" size={300}>Documents for Review:</Text>
          {kycCase.documents.length > 0 ? (
            kycCase.documents.map((document: Document) => (
              <div key={document.id} className={styles.documentItem}>
                <Text className={styles.docName}>{document.fileName}</Text>
                <Text className={styles.docType}>{document.documentType}</Text>
                <Text className={styles.docDate}>
                  {document.uploadDate.toLocaleDateString()}
                </Text>
              </div>
            ))
          ) : (
            <Text className={styles.emptyDocuments}>No documents available for review.</Text>
          )}
        </div>

        <div className={styles.approvalActions}>
          <Text weight="semibold" size={300}>Take Action:</Text>
          <div className={styles.actionButtons}>
            <Button
              appearance="primary"
              onClick={() => onApprove(kycCase.id, 'Approved via system')}
              disabled={isLoading}
              className={styles.actionButton}
            >
              ✅ Approve
            </Button>
            <Button
              appearance="secondary"
              onClick={() => onReject(kycCase.id, 'Rejected via system', 'Does not meet requirements')}
              disabled={isLoading}
              className={styles.actionButton}
            >
              ❌ Reject
            </Button>
            <Button
              appearance="outline"
              onClick={() => onRequestCorrections(
                kycCase.id,
                'Please provide additional documentation',
                ['Missing signature', 'Incomplete form']
              )}
              disabled={isLoading}
              className={styles.actionButton}
            >
              📝 Request Corrections
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
