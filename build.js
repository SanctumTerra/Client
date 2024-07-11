const swc = require("@swc/core");
const fs = require("fs");
const path = require("path");

const ignoredPaths = [
  '.git', 
  'node_modules', 
  'tsconfig.json',
  'package.json',
  'dist',
  'package-lock.json',
  'yarn.lock',
  '.swcrc',
  '.gitignore',
  'tokens',
  'build.js',
  '.github'
];

const allowedExtensions = ['.ts', '.js', '.mjs', '.cjs', '.tsx', '.jsx', '.json'];

const mkdirSyncRecursive = (directory) => {
  const parentDirectory = path.dirname(directory);
  if (!fs.existsSync(parentDirectory)) {
    mkdirSyncRecursive(parentDirectory);
  }
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
};

const compile = async (filePath) => {
  const sourceCode = fs.readFileSync(filePath, "utf-8");
  const { code } = await swc.transform(sourceCode, {
    filename: path.basename(filePath),
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
        dynamicImport: true,
        decorators: true  
      },
      target: "es2021",
      loose: true,
      externalHelpers: true
    },
    module: {
      type: "commonjs"
    }
  });
  return code;
};

const compileDirectory = async (srcDir, outDir) => {
  try {
    const files = fs.readdirSync(srcDir);
    
    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      const outPath = path.join(outDir, file.replace(/\.(ts|tsx)$/, '.js')); 

      if (ignoredPaths.includes(file)) {
        continue;
      }

      try {
        const stats = fs.lstatSync(fullPath);
        if (stats.isDirectory()) {
          if (!fs.existsSync(outPath)) mkdirSyncRecursive(outPath);
          await compileDirectory(fullPath, outPath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (!allowedExtensions.includes(ext)) {
            console.log(`Skipping file with unsupported extension: ${fullPath}`);
            continue;
          }

          if (ext === ".json") {
            mkdirSyncRecursive(path.dirname(outPath)); 
            fs.copyFileSync(fullPath, outPath);
          } else {
            const compiledCode = await compile(fullPath);
            mkdirSyncRecursive(path.dirname(outPath));  
            fs.writeFileSync(outPath, compiledCode);
          }
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${srcDir}:`, error.message);
  }
};

const srcDir = process.cwd();
const outDir = path.join(srcDir, 'dist');

compileDirectory(srcDir, outDir).then(() => {
  console.log("Compilation complete.");
}).catch(err => {
  console.error("Compilation failed:", err);
});