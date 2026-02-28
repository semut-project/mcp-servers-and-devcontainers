// Mock the PnP JS dependencies
jest.mock('@pnp/sp', () => {
  const mockSpfi = jest.fn().mockReturnValue({
    using: jest.fn().mockReturnThis()
  });
  
  return {
    spfi: mockSpfi,
    SPFx: jest.fn().mockReturnValue({}),
    sp: {
      web: {
        lists: {
          getByTitle: jest.fn().mockReturnValue({
            items: {
              add: jest.fn(),
              get: jest.fn(),
              getById: jest.fn(),
              filter: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            rootFolder: {
              files: {
                add: jest.fn()
              }
            }
          }),
        },
      },
    },
  };
});

jest.mock('@pnp/graph', () => {
  const mockGraphfi = jest.fn().mockReturnValue({
    using: jest.fn().mockReturnThis()
  });
  
  return {
    graphfi: mockGraphfi,
    SPFx: jest.fn().mockReturnValue({}),
  };
});

import { DocumentService } from '../DocumentService';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { DocumentType } from '../../types';

// Mock the WebPartContext
const mockContext: Partial<WebPartContext> = {
  pageContext: {
    web: {
      absoluteUrl: 'https://test.sharepoint.com'
    }
  } as any
};

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = new DocumentService(mockContext as WebPartContext);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(documentService).toBeDefined();
  });

  describe('getDocumentsByCaseId', () => {
    it('should return documents for a case', async () => {
      // Mock the PnP JS response
      const mockItems = [{ Id: 1, CaseId: 'CASE-001', Title: 'test.pdf' }];
      const mockGetItemsWithQuery = jest.fn().mockResolvedValue(mockItems);
      
      // Mock the protected method by accessing it through the instance
      documentService['getItemsWithQuery'] = mockGetItemsWithQuery;

      const result = await documentService.getDocumentsByCaseId('CASE-001');
      
      expect(result).toEqual(mockItems);
      expect(mockGetItemsWithQuery).toHaveBeenCalledWith("CaseId eq 'CASE-001'", 'Created desc');
    });

    it('should handle errors gracefully', async () => {
      const mockGetItemsWithQuery = jest.fn().mockRejectedValue(new Error('Network error'));
      documentService['getItemsWithQuery'] = mockGetItemsWithQuery;

      await expect(documentService.getDocumentsByCaseId('CASE-001')).rejects.toThrow('Network error');
    });
  });

  describe('getDocumentById', () => {
    it('should return null when document not found', async () => {
      const mockGetItemById = jest.fn().mockResolvedValue(null);
      documentService['getItemById'] = mockGetItemById;

      const result = await documentService.getDocumentById('999');
      
      expect(result).toBeNull();
      expect(mockGetItemById).toHaveBeenCalledWith(999);
    });

    it('should handle invalid document ID', async () => {
      await expect(documentService.getDocumentById('invalid')).rejects.toThrow('Invalid document ID: invalid');
    });
  });

  describe('documentExists', () => {
    it('should return false when no documents exist for case and type', async () => {
      const mockGetItemCount = jest.fn().mockResolvedValue(0);
      documentService['getItemCount'] = mockGetItemCount;

      const result = await documentService.documentExists('CASE-001', DocumentType.ID_DOCUMENT);
      
      expect(result).toBe(false);
      expect(mockGetItemCount).toHaveBeenCalledWith("CaseId eq 'CASE-001' and DocumentType eq 'ID Document'");
    });

    it('should return true when documents exist for case and type', async () => {
      const mockGetItemCount = jest.fn().mockResolvedValue(2);
      documentService['getItemCount'] = mockGetItemCount;

      const result = await documentService.documentExists('CASE-001', DocumentType.ID_DOCUMENT);
      
      expect(result).toBe(true);
    });
  });
});
