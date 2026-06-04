import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Generates a modern, premium HTML email using the provided design tokens and email content prompt.
 * Strictly preserves font sizes and colors from design tokens.
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

  console.log('Generating modern & premium HTML email via LLM...');

  const systemInstructions = `You are an elite, award-winning email designer and developer specializing in creating high-end, premium, and visually striking marketing layouts for pharmaceutical products.
Your task is to take the provided Design Tokens and the Email Content Copy, and generate a single, self-contained HTML email that looks modern and luxurious.

**CRITICAL STYLING LIMITATIONS (DO NOT VIOLATE)**:
1. **NO FONT SIZE CHANGES**: You MUST strictly use the exact font sizes specified in the design tokens for headers (H1, H2, H3), body text, and footers. Do not alter or scale them.
2. **NO COLOR CHANGES**: You MUST strictly use the exact colors (primaryColor, secondaryColor, accentColor, textColor, backgroundColor, lightBgColor, and section-specific background colors) defined in the design tokens. Do not introduce new colors.

**HOW TO MAKE THE EMAIL LOOK PREMIUM & STRIKING WITHIN THESE LIMITATIONS**:
- **Generous Spacing & Padding**: Provide spacious margins and vertical breathing room (e.g. 25px to 40px spacing). Avoid compact layouts.
- **Card-Style Callout Boxes**: Give callout boxes an elegant, modern card aesthetic:
  - Add rounded corners (e.g., \`border-radius: 8px\` or \`12px\`).
  - Add a 1px thin border in a subtle tint, or a solid vertical accent border on the left side of the box (e.g., \`border-left: 4px solid {PRIMARY_COLOR};\`) to highlight text beautifully.
- **Sleek Pill-Shaped Buttons**: Render CTA buttons as modern, pill-shaped buttons with rounded corners (e.g. \`border-radius: 24px\` or \`30px\`) and wide horizontal paddings (e.g. \`12px 32px\`) while preserving the exact font size and color.
- **Elegant Vertical Alignment**: Align structural elements with micro-grids. Centering headers and buttons can elevate the editorial feel.
- **Clean Dividers**: Use very thin, subtle lines (e.g., \`1px solid #e0e0e0\`) with generous padding above and below.
- **Refined List Structures**: Align lists using clean grid tables with wide spacing and elegant spacing between the bullet indicator column and text block.

To ensure the email renders flawlessly in ALL clients (including old versions of Microsoft Outlook, Gmail, Apple Mail, and Yahoo Mail), you MUST adhere to these strict coding standards:

1. **Section Structure Alignment**:
   - The Design Tokens contain a "structure" array which defines the exact ordered list of layout blocks from top to bottom. Output these blocks in the specified order.
   - For each block, use the specified "backgroundColor", "padding", and "componentType".
   - **CRITICAL COLOR ENFORCEMENT**: Use the exact background color specified for each block in the structure list.
   - **CRITICAL SPACING**: Apply the exact padding specified in the structure block to the wrapping \`<td>\` element of that section.
   - If a structural section has an "associatedAssetId", render the corresponding image from the "assets" registry centered inside that section.

2. **Preheader Block**:
   - If a "preheader" design token is present and contains values (and is NOT null or undefined), generate a preheader block at the very top.
   - Use the text, background color, text color, font size, line height, and padding from the token. If it is null/undefined, omit it entirely.

3. **Table-Based Layout**: 
   - Never use HTML5 layout elements like <section>, <article>, <header>, or <footer>. Never use flexbox or CSS grid.
   - Use nested tables for all layout structures: \`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">\`.
   - Set the main wrapper width to exactly the container width from the layout tokens (e.g. 600px).
   - Use Outlook wrapper tables around the main container:
     \`<!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600"><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->\`
     and close them at the end.

4. **Inline CSS**:
   - Apply all styling inline using the \`style\` attribute on the specific elements (mainly \`<td>\`, \`<div>\`, \`<span>\`, \`<a>\`).

5. **Typography & Spacing**:
   - Use the exact font-families, font-sizes, and line-heights specified in the design tokens.
   - For vertical margins, use explicit padding on \`<td>\` elements rather than margin styles on paragraphs/headings.
   - Never let adjacent text blocks or boxes touch. Always enforce separation with padding or spacer rows.

6. **Bullet Lists**:
   - Implement lists using tables with a column for the bullet and a column for the text.

7. **Bulletproof CTA Buttons**:
   - Use a table cell styled button with padding, border-radius, background color, and a block anchor inside:
     \`<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="{ALIGNMENT}" style="margin: 0 auto; border-collapse: separate;"><tr><td align="center" bgcolor="{BUTTON_BG}" style="border-radius: {BORDER_RADIUS}; padding: {PADDING};"><a href="#" target="_blank" style="font-family: Arial, sans-serif; font-size: {FONT_SIZE}; font-weight: {FONT_WEIGHT}; color: {TEXT_COLOR}; text-decoration: none; display: inline-block;">{BUTTON_TEXT}</a></td></tr></table>\`

8. **Images**:
   - Enforce \`display: block; border: 0; outline: none; text-decoration: none;\` on all \`<img>\` tags. Add top/bottom padding to image cells if they border other sections.

9. **Mobile Responsiveness**:
   - Include a media query block in a <style> tag inside the <head> for screens under 480px.

Respond with ONLY the raw HTML code of the generated email. Do not include markdown code block formatting (like triple backticks html) in your response, just the raw HTML code starting with '<!doctype html>' and ending with '</html>'.`;

  const prompt = `Use these Design Tokens (including the Assets Registry and Structure layout array):
${JSON.stringify(tokens, null, 2)}

Create a marketing email with this Content / Copy:
${contentPrompt}

Make sure you map the Content / Copy onto the sections defined in the "structure" array. 
Maintain the exact sequence:
1. Render each block in the "structure" array in order.
2. For each block, adapt the content to fit the block's "contentSummary" description.
3. If a block has an associated asset ID, include the corresponding image from the "assets" registry at that exact point.
4. Output a highly polished, visually striking, modern HTML email that matches the design token rules perfectly. Keep all colors and font sizes exactly as specified in the tokens.`;

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
    console.error('Usage: node design-create.js <path-to-tokens-json> <content-prompt-or-file> [path-to-output-html]');
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
