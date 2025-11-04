import z from "zod";
import {
    IntSchema,
    UuidSchema,
    MinCardinalitySchema,
    MaxCardinalitySchema,
    BaseNodeSchema,
    BaseNodeDataSchema,
    BaseEdgeSchema,
    LabelNodeSchema,
    ViewportSchema,
    BaseDiagramSchema,
    DiagramTypes,
} from "../common/schemas";

export const RelationshipConstraintsSchema = z.object({
    role: z.string(),
    min: IntSchema.optional(),
    max: IntSchema.optional(),
});

export const EntityDetailsSchema = z.object({
    id: UuidSchema,
    exactConstraints: RelationshipConstraintsSchema.optional(),
    minCardinality: MinCardinalitySchema.optional(),
    maxCardinality: MaxCardinalitySchema.optional(),
});

const attributeFlagsObjectSchema = z.object({
    Unique: z.boolean().optional(),
    Multivalued: z.boolean().optional(),
    Optional: z.boolean().optional(),
    Composite: z.boolean().optional(),
    Derived: z.boolean().optional(),
});

export const AttributeFlagsSchema = z.preprocess(
    (val) => {
        if (Array.isArray(val) && val.length === 0) return {};
        return val;
    }, 
    attributeFlagsObjectSchema
);

// ER Node Schemas
export const EntityNodeTypeSchema = z.enum([
    'Regular', 'Weak', 'Associative', 'Supertype',
])

export const EntityNodeDataSchema = BaseNodeDataSchema.extend({
    type: EntityNodeTypeSchema,
    parentId: UuidSchema.optional(),
});

export const SupertypeDefinitionSchema = z.enum([
    'Disjointed', 'Overlapping'
]);

export const EntityNodeSchema = z.lazy(() => BaseNodeSchema.extend({
    type: z.literal('Entity'),
    data: EntityNodeDataSchema,
    supertypeDefinition: SupertypeDefinitionSchema.optional(),
    totalSpecialization: z.boolean().optional(),
}));

export const AttributeNodeDataSchema = BaseNodeDataSchema.extend({
    types: AttributeFlagsSchema,
});

export const AttributeNodeSchema = BaseNodeSchema.extend({
    type: z.literal('Attribute'),
    parentId: UuidSchema.optional(),
    data: AttributeNodeDataSchema,
});

export const RelationshipNodeDataSchema = BaseNodeDataSchema.extend({
    isIdentifying: z.boolean().optional(),
    isSelfReferencing: z.boolean().optional(),
    sourceEntityDetails: EntityDetailsSchema.optional(),
    targetEntityDetails: EntityDetailsSchema.optional(),
});

export const RelationshipNodeSchema = BaseNodeSchema.extend({
    type: z.literal('Relationship'),
    data: RelationshipNodeDataSchema,
});

export const ErdNodeSchema = z.discriminatedUnion("type", [
    LabelNodeSchema,
    EntityNodeSchema,
    AttributeNodeSchema,
    RelationshipNodeSchema,
]);

// ER Edge Schemas
export const AttributeEdgeSchema = BaseEdgeSchema.extend({
    id: UuidSchema,
    type: z.literal('Attribute'),
});

export const SupertypeEdgeSchema = BaseEdgeSchema.extend({
    id: z.string().regex(/.+->.+/), // {source}->{target}
    type: z.literal('Supertype'),
    data: EntityNodeSchema,
});

export const RelationshipEdgeDataSchema = z.object({
    id: z.string().regex(/.+->.+/), // {source}->{target}
    exactConstraints: RelationshipConstraintsSchema.optional(),
    minCardinality: MinCardinalitySchema.optional(),
    maxCardinality: MaxCardinalitySchema.optional(),
});

export const RelationshipEdgeSchema = BaseEdgeSchema.extend({
    id: z.string().regex(/.+->.+;.+->.+/), // {source}->{target};{first}->{second}
    type: z.literal('Relationship'),
    data: RelationshipEdgeDataSchema.optional(),
});

export const SelfRelationshipEdgeDataSchema = z.object({
    id: z.string(), // Can't easily regex this: {relationship}->{entity}{suffix}
    exactConstraints: RelationshipConstraintsSchema.optional(),
    minCardinality: MinCardinalitySchema.optional(),
    maxCardinality: MaxCardinalitySchema.optional(),
});

export const SelfRelationshipEdgeSchema = BaseEdgeSchema.extend({
    id: z.string(), // Can't easily regex this: {rel}->{target}{suffix};{target}->{target}
    type: z.literal('SelfRelationship'),
    data: SelfRelationshipEdgeDataSchema.optional(),
});

export const ErdEdgeSchema = z.discriminatedUnion("type", [
    AttributeEdgeSchema,
    SupertypeEdgeSchema,
    RelationshipEdgeSchema,
    SelfRelationshipEdgeSchema,
]);

// ER Graph and Diagram Schemas
export const ErdGraphSchema = z.object({
    nodes: z.array(ErdNodeSchema),
    edges: z.array(ErdEdgeSchema),
    viewport: ViewportSchema,
});

export const ErdDiagramSchema = BaseDiagramSchema.extend({
    diagramType: z.literal(DiagramTypes.ER),
    data: ErdGraphSchema,
});

// Inferred Types
export type RelationshipConstraints = z.infer<typeof RelationshipConstraintsSchema>;
export type EntityDetails = z.infer<typeof EntityDetailsSchema>;
export type AttributeFlags = z.infer<typeof AttributeFlagsSchema>;

export type EntityNodeType = z.infer<typeof EntityNodeTypeSchema>;
export type EntityNodeData = z.infer<typeof EntityNodeDataSchema>;
export type SupertypeDefinition = z.infer<typeof SupertypeDefinitionSchema>;
export type EntityNode = z.infer<typeof EntityNodeSchema>;
export type AttributeNodeData = z.infer<typeof AttributeNodeDataSchema>;
export type AttributeNode = z.infer<typeof AttributeNodeSchema>;
export type RelationshipNodeData = z.infer<typeof RelationshipNodeDataSchema>;
export type RelationshipNode = z.infer<typeof RelationshipNodeSchema>;
export type ErdNode = z.infer<typeof ErdNodeSchema>;

export type AttributeEdge = z.infer<typeof AttributeEdgeSchema>;
export type SupertypeEdge = z.infer<typeof SupertypeEdgeSchema>;
export type RelationshipEdgeData = z.infer<typeof RelationshipEdgeDataSchema>;
export type RelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;
export type SelfRelationshipEdgeData = z.infer<typeof SelfRelationshipEdgeDataSchema>;
export type SelfRelationshipEdge = z.infer<typeof SelfRelationshipEdgeSchema>;
export type ErdEdge = z.infer<typeof ErdEdgeSchema>;

export type ErdGraph = z.infer<typeof ErdGraphSchema>;
export type ErdDiagram = z.infer<typeof ErdDiagramSchema>;