import { 
    EntityNode, 
    RelationalEdge, 
    RelationalNode, 
    TableNode 
} from '../../core/types';

/**
 * Removes the placeholder PK from Weak Entities if they now 
 * have a real PK (from an identifying relationship).
 */
export function cleanupWeakEntityPKs(
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