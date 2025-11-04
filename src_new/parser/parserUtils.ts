import { v4 as uuidv4 } from 'uuid';
import {
    AttributeNode,
    EntityNode,
    ForeignKeyProps,
    Int,
    RelationalEdge,
    SimpleColumn,
    SQLType,
    TableColumn,
    TableNode,
} from '../core/types';

/**
 * Creates a base TableNode from an EntityNode
 */
export function createBaseTableFromEntity(node: EntityNode): TableNode {
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

/**
 * Creates a default Primary Key column
 */
export function createPkColumn(name: string = 'id'): TableColumn {
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

/**
 * Creates a new Foreign Key column
 */
export function createFkColumn(columnName: string, type: SQLType, fkProps: ForeignKeyProps, isOptional: boolean): TableColumn {
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

/**
 * Filters a list of columns to find Primary Keys
 */
export function getPkColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(column => column.isPrimaryKey === true);
}

/**
 * Creates a RelationalEdge (the arrow between tables)
 */
export function createRelationalEdge(
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

/**
 * Creates a simplified column definition used inside ForeignKeyProps
 */
export function toFkSimpleColumn(column: TableColumn, target: TableNode, fkName: string = ''): SimpleColumn {
    const newFkColumn: SimpleColumn = {
        id: `fk_${column.id}`,
        name: fkName !== '' ? fkName : `fk_${target.data.label}`,
        type: column.type,
    };
    return newFkColumn;
}

/**
 * Helper to get attribute flags, handling the preprocessed {}
 */
export function getAttributeFlags(flags: { [key: string]: boolean }): { [key: string]: boolean } {
    return flags;
}

/**
 * Checks if any attribute in the composite hierarchy is Derived
 */
export function isAnyParentDerived(
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

/**
 * Checks if any attribute in the composite hierarchy is Optional
 */
export function isAnyParentOptional(
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

/**
 * Gets all UNIQUE group numbers from an attribute's hierarchy
 */
export function getUGroups(
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
