import { z } from "zod";
import {
    UuidSchema,
    SQLTypeSchema,
    IntSchema,
    BaseNodeSchema,
    BaseNodeDataSchema,
    BaseEdgeSchema,
    LabelNodeSchema,
    ViewportSchema,
    BaseDiagramSchema,
    DiagramTypes
} from "../common/schemas";

export const SimpleColumnSchema = z.object({
    id: UuidSchema,
    name: z.string(),
    type: SQLTypeSchema,
});

export const ForeignKeyPropsSchema = z.object({
    foreignKeyGroupId: UuidSchema,
    sourceTableId: UuidSchema,
    columns: z.array(SimpleColumnSchema),
});

export const TableColumnSchema = z.object({
    id: UuidSchema,
    name: z.string(),
    position: IntSchema,
    type: SQLTypeSchema,
    size: z.string().optional(),
    isPrimaryKey: z.boolean().optional(),
    isOptional: z.boolean().optional(),
    isUnique: z.boolean().optional(),
    isForeignKey: z.boolean().optional(),
    foreignKeyProps: ForeignKeyPropsSchema.optional(),
    groupNumbers: z.array(IntSchema).optional(),
});

export const TableNodeDataSchema = BaseNodeDataSchema.extend({
    isFactTable: z.boolean().optional(),
    columns: z.array(TableColumnSchema),
});

export const TableNodeSchema = BaseNodeSchema.extend({
    type: z.literal('Table'),
    data: TableNodeDataSchema,
});

export const RelationalEdgeDataSchema = z.object({
    foreignKeyProps: ForeignKeyPropsSchema,
});

export const RelationalEdgeSchema = BaseEdgeSchema.extend({
    id: z.string().regex(/.+->.+_.+/), // {source}->{target}_{HandleId}
    type: z.literal('Relational'),
    targetHandle: z.string().startsWith('foreign-key-handle-'),
    markerStart: z.object({ type: z.literal('arrow') }),
    data: RelationalEdgeDataSchema,
});

// Relational Union and Graph Schemas
export const RelationalNodeSchema = z.discriminatedUnion("type", [
    TableNodeSchema,
    LabelNodeSchema,
]);

export const RelationalGraphSchema = z.object({
    nodes: z.array(RelationalNodeSchema),
    edges: z.array(RelationalEdgeSchema),
    viewport: ViewportSchema,
});

export const RelationalDiagramSchema = BaseDiagramSchema.extend({
    diagramType: z.literal(DiagramTypes.RELATIONAL),
    data: RelationalGraphSchema,
});

// Inferred Types
export type SimpleColumn = z.infer<typeof SimpleColumnSchema>;
export type ForeignKeyProps = z.infer<typeof ForeignKeyPropsSchema>;
export type TableColumn = z.infer<typeof TableColumnSchema>;
export type TableNodeData = z.infer<typeof TableNodeDataSchema>;
export type TableNode = z.infer<typeof TableNodeSchema>;
export type RelationalEdgeData = z.infer<typeof RelationalEdgeDataSchema>;
export type RelationalEdge = z.infer<typeof RelationalEdgeSchema>;
export type RelationalNode = z.infer<typeof RelationalNodeSchema>;
export type RelationalGraph = z.infer<typeof RelationalGraphSchema>;
export type RelationalDiagram = z.infer<typeof RelationalDiagramSchema>;