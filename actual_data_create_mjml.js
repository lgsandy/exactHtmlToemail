import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Clean and extract raw digits from width values like "149/250" or "600px".
 * @param {string|number} widthVal 
 * @returns {string|null} Clean numeric string
 */
export function sanitizeWidth(widthVal) {
  if (!widthVal) return null;
  const match = widthVal.toString().match(/^\d+/);
  return match ? match[0] : null;
}

/**
 * Preprocesses moduleData JSON structure according to formatting, deduplication, and citation rules.
 * @param {Array} modules 
 * @returns {Object} Preprocessed data payload
 */
export function preprocessModuleData(modules, tokens = {}) {
  // Global reference registry: maps documentName -> reference number & details
  const globalReferencesMap = new Map();
  let refCounter = 1;

  // Global footnotes registry: maps footnoteText -> symbol
  const globalFootnotesMap = new Map();
  const footnoteSymbols = ['*', '†', '‡', '§', '¶', '#', '€', '**', '††', '‡‡'];
  let footnoteCounter = 0;

  // Global abbreviation registry: maps key -> value
  const globalAbbreviationsMap = new Map();

  function extractAbbreviations(claim) {
    if (claim && claim.abbreviation) {
      const parts = claim.abbreviation.split(/[;|\n]/);
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed) {
          const colonIdx = trimmed.indexOf(':');
          if (colonIdx !== -1) {
            const key = trimmed.substring(0, colonIdx).trim();
            const val = trimmed.substring(colonIdx + 1).trim();
            if (key && val) {
              const cleanVal = val.replace(/\.+$/, '');
              globalAbbreviationsMap.set(key, cleanVal);
            }
          } else {
            globalAbbreviationsMap.set(trimmed, '');
          }
        }
      });
    }
  }

  const processedModules = modules.map(module => {
    // Keep track of claims rendered in this module to prevent duplicates
    const renderedClaimsInModule = new Set();

    // Helper to process citations
    const getCitations = (claim) => {
      const citations = [];
      if (claim.footnotes && claim.footnotes.trim()) {
        const fnText = claim.footnotes.trim();
        if (!globalFootnotesMap.has(fnText)) {
          const symbol = footnoteSymbols[footnoteCounter % footnoteSymbols.length];
          footnoteCounter++;
          globalFootnotesMap.set(fnText, symbol);
        }
        citations.push(globalFootnotesMap.get(fnText));
      }

      if (claim.references && claim.references.length > 0) {
        claim.references.forEach(ref => {
          if (ref.documentName) {
            const docName = ref.documentName.trim();
            if (!globalReferencesMap.has(docName)) {
              globalReferencesMap.set(docName, {
                num: refCounter++,
                url: ref.documentUrl || '#'
              });
            }
            const refInfo = globalReferencesMap.get(docName);
            citations.push(refInfo.num.toString());
          }
        });
      }
      return citations;
    };

    // 1. Process Module Claims
    const processedClaims = (module.claims || []).map(claim => {
      // Mark as rendered in this module
      if (claim.claimName) renderedClaimsInModule.add(claim.claimName.trim());
      if (claim.matchText) renderedClaimsInModule.add(claim.matchText.trim());

      // Collect abbreviation
      extractAbbreviations(claim);

      const citations = getCitations(claim);
      let decoratedText = claim.matchText || '';
      if (citations.length > 0) {
        decoratedText += `<sup>${citations.join(',')}</sup>`;
      }

      return {
        ...claim,
        decoratedText,
        citations
      };
    });

    // 2. Process Related Claims from claims
    const processedRelatedClaims = [];
    (module.claims || []).forEach(claim => {
      (claim.relatedClaims || []).forEach(relClaim => {
        extractAbbreviations(relClaim);
        const citations = getCitations(relClaim);
        let decoratedText = relClaim.matchText || '';
        if (citations.length > 0) {
          decoratedText += `<sup>${citations.join(',')}</sup>`;
        }

        processedRelatedClaims.push({
          ...relClaim,
          decoratedText,
          citations
        });
      });
    });

    // 3. Process Reusable Texts
    const processedReusableTexts = (module.reusableTexts || []).map(rt => ({
      ...rt
    }));

    // 4. Process Components
    const overriddenUrls = new Set();
    if (tokens.assets && Array.isArray(tokens.assets)) {
      tokens.assets.forEach(asset => {
        if (asset.url) overriddenUrls.add(asset.url.trim());
      });
    }

    const componentsToProcess = (module.components || []).filter(comp => {
      const nameLower = (comp.componentName || '').toLowerCase();
      const titleLower = (comp.title || '').toLowerCase();
      const isLogo = nameLower.includes('logo') || titleLower.includes('logo') || nameLower.includes('gilead') || titleLower.includes('gilead');
      
      const compUrl = (comp.componentUrl || '').trim();
      const isAlreadyOverridden = overriddenUrls.has(compUrl);

      return !isLogo && !isAlreadyOverridden;
    });

    const processedComponents = componentsToProcess.map(comp => {
      // Filter relatedClaims to skip duplicates already rendered in this module's claims section
      const nonDuplicateClaims = (comp.relatedClaims || []).filter(rc => {
        const nameMatch = rc.claimName && renderedClaimsInModule.has(rc.claimName.trim());
        const textMatch = rc.matchText && renderedClaimsInModule.has(rc.matchText.trim());
        return !nameMatch && !textMatch;
      });

      // Decorate component related claims with citations
      const decoratedClaims = nonDuplicateClaims.map(rc => {
        extractAbbreviations(rc);
        const citations = getCitations(rc);
        let decoratedText = rc.matchText || '';
        if (citations.length > 0) {
          decoratedText += `<sup>${citations.join(',')}</sup>`;
        }
        return {
          ...rc,
          decoratedText,
          citations
        };
      });

      // Determine Layout Type
      const isFullWidth = 
        comp.classification === "Data Infographic" || 
        comp.classification === "Data Chart" || 
        comp.subType === "Data Graphic";

      let layoutType = isFullWidth ? 'full-width' : 'two-column';

      // Determine Style Width from tokens.assets
      let styleWidth = isFullWidth ? '100%' : '100px';
      if (tokens.assets && Array.isArray(tokens.assets)) {
        if (isFullWidth) {
          const chartAsset = tokens.assets.find(a => 
            (a.id || '').toLowerCase().includes('chart') || 
            (a.id || '').toLowerCase().includes('illustration') ||
            (a.id || '').toLowerCase().includes('infographic') ||
            (a.purpose || '').toLowerCase().includes('chart') ||
            (a.purpose || '').toLowerCase().includes('illustration') ||
            (a.purpose || '').toLowerCase().includes('infographic')
          );
          const rawWidth = chartAsset ? sanitizeWidth(chartAsset.width) : null;
          if (rawWidth) {
            styleWidth = rawWidth + 'px';
          } else {
            styleWidth = '550px'; // standard fallback
          }
        } else {
          const iconAsset = tokens.assets.find(a => 
            (a.id || '').toLowerCase().includes('icon') || 
            (a.id || '').toLowerCase().includes('logo') ||
            (a.purpose || '').toLowerCase().includes('icon') ||
            (a.purpose || '').toLowerCase().includes('logo')
          );
          const rawWidth = iconAsset ? sanitizeWidth(iconAsset.width) : null;
          if (rawWidth) {
            styleWidth = rawWidth + 'px';
          }
        }
      }

      // Left column content: display claims if they exist, else fallback to componentName or title
      let leftColumnContent = '';
      if (decoratedClaims.length > 0) {
        leftColumnContent = decoratedClaims.map(c => c.decoratedText).join('<br/>');
      } else {
        leftColumnContent = comp.componentName || comp.title || '';
      }

      return {
        ...comp,
        nonDuplicateClaims: decoratedClaims,
        layoutType,
        styleWidth,
        leftColumnContent,
        relatedReusableTexts: comp.relatedReusableTexts || []
      };
    });

    return {
      moduleId: module.moduleId,
      moduleName: module.moduleName,
      productName: module.productName,
      countryName: module.countryName,
      claims: processedClaims,
      relatedClaims: processedRelatedClaims,
      reusableTexts: processedReusableTexts,
      components: processedComponents
    };
  });

  // Rebuild footnotes list
  const footnotesList = Array.from(globalFootnotesMap.entries())
    .map(([text, symbol]) => ({
      symbol,
      text
    }));

  // Rebuild references list sorted by running numbers
  const referencesList = Array.from(globalReferencesMap.entries())
    .map(([docName, info]) => ({
      num: info.num,
      text: docName,
      url: info.url
    }))
    .sort((a, b) => a.num - b.num);

  // Rebuild abbreviations list sorted alphabetically by key
  const abbreviationsList = Array.from(globalAbbreviationsMap.entries())
    .map(([key, value]) => ({
      key,
      value
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    modules: processedModules,
    footnotes: footnotesList,
    references: referencesList,
    abbreviations: abbreviationsList
  };
}

/**
 * Main function to load tokens, preprocess module data, and generate MJML layout using Azure OpenAI.
 * @param {string} tokensJsonPath 
 * @param {string} moduleDataJsonPath 
 * @param {string} outputMjmlPath 
 */
export async function createEmailFromData(tokensJsonPath, moduleDataJsonPath, outputMjmlPath) {
  // Validate file paths
  if (!fs.existsSync(tokensJsonPath)) {
    throw new Error(`Design tokens JSON not found at: ${tokensJsonPath}`);
  }
  if (!fs.existsSync(moduleDataJsonPath)) {
    throw new Error(`Module data JSON not found at: ${moduleDataJsonPath}`);
  }

  console.log(`Reading design tokens from ${tokensJsonPath}...`);
  const tokens = JSON.parse(fs.readFileSync(tokensJsonPath, 'utf-8'));

  console.log(`Reading and preprocessing module data from ${moduleDataJsonPath}...`);
  const rawModules = JSON.parse(fs.readFileSync(moduleDataJsonPath, 'utf-8'));

  // Override the hardcoded design token asset URLs with original asset URLs from moduleData.json
  const allComponents = [];
  rawModules.forEach(mod => {
    if (mod.components) {
      mod.components.forEach(comp => {
        allComponents.push(comp);
      });
    }
  });

  const logoComps = allComponents.filter(comp => 
    (comp.componentName && comp.componentName.toLowerCase().includes('logo')) ||
    (comp.title && comp.title.toLowerCase().includes('logo'))
  );

  const chartComps = allComponents.filter(comp =>
    (comp.classification && (comp.classification.toLowerCase().includes('chart') || comp.classification.toLowerCase().includes('infographic'))) ||
    (comp.subType && comp.subType.toLowerCase().includes('graphic'))
  );

  if (tokens.assets && Array.isArray(tokens.assets)) {
    let chartIndex = 0;
    const logoUrl = logoComps.length > 0 ? logoComps[0].componentUrl : null;
    const usedComponentUrls = new Set();

    tokens.assets = tokens.assets.map(asset => {
      let updatedUrl = asset.url;
      const idLower = (asset.id || '').toLowerCase();
      const purposeLower = (asset.purpose || '').toLowerCase();

      // 1. Gilead logo or header/footer logo
      if (idLower.includes('logo') || purposeLower.includes('logo') || idLower.includes('gilead') || purposeLower.includes('gilead')) {
        if (logoUrl) {
          updatedUrl = logoUrl;
          console.log(`Overriding logo asset "${asset.id}" URL with dynamic logo: ${updatedUrl}`);
        }
      }
      // 2. Charts, graphics, or infographics (content assets)
      else if (!(idLower.includes('logo') || idLower.includes('icon') || idLower.includes('barcode') || idLower.includes('qr') || idLower.includes('download') || idLower.includes('gilead') ||
                 purposeLower.includes('logo') || purposeLower.includes('icon') || purposeLower.includes('barcode') || purposeLower.includes('qr') || purposeLower.includes('download') || purposeLower.includes('gilead')) &&
               (idLower.includes('chart') || idLower.includes('illustration') || idLower.includes('flowchart') || idLower.includes('diagram') || idLower.includes('graphic') || idLower.includes('infographic') ||
                purposeLower.includes('chart') || purposeLower.includes('illustration') || purposeLower.includes('flowchart') || purposeLower.includes('diagram') || purposeLower.includes('graphic') || purposeLower.includes('infographic'))) {
        if (chartIndex < chartComps.length) {
          const compUrl = chartComps[chartIndex].componentUrl;
          if (!usedComponentUrls.has(compUrl)) {
            updatedUrl = compUrl;
            usedComponentUrls.add(compUrl);
            console.log(`Overriding content asset "${asset.id}" URL with dynamic chart: ${updatedUrl}`);
          } else {
            updatedUrl = null; // Mark duplicate as null so we don't render it
            console.log(`Skipping duplicate chart asset override for "${asset.id}"`);
          }
          chartIndex++;
        } else {
          updatedUrl = null; // No more dynamic charts, set to null instead of falling back to duplicate
          console.log(`Setting content asset "${asset.id}" to null (no dynamic chart available)`);
        }
      }
      // Note: Hero banner assets are NOT overridden so that we preserve the header banner image of the brand (Trodelvy / Biktarvy) at the top.

      // Clean/sanitize asset widths to prevent invalid widths (like "149/250") in final generated markup
      const cleanWidth = sanitizeWidth(asset.width) || asset.width;

      return {
        ...asset,
        url: updatedUrl,
        width: cleanWidth
      };
    });
  }

  // Preprocess the modules with resolved token dimensions
  const processedData = preprocessModuleData(rawModules, tokens);

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

  console.log('Generating dynamic MJML email template via LLM...');

  const systemInstructions = `You are a professional email developer specializing in building clean, valid, and responsive MJML (Mailjet Markup Language) templates matching strict corporate brand systems.
Your task is to take the provided Design Tokens (for colors, fonts, layout limits, structure layout slots) and the preprocessed Dynamic Content modules, and generate a single, self-contained, valid MJML document.

To ensure the template layout, colors, typography, and section styling perfectly match the original email (as shown in the LHS of the reference image), you MUST follow these layout and compilation rules:

1. **MJML Structure Settings**:
   - The document must start with \`<mjml>\` and end with \`</mjml>\`.
   - Wrap settings in \`<mj-head>\`. Establish standard typography settings.
   - Wrap contents in \`<mj-body width="{containerWidth}">\` matching the container width from the tokens (e.g. 600px).
   - Use standard \`<mj-section>\`, \`<mj-column>\`, \`<mj-text>\`, \`<mj-image>\`, \`<mj-button>\`, \`<mj-divider>\` tags. Do not use plain HTML layouts inside the columns.

2. **Strict MJML Nesting Rules (No Nested Sections)**:
   - Direct children of \`<mj-body>\` must be \`<mj-section>\` elements.
   - Direct children of \`<mj-section>\` must be \`<mj-column>\` elements.
   - You MUST NEVER nest \`<mj-section>\` elements inside other \`<mj-section>\` or inside \`<mj-column>\` elements! This breaks email table compilation and causes images/logos to scale to a giant 100% width.
   - If a section contains a two-column component, close the previous section, and open a new \`<mj-section>\` directly under \`<mj-body>\`, adding the \`<mj-column>\` elements directly inside it.

3. **Typography Inline Styling (NO CSS Classes for Fonts)**:
   - Every single \`<mj-text>\` component MUST have its typography styles (specifically \`font-size\`, \`line-height\`, \`color\`, \`font-weight\`, and \`font-family\`) applied directly as inline attributes (e.g., \`<mj-text font-size="18px" line-height="25px" color="#003594" font-weight="700">\`).
   - Do NOT use \`css-class="h1"\` or similar, and do NOT style text using CSS rules in a \`<mj-style>\` block. During MJML compilation, inline attributes on \`<mj-text>\` take precedence over classes, so using classes results in unstyled black text.
   - Ensure H1/H2/H3 text blocks have the exact typography tokens applied.

4. **No HTML Escaping of Superscripts / Text Formatting**:
   - For all claims and texts, you MUST use their pre-decorated text (\`decoratedText\` property) which includes the HTML superscript citations (e.g. \`<sup>*,1</sup>\` or \`<sup>1,2</sup>\`). Never omit or strip these superscript tags or use the plain \`matchText\`!
   - Write formatting tags like \`<sup>\`, \`<sub>\`, \`<a>\`, and \`<strong>\` as raw HTML inline tags inside the text block content.
   - Do NOT escape them (do NOT write \`&lt;sup&gt;\` or \`\\u003csup\\u003e\`). The compiler expects raw HTML for these standard inline formatting tags.

5. **Template Structure & Dynamic Slot Mapping**:
   You must render the email by following the template's "structure" layout slots in the exact order specified in tokens.structure.
   For each structural slot, map the corresponding dynamic content from the preprocessed moduleData.json:
   
   - **A. Preheader notice (componentType === 'preheader')**:
     If defined, render a small grey background bar at the very top using the preheader text and styling from tokens.preheader.
     
   - **B. Hero Banner Image / Top Header (e.g. componentType === 'header_banner' or sectionId === 'hero_banner')**:
     - Render the full-width hero banner image (using the asset URL associated with this section, like 'hero_banner' or 'hero_background') from tokens.assets. Use a simple, clean \`<mj-image src="{HERO_BANNER_URL}" width="600px" padding="0px" />\` inside the header section.
     - Do NOT replace this top banner image with the Gilead corporate logo.
     
   - **C. Greeting / Intro Text Block (e.g. sectionId === 'greeting_text' or 'intro_greeting' or 'greeting')**:
     - Render a personalized greeting matching the brand template language: e.g., 'Estimado Dr./Dra. {{accLname}},' or 'Dear HCP,' (match the greeting style of the template). Do NOT render random reusable texts or main claims in this greeting block.
     
   - **D. Headline and Text Sections (H1/H2/H3)**:
     - Map the dynamic claims to the corresponding structural text sections in sequential order. For each claim, you MUST use \`decoratedText\` to preserve superscript citation links:
       - The 1st claim ("Aproximadamente el 60%...") maps to the first major headline slot (e.g., \`claim_patient_rated\` or \`headline_indication\` or \`intro_text_1\` or \`intro_text_2\`).
       - The 2nd claim ("La adherencia subóptima se asocia con resistencia...") maps to the first subheadline slot (e.g., \`subheadline_hivtsq\` or \`subheadline_need\` or \`claim_adherence_uncertainty\`).
       - The 3rd claim ("La adherencia subóptima se asocia con una no supresión virológica...") maps to the callout box slot (e.g., \`claim_reduced_switch\` or \`stat_callout\` or \`claim_forgiveness_highlight\`).
       - The 4th claim ("Biktarvy es el único regimen basado en INI con 0 resistencias...") maps to the second subheadline slot (e.g., \`subheadline_time_to_switch\` or \`green_question_callout\` or \`claim_long_term_success\`).
       - The 5th claim ("Mutaciones de resistencia asociadas con el tratamiento. Pacientes con TAR previo") maps to the third subheadline slot (e.g., \`subheadline_risk_of_switch\` or \`indication_intro\` or \`subheader_low_adherence\` or \`claim_rapid_start_summary\` or \`claim_rapid_start_discontinuations\` or \`subheader_rapid_start_suppression\`).
     - Map the Reusable Text ("Solicita aquí el acceso completo...") to the medical information/contact slot (e.g., \`medical_info_block\` or \`code_and_contact_block\` or \`closing_paragraph\` or \`smpc_reminder\`) rather than using it as a main headline or subheadline.
     
   - **E. Chart / Infographic Sections (Image Blocks)**:
     - Render dynamic chart images using \`<mj-image src="{componentUrl}" width="{styleWidth}" />\` inside a standard section and column. Do NOT wrap it in nested sections.
     
   - **F. Callout Boxes**:
     - To render a callout box with a colored background, set the background-color and padding directly on the parent \`<mj-section>\` or \`<mj-column>\` element (using tokens.components.calloutBox background/padding, e.g. background \`#35b376\` for Trodelvy, or background \`#CF0A2C\` for Biktarvy).
     - Do NOT set background-color or border attributes directly on the \`<mj-text>\` tag itself.
     
   - **G. Two-Column Components and Illustrations**:
     - Render any dynamic two-column components (e.g. warning icons or virus graphics) as two sibling \`<mj-column>\` elements inside the same \`<mj-section>\` (80% column for text, 20% column for image), using the component's original URL and clean numeric width.
     - If the dynamic content contains illustrations or components that are not mapped to specific slots in the template structure (e.g. caution symbol or virus icon), you MUST append them as two-column layout sections in the body flow before the CTA button or references section.
     
   - **H. Global Sections at the Bottom**:
     - CTA Button: Render the button styled exactly from the tokens (e.g. color, background, alignment, border-radius).
     - Footnotes Section (associated with structure slot 'footnote_hivtsq_definition'):
       - You MUST render the preprocessed footnotes list from \`processedData.footnotes\`.
       - Format the footnotes as \`<sup>SYMBOL</sup>TEXT\` separated by a semicolon and space (e.g., \`<sup>*</sup>La adherencia subóptima se definió como...; <sup>†</sup>Revisión sistemática...\`).
       - Apply the design token styling for footnote/references (font-family, size, line-height, color, e.g. color \`#707070\`). Do NOT leave it empty.
     - Abbreviations Section (associated with structure slot 'footnote_abbreviations'):
       - You MUST render the preprocessed abbreviations list from \`processedData.abbreviations\`.
       - Format it by bolding the abbreviation key and separating them with a semicolon and space (e.g., \`<b>TAR</b>: tratamiento antirretroviral; <b>IC</b>: intervalo de confianza; <b>OR</b>: odds ratio\`).
       - Apply the design token styling for footnote/references (font-family, size, line-height, color, e.g. color \`#707070\`). Do NOT leave it empty.
     - References Section (associated with structure slot 'footnote_bibliography'):
       - You MUST render the preprocessed references list from \`processedData.references\`.
       - Format it by prefixing with "<b>BIBLIOGRAFÍA:</b> " and listing each reference with its number and document name (e.g., \`<b>BIBLIOGRAFÍA:</b> 1. McComsey G.A... 2. Blanco JL...\`).
       - Apply the design token styling for footnote/references (font-family, size, line-height, color, e.g. color \`#707070\`). Do NOT leave it empty.
     - Footer Section: Render disclaimers, trademark notices, and the Gilead logo using the footer styles from tokens. The Gilead logo should be at the bottom (overridden Gilead logo URL, width 120px).

6. **Strict Color and Typography Preservation & Deduplication**:
   - Do NOT use hardcoded placeholder text from the template structure. The text copy must come entirely from the dynamic preprocessed modules and global references/abbreviations.
   - Do NOT render a centered Gilead corporate logo at the top of the email body; the header banner at the top of the email must be the full-width image from tokens.assets.
   - Do NOT output the dynamic modules as a separate section at the bottom. The dynamic content must be mapped directly into the structural sections.
   - **CRITICAL ASSET DEDUPLICATION**: If an image asset's URL is null, empty, or missing in the assets registry, you MUST NOT render that image or its associated section. Skip it entirely to prevent duplicate or placeholder layouts. Each component image from moduleData.json must be placed only once.

Respond with ONLY the raw MJML code. Do not wrap it in markdown code block ticks, just output the raw MJML text starting with '<mjml>' and ending with '</mjml>'.`;

  const prompt = `Use these Design Tokens (containing brand colors, fonts, footers, and structure):
${JSON.stringify(tokens, null, 2)}

Render this Preprocessed Dynamic Content JSON (containing reference numbers, superscript citations, dynamic components with correct layouts and style widths):
${JSON.stringify(processedData, null, 2)}

Create the responsive email template in MJML format. Map the preprocessed dynamic content directly into the corresponding structural slots of the template in sequence, styled strictly according to the design tokens.`;

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
    console.error('Usage: node actual_data_create_mjml.js <path-to-tokens-json> <path-to-module-data-json> [path-to-output-mjml]');
    process.exit(1);
  }

  const tokensJson = args[0];
  const moduleDataJson = args[1];
  const outputMjml = args[2] || './output/generated_email.mjml';

  try {
    await createEmailFromData(tokensJson, moduleDataJson, outputMjml);
  } catch (err) {
    console.error('Error during email creation:', err.message);
    process.exit(1);
  }
}
