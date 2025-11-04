import z from "zod";
import {
    ErdNodeSchema,
    ErdEdgeSchema,
    ErdGraphSchema,
    ErdDiagramSchema,
} from "./er/schemas";
import {
    RelationalNodeSchema,
    RelationalEdgeSchema,
    RelationalGraphSchema,
    RelationalDiagramSchema,
} from "./relational/schemas";

// Combined Union Schemas
export const DiagramNodeSchema = z.discriminatedUnion("type", [
    z.lazy(() => ErdNodeSchema),
    z.lazy(() => RelationalNodeSchema),
]);

export const DiagramEdgeSchema = z.discriminatedUnion("type", [
    z.lazy(() => ErdEdgeSchema),
    z.lazy(() => RelationalEdgeSchema),
]);

export const GraphSchema = z.discriminatedUnion("type", [
    ErdGraphSchema, 
    RelationalGraphSchema,
])

export const DiagramSchema = z.discriminatedUnion("diagramType", [
    ErdDiagramSchema,
    RelationalDiagramSchema,
]);

// Inferred Union Types
export type DiagramNode = z.infer<typeof DiagramNodeSchema>;
export type DiagramEdge = z.infer<typeof DiagramEdgeSchema>;
export type Graph = z.infer<typeof GraphSchema>;
export type Diagram = z.infer<typeof DiagramSchema>;

// Enums
export { DiagramTypes } from "./common/schemas";

// Common Schemas and Types
export * from "./common/schemas";

// ER Schemas and Types
export * from "./er/schemas";

// Relational Schemas and Types
export * from "./relational/schemas";