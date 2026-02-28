import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Document, DocumentType, User } from '../../types';

// Mock implementation of DocumentService that provides a proper constructor
export class DocumentService {
  private context: WebPartContext;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  async uploadDocument(
    file: File,
    caseId: string,
    documentType: DocumentType,
    uploadedBy: User,
    metadata?: Record<string, any>
  ): Promise<Document> {
    return Promise.resolve({
      id: '1',
      caseId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadDate: new Date(),
      uploadedBy,
      version: 1,
      documentType,
      metadata: metadata || {
        description: 'Mock document',
        confidential: false,
        retentionPeriod: 365,
        tags: ['mock']
      }
    });
  }

  async getDocumentsByCaseId(caseId: string): Promise<Document[]> {
    return Promise.resolve([
      {
        id: '1',
        caseId,
        fileName: 'passport.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadDate: new Date('2024-01-15'),
        uploadedBy: {
          id: 'user1@company.com',
          displayName: 'Test User',
          email: 'user1@company.com',
          jobTitle: '',
          department: '',
          roles: [],
          isActive: true
        },
        version: 1,
        documentType: DocumentType.ID_DOCUMENT,
        metadata: {
          description: 'Passport copy',
          confidential: false,
          retentionPeriod: 365,
          tags: ['id', 'passport']
        }
      },
      {
        id: '2',
        caseId,
        fileName: 'bank_statement.pdf',
        fileType: 'application/pdf',
        fileSize: 2048,
        uploadDate: new Date('2024-01-16'),
        uploadedBy: {
          id: 'user1@company.com',
          displayName: 'Test User',
          email: 'user1@company.com',
          jobTitle: '',
          department: '',
          roles: [],
          isActive: true
        },
        version: 1,
        documentType: DocumentType.FINANCIAL_STATEMENT,
        metadata: {
          description: 'Bank statement for verification',
          confidential: true,
          retentionPeriod: 365,
          tags: ['financial', 'statement']
        }
      }
    ]);
  }

  async getDocumentsByType(caseId: string, documentType: DocumentType): Promise<Document[]> {
    const documents = await this.getDocumentsByCaseId(caseId);
    return documents.filter(doc => doc.documentType === documentType);
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const documents = await this.getDocumentsByCaseId('CASE-2024-001');
    return documents.find(doc => doc.id === id) || null;
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    return Promise.resolve(new Blob(['Mock document content'], { type: 'application/pdf' }));
  }

  async updateDocumentMetadata(
    documentId: string,
    updates: {
      documentType?: DocumentType;
      description?: string;
      confidential?: boolean;
      retentionPeriod?: number;
      tags?: string[];
    }
  ): Promise<Document> {
    const document = await this.getDocumentById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    return {
      ...document,
      documentType: updates.documentType || document.documentType,
      metadata: {
        ...document.metadata,
        description: updates.description ?? document.metadata?.description,
        confidential: updates.confidential ?? document.metadata?.confidential,
        retentionPeriod: updates.retentionPeriod ?? document.metadata?.retentionPeriod,
        tags: updates.tags ?? document.metadata?.tags
      }
    };
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Mock implementation - no actual deletion
    return Promise.resolve();
  }

  async getDocumentVersions(documentId: string): Promise<any[]> {
    return Promise.resolve([
      {
        version: 1,
        modifiedDate: new Date('2024-01-15'),
        modifiedBy: 'user1@company.com'
      }
    ]);
  }

  async documentExists(caseId: string, documentType: DocumentType): Promise<boolean> {
    const documents = await this.getDocumentsByCaseId(caseId);
    return documents.some(doc => doc.documentType === documentType);
  }

  async getDocumentStats(caseId: string): Promise<{
    total: number;
    byType: Record<DocumentType, number>;
    totalSize: number;
  }> {
    const documents = await this.getDocumentsByCaseId(caseId);
    
    const stats = {
      total: documents.length,
      byType: {} as Record<DocumentType, number>,
      totalSize: 0
    };

    documents.forEach(doc => {
      stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;
      stats.totalSize += doc.fileSize || 0;
    });

    return stats;
  }
}

// Export as default for Jest auto-mocking
export default DocumentService;
