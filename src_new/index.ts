import fs from "fs";
import path from "path";
import { Diagram } from "./core/types";
import readErdplusFile from "./io/readErdplusFile";
import saveErdPlusFile from "./io/saveErdplusFile";
import parseErdToRelational from "./parser";

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
    console.log(`Processing ${files.length} .erdplus files...`);

    for (const fileName of files) {
        const baseName = path.basename(fileName, ".erdplus");
        try {
            const dg: Diagram = await readErdplusFile(path.join(inputFolder, fileName));
            const rel: Diagram = parseErdToRelational(dg)
            const outputPath = path.join(outputFolder, `${baseName}-relational.erdplus`);
            await saveErdPlusFile(rel, outputPath);
        } catch (error) {
            console.error(`Error parsing file ${fileName}:\n`, error)
        }
    }
    
  } catch (error) {
    console.error("Error parsing files:", error);
  }
})();