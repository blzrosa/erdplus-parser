import { Diagram } from "./interfaces";
import readErdplusFile from "./readErdplusFile";
import parseErdToRelational from "./parser";
import saveErdPlusFile from "./saveErdplusFile";

const inputFolder = 'data/tests'
const fileName = 'TesteVariacoes';
const outputFolder = 'data/tests/results';

(async () => {
  try {
    const dg: Diagram = await readErdplusFile(`${inputFolder}/${fileName}.erdplus`);
    const rel: Diagram = parseErdToRelational(dg)
    saveErdPlusFile(rel, `${outputFolder}/${fileName}_rel.erdplus`)
  } catch (error) {
    console.error("Error parsing file:", error);
  }
})();