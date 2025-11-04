import { v4 as uuidv4 } from 'uuid';
import { EntityNode, ForeignKeyProps, RelationalEdge, RelationalNode, TableNode } from '../../core/types';
import {
    createBaseTableFromEntity,
    createPkColumn,
    createRelationalEdge,
    getPkColumns,
    toFkSimpleColumn
} from '../parserUtils';

export function handleEntityNodes(
    nodes: Map<string, EntityNode>, 
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    // First pass: Create all tables and their PKs
    for (const [id, node] of nodes) {
        const newTable: TableNode = createBaseTableFromEntity(node);
        if (!node.data.parentId) {
            newTable.data.columns.push(createPkColumn(`${newTable.data.label}_id`));
        }
        else {
            // This handles subtype entities, inheriting the parent's PK name
            const parentNode: EntityNode = nodes.get(node.data.parentId) as EntityNode;
            newTable.data.columns.push(createPkColumn(`${parentNode.data.label}_id`))
        }
        nodeMap.set(id, newTable);
    }

    // Second pass: Create 1:1 edges for subtypes (parent/child entities)
    for (const [id, node] of nodes) {
        if (node.data.parentId) {
            const table = nodeMap.get(id) as TableNode;
            const parentTable = nodeMap.get(node.data.parentId) as TableNode;
            const pkFkColumn = getPkColumns(table.data.columns)[0];
            if (!pkFkColumn) continue;
            
            // The child's PK is also a FK referencing the parent
            pkFkColumn.isForeignKey = true;
            const fkProps = {
                foreignKeyGroupId: uuidv4(),
                sourceTableId: parentTable.id,
                columns: [toFkSimpleColumn(pkFkColumn, parentTable)]
            } as ForeignKeyProps;
            pkFkColumn.foreignKeyProps = fkProps;
            
            // new Edge
            const newEdge = createRelationalEdge(table, parentTable, fkProps);
            edgeMap.set(newEdge.id, newEdge)
        }
    }
}