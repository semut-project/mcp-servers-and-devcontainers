import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Document } from '../../../types';

export interface IDocumentUploadProps {
  context: WebPartContext;
  caseId: string;
  onUploadComplete?: (document: Document) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}
