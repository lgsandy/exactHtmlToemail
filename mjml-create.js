import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Generates an MJML email template using the provided design tokens and email content prompt.
 * @param {string} tokensJsonPath 
 * @param {string} contentPromptOrFile 
 * @param {string} outputMjmlPath 
 */
export async function createEmail(tokensJsonPath, contentPromptOrFile, outputMjmlPath) {
  // Validate token file exists
  if (!fs.existsSync(tokensJsonPath)) {
    throw new Error(`Design tokens JSON not found at: ${tokensJsonPath}`);
  }

  console.log(`Reading design tokens from ${tokensJsonPath}...`);
  const tokensContent = fs.readFileSync(tokensJsonPath, 'utf-8');
  const tokens = JSON.parse(tokensContent);

  // Read content prompt or file
  let contentPrompt = contentPromptOrFile;
  if (fs.existsSync(contentPromptOrFile)) {
    console.log(`Reading email content copy from file: ${contentPromptOrFile}...`);
    contentPrompt = fs.readFileSync(contentPromptOrFile, 'utf-8');
  }

  // Verify credentials exist
  if (!process.env.AZURE_API_KEY || !process.env.AZURE_RESOURCE_NAME) {
    throw new Error('Azure API configuration missing! Please ensure AZURE_API_KEY and AZURE_RESOURCE_NAME are defined in your .env file.');
  }

  const azure = createAzure({
    resourceName: process.env.AZURE_RESOURCE_NAME,
    apiKey: process.env.AZURE_API_KEY,
  });

  const deploymentName = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o';
  console.log(`Using Azure OpenAI deployment: ${deploymentName}`);
  const model = azure(deploymentName);

  console.log('Generating MJML email template via LLM...');

  const systemInstructions = `You are a professional email developer specializing in building clean, well-structured, and fully responsive MJML (Mailjet Markup Language) templates for pharmaceutical products.
Your task is to take the provided Design Tokens (which define colors, typography, spacing, layout, image assets, and section structure) and the Email Content Copy, and generate a single, self-contained, valid MJML document.

You MUST follow these MJML coding rules:
1. **Valid MJML Structure**:
   - The document must start with \`<mjml>\` and end with \`</mjml>\`.
   - Wrap the main settings in \`<mj-head>\` (e.g., global attributes, font imports, styles).
   - Wrap the email sections in \`<mj-body width="{containerWidth}">\` where width matches the layout container width from the tokens (e.g. 600px).
   - Use standard \`<mj-section>\`, \`<mj-column>\`, \`<mj-text>\`, \`<mj-image>\`, \`<mj-button>\`, \`<mj-divider>\`, and \`<mj-spacer>\` tags. Do not use plain HTML tags unless absolutely necessary inside \`<mj-text>\`.

2. **Section Structure Alignment & Spacing**:
   - The Design Tokens contain a "structure" array which defines the exact ordered list of layout blocks from top to bottom. You MUST output these blocks in the specified order.
   - For each block, generate a \`<mj-section>\` with the specified "background-color" and "padding".
   - If a section contains text blocks, map the text copy into one or more \`<mj-text>\` components, matching the font-family, font-size, line-height, and colors defined in the tokens.
   - If a structural section has an "associatedAssetId", look up that ID in the "assets" registry, and render the corresponding image using \`<mj-image src="..." width="..." align="center" padding="0" />\`.
   - Ensure there is proper vertical spacing between sections by using section paddings or \`<mj-spacer height="20px" />\` where appropriate.

3. **Preheader Block**:
   - If a "preheader" design token is present and contains values (and is NOT null or undefined), generate a top \`<mj-section>\` containing a text component for the preheader text, using its styling (background color, text color, font size, padding). If it is null/undefined/missing, do not include it.

4. **CTA Buttons**:
   - Style buttons using \`<mj-button>\`:
     \`<mj-button background-color="{BUTTON_BG}" color="{TEXT_COLOR}" border-radius="{BORDER_RADIUS}" padding="{PADDING}" font-size="{FONT_SIZE}" font-weight="{FONT_WEIGHT}" align="{ALIGNMENT}" href="#">{BUTTON_TEXT}</mj-button>\`

5. **Bullet Lists**:
   - In MJML, represent bullet lists cleanly. You can use standard inline bullet elements inside \`<mj-text>\` or construct columns (e.g. 5% column for bullet icon and 95% column for text) to ensure neat indentation.

6. **Dividers**:
   - Use \`<mj-divider border-color="{COLOR}" border-width="{THICKNESS}" padding="{PADDING}" />\` matching the tokens.

Respond with ONLY the raw MJML code. Do not include markdown code block formatting (like triple backticks mjml) in your response, just the raw MJML code starting with '<mjml>' and ending with '</mjml>'.`;

  const prompt = `Use these Design Tokens (including the Assets Registry and Structure layout array):
${JSON.stringify(tokens, null, 2)}

Create a marketing email with this Content / Copy:
${contentPrompt}

Make sure you map the Content / Copy onto the sections defined in the "structure" array. 
Maintain the exact sequence:
1. Render each block in the "structure" array in order as an mj-section.
2. For each block, adapt the text content to fit the block's "contentSummary" description.
3. If a block has an associated asset ID (like the flowchart image or logo), include the corresponding mj-image from the "assets" registry.
4. Output a highly polished, clean MJML template that matches the design token rules perfectly.`;

  const response = await generateText({
    model,
    system: systemInstructions,
    prompt: prompt,
  });

  let cleanMjml = response.text.trim();
  // Strip markdown code block ticks if LLM returned them despite instruction
  if (cleanMjml.startsWith('```xml')) {
    cleanMjml = cleanMjml.substring(6);
  }
  if (cleanMjml.startsWith('```mjml')) {
    cleanMjml = cleanMjml.substring(7);
  }
  if (cleanMjml.startsWith('```html')) {
    cleanMjml = cleanMjml.substring(7);
  }
  if (cleanMjml.startsWith('```')) {
    cleanMjml = cleanMjml.substring(3);
  }
  if (cleanMjml.endsWith('```')) {
    cleanMjml = cleanMjml.substring(0, cleanMjml.length - 3);
  }
  cleanMjml = cleanMjml.trim();

  // Ensure output directory exists
  const outputDir = path.dirname(outputMjmlPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save the generated email MJML to file
  console.log(`Saving generated MJML email to ${outputMjmlPath}...`);
  fs.writeFileSync(outputMjmlPath, cleanMjml, 'utf-8');
  console.log('MJML email generation complete!');

  return cleanMjml;
}

// Running script directly from CLI
if (import.meta.url === `file://${path.resolve(process.argv[1]).replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node mjml-create.js <path-to-tokens-json> <content-prompt-or-file> [path-to-output-mjml]');
    process.exit(1);
  }

  const tokensJson = args[0];
  const content = args[1];
  const outputMjml = args[2] || './output/generated_email.mjml';

  try {
    await createEmail(tokensJson, content, outputMjml);
  } catch (err) {
    console.error('Error during email creation:', err.message);
    process.exit(1);
  }
}
