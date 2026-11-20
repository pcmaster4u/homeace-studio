import type { Catalog } from "./catalog";

/** English texts. Placeholders like `{path}` are filled from `data.params`. */
export const CATALOG_EN: Catalog = {
  OK: "Done.",
  CREATED: "Created.",
  VALIDATION_FAILED: "The input is not valid.",
  NOT_FOUND: "Not found.",
  CONFLICT: "This conflicts with the current state.",
  REQUEST_FAILED: "The request could not be processed.",
  INTERNAL_ERROR: "An unexpected error occurred.",

  INVALID_VALUE: "Invalid value.",
  IS_NOT_EMPTY: "Must not be empty.",
  IS_STRING: "Must be text.",
  MIN_LENGTH: "Text is too short.",
  MAX_LENGTH: "Text is too long.",
  IS_IN: "This value is not allowed.",
  IS_OBJECT: "Invalid structure.",
  IS_BOOLEAN: "Must be yes or no.",
  IS_ARRAY: "Must be a list.",
  MATCHES: "Does not have the expected format.",

  ENTRY_NOT_FOUND: "Home Assistant has no entry {entityId}.",
  ENTRY_NOT_IN_REGISTRY:
    "{entityId} comes from YAML without a unique_id and cannot be put into a category.",
  ENTRY_MOVED: "Moved.",
  ENTRY_UPDATED: "Saved.",
  ENTRY_ACTION_DONE: "Done.",
  ENTRY_ACTION_UNSUPPORTED: '"{action}" does not work for {entityId}.',
  ENTRY_EXTRAS_SAVED: "Saved.",

  CATEGORY_PATH_INVALID: '"{path}" is not a valid category name. No level may be empty.',
  CATEGORY_NAME_TAKEN: 'The category "{path}" already exists.',
  CATEGORY_MOVE_INTO_ITSELF: "A category cannot be moved into itself.",
  CATEGORY_RENAMED: "Renamed.",
  CLEANUP_APPLIED: "Categories converted.",
  CLEANUP_IGNORED: "Will not be suggested again.",
  CLEANUP_RESTORED: "Hidden suggestions are back.",
  CLEANUP_DUPLICATE: '"{path}" is in the list more than once.',

  FOLDER_CREATED: "Folder created.",
  FOLDER_DELETED: "Folder removed.",
  FOLDER_EXISTS: 'The folder "{path}" already exists.',
  FOLDER_NOT_FOUND: 'There is no folder "{path}".',
  FOLDER_COLOR_SAVED: "Color saved.",

  HELPER_CREATED: "Helper created.",
  HELPER_SETTINGS_INVALID: 'The setting "{field}" is not valid.',
  HELPER_DELETED: "Helper deleted.",
  FLOW_UNSUPPORTED: "{entityId} has no flow. Only automations and scripts have one.",
  FLOW_SAVED: "Flow saved in Home Assistant.",
  FLOW_NOT_EDITABLE:
    "{entityId} cannot be edited or deleted here. Home Assistant does not keep it in automations.yaml or scripts.yaml (e.g. it comes from a package or a blueprint).",
  FLOW_INVALID: "Home Assistant rejected the flow: {reason}",
  FLOW_CREATED: "Created in Home Assistant.",
  FLOW_DELETED: "Deleted in Home Assistant.",
  HELPER_NOT_DELETABLE:
    "{entityId} cannot be deleted here. Delete template and group helpers in Home Assistant for now.",
};
