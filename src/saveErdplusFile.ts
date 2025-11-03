import { Diagram } from "./interfaces";
import * as fs from 'fs/promises';

export default async function saveErdPlusFile(diagram: Diagram, outputPath: string) {
    try {
        const jsonString = JSON.stringify(diagram, null, 2);
        await fs.writeFile(outputPath, jsonString, 'utf-8');
        console.log(`File saved as ${outputPath}`);
    } catch (error) {
        console.error("Error saving File:", error);
    }
}