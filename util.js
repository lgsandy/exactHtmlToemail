import fs from 'fs'

function extractModuleData(data) {
  return data.map((module) => ({
    moduleId: module.moduleId,
    moduleName: module.moduleName,
    productName: module.productName,
    countryName: module.countryName,
    claims: (module.claims || []).map((claim) => ({
      claimName: claim.claimName,
      matchText: claim.matchText,
      mustUse: claim.mustUse,
      abbreviation: claim.abbreviation,
      footnotes: claim.footnotes,
      references: claim.references,
      relatedClaims: claim.relatedClaims
    })),

    reusableTexts: (module.reusableTexts || []).map((text) => ({
      matchText: text.matchText,
      mustUse: text.mustUse,
    })),

    components: (module.components || []).map((component) => ({
      componentUrl: component.componentUrl,
      classification: component.classification,
      title: component.title,
      relatedClaims: component.relatedClaims,
      relatedReusableTexts: component.relatedReusableTexts
    })),
  }));
}

// Extract data
const extractedData = extractModuleData([  {
    "moduleId": "9f0844a8-09cc-4552-bdd2-87a2f81de18e",
    "moduleName": "Module13",
    "moduleDamId": "V3Q00000000H009",
    "moduleDamName": "CM-002071",
    "nextUniqueModuleCode": "BI_Module_325",
    "source": "PromoMats",
    "eDetailSourceDocNum": null,
    "eDetailDocUrl": null,
    "productName": "Biktarvy",
    "productDamId": "00P000000000H01",
    "countryName": "Spain",
    "countryDamId": "spain",
    "topicDamId": "V6G000000001002",
    "topicName": "Efficacy",
    "subtopicDamId": null,
    "subtopicName": null,
    "languageDamId": "V5B000000001026",
    "languageName": "Spanish",
    "therapeuticAreaDamId": "V1L000000001013",
    "therapeuticAreaName": "Does not Apply",
    "audienceDamId": "V3T000000001003",
    "audienceName": "Professional",
    "usageGuidelines": null,
    "brandStyleGuidelines": "",
    "communicationObjectives": "Address socioeconomic and emotional factors influencing HIV treatment outcomes.\n",
    "creativeAgencyName": "21GRAMS",
    "creativeAgencyDamId": "V3A000000001002",
    "contentToneName": null,
    "contentToneDamId": null,
    "mlrStatus": "Available for Use",
    "createdByName": "Vaidehi Joshi",
    "moduleDamUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#object/content_module__v/V3Q00000000H009",
    "componentUrl": "https://d1t0wo1ho6nrgc.cloudfront.net/components/6b90ff66-f712-423b-a2d8-932e291ed3f8/7ccda75e-98cb-4866-aa9b-f58a0ce535e2/8884_1_0.png",
    "componentThumbnailUrl": "https://d1t0wo1ho6nrgc.cloudfront.net/components-thumbnails/6b90ff66-f712-423b-a2d8-932e291ed3f8/7ccda75e-98cb-4866-aa9b-f58a0ce535e2/8884_1_0.png",
    "approvedDateTime": "2026-02-24T10:42:22.000+0000",
    "createdDateTime": "2026-02-12T11:41:48.000+0000",
    "editedByName": "Vaidehi Joshi",
    "editedDateTime": "2026-02-24T10:42:25.000+0000",
    "strategicObjectives": [],
    "segments": [
      {
        "segmentDamId": "esbvyexpertise_driven_agents_of_chang__c",
        "segmentName": "ES-BVY-Expertise Driven: Agents of Change"
      }
    ],
    "indications": [],
    "claims": [
      {
        "claimName": "CL-005527",
        "claimDamId": "V1X00000000C140",
        "claimId": "f23cbca8-4012-4ab6-b6e4-47d06d7c247d",
        "matchText": "Aproximadamente el 60% de los pacientes no son completamente adherentes al TAR",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "mustUse": true,
        "abbreviation": "TAR: tratamiento antirretroviral.",
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "indicationNames": "3L LBCL,HIV Prevention (PrEP),MM",
        "matchTextVariants": [],
        "references": [
          {
            "id": "c303266b-38e8-43a0-9d71-561981a9fa26",
            "documentUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#doc_info/8753/1/0",
            "documentName": "McComsey G.A, et al. Real-World Adherence to Antiretroviral Therapy Among HIV-1 Patients Across the United States. Adv Ther. 2021 Sep;38(9):4961-4974. doi: 10.1007/s12325-021-01883-8."
          }
        ],
        "relatedClaims": []
      },
      {
        "claimName": "CL-005528",
        "claimDamId": "V1X00000000C141",
        "claimId": "41e3e7a4-ab57-4dd7-bea0-1a9dbcb54c2d",
        "matchText": "La adherencia subóptima se asocia con resistencia emergente al tratamiento",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "mustUse": true,
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "indicationNames": "2L LBCL",
        "matchTextVariants": [],
        "references": [
          {
            "id": "b9dd7759-15b9-4733-ade3-d02278d33029",
            "documentUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#doc_info/8754/1/0",
            "documentName": "Carr A, et al. HIV drug resistance in the era of contemporary antiretroviral therapy: A clinical perspective. Antivir Ther. 2023 Oct;28(5):1-15. doi: 10.1177/13596535231201162."
          }
        ],
        "relatedClaims": []
      },
      {
        "claimName": "CL-005529",
        "claimDamId": "V1X00000000C142",
        "claimId": "c4a1c769-9247-434f-b019-d1c38cecc4b4",
        "matchText": "La adherencia subóptima se asocia con una no supresión virológica (OR: 2,24; IC 95%: 1,66–3,02)",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "mustUse": true,
        "footnotes": "La adherencia subóptima se definió como un informe de ≥1 razón por la que faltó al tratamiento antirretroviral ≥5 veces en el último mes.\nDatos de encuestas de adultos VIH+ confirmados en tratamiento antirretroviral en 25 países durante 2019 (EE. UU. [n = 400], Sudáfrica [n = 179], Rusia [n = 150], Reino Unido [n = 123], Australia [n = 120], Canadá [n = 120], Francia [n = 120], Alemania [n = 120], Italia [n = 120], España [n = 120], Japón [n = 75], México [n = 63], Portugal [n = 60], Brasil [n=58], Suiza [n=55], Taiwán [n=55], Países Bajos [n=51], Argentina [n=50], Austria [n=50], Bélgica [n=50], Chile [n=50], China [n=50], Irlanda [n=50], Polonia [n=50] y Corea del Sur [n=50]); La no supresión virológica fue autoinformada.",
        "abbreviation": "IC: intervalo de confianza; OR: odds ratio; VIH: virus de inmunodeficiencia humana.",
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "indicationNames": "aALL",
        "matchTextVariants": [],
        "references": [
          {
            "id": "5368da1d-1ff4-4a74-9344-2eb8b12caefb",
            "documentUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#doc_info/8854/1/0",
            "documentName": "de Los Rios P, et al. Prevalence, determinants, and impact of suboptimal adherence to HIV medication in 25 countries. Prev Med. 2020 Oct;139:106182. doi: 10.1016/j.ypmed.2020.106182."
          }
        ],
        "relatedClaims": []
      },
      {
        "claimName": "CL-005530",
        "claimDamId": "V1X00000000C143",
        "claimId": "9d63efab-4991-465e-ad40-56742788b9b3",
        "matchText": "Biktarvy es el único regimen basado en INI con 0 resistencias en todos sus ensayos clínicos, tanto en población naïve como pretratada",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "mustUse": false,
        "footnotes": "Revisión sistemática donde se describen las mutaciones de resistencia y fracasos virológicos observados con los últimos INI aprobados: dolutegravir, bictegravir y cabotegravir. La revisión sistemática se llevó a cabo siguiendo los estándares habituales y, adicionalmente, se aplicaron las directrices de PRISMA.",
        "abbreviation": "INI: inhibidor de integrasa.",
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "indicationNames": "3L LBCL",
        "matchTextVariants": [],
        "references": [
          {
            "id": "d65a5b1d-70f1-4979-ba2c-199f30a506f7",
            "documentUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#doc_info/8860/1/0",
            "documentName": "Blanco JL, et al. HIV-1 resistance and virological failure to treatment with the integrase inhibitors bictegravir, cabotegravir and dolutegravir: a systematic literature review. AIDS reviews. 2024."
          }
        ],
        "relatedClaims": []
      },
      {
        "claimName": "CL-005531",
        "claimDamId": "V1X00000000C144",
        "claimId": "093d0256-95d2-408c-b748-e7d21bcb6040",
        "matchText": "Mutaciones de resistencia asociadas con el tratamiento. Pacientes con TAR previo",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "mustUse": false,
        "abbreviation": "TAR: tratamiento antirretroviral.",
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "indicationNames": "3L LBCL",
        "matchTextVariants": [],
        "references": [
          {
            "id": "5943b48e-61fe-46a0-8bcb-415cf467d25b",
            "documentUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#doc_info/8860/1/0",
            "documentName": "Blanco JL, et al. HIV-1 resistance and virological failure to treatment with the integrase inhibitors bictegravir, cabotegravir and dolutegravir: a systematic literature review. AIDS reviews. 2024."
          }
        ],
        "relatedClaims": []
      }
    ],
    "reusableTexts": [
      {
        "reusableTextId": "74eb1bcb-d573-4cdd-865c-70deed96023d",
        "reusableTextName": "RT-002178",
        "reusableTextDamId": "V1X00000000C169",
        "topicName": "Efficacy",
        "topicDamId": "V6G000000001002",
        "mustUse": true,
        "matchText": "Solicita aquí el acceso completo al contenido, materiales y recursos proporcionados por el equipo de información médica",
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "indicationNames": "3L LBCL",
        "matchTextVariants": []
      }
    ],
    "components": [
      {
        "componentId": "7ccda75e-98cb-4866-aa9b-f58a0ce535e2",
        "componentDocNumber": "COMP-0112",
        "componentDamId": "8884_1_0",
        "componentUrl": "https://d1t0wo1ho6nrgc.cloudfront.net/components/6b90ff66-f712-423b-a2d8-932e291ed3f8/7ccda75e-98cb-4866-aa9b-f58a0ce535e2/8884_1_0.png",
        "subType": "Image",
        "classification": "Illustration",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "componentName": "Advertencia de Riesgo: Símbolo de Precaución ante Situaciones Peligrosas",
        "title": "Advertencia de Riesgo: Símbolo de Precaución ante Situaciones Peligrosas",
        "mustUse": true,
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "relatedClaims": [],
        "relatedReusableTexts": []
      },
      {
        "componentId": "c990fbdf-7694-4a74-9fcc-7ef194d65723",
        "componentDocNumber": "COMP-0114",
        "componentDamId": "8886_1_0",
        "componentUrl": "https://d1t0wo1ho6nrgc.cloudfront.net/components/e3fa38de-9e99-4119-893d-20fe25a1ced6/c990fbdf-7694-4a74-9fcc-7ef194d65723/8886_1_0.png",
        "subType": "Data Graphic",
        "classification": "Data Chart",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "componentName": "Mutaciones de resistencia asociados con el tratamiento. Pacientes con TAR previo",
        "title": "Mutaciones de resistencia asociados con el tratamiento. Pacientes con TAR previo",
        "mustUse": false,
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "relatedClaims": [],
        "relatedReusableTexts": []
      },
      {
        "componentId": "0c1fcd18-f2c3-45ac-942a-0322f67ce686",
        "componentDocNumber": "COMP-0113",
        "componentDamId": "8885_1_0",
        "componentUrl": "https://d1t0wo1ho6nrgc.cloudfront.net/components/6b90ff66-f712-423b-a2d8-932e291ed3f8/0c1fcd18-f2c3-45ac-942a-0322f67ce686/8885_1_0.png",
        "subType": "Image",
        "classification": "Illustration",
        "topicDamId": "V6G000000001002",
        "topicName": "Efficacy",
        "componentName": "Representación Gráfica del Virus: Indicador de Amenaza Biológica o Infección",
        "title": "Representación Gráfica del Virus: Indicador de Amenaza Biológica o Infección",
        "mustUse": false,
        "mlrStatus": "Available for Use",
        "country": "Spain",
        "relatedClaims": [],
        "relatedReusableTexts": []
      }
    ],
    "businessRules": [],
    "cmsdDocId": "12314",
    "cmsdMajorV": null,
    "cmsdMinorV": null,
    "cmsdDocUrl": "https://sb-gilead-poc-global-promomats.veevavault.com/ui/#doc_info/12314",
    "logos": [
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/modulePreviewArrow.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/mustUseGreenDot.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/mustUseRedDot.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/final-status.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/statusDraft.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/statusApproved.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/Intermediate.svg",
      "https://d1t0wo1ho6nrgc.cloudfront.net/LOGO/infoIcon.svg"
    ],
    "sourceModuleDamName": null,
    "sourceModuleMlrStatus": null,
    "sourceModuleDamUrl": null,
    "sourceModuleId": null,
    "moduleDraftElementIncluded": null,
    "businessRulePublished": null,
    "hasUnpublishedBusinessRules": false,
    "buisnessRuleSaved": null
  }]);

// Write JSON file
fs.writeFileSync(
  "./extractedData.json",
  JSON.stringify(extractedData, null, 2),
  "utf-8"
);

console.log("JSON file created successfully");