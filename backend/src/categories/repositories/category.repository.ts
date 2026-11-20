import type { CategoryScope } from "../categories.constants";
import type { Category } from "../category.model";

export interface CategoryRepository {
  list(scope: CategoryScope): Promise<Category[]>;
  create(scope: CategoryScope, name: string): Promise<Category>;
  rename(scope: CategoryScope, categoryId: string, name: string): Promise<void>;
  delete(scope: CategoryScope, categoryId: string): Promise<void>;
  /** Sets the entity's category in this scope; null removes it. Other scopes stay as they are. */
  assign(entityId: string, scope: CategoryScope, categoryId: string | null): Promise<void>;
  /** How many entities have this category in this scope. */
  countAssigned(scope: CategoryScope, categoryId: string): Promise<number>;
}
