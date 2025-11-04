import fs from "fs";
import path from "path";
import { Diagram } from "./core/types";
import readErdplusFile from "./io/readErdplusFile";
import saveErdPlusFile from "./io/saveErdplusFile";
import parseErdToRelational from "./parser";

const inputFolder = 'data/tests'
const outputFolder = 'data/tests/results';

(async () => {
  try {

    if (!fs.existsSync(outputFolder)) {
        fs.mkdir(outputFolder, { recursive: true }, (err) => {
            if (err) throw err;
        });
    }

    const files = fs.readdirSync(inputFolder).filter(file => file.endsWith(".erdplus"));
    console.log(`[TEST] Found ${files.length} test files to process...`);

    for (const fileName of files) {
        const baseName = path.basename(fileName, ".erdplus");
        const inputPath = path.join(inputFolder, fileName);
        console.log(`[TEST] Processing ${inputPath}...`);
        try {
            const dg: Diagram = await readErdplusFile(path.join(inputFolder, fileName));
            const rel: Diagram = parseErdToRelational(dg)
            const outputPath = path.join(outputFolder, `${baseName}-relational.erdplus`);
            await saveErdPlusFile(rel, outputPath);
        } catch (error) {
            console.error("[TEST] Error parsing file:", error)
        }
    }
    console.log("[TEST] All test files processed.");
  } catch (error) {
    console.error("[TEST] Error parsing files:", error);
  }
})();