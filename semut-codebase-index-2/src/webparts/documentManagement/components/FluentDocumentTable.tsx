import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens,
  Badge
} from '@fluentui/react-components';
import { Document } from '../../../types';

export interface FluentDocumentTableProps {
  documents: Document[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const useStyles = makeStyles({
  table: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium
  },
  loadingRow: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  emptyRow: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3
  },
  statusBadge: {
    fontWeight: tokens.fontWeightSemibold
  }
});

export const FluentDocumentTable: React.FC<FluentDocumentTableProps> = ({
  documents,
  isLoading = false,
  emptyMessage = 'No documents found'
}) => {
  const styles = useStyles();

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Table className={styles.table}>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <div className={styles.loadingRow}>
                Loading documents...
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (documents.length === 0) {
    return (
      <Table className={styles.table}>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <div className={styles.emptyRow}>
                {emptyMessage}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table className={styles.table}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>File Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Upload Date</TableHeaderCell>
          <TableHeaderCell>Size</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <TableCellLayout>
                {document.fileName}
              </TableCellLayout>
            </TableCell>
            <TableCell>{document.documentType}</TableCell>
            <TableCell>
              {document.uploadDate.toLocaleDateString()}
            </TableCell>
            <TableCell>
              {document.fileSize ? formatFileSize(document.fileSize) : 'N/A'}
            </TableCell>
            <TableCell>
              <Badge
                appearance="filled"
                color={document.metadata?.confidential ? 'danger' : 'success'}
                className={styles.statusBadge}
              >
                {document.metadata?.confidential ? '🔒 Confidential' : '📄 Standard'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
