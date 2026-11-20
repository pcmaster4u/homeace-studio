/**
 * All message IDs the API can send in `ApiResponse.message` or in validation `fields`.
 * Every ID needs a text in each catalog (enforced by the `Catalog` type).
 */
export const MESSAGE_ID = {
  // Common IDs (see docs/api.md)
  ok: "OK",
  created: "CREATED",
  validationFailed: "VALIDATION_FAILED",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  requestFailed: "REQUEST_FAILED",
  internalError: "INTERNAL_ERROR",

  // Validation constraints, used in `data.fields[].message`
  invalidValue: "INVALID_VALUE",
  isNotEmpty: "IS_NOT_EMPTY",
  isString: "IS_STRING",
  minLength: "MIN_LENGTH",
  maxLength: "MAX_LENGTH",
  isIn: "IS_IN",
  isObject: "IS_OBJECT",
  isBoolean: "IS_BOOLEAN",
  isArray: "IS_ARRAY",
  matches: "MATCHES",

  // Entries
  entryNotFound: "ENTRY_NOT_FOUND",
  entryNotInRegistry: "ENTRY_NOT_IN_REGISTRY",
  entryMoved: "ENTRY_MOVED",
  entryUpdated: "ENTRY_UPDATED",
  entryActionDone: "ENTRY_ACTION_DONE",
  entryActionUnsupported: "ENTRY_ACTION_UNSUPPORTED",
  entryExtrasSaved: "ENTRY_EXTRAS_SAVED",

  // Categories
  categoryPathInvalid: "CATEGORY_PATH_INVALID",
  categoryNameTaken: "CATEGORY_NAME_TAKEN",
  categoryMoveIntoItself: "CATEGORY_MOVE_INTO_ITSELF",
  categoryRenamed: "CATEGORY_RENAMED",

  // Folders (empty folders of the tree)
  folderCreated: "FOLDER_CREATED",
  folderDeleted: "FOLDER_DELETED",
  folderExists: "FOLDER_EXISTS",
  folderNotFound: "FOLDER_NOT_FOUND",
  folderColorSaved: "FOLDER_COLOR_SAVED",

  // Helpers
  helperCreated: "HELPER_CREATED",
  helperSettingsInvalid: "HELPER_SETTINGS_INVALID",
  helperDeleted: "HELPER_DELETED",
  helperNotDeletable: "HELPER_NOT_DELETABLE",

  // Editor
  flowUnsupported: "FLOW_UNSUPPORTED",
  flowSaved: "FLOW_SAVED",
  flowNotEditable: "FLOW_NOT_EDITABLE",
  flowInvalid: "FLOW_INVALID",
  flowCreated: "FLOW_CREATED",
  flowDeleted: "FLOW_DELETED",
} as const;

export type MessageId = (typeof MESSAGE_ID)[keyof typeof MESSAGE_ID];
