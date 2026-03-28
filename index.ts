import { parseQuiz } from "./parser";
import { generateHTML } from "./generator";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: bun run index.ts <quiz.md> [output.html]");
  process.exit(1);
}

const inputPath = args[0]!;
const inputFile = Bun.file(inputPath);

if (!(await inputFile.exists())) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

const markdown = await inputFile.text();
const quiz = parseQuiz(markdown);

const outputPath = args[1] ?? inputPath.replace(/\.md$/, ".html");
await Bun.write(outputPath, generateHTML(quiz));

console.log(`Generated ${outputPath} (${quiz.questions.length} questions)`);
