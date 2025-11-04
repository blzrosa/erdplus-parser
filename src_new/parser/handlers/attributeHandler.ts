import { v4 as uuidv4 } from 'uuid';
import {
    AttributeNode,
    EntityNode,
    ForeignKeyProps,
    Int,
    RelationalEdge,
    RelationalNode,
    RelationshipNode,
    TableColumn,
    TableNode
} from '../../core/types';
import {
    createFkColumn,
    createRelationalEdge,
    getAttributeFlags,
    getPkColumns,
    getUGroups,
    isAnyParentDerived,
    isAnyParentOptional,
    toFkSimpleColumn
} from '../parserUtils';

// Internal type for composite group tracking
type CompositeGroups = {
    actualIndex: Int;
    parentMapper: Map<string, Int>;
    childrenMapper: Map<Int, string[]>;
};

/**
 * Handles Composite attributes that are also Multivalued
 */
function handleCompositeMultivaluedAttribute(
    node: AttributeNode,
    parentTable: TableNode,
    columnName: string,
    cGroups: CompositeGroups,
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
        columns: parentPks.length > 1 ?
        parentPks.map((pk, index) => toFkSimpleColumn(pk, parentTable, `${parentTable.data.label}_${index+1}`)) :
        parentPks.map(pk => toFkSimpleColumn(pk, parentTable, parentTable.data.label)),
    };
    let currentPosition = 0;
    const fkColumn = createFkColumn(node.data.label, 'INT', fkProps, false);
    fkColumn.isPrimaryKey = true; // Part of the compose PK
    fkColumn.position = currentPosition++;
    newTable.data.columns.push(fkColumn);
    
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

/**
 * Handles Multivalued attributes (both Simple and Composite)
 */
function handleMultivaluedAttribute(
    node: AttributeNode,
    parentTable: TableNode,
    columnName: string,
    cGroups: CompositeGroups,
    nodes: Map<string, AttributeNode>,
    processedAttributes: Set<string>,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    const flags = getAttributeFlags(node.data.types);
    if (flags.Composite) {
        handleCompositeMultivaluedAttribute(node, parentTable, columnName, cGroups, nodes, processedAttributes, [nodeMap, edgeMap]);
    } else {
        // Simple Multivalued attribute
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
            columns: parentPks.length > 1 ?
            parentPks.map((pk, index) => toFkSimpleColumn(pk, parentTable, `${parentTable.data.label}_${index+1}`)) :
            parentPks.map(pk => toFkSimpleColumn(pk, parentTable, parentTable.data.label)),
        };

        let currentPosition = 0;
        const fkColumn = createFkColumn(node.data.label, 'INT', fkProps, false);
        fkColumn.isPrimaryKey = true; // Part of the compose PK
        fkColumn.position = currentPosition++;
        newTable.data.columns.push(fkColumn);

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

/**
 * Orchestrates all attribute node processing
 */
export function handleAttributeNodes(
    nodes: Map<string, AttributeNode>,
    entityNodes: Map<string, EntityNode>, 
    relationshipNodes: Map<string, RelationshipNode>,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    // UNIQUE groups
    let uGroups = {
        actualIndex: 1 as Int,
        mapper: new Map() as Map<string, Int>,
    }

    // Composite groups
    let cGroups: CompositeGroups = {
        actualIndex: 1 as Int,
        parentMapper: new Map() as Map<string, Int>,
        childrenMapper: new Map() as Map<Int, string[]>,
    }

    // First pass: identify all UNIQUE and COMPOSITE group parents
    for (const [id, node] of nodes) {
        const nodeTypes = getAttributeFlags(node.data.types)
        if (nodeTypes.Unique) uGroups.mapper.set(id, uGroups.actualIndex++);
        if (nodeTypes.Composite) cGroups.parentMapper.set(id, cGroups.actualIndex++);
    }

    // Second pass: map children to their COMPOSITE group
    for (const [id, node] of nodes) {
        const parentId = node.parentId;
        if (!parentId) continue;
        
        const parent = nodes.get(parentId)
        if (!parent) continue;

        const cGroup = cGroups.parentMapper.get(parentId);
        if (!cGroup) continue;
        
        const childrenArray = cGroups.childrenMapper.get(cGroup) || [];
        childrenArray.push(id);
        cGroups.childrenMapper.set(cGroup, childrenArray);
    }

    const processedAttributes: Set<string> = new Set();

    // Third pass: process all attributes
    for (const [id, node] of nodes) {
        const flags = getAttributeFlags(node.data.types);

        if (processedAttributes.has(id) || flags.Derived || isAnyParentDerived(nodes, id)) {
            continue;
        }

        let parentId = node.parentId as string;
        let parentNode = entityNodes.get(parentId) || relationshipNodes.get(parentId) || nodes.get(parentId);
        let parentTable: TableNode | undefined;
        let namePrefix = '';

        // Gets the prefix and goes up until the entity/relationship if it exists
        while (parentNode && parentNode.type === 'Attribute') {
            const parentAttribute = parentNode as AttributeNode;
            namePrefix = `${parentAttribute.data.label}_${namePrefix}`;
            
            parentId = parentAttribute.parentId as string;
            parentNode = entityNodes.get(parentId) || relationshipNodes.get(parentId) || nodes.get(parentId);
        }

        if (!parentNode) continue;

        // Find the correct table to add the column to
        if (parentNode.type === 'Entity') {
            parentTable = nodeMap.get(parentNode.id) as TableNode;
        }
        else if (parentNode.type === 'Relationship') {
            const relNode = parentNode as RelationshipNode;
            const sourceDetails = relNode.data.sourceEntityDetails;
            const targetDetails = relNode.data.targetEntityDetails;
            
            if (!sourceDetails || !targetDetails) continue;

            const isSourceMany = sourceDetails.maxCardinality === 'Many';
            const isTargetMany = targetDetails.maxCardinality === 'Many';

            if (isSourceMany && isTargetMany) {
                // M:N, attribute goes on the associative table
                parentTable = nodeMap.get(relNode.id) as TableNode;
            } else if (!isSourceMany && isTargetMany) {
                // 1:N, attribute goes on the "N" side (target)
                parentTable = nodeMap.get(targetDetails.id) as TableNode;
            } else if (isSourceMany && !isTargetMany) {
                // N:1, attribute goes on the "N" side (source)
                parentTable = nodeMap.get(sourceDetails.id) as TableNode;
            } else {
                // 1:1, attribute goes on the "Optional" side
                if (relNode.data.isIdentifying) {
                    const sourceNode = entityNodes.get(sourceDetails.id);
                    parentTable = (sourceNode?.data.type === 'Weak') 
                        ? nodeMap.get(sourceDetails.id) as TableNode 
                        : nodeMap.get(targetDetails.id) as TableNode;
                } else {
                    parentTable = (targetDetails.minCardinality === 'Optional')
                        ? nodeMap.get(targetDetails.id) as TableNode
                        : nodeMap.get(sourceDetails.id) as TableNode;
                }
            }
        }

        if (!parentTable || parentTable.type !== 'Table') {
            continue;
        }

        const columnName = (namePrefix + node.data.label).toLowerCase();

        // # Attribute Processing
        
        // Multivalued (creates a new table)
        if (flags.Multivalued) {
            handleMultivaluedAttribute(node, parentTable, columnName, cGroups, nodes, processedAttributes, [nodeMap, edgeMap]);
        }

        // Composite and not Multivalued (does nothing, children are processed individually)
        else if (flags.Composite) {
            continue
        }

        // Simple (adds a column)
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

            // Handle partial keys for Weak Entities
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