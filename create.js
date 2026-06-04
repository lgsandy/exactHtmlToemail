import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Generates an HTML email using the provided design tokens and email content prompt.
 * @param {string} tokensJsonPath 
 * @param {string} contentPromptOrFile 
 * @param {string} outputHtmlPath 
 */
export async function createEmail(tokensJsonPath, contentPromptOrFile, outputHtmlPath) {
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

  console.log('Generating HTML email via LLM...');

  const systemInstructions = `You are a professional email developer specializing in building pixel-perfect, highly responsive pharma marketing emails. 
Your task is to take the provided Design Tokens (which define colors, typography, spacing, layout, buttons, image assets, and section structure) and the Email Content Copy, and generate a single, self-contained HTML email.

To ensure the generated email renders flawlessly in ALL email clients (including old versions of Microsoft Outlook, Gmail, Apple Mail, and Yahoo Mail), you MUST adhere to the following strict coding standards:

1. **Section Structure Alignment & Spacing**:
   - The Design Tokens contain a "structure" array which defines the exact ordered list of layout blocks from top to bottom. You MUST output these blocks in the specified order.
   - For each block, use the specified "backgroundColor", "padding", and "componentType".
   - **CRITICAL COLOR ENFORCEMENT**: You MUST strictly use the "backgroundColor" defined for each block in the "structure" array (e.g. if a block specifies a light purple/lavender background like "#dddced", the background of that block container MUST be "#dddced", even if the brand's primary color is green). Do NOT make different blocks the same color if the structural tokens define distinct colors for them. Alternating or distinct section background colors (like purple and green blocks) must be preserved exactly.
   - **CRITICAL SPACING**: You MUST apply the exact "padding" value specified in the structure block to the wrapping \`<td>\` element of that section (e.g. \`<td style="padding: 20px 25px; ...">\`). Do not omit this padding; otherwise, visual components will touch each other. If a padding is empty or zero, apply a default safety padding of at least \`20px 20px\` to separate adjacent blocks.
   - If a structural section has an "associatedAssetId", look up that ID in the "assets" registry, and render the corresponding image (<img src="..." width="..." />) centered inside that section. Ensure there is healthy padding above and below the image inside its cell.
   - If two adjacent sections do not have background colors and appear touching, insert a spacer table between them:
     \`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="20" style="font-size:0px;line-height:0px;">&nbsp;</td></tr></table>\`

2. **Preheader Block**:
   - If a "preheader" design token is present and contains values (and is NOT null or undefined), generate a preheader block at the very top of the email body.
   - Use the text, background color, text color, font size, line height, and padding from the preheader token.
   - If the "preheader" token is null, undefined, or missing, do NOT generate any preheader block at the top of the email. Do not output any placeholder text or comments like "No preheader text present".

3. **Table-Based Layout**: 
   - Never use HTML5 layout elements like <section>, <article>, <header>, or <footer>. Never use flexbox or CSS grid.
   - Use nested tables for all layout structures: \`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">\`.
   - Set the main wrapper width to exactly the container width from the layout tokens (e.g. 600px).
   - Use Outlook wrapper tables around the main container:
     \`<!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600"><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->\`
     and close them at the end.

4. **Inline CSS**:
   - Apply all styling inline using the \`style\` attribute on the specific elements (mainly \`<td>\`, \`<div>\`, \`<span>\`, \`<a>\`). Do not assume styles will inherit; apply font-family, font-size, line-height, and color directly on text containers.

5. **Typography & Spacing**:
   - Use the exact font-families, font-sizes, and line-heights specified in the design tokens.
   - For vertical margins or padding, use explicit padding on \`<td>\` elements rather than margin styles on paragraphs/headings, as Outlook ignores margins.
   - Keep heading sizes, colors, and line-heights exactly matching the tokens for H1, H2, H3.
   - Never let adjacent text blocks or boxes touch. Always enforce separation with padding or spacer rows.

6. **Bullet Lists**:
   - Do not use \`<ul>\` or \`<li>\` as email clients render them with inconsistent spacing and bullet icons.
   - Implement lists using tables with a column for the bullet and a column for the text:
     \`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="20" valign="top" style="font-family: Arial; font-size: 13px; color: {BULLET_COLOR};">•</td><td valign="top" style="font-family: Arial; font-size: 13px; color: {TEXT_COLOR};">{LIST_ITEM_TEXT}</td></tr></table>\`

7. **Bulletproof CTA Buttons**:
   - Do not use plain link tags with padding, as Outlook strips padding on links.
   - Use a table cell styled button with padding, border-radius, background color, and a block anchor inside:
     \`<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="{ALIGNMENT}" style="margin: 0 auto; border-collapse: separate;"><tr><td align="center" bgcolor="{BUTTON_BG}" style="border-radius: {BORDER_RADIUS}; padding: {PADDING};"><a href="#" target="_blank" style="font-family: Arial, sans-serif; font-size: {FONT_SIZE}; font-weight: {FONT_WEIGHT}; color: {TEXT_COLOR}; text-decoration: none; display: inline-block;">{BUTTON_TEXT}</a></td></tr></table>\`

8. **Images**:
   - Enforce \`display: block; border: 0; outline: none; text-decoration: none;\` on all \`<img>\` tags to remove bottom spacing in Gmail. Ensure inline width is set.
   - Add top/bottom padding to image container cells if they border other sections.

9. **Mobile Responsiveness**:
   - Include a media query block in a \`<style>\` tag inside the \`<head>\` for screens under 480px width to shrink widths to 100% and adjust padding.
   - Use classes like \`mobile-width-100\` and \`mobile-padding\` with \`!important\` in the media queries.

Respond with ONLY the raw HTML code of the generated email. Do not include markdown block formatting (like \`\`\`html) in your response, just the raw HTML code starting with \`<!doctype html>\` and ending with \`</html>\`.`;

  const prompt = `Use these Design Tokens (including the Assets Registry and Structure layout array):
${JSON.stringify(tokens, null, 2)}

Create a marketing email with this Content / Copy:
${contentPrompt}

Make sure you map the Content / Copy onto the sections defined in the "structure" array. 
Maintain the exact sequence:
1. Render each block in the "structure" array in order.
2. For each block, if there is text content, adapt the provided Content/Copy to fit the block's "contentSummary" description (e.g. place the main announcement in the intro text block, details in the callout or bullet list blocks, CTA button labels, and footer notice).
3. If a block has an associated asset ID (like the flowchart image or logo), include the corresponding image from the "assets" registry at that exact point.
4. Output a highly polished, table-based, inline-styled email that matches the design token rules perfectly.`;

  const response = await generateText({
    model,
    system: systemInstructions,
    prompt: prompt,
  });

  let cleanHtml = response.text.trim();
  // Strip markdown code block ticks if LLM returned them despite instruction
  if (cleanHtml.startsWith('```html')) {
    cleanHtml = cleanHtml.substring(7);
  }
  if (cleanHtml.startsWith('```')) {
    cleanHtml = cleanHtml.substring(3);
  }
  if (cleanHtml.endsWith('```')) {
    cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
  }
  cleanHtml = cleanHtml.trim();

  // Ensure output directory exists
  const outputDir = path.dirname(outputHtmlPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save the generated email HTML to file
  console.log(`Saving generated HTML email to ${outputHtmlPath}...`);
  fs.writeFileSync(outputHtmlPath, cleanHtml, 'utf-8');
  console.log('HTML email generation complete!');

  return cleanHtml;
}

// Running script directly from CLI
if (import.meta.url === `file://${path.resolve(process.argv[1]).replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node create.js <path-to-tokens-json> <content-prompt-or-file> [path-to-output-html]');
    process.exit(1);
  }

  const tokensJson = args[0];
  const content = args[1];
  const outputHtml = args[2] || './output/generated_email.html';

  try {
    await createEmail(tokensJson, content, outputHtml);
  } catch (err) {
    console.error('Error during email creation:', err.message);
    process.exit(1);
  }
}
