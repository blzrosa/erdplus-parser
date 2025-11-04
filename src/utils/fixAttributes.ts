import { Diagram, ErdEdge, ErdNode } from "../core/types";

export default function fixAttributes(dg: Diagram) {
    const nodes: ErdNode[] = dg.data.nodes as ErdNode[];
    const edges: ErdEdge[] = dg.data.edges as ErdEdge[];
    const attributeParentMap: Map<string, string> = new Map();
    
    for (const edge of edges) {
        if (edge.type !== 'Attribute') continue;
        attributeParentMap.set(edge.target, edge.source);
    }

    for (const node of nodes) {
        if (node.type !== 'Attribute') continue;
        const parentId = attributeParentMap.get(node.id);
        if (!parentId) continue;
        node.parentId = parentId;
    }
}
