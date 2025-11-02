import * as fs from 'fs/promises';
import * as path from 'path';
import { Diagram } from './interfaces';

export default async function readErdplusFile(filePath: string): Promise<Diagram> {
    try {
        const fullPath = path.resolve(filePath);
        const fileContent = await fs.readFile(fullPath, { encoding: 'utf-8' });
        const jsonData = JSON.parse(fileContent);
        // TODO: Use Zod in the future
        const diagram = jsonData as Diagram;
        return diagram;

    } catch (error) {
        throw Error(`Error processing file:\n${error}`);
    }
}