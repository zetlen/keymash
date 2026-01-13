/**
 * Parser utility for transforming TypeDoc JSON output into a simplified structure
 * suitable for rendering in React components.
 *
 * @module parse-typedoc-json
 */

import type { ParsedApiItem, ParsedApiSection, ParsedParam } from './docs-types';
import { ReflectionKind } from './docs-types';

// =============================================================================
// TypeDoc JSON Types (simplified subset)
// =============================================================================

interface CommentDisplayPart {
  kind: 'text' | 'code' | 'inline-tag';
  text: string;
  tag?: string;
  target?: number | { sourceFileName: string; qualifiedName: string };
}

interface CommentTag {
  tag: string;
  content: CommentDisplayPart[];
}

interface Comment {
  summary?: CommentDisplayPart[];
  blockTags?: CommentTag[];
}

interface SomeType {
  type: string;
  name?: string;
  value?: unknown;
  elementType?: SomeType;
  types?: SomeType[];
  declaration?: DeclarationReflection;
  typeArguments?: SomeType[];
  target?: number | { sourceFileName: string; qualifiedName: string };
  package?: string;
  qualifiedName?: string;
}

interface ParameterReflection {
  id: number;
  name: string;
  kind: number;
  flags?: { isOptional?: boolean };
  type?: SomeType;
  comment?: Comment;
  defaultValue?: string;
}

interface SignatureReflection {
  id: number;
  name: string;
  kind: number;
  comment?: Comment;
  parameters?: ParameterReflection[];
  type?: SomeType;
  typeParameter?: TypeParameterReflection[];
}

interface TypeParameterReflection {
  id: number;
  name: string;
  kind: number;
  type?: SomeType;
  default?: SomeType;
}

interface DeclarationReflection {
  id: number;
  name: string;
  kind: number;
  comment?: Comment;
  signatures?: SignatureReflection[];
  type?: SomeType;
  children?: DeclarationReflection[];
  flags?: { isOptional?: boolean; isStatic?: boolean };
  defaultValue?: string;
  typeParameters?: TypeParameterReflection[];
  extendedTypes?: SomeType[];
  implementedTypes?: SomeType[];
}

interface ReflectionCategory {
  title: string;
  children: number[];
}

interface ProjectReflection {
  id: number;
  name: string;
  kind: number;
  children?: DeclarationReflection[];
  categories?: ReflectionCategory[];
}

// =============================================================================
// Comment Parsing
// =============================================================================

/**
 * Converts CommentDisplayPart array to a plain string.
 */
function parseCommentParts(parts?: CommentDisplayPart[]): string {
  if (!parts) return '';
  return parts
    .map((part) => {
      if (part.kind === 'code') {
        return part.text;
      }
      return part.text;
    })
    .join('')
    .trim();
}

/**
 * Extracts a specific block tag (e.g., @example, @returns) from a comment.
 */
function getBlockTag(comment?: Comment, tagName: string): string | undefined {
  if (!comment?.blockTags) return undefined;
  const tag = comment.blockTags.find((t) => t.tag === `@${tagName}`);
  if (!tag) return undefined;
  return parseCommentParts(tag.content);
}

/**
 * Gets the description from a comment's summary.
 */
function getDescription(comment?: Comment): string {
  return parseCommentParts(comment?.summary);
}

/**
 * Gets the @category tag value from a comment.
 */
function getCategory(comment?: Comment): string | undefined {
  return getBlockTag(comment, 'category');
}

// =============================================================================
// Type Stringification
// =============================================================================

/**
 * Converts a TypeDoc type object to a human-readable TypeScript string.
 */
function typeToString(type?: SomeType): string {
  if (!type) return 'unknown';

  switch (type.type) {
    case 'intrinsic':
      return type.name ?? 'unknown';

    case 'literal':
      if (typeof type.value === 'string') {
        return `'${type.value}'`;
      }
      return String(type.value);

    case 'reference':
      if (type.typeArguments && type.typeArguments.length > 0) {
        const args = type.typeArguments.map(typeToString).join(', ');
        return `${type.name}<${args}>`;
      }
      return type.name ?? 'unknown';

    case 'array':
      return `${typeToString(type.elementType)}[]`;

    case 'union':
      return type.types?.map(typeToString).join(' | ') ?? 'unknown';

    case 'intersection':
      return type.types?.map(typeToString).join(' & ') ?? 'unknown';

    case 'tuple':
      return `[${type.types?.map(typeToString).join(', ') ?? ''}]`;

    case 'reflection':
      if (type.declaration) {
        return formatReflectionType(type.declaration);
      }
      return 'object';

    case 'query':
      return `typeof ${typeToString(type.target as unknown as SomeType)}`;

    case 'typeOperator':
      return type.name ?? 'unknown';

    case 'indexedAccess':
      return 'unknown';

    default:
      return type.name ?? 'unknown';
  }
}

/**
 * Formats a reflection type (inline interface/object type).
 */
function formatReflectionType(decl: DeclarationReflection): string {
  if (decl.signatures && decl.signatures.length > 0) {
    // Function type
    const sig = decl.signatures[0];
    const params =
      sig.parameters?.map((p) => `${p.name}: ${typeToString(p.type)}`).join(', ') ?? '';
    return `(${params}) => ${typeToString(sig.type)}`;
  }

  if (decl.children && decl.children.length > 0) {
    // Object type
    const props = decl.children.map((child) => {
      const optional = child.flags?.isOptional ? '?' : '';
      return `${child.name}${optional}: ${typeToString(child.type)}`;
    });
    return `{ ${props.join('; ')} }`;
  }

  return 'object';
}

// =============================================================================
// Signature Building
// =============================================================================

/**
 * Builds a human-readable signature string for a declaration.
 */
function buildSignature(decl: DeclarationReflection): string | undefined {
  const kind = decl.kind;

  // Function
  if (kind === ReflectionKind.Function) {
    if (!decl.signatures || decl.signatures.length === 0) return undefined;

    return decl.signatures
      .map((sig) => {
        const typeParams = sig.typeParameter
          ? `<${sig.typeParameter.map((tp) => tp.name).join(', ')}>`
          : '';
        const params =
          sig.parameters
            ?.map((p) => `${p.name}${p.flags?.isOptional ? '?' : ''}: ${typeToString(p.type)}`)
            .join(', ') ?? '';
        const ret = typeToString(sig.type);
        return `function ${decl.name}${typeParams}(${params}): ${ret}`;
      })
      .join('\n');
  }

  // Variable
  if (kind === ReflectionKind.Variable) {
    return `const ${decl.name}: ${typeToString(decl.type)}`;
  }

  // Class
  if (kind === ReflectionKind.Class) {
    const ext = decl.extendedTypes?.map(typeToString).join(', ');
    const impl = decl.implementedTypes?.map(typeToString).join(', ');
    let sig = `class ${decl.name}`;
    if (ext) sig += ` extends ${ext}`;
    if (impl) sig += ` implements ${impl}`;
    return sig;
  }

  // Interface
  if (kind === ReflectionKind.Interface) {
    const ext = decl.extendedTypes?.map(typeToString).join(', ');
    let sig = `interface ${decl.name}`;
    if (ext) sig += ` extends ${ext}`;

    // Include properties for interfaces
    if (decl.children && decl.children.length > 0) {
      const props = decl.children.map((child) => {
        const optional = child.flags?.isOptional ? '?' : '';
        return `  ${child.name}${optional}: ${typeToString(child.type)};`;
      });
      sig += ` {\n${props.join('\n')}\n}`;
    }

    return sig;
  }

  // Type Alias
  if (kind === ReflectionKind.TypeAlias) {
    return `type ${decl.name} = ${typeToString(decl.type)}`;
  }

  // Method
  if (kind === ReflectionKind.Method) {
    if (!decl.signatures || decl.signatures.length === 0) return undefined;

    return decl.signatures
      .map((sig) => {
        const params =
          sig.parameters
            ?.map((p) => `${p.name}${p.flags?.isOptional ? '?' : ''}: ${typeToString(p.type)}`)
            .join(', ') ?? '';
        const ret = typeToString(sig.type);
        return `${decl.name}(${params}): ${ret}`;
      })
      .join('\n');
  }

  // Property
  if (kind === ReflectionKind.Property) {
    const optional = decl.flags?.isOptional ? '?' : '';
    return `${decl.name}${optional}: ${typeToString(decl.type)}`;
  }

  return undefined;
}

// =============================================================================
// Parameter Parsing
// =============================================================================

/**
 * Extracts parameter information from a function/method signature.
 */
function parseParameters(sig: SignatureReflection, comment?: Comment): ParsedParam[] {
  if (!sig.parameters) return [];

  // Build a map of @param descriptions from the comment
  const paramDescriptions = new Map<string, string>();
  if (comment?.blockTags) {
    for (const tag of comment.blockTags) {
      if (tag.tag === '@param' && tag.content.length > 0) {
        // First part is usually the param name, rest is description
        const text = parseCommentParts(tag.content);
        const match = text.match(/^(\w+)\s*-?\s*(.*)/s);
        if (match) {
          paramDescriptions.set(match[1], match[2].trim());
        }
      }
    }
  }

  return sig.parameters.map((param) => ({
    name: param.name,
    type: typeToString(param.type),
    description: paramDescriptions.get(param.name) || getDescription(param.comment),
    optional: param.flags?.isOptional,
    defaultValue: param.defaultValue,
  }));
}

// =============================================================================
// Declaration Parsing
// =============================================================================

/**
 * Maps TypeDoc reflection kind to our simplified kind.
 */
function mapKind(kind: number): ParsedApiItem['kind'] {
  switch (kind) {
    case ReflectionKind.Function:
      return 'function';
    case ReflectionKind.Variable:
      return 'variable';
    case ReflectionKind.Class:
      return 'class';
    case ReflectionKind.Interface:
      return 'interface';
    case ReflectionKind.TypeAlias:
      return 'type';
    case ReflectionKind.Property:
      return 'property';
    case ReflectionKind.Method:
      return 'method';
    default:
      return 'variable';
  }
}

/**
 * Parses a single declaration into a ParsedApiItem.
 */
function parseDeclaration(decl: DeclarationReflection): ParsedApiItem {
  // Get the primary comment (from signature for functions, from decl for others)
  const comment =
    decl.signatures && decl.signatures.length > 0 ? decl.signatures[0].comment : decl.comment;

  // Parse parameters from first signature if it's a function
  const params =
    decl.signatures && decl.signatures.length > 0
      ? parseParameters(decl.signatures[0], comment)
      : undefined;

  // Get @returns from comment
  const returns = getBlockTag(comment, 'returns');

  // Get @example from comment (remove markdown code fence if present)
  let example = getBlockTag(comment, 'example');
  if (example) {
    // Remove markdown code fence wrapper if present
    example = example.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  }

  // Parse child items for classes (methods and properties)
  const childItems = decl.children
    ?.filter((child) => {
      // Skip private/internal members
      const kind = child.kind;
      return (
        kind === ReflectionKind.Method ||
        kind === ReflectionKind.Property ||
        kind === ReflectionKind.Accessor
      );
    })
    .map(parseDeclaration);

  return {
    id: decl.id,
    name: decl.name,
    kind: mapKind(decl.kind),
    signature: buildSignature(decl),
    description: getDescription(comment),
    params: params && params.length > 0 ? params : undefined,
    returns,
    example,
    deprecated: getBlockTag(comment, 'deprecated'),
    category: getCategory(comment),
    childItems: childItems && childItems.length > 0 ? childItems : undefined,
  };
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Default category order for sections.
 */
const DEFAULT_CATEGORY_ORDER = ['Core Exports', 'Keymash Instance', 'Types'];

/**
 * Flattens children from module declarations.
 * TypeDoc outputs modules (kind 2) as containers for the actual exports.
 */
function flattenModules(children: DeclarationReflection[]): DeclarationReflection[] {
  const result: DeclarationReflection[] = [];

  for (const child of children) {
    // If it's a module (kind 2), get its children
    if (child.kind === ReflectionKind.Module && child.children) {
      result.push(...child.children);
    } else {
      result.push(child);
    }
  }

  return result;
}

/**
 * Parses TypeDoc JSON output into an array of API sections.
 *
 * @param json - The TypeDoc project reflection JSON
 * @param categoryOrder - Optional custom category order
 * @returns Array of parsed API sections
 */
export function parseTypeDocJson(
  json: ProjectReflection,
  categoryOrder: string[] = DEFAULT_CATEGORY_ORDER,
): ParsedApiSection[] {
  const sections = new Map<string, ParsedApiItem[]>();

  // Initialize sections in order
  for (const cat of categoryOrder) {
    sections.set(cat, []);
  }
  sections.set('Other', []);

  // Flatten module structure to get actual exports
  const allChildren = flattenModules(json.children ?? []);

  // Parse all children
  for (const child of allChildren) {
    const item = parseDeclaration(child);
    const category = item.category ?? 'Other';

    if (!sections.has(category)) {
      sections.set(category, []);
    }
    sections.get(category)?.push(item);
  }

  // Convert to array, filtering out empty sections
  const result: ParsedApiSection[] = [];

  // Add sections in order
  for (const title of [...categoryOrder, 'Other']) {
    const items = sections.get(title);
    if (items && items.length > 0) {
      result.push({ title, items });
    }
  }

  // Add any remaining sections not in the order list
  for (const [title, items] of sections) {
    if (!categoryOrder.includes(title) && title !== 'Other' && items.length > 0) {
      result.push({ title, items });
    }
  }

  return result;
}

/**
 * Creates a map of declaration IDs to names for resolving references.
 */
export function createIdMap(json: ProjectReflection): Map<number, string> {
  const map = new Map<number, string>();

  function walk(decl: DeclarationReflection): void {
    map.set(decl.id, decl.name);
    if (decl.children) {
      for (const child of decl.children) {
        walk(child);
      }
    }
  }

  for (const child of json.children ?? []) {
    walk(child);
  }

  return map;
}
