/**
 * Types for parsed TypeDoc JSON output used in the API reference renderer.
 * These simplified types are used by parse-typedoc-json.ts to transform
 * TypeDoc's JSON structure into a format suitable for React components.
 */

/**
 * A parsed API item representing a function, variable, class, interface, or type.
 */
export interface ParsedApiItem {
  /** Unique identifier from TypeDoc */
  id: number;
  /** Name of the item (e.g., "keymash", "Binding") */
  name: string;
  /** Kind of declaration */
  kind: 'function' | 'variable' | 'class' | 'interface' | 'type' | 'property' | 'method';
  /** TypeScript signature string */
  signature?: string;
  /** Description from JSDoc comment */
  description: string;
  /** Parameters for functions/methods */
  params?: ParsedParam[];
  /** Return type description */
  returns?: string;
  /** Example code from @example tag */
  example?: string;
  /** Deprecation notice from @deprecated tag */
  deprecated?: string;
  /** Category from @category tag */
  category?: string;
  /** Child items (for classes with methods/properties) */
  childItems?: ParsedApiItem[];
}

/**
 * A parsed parameter from a function or method signature.
 */
export interface ParsedParam {
  /** Parameter name */
  name: string;
  /** TypeScript type string */
  type: string;
  /** Description from @param tag */
  description: string;
  /** Whether the parameter is optional */
  optional?: boolean;
  /** Default value from @default tag or type info */
  defaultValue?: string;
}

/**
 * A section of API documentation grouped by category.
 */
export interface ParsedApiSection {
  /** Section title (e.g., "Core Exports", "Types") */
  title: string;
  /** Items in this section */
  items: ParsedApiItem[];
}

/**
 * TypeDoc reflection kind values.
 * @see https://typedoc.org/api/enums/ReflectionKind.html
 */
export const ReflectionKind = {
  Project: 1,
  Module: 2,
  Namespace: 4,
  Enum: 8,
  EnumMember: 16,
  Variable: 32,
  Function: 64,
  Class: 128,
  Interface: 256,
  Constructor: 512,
  Property: 1024,
  Method: 2048,
  CallSignature: 4096,
  IndexSignature: 8192,
  ConstructorSignature: 16384,
  Parameter: 32768,
  TypeLiteral: 65536,
  TypeParameter: 131072,
  Accessor: 262144,
  GetSignature: 524288,
  SetSignature: 1048576,
  TypeAlias: 2097152,
  Reference: 4194304,
  Document: 8388608,
} as const;

export type ReflectionKindValue = (typeof ReflectionKind)[keyof typeof ReflectionKind];
