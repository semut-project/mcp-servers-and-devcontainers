import * as React from 'react';
import { DocumentUpload } from './DocumentUpload';
import { WebPartContext } from '@microsoft/sp-webpart-base';

/**
 * Example usage of DocumentUpload component
 * This demonstrates how to integrate the DocumentUpload component in your web part
 */
export const DocumentUploadExample: React.FC<{ context: WebPartContext }> = ({ context }) => {
  const handleUploadComplete = (document: any) => {
    console.log('Document uploaded successfully:', document);
    // You can update your state or show a success message here
  };

  const handleUploadError = (error: string) => {
    console.error('Document upload failed:', error);
    // You can show an error message to the user here
  };

  return (
    <div>
      <h2>KYC Document Upload</h2>
      <p>Use this form to upload documents for case review and approval.</p>
      
      <DocumentUpload
        context={context}
        caseId="CASE-12345" // This would typically come from your application state
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        disabled={false}
      />
    </div>
  );
};

// Usage in your web part:
/*
import { DocumentUploadExample } from './DocumentUpload.example';

// In your web part's render method:
public render(): void {
  // ...
  return (
    <DocumentUploadExample context={this.context} />
  );
}
*/
