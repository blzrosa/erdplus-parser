import fs from "fs";
import path from "path";
import { Diagram } from "./interfaces";
import readErdplusFile from "./readErdplusFile";
import parseErdToRelational from "./parser";
import saveErdPlusFile from "./saveErdplusFile";

const inputFolder = 'input'
const outputFolder = 'output';

(async () => {
  try {

    if (!fs.existsSync(outputFolder)) {
        fs.mkdir(outputFolder, { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    const files = fs.readdirSync(inputFolder).filter(file => file.endsWith(".erdplus"));
    for (const fileName of files) {
        const baseName = path.basename(fileName, ".erdplus");
        try {
            const dg: Diagram = await readErdplusFile(path.join(inputFolder, fileName));
            const rel: Diagram = parseErdToRelational(dg)
            const outputPath = path.join(outputFolder, `${baseName}-relational.erdplus`);
            saveErdPlusFile(rel, outputPath);
        } catch (error) {
            console.error(`Error parsing file ${fileName}:\n`, error)
        }
    }

    
  } catch (error) {
    console.error("Error parsing files:", error);
  }
})();