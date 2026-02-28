import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseService } from './BaseService';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";

/**
 * Abstract base repository class for SharePoint data operations
 * Extends BaseService to provide common CRUD operations
 */
export abstract class BaseRepository<T> extends BaseService {
  protected abstract listName: string;
  protected abstract siteUrl?: string;

  constructor(context: WebPartContext) {
    super(context);
  }

  /**
   * Get all items from the SharePoint list
   */
  protected async getAllItems(): Promise<T[]> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .select('*')();

      return items.map((item: unknown) => this.mapSharePointItemToEntity(item));
    } catch (error: unknown) {
      this.handleError('getAllItems', error, `Failed to retrieve items from ${this.listName}`);
    }
  }

  /**
   * Get item by ID from the SharePoint list
   */
  protected async getItemById(id: number): Promise<T | null> {
    try {
      this.validateRequiredParams({ id }, 'getItemById');

      const item = await this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .getById(id)
        .select('*')();

      return this.mapSharePointItemToEntity(item);
    } catch (error: unknown) {
      const errorObj = error as { status?: number };
      if (errorObj.status === 404) {
        return null;
      }
      this.handleError('getItemById', error, `Failed to retrieve item ${id} from ${this.listName}`);
    }
  }

  /**
   * Create a new item in the SharePoint list
   */
  protected async createItem(entity: Partial<T>): Promise<T> {
    try {
      this.validateRequiredParams({ entity }, 'createItem');

      const sharePointData = this.mapEntityToSharePointItem(entity);
      
      const result = await this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .add(sharePointData);

      return this.mapSharePointItemToEntity(result.data);
    } catch (error: unknown) {
      this.handleError('createItem', error, `Failed to create item in ${this.listName}`);
    }
  }

  /**
   * Update an existing item in the SharePoint list
   */
  protected async updateItem(id: number, entity: Partial<T>): Promise<T> {
    try {
      this.validateRequiredParams({ id, entity }, 'updateItem');

      const sharePointData = this.mapEntityToSharePointItem(entity);
      
      const result = await this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .getById(id)
        .update(sharePointData);

      return this.mapSharePointItemToEntity(result.data);
    } catch (error: unknown) {
      this.handleError('updateItem', error, `Failed to update item ${id} in ${this.listName}`);
    }
  }

  /**
   * Delete an item from the SharePoint list
   */
  protected async deleteItem(id: number): Promise<void> {
    try {
      this.validateRequiredParams({ id }, 'deleteItem');

      await this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .getById(id)
        .delete();
    } catch (error: unknown) {
      this.handleError('deleteItem', error, `Failed to delete item ${id} from ${this.listName}`);
    }
  }

  /**
   * Get items with optional filtering and sorting
   */
  protected async getItemsWithQuery(
    filter?: string,
    orderBy?: string,
    top?: number
  ): Promise<T[]> {
    try {
      let query = this.sp.web.lists
        .getByTitle(this.listName)
        .items
        .select('*');

      if (filter) {
        query = query.filter(filter);
      }

      if (orderBy) {
        query = query.orderBy(orderBy);
      }

      if (top) {
        query = query.top(top);
      }

      const items = await query();
      return items.map((item: unknown) => this.mapSharePointItemToEntity(item));
    } catch (error: unknown) {
      this.handleError('getItemsWithQuery', error, `Failed to query items from ${this.listName}`);
    }
  }

  /**
   * Get items by a specific field value
   */
  protected async getItemsByField(fieldName: string, fieldValue: unknown): Promise<T[]> {
    try {
      this.validateRequiredParams({ fieldName, fieldValue }, 'getItemsByField');

      const filter = `${fieldName} eq '${fieldValue}'`;
      return await this.getItemsWithQuery(filter);
    } catch (error: unknown) {
      this.handleError('getItemsByField', error, `Failed to get items by ${fieldName} from ${this.listName}`);
    }
  }

  /**
   * Check if an item exists with specific criteria
   */
  protected async itemExists(criteria: Partial<T>): Promise<boolean> {
    try {
      const filter = this.buildFilterFromCriteria(criteria);
      const items = await this.getItemsWithQuery(filter, undefined, 1);
      return items.length > 0;
    } catch (error: unknown) {
      this.handleError('itemExists', error, `Failed to check item existence in ${this.listName}`);
    }
  }

  /**
   * Get item count with optional filter
   */
  protected async getItemCount(filter?: string): Promise<number> {
    try {
      let query = this.sp.web.lists
        .getByTitle(this.listName)
        .items;

      if (filter) {
        query = query.filter(filter);
      }

      const result = await query();
      return result.length;
    } catch (error: unknown) {
      this.handleError('getItemCount', error, `Failed to get item count from ${this.listName}`);
    }
  }

  /**
   * Abstract method to map SharePoint item to entity
   * Must be implemented by concrete repositories
   */
  protected abstract mapSharePointItemToEntity(item: any): T;

  /**
   * Abstract method to map entity to SharePoint item
   * Must be implemented by concrete repositories
   */
  protected abstract mapEntityToSharePointItem(entity: Partial<T>): any;

  /**
   * Build OData filter from criteria object
   */
  private buildFilterFromCriteria(criteria: Partial<T>): string {
    const filters: string[] = [];

    for (const key in criteria) {
      if (Object.prototype.hasOwnProperty.call(criteria, key)) {
        const value = (criteria as Record<string, unknown>)[key];
        if (value !== undefined && value !== null) {
          if (typeof value === 'string') {
            filters.push(`${key} eq '${value.replace(/'/g, "''")}'`);
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            filters.push(`${key} eq ${value}`);
          } else if (value instanceof Date) {
            filters.push(`${key} eq datetime'${value.toISOString()}'`);
          }
        }
      }
    }

    return filters.join(' and ');
  }

  /**
   * Batch operations for better performance
   */
  protected async batchCreateItems(entities: Partial<T>[]): Promise<T[]> {
    try {
      this.validateRequiredParams({ entities }, 'batchCreateItems');

      const results: T[] = [];

      // Create items sequentially since batch operations have compatibility issues
      for (const entity of entities) {
        try {
          const result = await this.createItem(entity);
          results.push(result);
        } catch (error: unknown) {
          console.error('Batch create failed for item:', error);
          results.push(null as unknown as T);
        }
      }

      return results.filter(item => item !== null);
    } catch (error: unknown) {
      this.handleError('batchCreateItems', error, `Failed to batch create items in ${this.listName}`);
    }
  }

  /**
   * Ensure list exists (for development/testing)
   */
  protected async ensureListExists(): Promise<void> {
    try {
      await this.sp.web.lists.getByTitle(this.listName)();
    } catch (error: unknown) {
      const errorObj = error as { status?: number };
      if (errorObj.status === 404) {
        console.warn(`List '${this.listName}' does not exist. Please create it in SharePoint.`);
      } else {
        console.error(`Error checking list existence:`, error);
      }
    }
  }
}
