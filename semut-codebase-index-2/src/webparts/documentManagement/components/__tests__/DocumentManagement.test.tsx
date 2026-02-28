// Mock the PnP JS and service dependencies
jest.mock('@pnp/sp', () => ({
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
          }
        }),
      },
    },
  },
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentManagement from '../DocumentManagement';
import { IDocumentManagementProps } from '../IDocumentManagementProps';
import { FluentThemeProvider } from '../FluentThemeProvider';

// Use manual mocks for services
jest.mock('../../../../services/DocumentService');
jest.mock('../../../../services/WorkflowService');

// Import service modules for mocking
import { DocumentService } from '../../../../services/DocumentService';
import { WorkflowService } from '../../../../services/WorkflowService';

describe('DocumentManagement', () => {
  const mockProps: IDocumentManagementProps = {
    context: {
      pageContext: {
        web: {
          absoluteUrl: 'https://test.sharepoint.com'
        },
        user: {
          loginName: 'user1@company.com',
          displayName: 'Test User',
          email: 'user1@company.com'
        }
      }
    } as any,
    description: 'Test Description',
    isDarkTheme: false,
    environmentMessage: 'Test Environment',
    hasTeamsContext: false,
    userDisplayName: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with all tabs', () => {
    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );
    
    expect(screen.getByText('KYC Document Management System')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    
    // Check that all tabs are rendered
    expect(screen.getByText('📁 Upload Documents')).toBeInTheDocument();
    expect(screen.getByText('📋 View Documents')).toBeInTheDocument();
    expect(screen.getByText('✅ Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('🔍 Search')).toBeInTheDocument();
  });

  it('should switch between tabs correctly', () => {
    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );
    
    // Initially on upload tab
    expect(screen.getByText('Upload KYC Documents')).toBeInTheDocument();
    
    // Click on documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));
    expect(screen.getByText('Case Documents: CASE-2024-001')).toBeInTheDocument();
    
    // Click on approvals tab
    fireEvent.click(screen.getByText('✅ Approval Queue'));
    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    
    // Click on search tab
    fireEvent.click(screen.getByText('🔍 Search'));
    expect(screen.getByText('Document Search')).toBeInTheDocument();
  });

  it('should show loading state when switching to documents tab', async () => {
    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );
    
    // Switch to documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));
    
    // Should show loading state initially
    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('should show empty state for documents when none are available', async () => {
    // Mock the DocumentService to return empty array
    const mockGetDocuments = jest.fn().mockResolvedValue([]);
    DocumentService.prototype.getDocumentsByCaseId = mockGetDocuments;

    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );

    // Switch to documents tab
    fireEvent.click(screen.getByText('📋 View Documents'));

    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText('No documents found for this case.')).toBeInTheDocument();
    });
  });

  it('should handle search input and button click', async () => {
    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );
    
    // Switch to search tab
    fireEvent.click(screen.getByText('🔍 Search'));
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search by file name, document type, description, or tags...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Verify search input value
    expect(searchInput).toHaveValue('test');
    
    // Click search button - use getAllByText and select the second one (search button, not tab)
    const searchButtons = screen.getAllByText('🔍 Search');
    if (searchButtons && searchButtons[1]) {
      fireEvent.click(searchButtons[1]); // The search button, not the tab
    }
    
    // Should show search in progress
    expect(screen.getByText('Searching documents...')).toBeInTheDocument();
  });

  it('should show empty search state initially', async () => {
    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );
    
    // Switch to search tab
    fireEvent.click(screen.getByText('🔍 Search'));
    
    // Should show empty search state
    await waitFor(() => {
      expect(screen.getByText('Enter search terms above to find documents')).toBeInTheDocument();
    });
  });

  it('should show loading state for approvals', async () => {
    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );
    
    // Switch to approvals tab
    fireEvent.click(screen.getByText('✅ Approval Queue'));
    
    // Should show loading state initially
    expect(screen.getByText('Loading pending approvals...')).toBeInTheDocument();
  });

  it('should show empty state for approvals when none are pending', async () => {
    // Mock the WorkflowService to return empty array for pending approvals
    const mockGetPendingApprovals = jest.fn().mockResolvedValue([]);
    WorkflowService.prototype.getPendingApprovals = mockGetPendingApprovals;

    render(
      <FluentThemeProvider initialTheme={false}>
        <DocumentManagement {...mockProps} />
      </FluentThemeProvider>
    );

    // Switch to approvals tab
    fireEvent.click(screen.getByText('✅ Approval Queue'));

    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText('No pending approvals at this time.')).toBeInTheDocument();
    });
  });
});
