export type Int = number;
export type Uuidv4 = string;
export type Timestamp = number;

export type ErdDiagramType = 1;
export type RelationalDiagramType = 2;
export type DiagramType = ErdDiagramType | RelationalDiagramType;

export type SimpleDataType = 'INT' | 'None' | 'Custom' | 'CHAR(n)' | 'DATE' | 'FLOAT' | 'NUMERIC(p s)' | 'VARCHAR(n)';
export type MinCardinality = 'Mandatory' | 'Optional';
export type MaxCardinality = 'One' | 'Many';
export type SelfRelSuffix = '(1)' | '(2)';


export interface Folder {
    name: string;
    id: string;
    folderType: Int;
    depth: Int;
    parentFolder?: Folder;
}

export interface SimpleColumn {
    id: Uuidv4;
    name: string;
    type: SimpleDataType;
}

export interface ForeignKeyProps {
    foreignKeyGroupId: Uuidv4;
    sourceTableId: Uuidv4;
    columns: Array<SimpleColumn>;
}

export interface Position {
    x: number;
    y: number;
}

export interface Measured {
    width: Int;
    height: Int;
}

export interface EntityDetails {
    id: Uuidv4;
    exactConstraints?: {
        role: string;
        min?: Int;
        max?: Int;
    };
    minCardinality?: MinCardinality;
    maxCardinality?: MaxCardinality;
}

export interface BaseNode {
    id: Uuidv4;
    dragging: boolean;
    measured: Measured;
    selected: boolean;
    position: Position;
}

export interface BaseNodeData {
    label: string;
    isConnectable: boolean;
    isSelected: boolean;
}

export interface BaseEdge {
    id: string;
    type: string;
    source: Uuidv4;
    target: Uuidv4;
}

export interface LabelNodeData extends BaseNodeData { };

export interface LabelNode extends BaseNode {
    type: 'Label';
    data: LabelNodeData;
}

export interface EntityNodeData extends BaseNodeData {
    type: 'Regular' | 'Weak' | 'Associative' | 'Supertype';
    parentId?: Uuidv4;
}

export interface EntityNode extends BaseNode {
    type: 'Entity';
    data: EntityNodeData;
    supertypeDefinition?: 'Disjointed' | 'Overlapping';
    totalSpecialization?: boolean;
}

export type AttributeFlag = 
{ 'Unique': boolean } |
{ 'Multivalued': boolean } |
{ 'Optional': boolean } |
{ 'Composite': boolean } |
{ 'Derived': boolean }

export type AttributeFlagsArray = {
        Unique?: boolean, 
        Multivalued?: boolean,
        Optional?: boolean,
        Composite?: boolean,
        Derived?: boolean
}

export type AttributeFlags = AttributeFlagsArray | AttributeFlag

export interface AttributeNodeData extends BaseNodeData {
    types: AttributeFlags;
}

export interface AttributeNode extends BaseNode {
    type: 'Attribute';
    parentId?: Uuidv4;
    data: AttributeNodeData;
}

export interface RelationshipNodeData extends BaseNodeData {
    isIdentifying?: boolean;
    isSelfReferencing?: boolean;
    sourceEntityDetails?: EntityDetails;
    targetEntityDetails?: EntityDetails;
}

export interface RelationshipNode extends BaseNode {
    type: 'Relationship';
    data: RelationshipNodeData;
}

export interface TableColumn {
    id: Uuidv4;
    name: string;
    position: Int;
    type: SimpleDataType;
    size?: string;
    isPrimaryKey?: boolean;
    isOptional?: boolean;
    isUnique?: boolean;
    isForeignKey?: boolean;
    foreignKeyProps?: ForeignKeyProps;
    groupNumbers?: Int[]
}

export interface TableNodeData extends BaseNodeData {
    isFactTable?: boolean;
    columns: TableColumn[];
}

export interface TableNode extends BaseNode {
    type: 'Table';
    data: TableNodeData;
}

export type ErNode = LabelNode | EntityNode | AttributeNode | RelationshipNode;
export type RelationalNode = LabelNode | TableNode;
export type DiagramNode = ErNode | RelationalNode;


export interface AttributeEdge extends BaseEdge {
    id: Uuidv4;
    type: 'Attribute';
}

export interface SupertypeEdge extends BaseEdge {
    id: `${Uuidv4}->${Uuidv4}`; // source->target
    type: 'Supertype';
    data: EntityNode;
}

export interface RelationshipConstraints {
    role: string;
    min?: Int;
    max?: Int;
}

export interface RelationshipEdgeData {
    id: `${Uuidv4}->${Uuidv4}`; // source->target
    exactConstraints?: RelationshipConstraints;
    minCardinality?: MinCardinality;
    maxCardinality?: MaxCardinality;
}

export interface RelationshipEdge extends BaseEdge {
    id: `${Uuidv4}->${Uuidv4};${Uuidv4}->${Uuidv4}`; // source->target;first->second
    type: 'Relationship';
    data?: RelationshipEdgeData;
}

export interface SelfRelationshipEdgeData {
    id: `${Uuidv4}->${Uuidv4}${SelfRelSuffix}`; // relationship->entity(k)
    exactConstraints?: RelationshipConstraints;
    minCardinality?: MinCardinality;
    maxCardinality?: MaxCardinality;
}

export interface SelfRelationshipEdge extends BaseEdge {
    id: `${Uuidv4}->${Uuidv4}${SelfRelSuffix};${Uuidv4}->${Uuidv4}`; // relationship->target(k);target->target
    type: 'SelfRelationship';
    data?: SelfRelationshipEdgeData;
}

export interface RelationalEdgeData {
    foreignKeyProps: ForeignKeyProps;
}

export interface RelationalEdge extends BaseEdge {
    id: `${Uuidv4}->${Uuidv4}_${Uuidv4}`; // {source}->{target}_{HandleId}
    type: 'Relational';
    targetHandle: `foreign-key-handle-${Uuidv4}`; // ForeignKeyGroupId
    markerStart: { type: 'arrow' };
    data: RelationalEdgeData;
}

export type ErdEdge = AttributeEdge | SupertypeEdge | RelationshipEdge | SelfRelationshipEdge;
export type DiagramEdge = ErdEdge | RelationalEdge;


export interface Graph {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    viewport: { x: number; y: number; zoom: number };
}

export interface Diagram {
    diagramType: DiagramType;
    id: Int;
    name: string;
    folder?: Folder;
    updatedAtTimestamp?: string;
    data: Graph;
}