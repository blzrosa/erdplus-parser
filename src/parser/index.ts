import {
    Diagram,
    ErdDiagram,
    ErdNode,
    RelationalEdge,
    RelationalNode,
    LabelNode,
    EntityNode,
    AttributeNode,
    RelationshipNode,
    DiagramTypes,
    RelationalGraph,
    RelationalDiagram
} from '../core/types';
import fixAttributes from '../utils/fixAttributes';
import fixIds from '../utils/fixIds';
import { handleAttributeNodes } from './handlers/attributeHandler';
import { handleEntityNodes } from './handlers/entityHandler';
import { handleLabelNodes } from './handlers/labelHandler';
import { handleRelationshipNodes } from './handlers/relationshipHandler';
import { cleanupWeakEntityPKs } from './handlers/weakEntityHandler';

// Define the structure for processing nodes
type NodesToProcess = {
    labels: Map<string, LabelNode>,
    entities: Map<string, EntityNode>,
    relationships: Map<string, RelationshipNode>,
    attributes: Map<string, AttributeNode>
};

/**
 * Orchestrates the processing of all ER node types in the correct order.
 */
function processNodes(
    toProcess: NodesToProcess,
    [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>]
) {
    const maps: [Map<string, RelationalNode>, Map<string, RelationalEdge>] = [nodeMap, edgeMap];
    
    // Order of operations is critical
    handleLabelNodes(toProcess.labels, maps);
    handleEntityNodes(toProcess.entities, maps);
    handleRelationshipNodes(toProcess.relationships, toProcess.entities, maps);
    cleanupWeakEntityPKs(toProcess.entities, maps);
    handleAttributeNodes(toProcess.attributes, toProcess.entities, toProcess.relationships, maps);
}

/**
 * Converts an ERD into maps of RelationalNodes and RelationalEdges
 */
function erdToRelationalMaps(erd: ErdDiagram): [Map<string, RelationalNode>, Map<string, RelationalEdge>] {
    const erdNodes: ErdNode[] = erd.data.nodes as ErdNode[];
    
    // Sort all ER nodes into maps by type
    const toProcess: NodesToProcess = {
        labels: new Map(),
        entities: new Map(),
        relationships: new Map(),
        attributes: new Map()
    };

    for (const erdNode of erdNodes) {
        switch (erdNode.type) {
            case 'Label':
                toProcess.labels.set(erdNode.id, erdNode as LabelNode);
                break;
            case 'Entity':
                toProcess.entities.set(erdNode.id, erdNode as EntityNode);
                break;
            case 'Attribute':
                toProcess.attributes.set(erdNode.id, erdNode as AttributeNode);
                break;
            case 'Relationship':
                toProcess.relationships.set(erdNode.id, erdNode as RelationshipNode);
                break;
        }
    }
    
    const [nodeMap, edgeMap]: [Map<string, RelationalNode>, Map<string, RelationalEdge>] = [new Map(), new Map()];
    processNodes(toProcess, [nodeMap, edgeMap]);
    return [nodeMap, edgeMap];
}

/**
 * Builds the final arrays of nodes and edges from the maps
 */
function buildRelationalNodesAndEdges(erd: ErdDiagram): [RelationalNode[], RelationalEdge[]] {
    let [nodeMap, edgeMap] = erdToRelationalMaps(erd);
    
    const parsed_nodes: RelationalNode[] = Array.from(nodeMap.values());
    const parsed_edges: RelationalEdge[] = Array.from(edgeMap.values());
    return [parsed_nodes, parsed_edges];
}

/**
 * Builds the RelationalGraph object
 */
function buildRelationalGraph(erd: ErdDiagram): RelationalGraph {
    const [parsed_nodes, parsed_edges]: [RelationalNode[], RelationalEdge[]] = buildRelationalNodesAndEdges(erd);
    
    const relationalGraph: RelationalGraph = {
        nodes: parsed_nodes,
        edges: parsed_edges,
        viewport: erd.data.viewport || { x: 0.0, y: 0.0, zoom: 1.0 }
    };
    return relationalGraph;
}

/**
 * Builds the final Relational Diagram wrapper
 */
function buildRelationalDiagram(erd: ErdDiagram): RelationalDiagram {
    const relationalGraph = buildRelationalGraph(erd);
    return {
        diagramType: DiagramTypes.RELATIONAL,
        id: 0, // Simple Placeholder
        name: `${erd.name}_Relational`,
        folder: erd.folder,
        updatedAtTimestamp: Math.floor(Date.now() / 1000),
        data: relationalGraph,
    };
}

/**
 * Main export function.
 * Converts an ER Diagram into a Relational Diagram.
 */
export default function parseErdToRelational(diagram: Diagram): Diagram {
    if (diagram.diagramType === DiagramTypes.RELATIONAL) {
        return diagram; // Already relational, no-op
    }

    const erd = diagram as ErdDiagram;

    // Fix potential inconsistencies in the ERD file first
    fixIds(erd);
    fixAttributes(erd);
    
    const relationalParsed: Diagram = buildRelationalDiagram(erd);
    return relationalParsed;
}