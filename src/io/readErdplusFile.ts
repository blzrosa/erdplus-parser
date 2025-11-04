import * as fs from 'fs/promises';
import * as path from 'path';
import z from 'zod';
import { Diagram, DiagramSchema } from '../core/types';

export default async function readErdplusFile(filePath: string): Promise<Diagram> {
    try {
        const fullPath = path.resolve(filePath);
        const fileContent = await fs.readFile(fullPath, { encoding: 'utf-8' });
        const jsonData = JSON.parse(fileContent);
        const diagram = DiagramSchema.parse(jsonData);
        return diagram;

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error(`Invalid .erdplus file format in ${filePath}:`);
            throw new Error(`Invalid .erdplus file format in ${filePath}:\n${JSON.stringify(z.treeifyError(error), null, 2)}`);
        }
        throw new Error(`Error processing file ${filePath}:\n${error}`);
    }
}