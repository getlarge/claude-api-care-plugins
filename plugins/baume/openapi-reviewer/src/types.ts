/**
 * AIP-based OpenAPI Reviewer - Type Definitions
 * @module types
 */

/** Severity levels for findings */
export type Severity = 'error' | 'warning' | 'suggestion';

/** Categories of AIP rules */
export type RuleCategory =
  | 'naming'
  | 'standard-methods'
  | 'errors'
  | 'pagination'
  | 'filtering'
  | 'lro'
  | 'idempotency'
  | 'versioning'
  | 'security';

// ============================================
// Machine-Readable Fix Types
// ============================================

/** Types of automated fixes that can be applied to an OpenAPI spec */
export type FixType =
  | 'rename-path-segment' // Rename a segment in a path (e.g., /user -> /users)
  | 'rename-parameter' // Rename a path/query/header parameter
  | 'add-parameter' // Add a single query/header/path parameter
  | 'add-parameters' // Add multiple parameters at once
  | 'remove-request-body' // Remove requestBody from an operation
  | 'change-status-code' // Change a response status code
  | 'add-operation' // Add a new HTTP method to a path
  | 'add-schema' // Add a schema to components/schemas
  | 'add-schema-property' // Add a property to an existing schema
  | 'add-response' // Add a response to an operation
  | 'set-schema-constraint'; // Set max/min/pattern constraint on a schema

/** Types of JSON operations for spec changes */
export type SpecChangeOperation =
  | 'rename-key'
  | 'set'
  | 'add'
  | 'remove'
  | 'merge';

/**
 * A single atomic change to the OpenAPI spec.
 * Used by Phase 4 auto-fixer to apply modifications.
 */
export interface SpecChange {
  /** Type of JSON operation to perform */
  operation: SpecChangeOperation;
  /** JSONPath to the location (parent for add, target for set/remove) */
  path: string;
  /** For rename-key: old key name */
  from?: string;
  /** For rename-key/add: new key name or value location */
  to?: string;
  /** Value to set/add/merge */
  value?: unknown;
}

/**
 * Machine-readable fix for automated application.
 * Enables IDE integrations and automated spec modification.
 */
export interface Fix {
  /** Type of fix operation */
  type: FixType;
  /** JSONPath to the element being modified */
  jsonPath: string;
  /** Target-specific data (varies by fix type) */
  target?: Record<string, unknown>;
  /** New value or replacement */
  replacement?: unknown;
  /** Atomic spec changes for Phase 4 auto-fixer */
  specChanges: SpecChange[];
}

/**
 * A single finding from the review process
 */
export interface Finding {
  /** Unique identifier for this finding type */
  ruleId: string;
  /** Severity level */
  severity: Severity;
  /** Category of the rule */
  category: RuleCategory;
  /** Location in the spec (e.g., "GET /users/{id}") */
  path: string;
  /** Human-readable description of the issue */
  message: string;
  /** Reference to relevant AIP (e.g., "AIP-158") */
  aip?: string;
  /** Suggested fix description */
  suggestion?: string;
  /** JSONPath to the problematic location in the spec */
  jsonPath?: string;
  /** Additional context for framework-specific fixers */
  context?: Record<string, unknown>;
  /** Machine-readable fix for automated application */
  fix?: Fix;
}

/**
 * Result of reviewing a spec
 */
export interface ReviewResult {
  /** Path to the reviewed spec */
  specPath: string;
  /** OpenAPI spec title */
  specTitle?: string;
  /** OpenAPI spec version */
  specVersion?: string;
  /** All findings */
  findings: Finding[];
  /** Summary counts */
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
    byCategory: Record<RuleCategory, number>;
  };
  /** Review metadata */
  metadata: {
    reviewedAt: string;
    reviewerVersion: string;
    rulesApplied: string[];
    /** True if review was done in lenient mode (strict OpenAPI validation was skipped) */
    lenientMode?: boolean;
    /** Reason for lenient mode (explicit request or auto-fallback) */
    lenientReason?: string;
  };
}

/**
 * Configuration for the reviewer
 */
export interface ReviewerConfig {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Only run specific rule categories */
  categories?: RuleCategory[];
  /** Skip specific rule IDs */
  skipRules?: string[];
  /** Custom rules to add */
  customRules?: Rule[];
}

/**
 * A single review rule (legacy interface)
 */
export interface Rule {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category */
  category: RuleCategory;
  /** Default severity */
  severity: Severity;
  /** AIP reference */
  aip?: string;
  /** Description of what this rule checks */
  description: string;
  /** The check function */
  check: RuleChecker;
}

// ============================================
// Typed Rule System (Google aip-linter style)
// ============================================

/**
 * Base configuration for all typed rules
 */
export interface BaseRuleConfig {
  /** Unique identifier (e.g., "aip122/plural-resources") */
  id: string;
  /** Human-readable name */
  name: string;
  /** AIP reference (e.g., "AIP-122") */
  aip?: string;
  /** Default severity */
  severity: Severity;
  /** Description of what the rule checks */
  description: string;
}

/**
 * Rule that runs once per spec
 */
export interface SpecRuleChecker {
  (spec: OpenAPISpec, ctx: RuleContext): Finding[];
}

/**
 * Rule that runs for each path
 */
export interface PathRuleChecker {
  (
    path: string,
    pathItem: PathItem,
    spec: OpenAPISpec,
    ctx: RuleContext
  ): Finding[];
}

/**
 * Rule that runs for each operation
 */
export interface OperationRuleChecker {
  (
    method: string,
    operation: Operation,
    path: string,
    spec: OpenAPISpec,
    ctx: RuleContext
  ): Finding[];
}

/**
 * Rule that runs for each schema
 */
export interface SchemaRuleChecker {
  (
    schemaName: string,
    schema: Schema,
    spec: OpenAPISpec,
    ctx: RuleContext
  ): Finding[];
}

/**
 * Rule that runs for each property in a schema
 */
export interface PropertyRuleChecker {
  (
    propertyName: string,
    property: Schema,
    schemaName: string,
    spec: OpenAPISpec,
    ctx: RuleContext
  ): Finding[];
}

/**
 * Rule that runs for each parameter
 */
export interface ParameterRuleChecker {
  (
    param: Parameter,
    method: string,
    path: string,
    spec: OpenAPISpec,
    ctx: RuleContext
  ): Finding[];
}

/**
 * Function signature for rule checkers
 */
export type RuleChecker = (
  spec: OpenAPISpec,
  context: RuleContext
) => Finding[];

/**
 * Context passed to rule checkers
 */
export interface RuleContext {
  /** Full spec for cross-referencing */
  spec: OpenAPISpec;
  /** Helper to create findings */
  createFinding: (
    partial: Partial<Finding> & { path: string; message: string }
  ) => Finding;
}

// ============================================
// OpenAPI Types (simplified for our use case)
// ============================================

export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
    contact?: { name?: string; email?: string; url?: string };
    license?: { name?: string; url?: string };
    termsOfService?: string;
    [key: string]: unknown;
  };
  paths?: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    parameters?: Record<string, Parameter>;
    responses?: Record<string, Response>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
  servers?: Server[];
  tags?: Tag[];
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
  parameters?: Parameter[];
  summary?: string;
  description?: string;
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
  security?: SecurityRequirement[];
  deprecated?: boolean;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Schema;
  style?: string;
  explode?: boolean;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, MediaType>;
}

export interface Response {
  description?: string;
  headers?: Record<string, Header>;
  content?: Record<string, MediaType>;
  $ref?: string;
}

export interface MediaType {
  schema?: Schema;
  example?: unknown;
  examples?: Record<string, Example>;
}

export interface Schema {
  type?: string;
  format?: string;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  enum?: unknown[];
  $ref?: string;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  nullable?: boolean;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | Schema;
}

export interface Header {
  description?: string;
  schema?: Schema;
}

export interface Example {
  summary?: string;
  description?: string;
  value?: unknown;
}

export interface SecurityScheme {
  type: string;
  description?: string;
  name?: string;
  in?: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, unknown>;
  openIdConnectUrl?: string;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface Tag {
  name: string;
  description?: string;
}
