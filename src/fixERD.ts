import { Diagram, ErdEdge, ErNode } from "./interfaces";

interface RelationshipMapEntry {
    sourcePlaceholder: string | null,
    targetPlaceholder: string | null,
    sourceRealId: string | null,
    targetRealId: string | null,
}

export default function fixERD(dg: Diagram) {
    const nodes: ErNode[] = dg.data.nodes as ErNode[];
    const edges: ErdEdge[] = dg.data.edges as ErdEdge[];
    const relationshipMap: Map<string, RelationshipMapEntry> = new Map();

    for (const node of nodes) {
        if (!(node.type === 'Relationship')) continue;

        const relId: string = node.id;
        const sourcePlaceholder: string = node.data.sourceEntityDetails?.id as string;
        const targetPlaceholder: string = node.data.targetEntityDetails?.id as string;
        relationshipMap.set(relId, { sourcePlaceholder, targetPlaceholder, sourceRealId: null, targetRealId: null })
    }

    for (const edge of edges) {
        if (!(edge.type === 'Relationship')) continue;
        
        const relId: string = edge.source;
        const realEntityId: string = edge.target;
        const mapEntry = relationshipMap.get(relId)
        if (!mapEntry) continue;

        const idParts: string[] = edge.id.split(';')
        const entityPart: string = idParts[1]
        if (entityPart.startsWith(realEntityId)) {
            mapEntry.sourceRealId = realEntityId
        } else if (entityPart.endsWith(realEntityId)) {
            mapEntry.targetRealId = realEntityId
        }
    }

    for (const node of nodes) {
        if (!(node.type === 'Relationship')) continue;

        const mapEntry = relationshipMap.get(node.id);
        const sourceRealId = mapEntry?.sourceRealId;
        const targetRealId = mapEntry?.targetRealId;
        if (!(sourceRealId && targetRealId)) continue;                
        
        const sourceEntityDetails = node.data.sourceEntityDetails;
        const targetEntityDetails = node.data.targetEntityDetails;
        if (sourceEntityDetails && targetEntityDetails) {
            sourceEntityDetails.id = sourceRealId;
            targetEntityDetails.id = targetRealId;
        }
    }

    for (const edge of edges) {
        if (!(edge.type === 'Relationship')) continue;

        const relId = edge.source;
        const thisEdgeTargetId = edge.target;
        const mapEntry = relationshipMap.get(relId);
        const sourceRealId = mapEntry?.sourceRealId;
        const targetRealId = mapEntry?.targetRealId;
        if (!(sourceRealId && targetRealId)) continue;                
        edge.id = `${relId}->${thisEdgeTargetId};${sourceRealId}->${targetRealId}`;
        if (edge.data) {
            edge.data.id = `${relId}->${thisEdgeTargetId}`;
        }
    }

}