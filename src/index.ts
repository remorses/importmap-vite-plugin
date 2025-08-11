import type { Plugin } from "vite";
import path from 'path'

interface ImportMapPluginOptions {
  imports: Record<string, string>;
}

export function importMapPlugin({
  imports = {},
}: ImportMapPluginOptions): Plugin {
  const VIRTUAL_IMPORTMAP_ID = "virtual:importmap";
  const RESOLVED_VIRTUAL_IMPORTMAP_ID = "\0" + VIRTUAL_IMPORTMAP_ID;

  const chunkReferenceMap = new Map<string, string>();

  return {
    name: "importmaps",

    resolveId(id) {
      if (id === VIRTUAL_IMPORTMAP_ID) {
        return RESOLVED_VIRTUAL_IMPORTMAP_ID;
      }
    },

    buildStart() {
      // Emit chunks for local imports during build
      if (!this.meta.watchMode) {
        for (const [key, value] of Object.entries(imports)) {
          if (value.startsWith("./") || value.startsWith("../")) {
            const resolvedPath = path.resolve(value);
            const fileRef = this.emitFile({
              type: "chunk",
              id: resolvedPath,
              preserveSignature: "strict",
            });
            chunkReferenceMap.set(key, fileRef);
          }
        }
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_IMPORTMAP_ID) {
        const importMapEntries: string[] = [];

        if (this.meta.watchMode) {
          // Dev mode: use ?url imports
          const importStatements: string[] = [];
          let importIndex = 0;

          for (const [key, value] of Object.entries(imports)) {
            if (value.startsWith("./") || value.startsWith("../")) {
              const varName = `import_${importIndex++}`;
              importStatements.push(`import ${varName} from '${value}?url'`);
              importMapEntries.push(
                `'${key}': new URL(${varName}, import.meta.url).href`,
              );
            } else {
              importMapEntries.push(`'${key}': ${JSON.stringify(value)}`);
            }
          }

          return `
${importStatements.join("\n")}

export default {
  imports: {
    ${importMapEntries.join(",\n    ")}
  }
}`;
        } else {
          // Build mode: use emitted chunk references
          for (const [key, value] of Object.entries(imports)) {
            const chunkRef = chunkReferenceMap.get(key);
            if (chunkRef) {
              // Use import.meta.ROLLUP_FILE_URL_ for chunk references
              importMapEntries.push(
                `'${key}': new URL(import.meta.ROLLUP_FILE_URL_${chunkRef}, import.meta.url).href`,
              );
            } else {
              importMapEntries.push(`'${key}': ${JSON.stringify(value)}`);
            }
          }

          return `
export default {
  imports: {
    ${importMapEntries.join(",\n    ")}
  }
}`;
        }
      }
    },
  };
}
