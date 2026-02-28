import * as React from 'react';
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  mergeClasses,
  Select,
  Option
} from '@fluentui/react-components';
import {
  DocumentRegular,
  ArrowUploadRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  InfoRegular
} from '@fluentui/react-icons';
import { useDropzone } from 'react-dropzone';
import { DocumentType } from '../../../types';
import { validateFile, validateDocumentType, formatFileSize } from '../../../utils/validation';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  dropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '120px'
  },
  dropZoneHover: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  dropZoneDragging: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  dropZoneError: {
    backgroundColor: tokens.colorPaletteRedBackground2,
  },
  dropZoneSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
  },
  dropMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
  },
  dropIcon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground3,
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
  },
  fileName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  fileDetails: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  metadataOptions: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    alignItems: 'flex-start',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-start',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  progressText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
});

export interface FluentUploadZoneProps {
  caseId: string;
  onUploadComplete: (document: any) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  multiple?: boolean;
}

export const FluentUploadZone: React.FC<FluentUploadZoneProps> = ({
  caseId,
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'],
  multiple = false,
}) => {
  const styles = useStyles();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [documentType, setDocumentType] = React.useState<DocumentType>(DocumentType.OTHER);
  const [description, setDescription] = React.useState<string>('');
  const [confidential, setConfidential] = React.useState<boolean>(false);
  const [retentionPeriod, setRetentionPeriod] = React.useState<number>(365);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'validating' | 'uploading' | 'success' | 'error'>('idle');

  // Debug logging
  React.useEffect(() => {
    console.log('[FluentUploadZone] Component mounted');
    console.log('[FluentUploadZone] Current documentType:', documentType);
    console.log('[FluentUploadZone] DocumentType enum values:', Object.values(DocumentType));
    return () => console.log('[FluentUploadZone] Component unmounted');
  }, []);

  React.useEffect(() => {
    console.log('[FluentUploadZone] documentType changed:', documentType);
  }, [documentType]);

  const handleFileSelect = React.useCallback((file: File) => {
    setUploadStatus('validating');

    const fileValidation = validateFile(file);
    const documentTypeValidation = validateDocumentType(documentType);

    setValidationErrors([...fileValidation.errors, ...documentTypeValidation.errors]);
    setValidationWarnings([...fileValidation.warnings, ...documentTypeValidation.warnings]);

    if (fileValidation.errors.length === 0) {
      setSelectedFile(file);
      setUploadStatus('idle');
    } else {
      setSelectedFile(null);
      setUploadStatus('error');
    }
  }, [documentType]);

  const handleReset = React.useCallback(() => {
    setSelectedFile(null);
    setDocumentType(DocumentType.OTHER);
    setDescription('');
    setConfidential(false);
    setRetentionPeriod(365);
    setValidationErrors([]);
    setValidationWarnings([]);
    setUploadStatus('idle');
    setUploadProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && acceptedFiles[0]) {
        handleFileSelect(acceptedFiles[0]);
      }
    },
    disabled: isUploading || disabled,
    multiple,
    maxSize: maxFileSize,
    accept: acceptedFileTypes.reduce((acc, ext) => {
      acc[ext] = [];
      return acc;
    }, {} as Record<string, string[]>),
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setValidationErrors(['Please select a file to upload']);
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate upload progress (would be replaced with actual SharePoint API calls)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          if (newProgress === 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 200);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedDocument = {
        id: `doc-${Date.now()}`,
        fileName: selectedFile.name,
        documentType,
        fileSize: selectedFile.size,
        uploadDate: new Date(),
        metadata: {
          description,
          confidential,
          retentionPeriod,
        },
      };

      setUploadStatus('success');
      onUploadComplete(uploadedDocument);

      // Reset form after successful upload
      setTimeout(() => {
        handleReset();
      }, 2000);

    } catch (error: any) {
      setUploadStatus('error');
      setValidationErrors([error.message || 'Failed to upload document']);
      onUploadError(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = selectedFile && validationErrors.length === 0 && !isUploading && !disabled;

  const dropZoneClasses = mergeClasses(
    styles.dropZone,
    isDragActive && styles.dropZoneDragging,
    uploadStatus === 'error' && styles.dropZoneError,
    uploadStatus === 'success' && styles.dropZoneSuccess
  );

  return (
    <div className={styles.root}>
      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={dropZoneClasses}
        data-dragging={isDragActive}
        data-error={uploadStatus === 'error'}
        data-success={uploadStatus === 'success'}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className={styles.fileInfo}>
            <DocumentRegular fontSize={32} />
            <div className={styles.fileName}>{selectedFile.name}</div>
            <div className={styles.fileDetails}>
              <span>{formatFileSize(selectedFile.size)}</span>
              <span>{selectedFile.type || 'Unknown type'}</span>
            </div>
          </div>
        ) : (
          <div className={styles.dropMessage}>
            <ArrowUploadRegular className={styles.dropIcon} />
            <div>
              <strong>Click to select a file or drag and drop here</strong>
              <br />
              <small>
                Max file size: {formatFileSize(maxFileSize)} • Supported formats: {acceptedFileTypes.join(', ')}
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Document Type Selection */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="documentType">
          Document Type *
        </label>
        <Select
          id="documentType"
          value={documentType}
          onChange={(_, data) => {
            console.log('[FluentUploadZone] Select onChange called with data:', data);
            const newType = data.value as DocumentType;
            console.log('[FluentUploadZone] Setting new documentType:', newType);
            setDocumentType(newType);
            const validation = validateDocumentType(newType);
            setValidationErrors(validation.errors);
            setValidationWarnings(validation.warnings);
          }}
          disabled={isUploading || disabled}
        >
          <Option value={DocumentType.APPLICATION_FORM}>Application Form</Option>
          <Option value={DocumentType.ID_DOCUMENT}>ID Document</Option>
          <Option value={DocumentType.FINANCIAL_STATEMENT}>Financial Statement</Option>
          <Option value={DocumentType.PROOF_OF_ADDRESS}>Proof of Address</Option>
          <Option value={DocumentType.BUSINESS_REGISTRATION}>Business Registration</Option>
          <Option value={DocumentType.COMPLIANCE_CERTIFICATE}>Compliance Certificate</Option>
          <Option value={DocumentType.OTHER}>Other</Option>
        </Select>
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for this document..."
          rows={3}
          disabled={isUploading || disabled}
        />
      </div>

      {/* Metadata Options */}
      <div className={styles.metadataOptions}>
        <div className={styles.checkboxGroup}>
          <Checkbox
            id="confidential"
            checked={confidential}
            onChange={(_, data) => setConfidential(data.checked as boolean)}
            disabled={isUploading || disabled}
            label="Mark as confidential"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="retentionPeriod">
            Retention Period (days)
          </label>
          <Input
            type="number"
            id="retentionPeriod"
            value={retentionPeriod.toString()}
            onChange={(e) => setRetentionPeriod(parseInt(e.target.value, 10) || 365)}
            min="1"
            max="3650"
            disabled={isUploading || disabled}
          />
        </div>
      </div>

      {/* Validation Messages */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div>
          {validationErrors.map((error, index) => (
            <MessageBar key={index} intent="error">
              <MessageBarBody>
                <ErrorCircleRegular /> {error}
              </MessageBarBody>
            </MessageBar>
          ))}
          {validationWarnings.map((warning, index) => (
            <MessageBar key={index} intent="info">
              <MessageBarBody>
                <InfoRegular /> {warning}
              </MessageBarBody>
            </MessageBar>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className={styles.progressContainer}>
          <ProgressBar value={uploadProgress} max={100} />
          <div className={styles.progressText}>
            Uploading... {uploadProgress}%
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === 'success' && (
        <MessageBar intent="success">
          <MessageBarBody>
            <CheckmarkCircleRegular /> Document uploaded successfully!
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button
          appearance="primary"
          onClick={handleUpload}
          disabled={!canUpload}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
        
        <Button
          appearance="secondary"
          onClick={handleReset}
          disabled={isUploading}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};
