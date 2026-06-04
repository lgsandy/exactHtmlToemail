import { extractTokens } from './extract.js';
import { createEmail } from './create.js';
import { createEmail as createDesignEmail } from './design-create.js';
import { createEmail as createMjmlEmail } from './mjml-create.js';
import path from 'path';
import fs from 'fs';

function showHelp() {
  console.log(`
Pharma Email Design System Tool CLI
====================================
Usage:
  node index.js <command> [arguments]

Commands:
  extract   Extract design tokens from a sample HTML email.
            Usage: node index.js extract <path-to-html> [path-to-output-json]
            Example: node index.js extract "./ModCon TRO Emailer.html" "./output/design_tokens.json"

  create    Generate a new responsive email using design tokens and copy text.
            Usage: node index.js create <path-to-tokens-json> <content-prompt-or-file> [path-to-output-html]
            Example: node index.js create "./output/design_tokens.json" "Create a brief update about Trodelvy clinical data." "./output/generated_email.html"

  design-create Generate a modern, premium, visually striking email using design tokens and copy text (keeping exact colors and font sizes).
                Usage: node index.js design-create <path-to-tokens-json> <content-prompt-or-file> [path-to-output-html]
                Example: node index.js design-create "./output/design_tokens.json" "Create a brief update about Biktarvy." "./output/premium_email.html"

  mjml-create   Generate a responsive email in MJML markup instead of HTML.
                Usage: node index.js mjml-create <path-to-tokens-json> <content-prompt-or-file> [path-to-output-mjml]
                Example: node index.js mjml-create "./output/design_tokens.json" "Create a brief update about Biktarvy." "./output/generated_email.mjml"

  run-all       Run the full pipeline (extract tokens first, then generate a new email using them).
                Usage: node index.js run-all <path-to-html> <content-prompt-or-file> [output-dir]
                Example: node index.js run-all "./ModCon TRO Emailer.html" "Create a brief update about Trodelvy clinical data." "./output"

  run-all-mjml  Run the full MJML pipeline (extract tokens first, then generate a new MJML email).
                Usage: node index.js run-all-mjml <path-to-html> <content-prompt-or-file> [output-dir]
                Example: node index.js run-all-mjml "./ModCon TRO Emailer.html" "Create a brief update about Trodelvy clinical data." "./output"

  help          Show this help information.
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0].toLowerCase();

  try {
    switch (command) {
      case 'help':
      case '-h':
      case '--help':
        showHelp();
        break;

      case 'extract': {
        if (args.length < 2) {
          console.error('Error: Missing arguments for extract.');
          console.error('Usage: node index.js extract <path-to-html> [path-to-output-json]');
          process.exit(1);
        }
        const htmlPath = args[1];
        const outputJson = args[2] || './output/design_tokens.json';
        await extractTokens(htmlPath, outputJson);
        break;
      }

      case 'create': {
        if (args.length < 3) {
          console.error('Error: Missing arguments for create.');
          console.error('Usage: node index.js create <path-to-tokens-json> <content-prompt-or-file> [path-to-output-html]');
          process.exit(1);
        }
        const tokensJson = args[1];
        const content = args[2];
        const outputHtml = args[3] || './output/generated_email.html';
        await createEmail(tokensJson, content, outputHtml);
        break;
      }

      case 'design-create': {
        if (args.length < 3) {
          console.error('Error: Missing arguments for design-create.');
          console.error('Usage: node index.js design-create <path-to-tokens-json> <content-prompt-or-file> [path-to-output-html]');
          process.exit(1);
        }
        const tokensJson = args[1];
        const content = args[2];
        const outputHtml = args[3] || './output/generated_email.html';
        await createDesignEmail(tokensJson, content, outputHtml);
        break;
      }

      case 'mjml-create': {
        if (args.length < 3) {
          console.error('Error: Missing arguments for mjml-create.');
          console.error('Usage: node index.js mjml-create <path-to-tokens-json> <content-prompt-or-file> [path-to-output-mjml]');
          process.exit(1);
        }
        const tokensJson = args[1];
        const content = args[2];
        const outputMjml = args[3] || './output/generated_email.mjml';
        await createMjmlEmail(tokensJson, content, outputMjml);
        break;
      }

      case 'run-all': {
        if (args.length < 3) {
          console.error('Error: Missing arguments for run-all.');
          console.error('Usage: node index.js run-all <path-to-html> <content-prompt-or-file> [output-dir]');
          process.exit(1);
        }
        const sampleHtmlPath = args[1];
        const contentPromptOrFile = args[2];
        const outputDir = args[3] || './output';

        const tokensJsonPath = path.join(outputDir, 'design_tokens.json');
        const outputHtmlPath = path.join(outputDir, 'generated_email.html');

        console.log('=== STEP 1: EXTRACTING DESIGN TOKENS ===');
        await extractTokens(sampleHtmlPath, tokensJsonPath);

        console.log('\n=== STEP 2: GENERATING EMAIL FROM TOKENS ===');
        await createEmail(tokensJsonPath, contentPromptOrFile, outputHtmlPath);

        console.log('\nPipeline completed successfully!');
        console.log(`Design tokens: ${tokensJsonPath}`);
        console.log(`Generated email: ${outputHtmlPath}`);
        break;
      }

      case 'run-all-mjml': {
        if (args.length < 3) {
          console.error('Error: Missing arguments for run-all-mjml.');
          console.error('Usage: node index.js run-all-mjml <path-to-html> <content-prompt-or-file> [output-dir]');
          process.exit(1);
        }
        const sampleHtmlPath = args[1];
        const contentPromptOrFile = args[2];
        const outputDir = args[3] || './output';

        const tokensJsonPath = path.join(outputDir, 'design_tokens.json');
        const outputMjmlPath = path.join(outputDir, 'generated_email.mjml');

        console.log('=== STEP 1: EXTRACTING DESIGN TOKENS ===');
        await extractTokens(sampleHtmlPath, tokensJsonPath);

        console.log('\n=== STEP 2: GENERATING MJML EMAIL FROM TOKENS ===');
        await createMjmlEmail(tokensJsonPath, contentPromptOrFile, outputMjmlPath);

        console.log('\nPipeline completed successfully!');
        console.log(`Design tokens: ${tokensJsonPath}`);
        console.log(`Generated MJML email: ${outputMjmlPath}`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('\nExecution failed:', err.message);
    process.exit(1);
  }
}

main();
