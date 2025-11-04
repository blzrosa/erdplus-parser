import z from "zod";

// Primitives
export const IntSchema = z.number().int();
export const UuidSchema = z.uuid();
export const UnixTimestampSchema = z.coerce.number().int().positive();

// Enums
export const SQLTypeSchema = z.enum([
    'INT', 'None', 'Custom', 
    'CHAR(n)', 'DATE', 'FLOAT', 
    'NUMERIC(p s)', 'VARCHAR(n)',
]);

export const MinCardinalitySchema = z.enum([
    'Mandatory', 'Optional',
]);

export const MaxCardinalitySchema = z.enum([
    'One', 'Many',
]);

export const DiagramTypes = {
    ER: 1,
    RELATIONAL: 2,
} as const;
export const DiagramTypeSchema = z.enum(DiagramTypes);

// Base Structues
export const PositionSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export const MeasuredSchema = z.object({
    width: IntSchema,
    height: IntSchema,
});

export const ViewportSchema = z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
});

export const BaseNodeDataSchema = z.object({
    label: z.string(),
    isConnectable: z.boolean().optional(),
    isSelected: z.boolean().optional(),
});

export const BaseNodeSchema = z.object({
    id: UuidSchema,
    dragging: z.boolean().optional(),
    measured: MeasuredSchema,
    selected: z.boolean().optional(),
    position: PositionSchema,
});

export const BaseEdgeSchema = z.object({
    id: z.string(), // Edge IDs are not always UUIDs (e.g., "source->target")
    type: z.string(),
    source: UuidSchema,
    target: UuidSchema,
});

// Shared Node Types
export const LabelNodeDataSchema = BaseNodeDataSchema.extend({});

export const LabelNodeSchema = BaseNodeSchema.extend({
    type: z.literal('Label'),
    data: LabelNodeDataSchema.optional(),
});

// Metadata
export const FolderSchema = z.object({
    name: z.string(),
    id: z.coerce.string(),
    folderType: IntSchema,
    depth: IntSchema,
});
// Self-reference for parentFolder
export type Folder = z.infer<typeof FolderSchema> & {
    parentFolder?: Folder;
};
export const FolderSchemaWithParent: z.ZodType<Folder> = FolderSchema.extend({
    parentFolder: z.lazy(() => FolderSchemaWithParent).optional(),
});

// Base Diagram schema
export const BaseDiagramSchema = z.object({
    diagramType: DiagramTypeSchema,
    id: IntSchema,
    name: z.string(),
    folder: FolderSchemaWithParent,
    updatedAtTimestamp: UnixTimestampSchema,
});

// Inferred Types
export type Int = z.infer<typeof IntSchema>;
export type Uuid = z.infer<typeof UuidSchema>;
export type UnixTimestamp = z.infer<typeof UnixTimestampSchema>;

export type SQLType = z.infer<typeof SQLTypeSchema>;
export type MinCardinality = z.infer<typeof MinCardinalitySchema>;
export type MaxCardinality = z.infer<typeof MaxCardinalitySchema>;
export type DiagramType = z.infer<typeof DiagramTypeSchema>;

export type Position = z.infer<typeof PositionSchema>;
export type Measured = z.infer<typeof MeasuredSchema>;
export type Viewport = z.infer<typeof ViewportSchema>;
export type BaseNodeData = z.infer<typeof BaseNodeDataSchema>;
export type BaseNode = z.infer<typeof BaseNodeSchema>;
export type BaseEdge = z.infer<typeof BaseEdgeSchema>;

export type LabelNodeData = z.infer<typeof LabelNodeDataSchema>;
export type LabelNode = z.infer<typeof LabelNodeSchema>;

// Folder type is already defined
export type BaseDiagram = z.infer<typeof BaseDiagramSchema>;