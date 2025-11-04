import { v4 as uuidv4 } from 'uuid';
import {
    EntityDetails,
    EntityNode,
    ForeignKeyProps,
    RelationalEdge,
    RelationalNode,
    RelationshipNode,
    TableNode
} from '../../core/types';
import {
    createFkColumn,
    createRelationalEdge,
    getPkColumns,
    toFkSimpleColumn
} from '../parserUtils';

/**
 * Handles M:N relationships by creating an associative table
 */
export function handleMNRelationship(
    entityNodes: Map<string, EntityNode>,
    node: RelationshipNode,
    sourceDetails: EntityDetails,
    targetDetails: EntityDetails,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    const sourceTable = nodeMap.get(sourceDetails.id) as TableNode;
    const targetTable = nodeMap.get(targetDetails.id) as TableNode;

    const sourceCandidatePks = getPkColumns(sourceTable.data.columns);
    const sourceNode: EntityNode = entityNodes.get(sourceDetails.id) as EntityNode;
    const sourcePks = sourceNode.data.type !== 'Weak' ? sourceCandidatePks :  sourceCandidatePks.filter(col => {
                    const isPlaceholder = col.isPrimaryKey === true && col.isForeignKey !== true;
                    return isPlaceholder; // Removes only the placeholder
                });
    
    const targetCandidatePks = getPkColumns(targetTable.data.columns);
    const targetNode: EntityNode = entityNodes.get(targetDetails.id) as EntityNode;
    const targetPks = targetNode.data.type !== 'Weak' ? targetCandidatePks :  targetCandidatePks.filter(col => {
                    const isPlaceholder = col.isPrimaryKey === true && col.isForeignKey !== true;
                    return isPlaceholder; // Removes only the placeholder
                });
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

    const isSelfRelationship = node.data.isSelfReferencing;
    const [label1, label2] : [string, string] = isSelfRelationship ? [`${sourceNode.data.label}(1)`, `${targetNode.data.label}(2)`] : [sourceNode.data.label, targetNode.data.label]

    let currentPosition = 0

    const fk1Props: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: sourceTable.id,
        columns: sourcePks.length > 1 ? 
        sourcePks.map((pk, index) => toFkSimpleColumn(pk, sourceTable, `${label1}_${index+1}`)) :
        sourcePks.map(pk => toFkSimpleColumn(pk, sourceTable, label1)),
    };
    const fk1Column = createFkColumn(label1, 'INT', fk1Props, false);
    fk1Column.isPrimaryKey = true; // Part of the compose PK
    fk1Column.position = currentPosition++;
    newTable.data.columns.push(fk1Column);

    const fk2Props: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: targetTable.id,
        columns: targetPks.length > 1 ? 
        targetPks.map((pk, index) => toFkSimpleColumn(pk, targetTable, `${label2}_${index+1}`)) :
        targetPks.map(pk => toFkSimpleColumn(pk, targetTable, label2)),
    };
    const fk2Column = createFkColumn(label2, 'INT', fk2Props, false);
    fk2Column.isPrimaryKey = true; // Part of the compose PK
    fk2Column.position = currentPosition++;
    newTable.data.columns.push(fk2Column);
    
    nodeMap.set(newTable.id, newTable);

    const edge1 = createRelationalEdge(newTable, sourceTable, fk1Props);
    const edge2 = createRelationalEdge(newTable, targetTable, fk2Props);
    edgeMap.set(edge1.id, edge1);
    edgeMap.set(edge2.id, edge2);
}

/**
 * Handles 1:N and 1:1 relationships by adding a FK to the "Many" side
 */
export function handle1NRelationship(
    entityNodes: Map<string, EntityNode>,
    node: RelationshipNode,
    oneDetails: EntityDetails,
    manyDetails: EntityDetails,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>],
    isOneToOne: boolean = false
) {
    const oneTable = nodeMap.get(oneDetails.id) as TableNode;  // "1" Side
    const manyTable = nodeMap.get(manyDetails.id) as TableNode; // "N" Side

    const oneCandidatePks = getPkColumns(oneTable.data.columns);
    const oneNode: EntityNode = entityNodes.get(oneDetails.id) as EntityNode;
    const onePks = oneNode.data.type !== 'Weak' ? oneCandidatePks :  oneCandidatePks.filter(col => {
                    const isPlaceholder = col.isPrimaryKey === true && col.isForeignKey !== true;
                    return isPlaceholder; // Removes only the placeholder
                });
    if (onePks.length === 0) return;

    const fkProps: ForeignKeyProps = {
        foreignKeyGroupId: uuidv4(),
        sourceTableId: oneTable.id,
        columns: onePks.map(pk => toFkSimpleColumn(pk, oneTable, node.data.label)),
    };
    
    const fkColumn = createFkColumn(node.data.label, 'INT', fkProps, false);
    // Weak Entity
    if (node.data.isIdentifying) {
        fkColumn.isPrimaryKey = true;
    }

    if (isOneToOne) {
        fkColumn.isUnique = true;
    }
    
    fkColumn.position = manyTable.data.columns.length;
    manyTable.data.columns.push(fkColumn);

    const newEdge = createRelationalEdge(manyTable, oneTable, fkProps);
    edgeMap.set(newEdge.id, newEdge);
}

/**
 * Handles 1:1 relationships by adding the FK to the optional/weak side
 */
export function handle11Relationship(
    entityNodes: Map<string, EntityNode>,
    node: RelationshipNode,
    sourceDetails: EntityDetails,
    targetDetails: EntityDetails,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>],
) {
    // FK goes to the Optional side
    if (node.data.isIdentifying) {
        const sourceNode = entityNodes.get(sourceDetails.id);
        const targetNode = entityNodes.get(targetDetails.id);
        if (sourceNode?.data.type === 'Weak') {
            handle1NRelationship(entityNodes, node, targetDetails, sourceDetails, [nodeMap, edgeMap], true);
        } else if (targetNode?.data.type === 'Weak') {
            handle1NRelationship(entityNodes, node, sourceDetails, targetDetails, [nodeMap, edgeMap], true);
        } else {
            if (targetDetails.minCardinality === 'Optional') {
                handle1NRelationship(entityNodes, node, sourceDetails, targetDetails, [nodeMap, edgeMap], true);
            } else {
                handle1NRelationship(entityNodes, node, targetDetails, sourceDetails, [nodeMap, edgeMap], true);
            }
        }
    } else {
        if (targetDetails.minCardinality === 'Optional') {
            handle1NRelationship(entityNodes, node, sourceDetails, targetDetails, [nodeMap, edgeMap], true);
        } else {
            handle1NRelationship(entityNodes, node, targetDetails, sourceDetails, [nodeMap, edgeMap], true);
        }
    }
}

/**
 * Orchestrates all relationship node processing
 */
export function handleRelationshipNodes(
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
            handleMNRelationship(entityNodes, node, sourceDetails, targetDetails, [nodeMap, edgeMap]);
        }
        
        // 1:N
        else if (!isSourceMany && isTargetMany) {
            // source is "1", target is "N"
            handle1NRelationship(entityNodes, node, sourceDetails, targetDetails, [nodeMap, edgeMap]);
        }
        
        // N:1
        else if (isSourceMany && !isTargetMany) {
            // source is "N", target is "1"
            handle1NRelationship(entityNodes, node, targetDetails, sourceDetails, [nodeMap, edgeMap]);
        }
        
        // 1:1
        else {
            handle11Relationship(entityNodes, node, sourceDetails, targetDetails, [nodeMap, edgeMap])
        }
    }
}