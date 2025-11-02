import { Diagram } from "./interfaces";
import readErdplusFile from "./readErdplusFile";
import parseErdToRelational from "./parser";
import saveErdPlusFile from "./saveErdplusFile";

(async () => {
  try {
    const dg: Diagram = await readErdplusFile('data/TesteVariacoes2.erdplus');
    const rel: Diagram = parseErdToRelational(dg)
    saveErdPlusFile(rel, 'data/output.erdplus')
  } catch (error) {
    console.error("Error parsing file:", error);
  }
})();