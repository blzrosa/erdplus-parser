export type erdType = 1;
export type relationalType = 2;
export type int = number;
export type uuid8 = string;

export type updatedAtTimestamp = number;
export type folder = {
    name: string,
    id: string,
    folderType: int,
    depth: int,
    parentFolder?: folder

}

export type simpleDataType = 'INT' | 'None' | 'Custom' | 'CHAR(n)' | 'DATE' | 'FLOAT' | 'NUMERIC(p s)' | 'VARCHAR(n)'

export type simpleColumn = {
    id: uuid8,
    name: string,
    type: simpleDataType,
}

export type foreignKeyPropsType = {
    foreignKeyGroupId: uuid8,
    sourceTableId: uuid8
    columns: Array<simpleColumn>
}

export type AttributeEdge = {
    id: uuid8,
    type: 'Attribute',
    source: uuid8,
    target: uuid8
}

export type SupertypeEdge = {
    id: `${uuid8}->${uuid8}`, // source->target
    type: 'Supertype',
    source: uuid8,
    target: uuid8,
    data: EntityNode
}

export type RelationshipEdge = {
    id: `${uuid8}->${uuid8};${uuid8}->${uuid8}`, // source->target;first->second
    type: 'Relationship',
    source: uuid8, // relationship
    target: uuid8, // entity
    data?: {
        id: `${uuid8}->${uuid8}`, // source->target
        exactConstraints?: {
            role: string,
            min?: int,
            max?: int
        }
        minCardinality?: minCardinalityType,
        maxCardinality?: maxCardinalityType
    }
}

export type SelfRelationshipEdge = {
    id: `${uuid8}->${uuid8}${'(1)' | '(2)'};${uuid8}->${uuid8}`, // relationship->target(k);target->target
    type: 'SelfRelationship',
    source: uuid8, // relationship if (1), entity if (2)
    target: uuid8, // entity if (1), relationship if (2)
    data?: {
        id: `${uuid8}->${uuid8}${'(1)' | '(2)'}`, // relationship->entity(k)
        exactConstraints?: {
            role: string,
            min?: int,
            max?: int
        }
        minCardinality?: minCardinalityType,
        maxCardinality?: maxCardinalityType
    }

}

export type erdEdgeType = AttributeEdge | SupertypeEdge | RelationshipEdge | SelfRelationshipEdge;

export type relationalEdgeType = {
    id: `${uuid8}->${uuid8}_${uuid8}` // {source}->{target}_{Without("foreign-key-handle-", handle)"}
    type: 'Relational',
    source: uuid8, // Source table
    targetHandle: `foreign-key-handle-${uuid8}`, // ForeignKeyGroupId
    target:  uuid8, // target table
    markerStart: { type: 'arrow' },
    data: { foreignKeyProps: foreignKeyPropsType }

}

export type edgeType = erdEdgeType | relationalEdgeType

export type LabelNode = {
    id: uuid8,
    type: 'Label',
    data: { 
        label : string,
        isConnectable: boolean,
        isSelected: boolean
    },
    dragging: boolean,
    measured: {
        'width': int,
        'height': int
    },
    selected: boolean,
    position: {
        x: number,
        y: number
    }
}


export type EntityNode = {
    id: uuid8,
    type: 'Entity',
    data: {
        label: string,
        type: 'Regular' | 'Weak' | 'Associative' | 'Supertype',
        parentId?: uuid8,
        isConnectable: boolean,
        isSelected: boolean
    },
    supertypeDefinition?: 'Disjointed' | 'Overlapping',
    totalSpecialization?: boolean,
    dragging: boolean,
    measured: {
        'width': int,
        'height': int
    },
    selected: boolean,
    position: {
        x: number,
        y: number
    }
}

export type AttributeNode = {
    id: uuid8,
    parentId?: uuid8,
    type: 'Attribute',
    data: {
        label: string,
        types: [
            { 'Unique': boolean },
            { 'Multivalued': boolean },
            { 'Optional': boolean },
            { 'Composite': boolean },
            { 'Derived': boolean }
        ],
        isConnectable: boolean,
        isSelected: boolean
    },
    dragging: boolean,
    measured: {
        'width': int,
        'height': int
    },
    selected: boolean,
    position: {
        x: number,
        y: number
    }
}

export type minCardinalityType = 'Mandatory' | 'Optional';
export type maxCardinalityType = 'One' | 'Many';

export type entityDetails = {
    id: uuid8,
    exactConstraints?: {
        role: string,
        min?: int,
        max?: int
    }
    minCardinality?: minCardinalityType,
    maxCardinality?: maxCardinalityType
}

export type RelationshipNode = {
    id: uuid8,
    type: 'Relationship',
    data: {
        label: string,
        isIdentifying?: boolean,
        isSelfReferencing?: boolean,
        sourceEntityDetails?: entityDetails,
        targetEntityDetails?: entityDetails,
        isConnectable: boolean,
        isSelected: boolean
    },
    dragging: boolean,
    measured: {
        'width': int,
        'height': int
    },
    selected: boolean,
    position: {
        x: number,
        y: number
    }
}

export type TableColumn = {
    id: uuid8,
    name: string,
    position: int,
    type: simpleDataType,
    size?: string,
    isPrimaryKey?: boolean,
    isOptional?: boolean,
    isUnique?: boolean,
    isForeignKey?: boolean,
    foreignKeyProps?: foreignKeyPropsType
}

export type TableNode = {
    id: uuid8,
    type: 'Table',
    data: {
        label: string,
        isFactTable?: boolean,
        columns: Array<TableColumn>,
        isConnectable: boolean,
        isSelected: boolean
    },
    dragging: boolean,
    measured: {
        'width': int,
        'height': int
    },
    selected: boolean,
    position: {
        x: number,
        y: number
    }
}

export type ERNode = LabelNode | EntityNode | AttributeNode | RelationshipNode;
export type RelationalNode = LabelNode | TableNode;

export type graph = {
    nodes: Array<ERNode | RelationalNode>, 
    edges: Array<edgeType>,
    viewport: { x: number, y: number, zoom: number }
}

export type diagram = {
    diagramType: erdType | relationalType, 
    id: uuid8,
    name: string,
    folder?: folder,
    updatedAtTimestamp?: string,
    data: graph,
}