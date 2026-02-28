import * as React from 'react';
import {
  Button,
  Label,
  ProgressBar,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { DocumentService } from '../../../services/DocumentService';
import { Document as DocumentEntity, DocumentType, User } from '../../../types';
import { validateFile, validateDocumentType, formatFileSize } from '../../../utils/validation';
import { IDocumentUploadProps } from './IDocumentUploadProps';
import { useDropzone } from 'react-dropzone';

const useStyles = makeStyles({
  documentUpload: {
    margin: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  dropZone: {
    border: `2px dashed ${tokens.colorNeutralStrokeAccessible}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: tokens.colorNeutralBackground3,
    marginBottom: tokens.spacingVerticalM
  },
  dropZoneHover: {
    backgroundColor: tokens.colorNeutralBackground2
  },
  dropZoneError: {
    backgroundColor: tokens.colorPaletteRedBackground1
  },
  dropZoneSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground1
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  fileName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  fileSize: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300
  },
  fileType: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  dropMessage: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  dropIcon: {
    fontSize: tokens.fontSizeBase600,
    marginBottom: tokens.spacingVerticalS
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalM
  },
  metadataOptions: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: tokens.spacingVerticalM
    }
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  validationMessages: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalM
  },
  validationError: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase300,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusSmall,
    borderLeft: `3px solid ${tokens.colorPaletteRedForeground1}`
  },
  validationWarning: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    fontSize: tokens.fontSizeBase300,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteDarkOrangeBackground1,
    borderRadius: tokens.borderRadiusSmall,
    borderLeft: `3px solid ${tokens.colorPaletteDarkOrangeForeground1}`
  },
  uploadProgress: {
    marginBottom: tokens.spacingVerticalM
  },
  progressBar: {
    height: '4px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
    marginBottom: tokens.spacingVerticalXS
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colorBrandBackground,
    transition: 'width 0.3s ease'
  },
  progressText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'center'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    border: `1px solid ${tokens.colorPaletteGreenForeground1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM
  },
  successIcon: {
    fontSize: '20px'
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    '@media (max-width: 480px)': {
      flexDirection: 'column'
    }
  }
});

interface IDocumentUploadState {
  selectedFile: File | null;
  documentType: DocumentType;
  description: string;
  confidential: boolean;
  retentionPeriod: number;
  isUploading: boolean;
  uploadProgress: number;
  validationErrors: string[];
  validationWarnings: string[];
  uploadStatus: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
  uploadedDocument: DocumentEntity | null;
}

export const DocumentUpload: React.FC<IDocumentUploadProps> = (props) => {
  const styles = useStyles();
  const [state, setState] = React.useState<IDocumentUploadState>({
    selectedFile: null,
    documentType: DocumentType.OTHER,
    description: '',
    confidential: false,
    retentionPeriod: 365,
    isUploading: false,
    uploadProgress: 0,
    validationErrors: [],
    validationWarnings: [],
    uploadStatus: 'idle',
    uploadedDocument: null
  });

  const documentService = React.useMemo(() => new DocumentService(props.context), [props.context]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateAndSetFile = React.useCallback((file: File): void => {
    setState(prev => ({ ...prev, uploadStatus: 'validating' }));

    const fileValidation = validateFile(file);
    const documentTypeValidation = validateDocumentType(state.documentType);

    const errors = [...fileValidation.errors, ...documentTypeValidation.errors];
    const warnings = [...fileValidation.warnings, ...documentTypeValidation.warnings];

    setState(prev => ({
      ...prev,
      selectedFile: file,
      validationErrors: errors,
      validationWarnings: warnings,
      uploadStatus: errors.length === 0 ? 'idle' : 'error'
    }));
  }, [state.documentType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
   onDrop: (acceptedFiles: File[]) => {
     if (acceptedFiles.length > 0 && acceptedFiles[0]) {
       validateAndSetFile(acceptedFiles[0]);
     }
   },
   disabled: Boolean(state.isUploading || props.disabled),
   noClick: true
 });

  const handleFileSelect = React.useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files && files.length > 0 && files[0]) {
      validateAndSetFile(files[0]);
    }
  }, [validateAndSetFile]);

  const handleDocumentTypeChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
    const documentType = event.target.value as DocumentType;
    const validation = validateDocumentType(documentType);
    
    setState(prev => ({
      ...prev,
      documentType,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings
    }));
  }, []);

  const handleDescriptionChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setState(prev => ({ ...prev, description: event.target.value }));
  }, []);

  const handleConfidentialChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setState(prev => ({ ...prev, confidential: event.target.checked }));
  }, []);

  const handleRetentionPeriodChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setState(prev => ({ ...prev, retentionPeriod: parseInt(event.target.value, 10) }));
  }, []);

  const handleUpload = React.useCallback(async (): Promise<void> => {
    const { selectedFile, documentType, description, confidential, retentionPeriod } = state;
    const { caseId, onUploadComplete, onUploadError } = props;

    if (!selectedFile) {
      setState(prev => ({ ...prev, validationErrors: ['Please select a file to upload'] }));
      return;
    }

    // Get current user info from context
    const currentUser: User = {
      id: props.context.pageContext.user.loginName,
      displayName: props.context.pageContext.user.displayName,
      email: props.context.pageContext.user.email,
      jobTitle: '',
      department: '',
      roles: [],
      isActive: true
    };

    try {
      setState(prev => ({ 
        ...prev,
        isUploading: true, 
        uploadStatus: 'uploading',
        uploadProgress: 0 
      }));

      // Simulate progress (actual progress would come from SharePoint API events)
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      // Upload the document
      const uploadedDocument = await documentService.uploadDocument(
        selectedFile,
        caseId,
        documentType,
        currentUser,
        {
          description,
          confidential,
          retentionPeriod
        }
      );

      clearInterval(progressInterval);
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
        uploadStatus: 'success',
        uploadedDocument,
        selectedFile: null,
        description: '',
        validationErrors: [],
        validationWarnings: []
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete(uploadedDocument);
      }

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadStatus: 'error',
        validationErrors: [error.message || 'Failed to upload document']
      }));

      if (onUploadError) {
        onUploadError(error.message || 'Failed to upload document');
      }
    }
  }, [state, props, documentService]);

  const handleReset = React.useCallback((): void => {
    setState({
      selectedFile: null,
      documentType: DocumentType.OTHER,
      description: '',
      confidential: false,
      retentionPeriod: 365,
      validationErrors: [],
      validationWarnings: [],
      uploadStatus: 'idle',
      uploadedDocument: null,
      isUploading: false,
      uploadProgress: 0
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const {
    selectedFile, 
    documentType, 
    description, 
    confidential, 
    retentionPeriod,
    isUploading, 
    uploadProgress, 
    validationErrors, 
    validationWarnings,
    uploadStatus,
    uploadedDocument 
  } = state;

  const canUpload = selectedFile && validationErrors.length === 0 && !isUploading && !props.disabled;
  const isError = validationErrors.length > 0;

  const dropZoneClass = `${styles.dropZone} ${
    isError ? styles.dropZoneError : ''
  } ${
    uploadStatus === 'success' ? styles.dropZoneSuccess : ''
  } ${
    isDragActive ? styles.dropZoneHover : ''
  }`;

  return (
    <div className={styles.documentUpload}>
      <div className={styles.uploadSection}>
        <Text size={500} weight="semibold">Upload Document</Text>
        
        {/* File Drop Zone */}
        <div 
          {...getRootProps()}
          className={dropZoneClass}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            disabled={isUploading || props.disabled}
            aria-label="Select file to upload"
            {...getInputProps()}
          />
          
          {selectedFile ? (
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{selectedFile.name}</div>
              <div className={styles.fileSize}>{formatFileSize(selectedFile.size)}</div>
              <div className={styles.fileType}>{selectedFile.type}</div>
            </div>
          ) : (
            <div className={styles.dropMessage}>
              <span className={styles.dropIcon}>📁</span>
              <Text>Click to select a file or drag and drop here</Text>
              <Text size={200} color="neutral">
                Max file size: 50MB • Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT
              </Text>
            </div>
          )}
        </div>

        {/* Document Type Selection */}
        <div className={styles.formGroup}>
          <Label htmlFor="documentType" required>Document Type</Label>
          <select
            id="documentType"
            value={documentType}
            onChange={handleDocumentTypeChange}
            disabled={isUploading || props.disabled}
          >
            <option value={DocumentType.APPLICATION_FORM}>Application Form</option>
            <option value={DocumentType.ID_DOCUMENT}>ID Document</option>
            <option value={DocumentType.FINANCIAL_STATEMENT}>Financial Statement</option>
            <option value={DocumentType.PROOF_OF_ADDRESS}>Proof of Address</option>
            <option value={DocumentType.BUSINESS_REGISTRATION}>Business Registration</option>
            <option value={DocumentType.COMPLIANCE_CERTIFICATE}>Compliance Certificate</option>
            <option value={DocumentType.OTHER}>Other</option>
          </select>
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Enter a description for this document..."
            rows={3}
            disabled={isUploading || props.disabled}
          />
        </div>

        {/* Metadata Options */}
        <div className={styles.metadataOptions}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="confidential"
              checked={confidential}
              onChange={handleConfidentialChange}
              disabled={isUploading || props.disabled}
            />
            <Label htmlFor="confidential">Mark as confidential</Label>
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
            <input
              type="number"
              id="retentionPeriod"
              value={retentionPeriod}
              onChange={handleRetentionPeriodChange}
              min="1"
              max="3650"
              disabled={isUploading || props.disabled}
            />
          </div>
        </div>

        {/* Validation Messages */}
        {(validationErrors.length > 0 || validationWarnings.length > 0) && (
          <div className={styles.validationMessages}>
            {validationErrors.map((error, index) => (
              <div key={index} className={styles.validationError}>
                ⚠️ {error}
              </div>
            ))}
            {validationWarnings.map((warning, index) => (
              <div key={index} className={styles.validationWarning}>
                ℹ️ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className={styles.uploadProgress}>
            <ProgressBar
              value={uploadProgress}
              max={100}
              thickness="large"
              style={{ marginBottom: tokens.spacingVerticalXS }}
            />
            <Text size={300} color="neutral" align="center">
              Uploading... {uploadProgress}%
            </Text>
          </div>
        )}

        {/* Success Message */}
        {uploadStatus === 'success' && uploadedDocument && (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✅</div>
            <div>
              <Text weight="semibold">Document uploaded successfully!</Text>
              <Text size={300}>File: {uploadedDocument.fileName}</Text>
              <Text size={300}>Type: {uploadedDocument.documentType}</Text>
            </div>
          </div>
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
    </div>
  );
};
