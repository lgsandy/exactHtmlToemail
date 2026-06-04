import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const designTokenSchema = z.object({
  brandName: z.string().describe('Name of the pharmaceutical brand/product if identified, else generic description'),
  colors: z.object({
    primaryColor: z.string().describe('Hex code of the main brand color (e.g. used for headers, prominent lines, primary buttons)'),
    secondaryColor: z.string().describe('Hex code of the secondary brand color'),
    accentColor: z.string().describe('Hex code of any accents (e.g. buttons, alerts)'),
    backgroundColor: z.string().describe('Hex code of the email global page background (often light gray/off-white or white)'),
    containerBgColor: z.string().describe('Hex code of the main email inner container background (usually white #ffffff)'),
    textColor: z.string().describe('Hex code of the body text color (e.g. #000000, #333333)'),
    lightBgColor: z.string().describe('Hex code of light background shading used for callouts or highlights'),
  }),
  preheader: z.object({
    text: z.string().describe('The default text of the preheader section found at the very top of the email (usually promotional/regulatory disclaimer context)'),
    backgroundColor: z.string().describe('Hex code of the preheader background'),
    textColor: z.string().describe('Hex code of the preheader text'),
    fontSize: z.string().describe('Font size of the preheader text (e.g. "10px")'),
    lineHeight: z.string().describe('Line height of the preheader text (e.g. "13px")'),
    padding: z.string().describe('Padding of the preheader section (e.g. "10px 25px")'),
  }).nullish().describe('The top preheader styling and default notice details, or null if there is no preheader text block/bar at the very top of the email'),
  typography: z.object({
    fontFamily: z.string().describe('Primary font family (e.g. Arial, Georgia, sans-serif)'),
    baseFontSize: z.string().describe('Default body font size (e.g. 13px, 14px)'),
    baseLineHeight: z.string().describe('Default line height for body text (e.g. 15px, 19px)'),
    header1: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      color: z.string(),
      fontWeight: z.string(),
    }).describe('Style for main headlines (H1 level)'),
    header2: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      color: z.string(),
      fontWeight: z.string(),
    }).describe('Style for section headings (H2 level)'),
    header3: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      color: z.string(),
      fontWeight: z.string(),
    }).describe('Style for subheaders (H3 level)'),
  }),
  layout: z.object({
    maxContainerWidth: z.string().describe('Maximum width of the email content container (typically 600px)'),
    sectionPaddingDesktop: z.string().describe('Standard desktop padding for content sections (e.g. 20px 25px)'),
    sectionPaddingMobile: z.string().describe('Standard mobile padding for content sections (e.g. 10px 15px)'),
  }),
  components: z.object({
    headerBanner: z.object({
      hasBanner: z.boolean(),
      backgroundImageUrlPattern: z.string().nullish().describe('Example or placeholder URL of the banner background image if used'),
      padding: z.string().nullish(),
      height: z.string().nullish(),
      titleColor: z.string().nullish(),
      titleSize: z.string().nullish(),
    }).describe('Top header banner block style'),
    calloutBox: z.object({
      backgroundColor: z.string(),
      borderRadius: z.string(),
      borderColor: z.string().nullish(),
      borderWidth: z.string().nullish(),
      padding: z.string(),
      textColor: z.string(),
    }).describe('Style details for callout/highlight sections'),
    button: z.object({
      backgroundColor: z.string(),
      textColor: z.string(),
      borderRadius: z.string(),
      padding: z.string(),
      fontSize: z.string(),
      fontWeight: z.string(),
      alignment: z.string().describe('Default button horizontal alignment (left, center, right)'),
    }).describe('Primary CTA button styles'),
    bulletList: z.object({
      bulletCharacter: z.string().describe('Bullet point character/icon used (e.g. •, checkmark, arrow)'),
      bulletColor: z.string(),
      fontSize: z.string(),
      lineHeight: z.string(),
      indentation: z.string().describe('Margin/padding indentation for bullets'),
    }).describe('Bullet point list styles'),
    divider: z.object({
      color: z.string(),
      thickness: z.string(),
      margin: z.string(),
    }).describe('Divider line style between sections'),
    footer: z.object({
      backgroundColor: z.string(),
      textColor: z.string(),
      fontSize: z.string(),
      lineHeight: z.string(),
      padding: z.string(),
      alignment: z.string(),
    }).describe('Legal text and footer section style details'),
  }),
  assets: z.array(z.object({
    id: z.string().describe('Unique identifier for this asset, e.g. "header_logo", "hero_banner", "chart_flowchart", "footer_logo"'),
    url: z.string().describe('The src URL of the image'),
    width: z.string().describe('Width attribute of the image (e.g. "600", "263")'),
    alt: z.string().nullish().describe('Alt text if any'),
    purpose: z.string().describe('Brief description of what this image is and its location in the email template'),
  })).describe('List of all images/graphics used in the email template'),
  structure: z.array(z.object({
    sectionId: z.string().describe('A descriptive ID for this section, e.g. "preheader", "hero_banner", "intro_text", "flowchart_diagram", "purple_callout", "button_cta", "legal_disclaimer"'),
    componentType: z.enum(['preheader', 'header_banner', 'text_block', 'image_block', 'callout_box', 'bullet_list', 'cta_button', 'divider', 'footer']).describe('The structural component type'),
    backgroundColor: z.string().describe('Background color of this section container'),
    padding: z.string().describe('Padding configuration of this section'),
    associatedAssetId: z.string().nullish().describe('If this section displays an image, specify the asset ID from the assets registry'),
    contentSummary: z.string().describe('Brief summary of the textual content, title, or intent of this section in the template (e.g. Gilead disclaimer text, "Of patients with known outcomes..." headline)'),
  })).describe('Ordered structure of layout sections in the email from top to bottom'),
});

/**
 * Extracts design tokens from a given HTML email file.
 * @param {string} htmlFilePath 
 * @param {string} outputJsonPath 
 */
export async function extractTokens(htmlFilePath, outputJsonPath) {
  // Validate file exists
  if (!fs.existsSync(htmlFilePath)) {
    throw new Error(`Input HTML file not found at: ${htmlFilePath}`);
  }

  console.log(`Reading HTML file from ${htmlFilePath}...`);
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

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

  console.log('Sending HTML content to LLM to extract design tokens...');

  const response = await generateObject({
    model,
    schema: designTokenSchema,
    prompt: `Analyze the following pharma marketing email HTML template. 
Carefully extract its design system, visual styling rules, component configurations, typography specs, all visual image assets, and its overall section layout sequence into the structured design token format.

Specifically look at and extract:
1. Palette & Colors (brand colors, background colors, highlighted callout colors, text colors).
2. Preheader block (text notice/bar at the very top of the email, its styles, background color, padding, and text color. If there is no preheader text bar at the very top of the HTML email, set this "preheader" object to null).
3. Typography (font families, body text sizes, header weights, colors, and heights).
4. Layout attributes (container maximum widths, padding on sections for desktop vs mobile).
5. Component details (how the primary button CTA is styled, callout box styling, dividers, footer styles, bullet lists, header banner structures).
6. Assets (identify all <img src="..."> tags, determine their URLs, width properties, and map them to descriptive IDs such as "header_logo", "hero_banner", "chart_flowchart", "footer_logo").
7. Structure (analyze the vertical flow of sections from top to bottom. Order them sequentially. For each section, note its ID, background color, padding, component type, any associated image asset ID, and a brief content summary of what it contains in the template).

Here is the HTML content of the email:
----------------------------------------
${htmlContent}
----------------------------------------
`,
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputJsonPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save the extracted tokens to file
  console.log(`Saving design tokens to ${outputJsonPath}...`);
  fs.writeFileSync(outputJsonPath, JSON.stringify(response.object, null, 2), 'utf-8');
  console.log('Design token extraction complete!');

  return response.object;
}

// Running script directly from CLI
if (import.meta.url === `file://${path.resolve(process.argv[1]).replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node extract.js <path-to-html> [path-to-output-json]');
    process.exit(1);
  }

  const inputHtml = args[0];
  const outputJson = args[1] || './output/design_tokens.json';

  try {
    await extractTokens(inputHtml, outputJson);
  } catch (err) {
    console.error('Error during extraction:', err.message);
    process.exit(1);
  }
}
