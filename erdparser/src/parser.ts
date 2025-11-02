import { Diagram, ErNode, Graph, RelationalEdge, RelationalNode,  LabelNode, EntityNode, AttributeNode, RelationshipNode, TableNode, TableColumn, SimpleColumn, ForeignKeyProps, SimpleDataType, EntityDetails, AttributeFlags, AttributeFlag, Int } from "./interfaces";
import { v4 as uuidv4 } from 'uuid';

enum DiagramTypes {
    ER = 1,
    Relational = 2,
};


function handleLabelNodes(nodes: Map<string, LabelNode>, [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]) {
    return;
}

function createBaseTableFromEntity(node: EntityNode): TableNode {
    return {
        id: node.id,
        type: 'Table',
        data: {
            label: node.data.label,
            columns: [],
            isConnectable: true,
            isSelected: false,
        },
        position: node.position,
        measured: node.measured,
        dragging: false,
        selected: false,
    };
}

function createPkColumn(name: string = 'id'): TableColumn {
    return {
        id: uuidv4(),
        name: name,
        position: 0,
        type: 'INT',
        isPrimaryKey: true,
        isOptional: false,
        isUnique: true
    } as TableColumn;
}

function getPkColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(column => column.isPrimaryKey === true);
}

function createRelationalEdge(
    targetTable: TableNode, // has the FK ("N" side)
    sourceTable: TableNode, // has the PK ("1" side)
    fkProps: ForeignKeyProps
): RelationalEdge {
    return {
        id: `${sourceTable.id}->${targetTable.id}_${fkProps.foreignKeyGroupId}`,
        type: 'Relational',
        source: sourceTable.id,
        target: targetTable.id,
        targetHandle: `foreign-key-handle-${fkProps.foreignKeyGroupId}`,
        markerStart: { type: 'arrow' },
        data: { foreignKeyProps: fkProps },
    };
}

function toFkSimpleColumn(column: TableColumn, target: TableNode): SimpleColumn {
    return {
        id: `fk_${column.id}`,
        name: `fk_${target.data.label}`,
        type: column.type,
    } as SimpleColumn
}

function handleEntityNodes(
    nodes: Map<string, EntityNode>, 
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    for (const [id, node] of nodes) {
        const newTable: TableNode = createBaseTableFromEntity(node);
        if (!node.data.parentId) {
            newTable.data.columns.push(createPkColumn(`${newTable.data.label}_id`));
        }
        else {
            const parentNode: EntityNode = nodes.get(node.data.parentId) as EntityNode;
            newTable.data.columns.push(createPkColumn(`${parentNode.data.label}_id`))
        }
        nodeMap.set(id, newTable);
    }

    for (const [id, node] of nodes) {
        if (node.data.parentId) {
            // 1:1 -> BCNF
            const table = nodeMap.get(id) as TableNode;
            const parentTable = nodeMap.get(node.data.parentId) as TableNode;
            const pkFkColumn = getPkColumns(table.data.columns)[0];
            if (!pkFkColumn) continue;
            pkFkColumn.isForeignKey = true;
            const fkProps = {
                foreignKeyGroupId: uuidv4(),
                sourceTableId: parentTable.id,
                columns: [toFkSimpleColumn(getPkColumns(parentTable.data.columns)[0] as TableColumn, parentTable)]
            } as ForeignKeyProps;
            pkFkColumn.foreignKeyProps = fkProps;
            
            // new Edge
            const newEdge = createRelationalEdge(table, parentTable, fkProps);
            edgeMap.set(newEdge.id, newEdge)
        }
    }
}

function createFkColumn(columnName: string, type: SimpleDataType, fkProps: ForeignKeyProps, isOptional: boolean): TableColumn {
    const FkColumn: TableColumn = {
            id: `fk_${uuidv4()}`,
            name: columnName.toLowerCase(),
            type: type,
            isForeignKey: true,
            foreignKeyProps: fkProps
        } as TableColumn;
    if (isOptional) {
        FkColumn.isOptional = true
    }
    return FkColumn;
}

function handleMNRelationship(
    node: RelationshipNode,
    sourceDetails: EntityDetails,
    targetDetails: EntityDetails,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    const sourceTable = nodeMap.get(sourceDetails.id) as TableNode;
    const targetTable = nodeMap.get(targetDetails.id) as TableNode;

    const sourcePks = getPkColumns(sourceTable.data.columns);
    const targetPks = getPkColumns(targetTable.data.columns);

    if (sourcePks.length === 0 || targetPks.length === 0) return;

    // Creating Associative table
    const newTable: TableNode = {
        id: node.id,
        type: 'Table',
        data: {
            label: node.data.label, // Relationship name
            columns: [],
            isConnectable: true,
            isSelected: false,
        },
        position: node.position,
        measured: node.measured,
        dragging: false,
        selected: false,
    };

    let currentPosition = 0

    const fk1Props: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: sourceTable.id,
        columns: sourcePks.map(pk => toFkSimpleColumn(pk, sourceTable)),
    };
    for (const pk of sourcePks) {
        const fkColumn = createFkColumn(pk.name, pk.type, fk1Props, false);
        fkColumn.isPrimaryKey = true; // Part of the compose PK
        fkColumn.position = currentPosition++;
        newTable.data.columns.push(fkColumn);
    }

    const fk2Props: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: targetTable.id,
        columns: targetPks.map(pk => toFkSimpleColumn(pk, targetTable)),
    };
    for (const pk of targetPks) {
        const fkColumn = createFkColumn(pk.name, pk.type, fk2Props, false);
        fkColumn.isPrimaryKey = true; // Part of the compose PK
        fkColumn.position = currentPosition++;
        newTable.data.columns.push(fkColumn);
    }
    
    nodeMap.set(newTable.id, newTable);

    const edge1 = createRelationalEdge(newTable, sourceTable, fk1Props);
    const edge2 = createRelationalEdge(newTable, targetTable, fk2Props);
    edgeMap.set(edge1.id, edge1);
    edgeMap.set(edge2.id, edge2);
}

function handle1NRelationship(
    node: RelationshipNode,
    oneDetails: EntityDetails,
    manyDetails: EntityDetails,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>],
    isOneToOne: boolean = false
) {
    const oneTable = nodeMap.get(oneDetails.id) as TableNode;  // "1" Side
    const manyTable = nodeMap.get(manyDetails.id) as TableNode; // "N" Side

    const onePks: TableColumn[] = getPkColumns(oneTable.data.columns);
    if (onePks.length === 0) return;

    const isOptional = oneDetails.minCardinality === 'Optional';

    const fkProps: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: oneTable.id,
        columns: onePks.map(pk => toFkSimpleColumn(pk, oneTable)),
    };

    
    for (const onePkColumn of onePks) {
        
        const fkName = onePkColumn.name; 
        const fkColumn = createFkColumn(fkName, onePkColumn.type, fkProps, isOptional);
        
        // Weak Entity
        if (node.data.isIdentifying) {
            fkColumn.isPrimaryKey = true;
        }

        if (isOneToOne) {
            fkColumn.isUnique = true;
        }

        fkColumn.position = manyTable.data.columns.length;
        manyTable.data.columns.push(fkColumn);
    }

    const newEdge = createRelationalEdge(manyTable, oneTable, fkProps);
    edgeMap.set(newEdge.id, newEdge);
}


// Add to the new uGroup
function handleRelationshipNodes(
    nodes: Map<string, RelationshipNode>, 
    entityNodes: Map<string, EntityNode>,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    for (const [id, node] of nodes) {
        const sourceDetails = node.data.sourceEntityDetails;
        const targetDetails = node.data.targetEntityDetails;

        if (!sourceDetails || !targetDetails) {
            continue;
        }

        
        if (sourceDetails.exactConstraints?.max === 0 || targetDetails.exactConstraints?.max === 0) {
            continue;
        }

        const isSourceMany = sourceDetails.maxCardinality === 'Many';
        const isTargetMany = targetDetails.maxCardinality === 'Many';

        // M:N
        if (isSourceMany && isTargetMany) {
            handleMNRelationship(node, sourceDetails, targetDetails, [nodeMap, edgeMap]);
        }
        
        // 1:N
        else if (!isSourceMany && isTargetMany) {
            // source is "1", target is "N"
            handle1NRelationship(node, sourceDetails, targetDetails, [nodeMap, edgeMap]);
        }
        
        // N:1
        else if (isSourceMany && !isTargetMany) {
            // source is "N", target is "1"
            handle1NRelationship(node, targetDetails, sourceDetails, [nodeMap, edgeMap]);
        }
        
        // 1:1
        else {
            // FK goes to the Optional side
            if (node.data.isIdentifying) {
                const sourceNode = entityNodes.get(sourceDetails.id);
                const targetNode = entityNodes.get(targetDetails.id);
                if (sourceNode?.data.type === 'Weak') {
                    handle1NRelationship(node, targetDetails, sourceDetails, [nodeMap, edgeMap], true);
                } else if (targetNode?.data.type === 'Weak') {
                    handle1NRelationship(node, sourceDetails, targetDetails, [nodeMap, edgeMap], true);
                } else {
                    if (targetDetails.minCardinality === 'Optional') {
                        handle1NRelationship(node, sourceDetails, targetDetails, [nodeMap, edgeMap], true);
                    } else {
                        handle1NRelationship(node, targetDetails, sourceDetails, [nodeMap, edgeMap], true);
                    }
                }
            } else {
                if (targetDetails.minCardinality === 'Optional') {
                    handle1NRelationship(node, sourceDetails, targetDetails, [nodeMap, edgeMap], true);
                } else {
                    handle1NRelationship(node, targetDetails, sourceDetails, [nodeMap, edgeMap], true);
                }
            }
        }
    }
}


// Converts the array into an object
function getAttributeFlags(flags: AttributeFlags): { [key: string]: boolean } {
    return flags;
}

function handleCompositeMultivaluedAttribute(
    node: AttributeNode,
    parentTable: TableNode,
    columnName: string,
    cGroups: {
        actualIndex: number;
        parentMapper: Map<string, number>;
        childrenMapper: Map<number, string[]>;
    },
    nodes: Map<string, AttributeNode>,
    processedAttributes: Set<string>,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    const newTable: TableNode = {
        id: node.id,
        type: 'Table',
        data: {
            label: `${parentTable.data.label}_${node.data.label}`,
            columns: [],
            isConnectable: true,
            isSelected: false,
        },
        position: node.position,
        measured: node.measured,
        dragging: false,
        selected: false,
    };
    
    const parentPks = getPkColumns(parentTable.data.columns);
    if (parentPks.length === 0) return;

    const fkProps: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: parentTable.id,
        columns: parentPks.map(pk => toFkSimpleColumn(pk, parentTable)),
    };
    let currentPosition = 0;
    for (const pk of parentPks) {
        const fkColumn = createFkColumn(pk.name, pk.type, fkProps, false);
        fkColumn.isPrimaryKey = true; // Part of the compose PK
        fkColumn.position = currentPosition++;
        newTable.data.columns.push(fkColumn);
    }

    const cGroup = cGroups.parentMapper.get(node.id);
    if (!cGroup) return;

    const childrenIds = cGroups.childrenMapper.get(cGroup);
    if (!childrenIds) return;

    for (const childId of childrenIds) {
        const childNode = nodes.get(childId);
        if (!childNode) continue;
        const newColumn: TableColumn = {
            id: childNode.id,
            name: childNode.data.label.toLowerCase(),
            position: currentPosition++,
            type: 'None',
            isPrimaryKey: true, // Part of the compose PK
            isOptional: false,
        } as TableColumn;
        newTable.data.columns.push(newColumn);
        processedAttributes.add(childId);
    }

    nodeMap.set(newTable.id, newTable);
    const newEdge = createRelationalEdge(newTable, parentTable, fkProps);
    edgeMap.set(newEdge.id, newEdge);
}

function handleMultivaluedAttribute(
    node: AttributeNode,
    parentTable: TableNode,
    columnName: string,
    cGroups: {
        actualIndex: number;
        parentMapper: Map<string, number>;
        childrenMapper: Map<number, string[]>;
    },
    nodes: Map<string, AttributeNode>,
    processedAttributes: Set<string>,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    const flags = getAttributeFlags(node.data.types);
    if (flags.Composite) {
        handleCompositeMultivaluedAttribute(node, parentTable, columnName, cGroups, nodes, processedAttributes, [nodeMap, edgeMap]);
    } else {
        const newTable: TableNode = {
            id: node.id,
            type: 'Table',
            data: {
                label: `${parentTable.data.label}_${node.data.label}`,
                columns: [],
                isConnectable: true,
                isSelected: false,
            },
            position: node.position,
            measured: node.measured,
            dragging: false,
            selected: false,
        };

        const parentPks = getPkColumns(parentTable.data.columns);
        if (parentPks.length === 0) return;

        const fkProps: ForeignKeyProps = {
            foreignKeyGroupId: uuidv4(),
            sourceTableId: parentTable.id,
            columns: parentPks.map(pk => toFkSimpleColumn(pk, parentTable)),
        };

        let currentPosition = 0;
        for (const pk of parentPks) {
            const fkColumn = createFkColumn(pk.name, pk.type, fkProps, false);
            fkColumn.isPrimaryKey = true; // Part of the compose PK
            fkColumn.position = currentPosition++;
            newTable.data.columns.push(fkColumn);
        }

        const valueColumn: TableColumn = {
            id: uuidv4(),
            name: columnName,
            position: 1,
            type: 'None',
            isPrimaryKey: true, // Part of the compose PK
            isOptional: false,
        } as TableColumn;
        newTable.data.columns.push(valueColumn);

        nodeMap.set(newTable.id, newTable);

        const newEdge = createRelationalEdge(newTable, parentTable, fkProps);
        edgeMap.set(newEdge.id, newEdge);
    }
}


function isAnyParentDerived(
    nodes: Map<string, AttributeNode>,
    id: string
): boolean {
    let parentId = nodes.get(id)?.parentId;
    if (!parentId) {
        return false;
    }
    else {
        let parent;
        while (parentId) {
            parent = nodes.get(parentId)
            if (!parent) {
                return false
            }
            if (getAttributeFlags(parent.data.types).Derived) {
                return true;
            }
            parentId = parent?.parentId;            
        }
    }
    return false;
}

function isAnyParentOptional(
    nodes: Map<string, AttributeNode>,
    id: string
): boolean {
    let parentId = nodes.get(id)?.parentId;
    if (!parentId) {
        return false;
    }
    else {
        let parent;
        while (parentId) {
            parent = nodes.get(parentId)
            if (!parent) {
                return false
            }
            if (getAttributeFlags(parent.data.types).Optional) {
                return true;
            }
            parentId = parent?.parentId;            
        }
    }
    return false;
}

function getUGroups(
    nodes: Map<string, AttributeNode>,
    uGroups: { actualIndex: Int, mapper: Map<string, Int> },
    id: string
): Int[] {
    const allGroups: Set<Int> = new Set()
    let parentId = nodes.get(id)?.parentId;
    if (!parentId) {
        return [];
    }
    else {
        let parent: AttributeNode | undefined;
        let value: Int | undefined;
        while (parentId) {
            parent = nodes.get(parentId)
            if (!parent) {
                break
            }
            value = uGroups.mapper.get(parentId)
            if (value) {
                allGroups.add(value)
            }
            parentId = parent?.parentId;            
        }
    }
    return Array.from(allGroups).sort()
}

function handleAttributeNodes(
    nodes: Map<string, AttributeNode>,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    // UNIQUE groups
    let uGroups = {
        actualIndex: 1 as Int,
        mapper: new Map() as Map<string, Int>,
    }

    // Composite groups
    let cGroups = {
        actualIndex: 1 as Int,
        parentMapper: new Map() as Map<string, Int>,
        childrenMapper: new Map() as Map<Int, string[]>,
    }

    for (const [id, node] of nodes) {
        const nodeTypes = getAttributeFlags(node.data.types)
        if (nodeTypes.Unique) uGroups.mapper.set(id, uGroups.actualIndex++);
        if (nodeTypes.Composite) cGroups.parentMapper.set(id, cGroups.actualIndex++);
    }

    for (const [id, node] of nodes) {
        const parentId = node.parentId;
        if (!parentId) {
            continue;
        }
        const parent = nodes.get(parentId)
        if (!parent) {
            continue;
        }
        const cGroup = cGroups.parentMapper.get(parentId);
        if (!cGroup) {
            continue;
        }
        const childrenArray = cGroups.childrenMapper.get(cGroup) || [];
        childrenArray.push(id);
        cGroups.childrenMapper.set(cGroup, childrenArray);
    }

    const processedAttributes: Set<string> = new Set();


    for (const [id, node] of nodes) {
        const flags = getAttributeFlags(node.data.types);

        // Already processed
        if (processedAttributes.has(id)) {
            continue;
        }

        // Derived (ignore)
        if (flags.Derived || isAnyParentDerived(nodes, id)) {
            continue;
        }
        
        let parentId = node.parentId as string;
        let parent = nodeMap.get(parentId) || nodes.get(parentId); // Table or Composite Attribute
        let namePrefix = '';

        // Gets the prefix and goes up until the entity if it exists
        while (parent && parent.type === 'Attribute') {
            const parentAttribute = parent as AttributeNode;
            namePrefix = `${parentAttribute.data.label}_${namePrefix}`;
            parentId = parentAttribute.parentId as string;
            parent = nodeMap.get(parentId) || nodes.get(parentId);
        }
        if (!parent || parent.type !== 'Table') {
            continue;
        }

        const parentTable = parent as TableNode;
        const columnName = (namePrefix + node.data.label).toLowerCase();

        // Multivalued
        if (flags.Multivalued) {
            handleMultivaluedAttribute(node, parentTable, columnName, cGroups, nodes, processedAttributes, [nodeMap, edgeMap]);
        }

        // Composite and not Multivalued
        else if (flags.Composite) {
            continue
        }

        // Simple
        else {
            const newColumn: TableColumn = {
                id: node.id,
                name: columnName,
                position: parentTable.data.columns.length,
                type: 'None',
                isPrimaryKey: false,
                isOptional: flags.Optional || isAnyParentOptional(nodes, id),
                isUnique: flags.Unique,
                groupNumbers: getUGroups(nodes, uGroups, id)
            } as TableColumn;

            if (flags.Unique) {
                const parentPks = getPkColumns(parentTable.data.columns);
                const isWeakTable = parentPks.some(pk => pk.isForeignKey === true);

                if (isWeakTable) {
                    newColumn.isPrimaryKey = true;
                }
            }

            parentTable.data.columns.push(newColumn);
        }
    }
}

function cleanupWeakEntityPKs(
    entityNodes: Map<string, EntityNode>, 
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    for (const [id, entityNode] of entityNodes) {
        if (entityNode.data.type === 'Weak') {
            const table = nodeMap.get(id) as TableNode;
            if (!table) continue;

            const hasIdentifyingFK = table.data.columns.some(col => 
                col.isPrimaryKey === true && col.isForeignKey === true
            );

            if (hasIdentifyingFK) {
                table.data.columns = table.data.columns.filter(col => {
                    const isPlaceholder = col.isPrimaryKey === true && col.isForeignKey !== true;
                    return !isPlaceholder; // Removes only the placeholder
                });
            }
        }
    }
}

function processNodes(
    toProcess: 
        {
            labels: Map<string, LabelNode>,
            entities: Map<string, EntityNode>,
            relationships: Map<string, RelationshipNode>,
            attributes: Map<string, AttributeNode>
        },
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
    ) {
        const maps: [Map<string, RelationalNode>, Map<string, RelationalEdge>] = [nodeMap, edgeMap];
        handleLabelNodes(toProcess.labels, maps);
        handleEntityNodes(toProcess.entities, maps);
        handleRelationshipNodes(toProcess.relationships, toProcess.entities, maps);
        handleAttributeNodes(toProcess.attributes, maps);
        cleanupWeakEntityPKs(toProcess.entities, maps);
    }


// TODO
function erdToRelationalMaps(erd: Diagram): [Map<string, RelationalNode>, Map<string, RelationalEdge>] {
    const erdNodes: ErNode[] = erd.data.nodes as ErNode[];
    const toProcess = {
        labels: new Map() as Map<string, LabelNode>,
        entities: new Map() as Map<string, EntityNode>,
        relationships: new Map() as Map<string, RelationshipNode>,
        attributes: new Map() as Map<string, AttributeNode>
    }
    for (const erdNode of erdNodes) {
        switch (erdNode.type) {
            case 'Label':
                toProcess.labels.set(erdNode.id, erdNode)
                break;
            case 'Entity':
                toProcess.entities.set(erdNode.id, erdNode)
                break;
            case 'Attribute':
                toProcess.attributes.set(erdNode.id, erdNode)
                break;
            case 'Relationship':
                toProcess.relationships.set(erdNode.id, erdNode)
                break;
        }
    }
    const [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>] = [new Map(), new Map()];
    processNodes(toProcess, [nodeMap, edgeMap]);
    return [nodeMap, edgeMap]
}

function buildRelationalNodesAndEdges(erd: Diagram): [RelationalNode[], RelationalEdge[]] {
    let [nodeMap, edgeMap] = erdToRelationalMaps(erd);
    
    const parsed_nodes: RelationalNode[] = Array.from(nodeMap).map<RelationalNode>((tuple) => tuple[1]);
    const parsed_edges: RelationalEdge[] = Array.from(edgeMap).map<RelationalEdge>((tuple) => tuple[1]);
    return [parsed_nodes, parsed_edges];
}

function buildRelationalGraph(erd: Diagram): Graph {
    const [parsed_nodes, parsed_edges]: [RelationalNode[], RelationalEdge[]] = buildRelationalNodesAndEdges(erd)
    
    const RelationalGraph = {
        nodes: parsed_nodes,
        edges: parsed_edges,
        viewport: { x: 0.0, y: 0.0, zoom: 1.0 }
    } as Graph
    return RelationalGraph
}

function buildRelationalDiagram(erd: Diagram): Diagram {
    const relationalGraph = buildRelationalGraph(erd)
    return {
        diagramType: DiagramTypes.Relational,
        id: 0,
        name: `${erd.name}_Relational`,
        folder: erd.folder,
        updatedAtTimestamp: String(Math.floor(Date.now() / 1000)),
        data: relationalGraph,
    } as Diagram;
}
1
export default function parseErdToRelational(erd: Diagram): Diagram {
    if (erd.diagramType === DiagramTypes.Relational) {
        return erd;
    }

    const relationalParsed: Diagram = buildRelationalDiagram(erd);
    return relationalParsed;

}