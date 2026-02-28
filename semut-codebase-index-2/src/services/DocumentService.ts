import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseRepository } from './BaseRepository';
import { Document, DocumentType, User } from '../types';
import { validateFile, validateDocumentType } from '../utils/validation';
import "@pnp/sp/files";
import "@pnp/sp/folders";

/**
 * Document Service for handling SharePoint document operations
 * Extends BaseRepository to provide document-specific functionality
 */
export class DocumentService extends BaseRepository<Document> {
  protected listName = 'KYC Documents';
  protected siteUrl?: string;

  constructor(context: WebPartContext) {
    super(context);
  }

  /**
   * Upload a document to SharePoint
   */
  async uploadDocument(
    file: File,
    caseId: string,
    documentType: DocumentType,
    uploadedBy: User,
    metadata?: Record<string, any>
  ): Promise<Document> {
    try {
      // Validate the file before upload
      const fileValidation = validateFile(file);
      const documentTypeValidation = validateDocumentType(documentType);
      
      if (!fileValidation.isValid || !documentTypeValidation.isValid) {
        const errors = [
          ...fileValidation.errors,
          ...documentTypeValidation.errors
        ];
        throw new Error(`Document validation failed: ${errors.join(', ')}`);
      }

      // Create document metadata
      const documentMetadata = {
        CaseId: caseId,
        DocumentType: documentType,
        UploadedBy: uploadedBy.id,
        Version: 1,
        Confidential: metadata?.confidential || false,
        RetentionPeriod: metadata?.retentionPeriod,
        Description: metadata?.description
      };

      // Upload file to SharePoint document library using PnPjs v4 syntax
      const result = await this.sp.web
        .getFolderByServerRelativePath(`/sites/${this.context.pageContext.web.serverRelativeUrl}/${this.listName}`)
        .files
        .addUsingPath(file.name, file, { Overwrite: true });

      // Add metadata to the uploaded file - need to get the list item separately
      const fileItem = await this.sp.web
        .getFileByServerRelativePath(`/sites/${this.context.pageContext.web.serverRelativeUrl}/${this.listName}/${file.name}`)
        .listItemAllFields();
      
      await fileItem.update(documentMetadata);

      // Get the complete document item with metadata
      const documentItem = await fileItem();

      return this.mapSharePointItemToEntity(documentItem);
    } catch (error: any) {
      this.handleError('uploadDocument', error, `Failed to upload document: ${file.name}`);
    }
  }

  /**
   * Get all documents for a specific case
   */
  async getDocumentsByCaseId(caseId: string): Promise<Document[]> {
    try {
      this.validateRequiredParams({ caseId }, 'getDocumentsByCaseId');
      
      const filter = `CaseId eq '${caseId}'`;
      return await this.getItemsWithQuery(filter, 'Created desc');
    } catch (error: any) {
      this.handleError('getDocumentsByCaseId', error, `Failed to get documents for case: ${caseId}`);
    }
  }

  /**
   * Get documents by type for a specific case
   */
  async getDocumentsByType(caseId: string, documentType: DocumentType): Promise<Document[]> {
    try {
      this.validateRequiredParams({ caseId, documentType }, 'getDocumentsByType');
      
      const filter = `CaseId eq '${caseId}' and DocumentType eq '${documentType}'`;
      return await this.getItemsWithQuery(filter, 'Created desc');
    } catch (error: any) {
      this.handleError('getDocumentsByType', error, `Failed to get ${documentType} documents for case: ${caseId}`);
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    try {
      this.validateRequiredParams({ id }, 'getDocumentById');
      
      // Convert string ID to number for SharePoint lookup
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid document ID: ${id}`);
      }

      return await this.getItemById(numericId);
    } catch (error: any) {
      this.handleError('getDocumentById', error, `Failed to get document: ${id}`);
    }
  }

  /**
   * Download a document from SharePoint
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      this.validateRequiredParams({ documentId }, 'downloadDocument');
      
      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Get the file content using PnPjs v4 syntax
      const file = await this.sp.web
        .getFileByServerRelativePath(`/sites/${this.context.pageContext.web.serverRelativeUrl}/${this.listName}/${documentId}`)
        .getBlob();

      return file;
    } catch (error: any) {
      this.handleError('downloadDocument', error, `Failed to download document: ${documentId}`);
    }
  }

  /**
   * Update document metadata
   */
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
    try {
      this.validateRequiredParams({ documentId }, 'updateDocumentMetadata');

      const numericId = parseInt(documentId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid document ID: ${documentId}`);
      }

      const updateData: any = {};
      
      if (updates.documentType) updateData.DocumentType = updates.documentType;
      if (updates.description) updateData.Description = updates.description;
      if (updates.confidential !== undefined) updateData.Confidential = updates.confidential;
      if (updates.retentionPeriod !== undefined) updateData.RetentionPeriod = updates.retentionPeriod;
      if (updates.tags) updateData.Tags = updates.tags.join(';');

      return await this.updateItem(numericId, updateData);
    } catch (error: any) {
      this.handleError('updateDocumentMetadata', error, `Failed to update document metadata: ${documentId}`);
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      this.validateRequiredParams({ documentId }, 'deleteDocument');

      const numericId = parseInt(documentId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid document ID: ${documentId}`);
      }

      await this.deleteItem(numericId);
    } catch (error: any) {
      this.handleError('deleteDocument', error, `Failed to delete document: ${documentId}`);
    }
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string): Promise<any[]> {
    try {
      this.validateRequiredParams({ documentId }, 'getDocumentVersions');

      const numericId = parseInt(documentId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid document ID: ${documentId}`);
      }

      const versions = await this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .getById(numericId)
        .versions();

      return versions;
    } catch (error: any) {
      this.handleError('getDocumentVersions', error, `Failed to get document versions: ${documentId}`);
    }
  }

  /**
   * Check if a document exists for a case with specific criteria
   */
  async documentExists(caseId: string, documentType: DocumentType): Promise<boolean> {
    try {
      this.validateRequiredParams({ caseId, documentType }, 'documentExists');
      
      const filter = `CaseId eq '${caseId}' and DocumentType eq '${documentType}'`;
      const count = await this.getItemCount(filter);
      
      return count > 0;
    } catch (error: any) {
      this.handleError('documentExists', error, `Failed to check document existence for case: ${caseId}, type: ${documentType}`);
    }
  }

  /**
   * Get document statistics for a case
   */
  async getDocumentStats(caseId: string): Promise<{
    total: number;
    byType: Record<DocumentType, number>;
    totalSize: number;
  }> {
    try {
      this.validateRequiredParams({ caseId }, 'getDocumentStats');
      
      const documents = await this.getDocumentsByCaseId(caseId);
      
      const stats = {
        total: documents.length,
        byType: {} as Record<DocumentType, number>,
        totalSize: 0
      };

      documents.forEach(doc => {
        // Count by document type
        stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;
        
        // Sum file sizes
        stats.totalSize += doc.fileSize || 0;
      });

      return stats;
    } catch (error: any) {
      this.handleError('getDocumentStats', error, `Failed to get document statistics for case: ${caseId}`);
    }
  }

  /**
   * Map SharePoint item to Document entity
   */
  protected mapSharePointItemToEntity(item: any): Document {
    return {
      id: item.Id.toString(),
      caseId: item.CaseId?.toString() || '',
      fileName: item.FileLeafRef || item.Title || '',
      fileType: item.File_x0020_Type || '',
      fileSize: item.FileSize || 0,
      uploadDate: new Date(item.Created),
      uploadedBy: {
        id: item.UploadedBy?.toString() || '',
        displayName: item.UploadedBy?.Name || '',
        email: item.UploadedBy?.Email || '',
        jobTitle: '',
        department: '',
        roles: [],
        isActive: true
      },
      version: item.Version || 1,
      documentType: item.DocumentType as DocumentType,
      metadata: {
        description: item.Description,
        confidential: item.Confidential || false,
        retentionPeriod: item.RetentionPeriod,
        tags: item.Tags ? item.Tags.split(';') : []
      }
    };
  }

  /**
   * Map Document entity to SharePoint item
   */
  protected mapEntityToSharePointItem(entity: Partial<Document>): any {
    const result: any = {};

    if (entity.fileName !== undefined) result.Title = entity.fileName;
    if (entity.caseId !== undefined) result.CaseId = entity.caseId;
    if (entity.documentType !== undefined) result.DocumentType = entity.documentType;
    if (entity.uploadedBy !== undefined) result.UploadedBy = entity.uploadedBy.id;
    if (entity.version !== undefined) result.Version = entity.version;

    // Handle metadata fields
    if (entity.metadata) {
      if (entity.metadata.description !== undefined) result.Description = entity.metadata.description;
      if (entity.metadata.confidential !== undefined) result.Confidential = entity.metadata.confidential;
      if (entity.metadata.retentionPeriod !== undefined) result.RetentionPeriod = entity.metadata.retentionPeriod;
      if (entity.metadata.tags !== undefined) result.Tags = entity.metadata.tags.join(';');
    }

    return result;
  }

}
