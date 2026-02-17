import type { PayloadHandler } from 'payload'
import OpenAI from 'openai'
import { resolveDepartmentId } from '../utilities/departmentUtils'

interface ProductCreationInput {
  description?: string
  sizes: string[]
  basePrice: number
  department: string
  collection: string
  category: string // Can be category ID or category name
  stock?: number
  condition?: 'new' | 'used_like_new' | 'used_good' | 'used_fair'
  authenticity?: 'original' | 'replica'
}

interface AIProductStructure {
  style: {
    title: string
    material?: string
    brand?: string
    description?: string
  }
  variations: Array<{
    color: string
    imageIndexes: number[]
  }>
}

/**
 * AI-Powered Product Creation Endpoint
 *
 * Creates Style → Variations → SKUs from images + user inputs
 *
 * Usage: POST /api/create-product-with-ai
 * Body: {
 *   images: string[],           // Array of media IDs
 *   sizes: string[],            // Available sizes ["S", "M", "L"]
 *   basePrice: number,          // Base price
 *   department: string,         // Department ID or slug (e.g., "men", "women", "kids")
 *   collection: string,         // Collection ID (user-selected)
 *   category: string,           // Category ID (user-selected)
 *   stock?: number,             // Stock per SKU (optional)
 *   condition?: string          // Condition (optional)
 *   authenticity?: string       // Authenticity (optional)
 * }
 */
export const createProductWithAI: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check authentication
  if (!user) {
    return Response.json({
      errors: [{ message: 'Unauthorized' }],
    }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      errors: [{ message: 'OPENAI_API_KEY not configured' }],
    }, { status: 500 })
  }

  try {
    const body = await req.json?.()
    const {
      images,
      description,
      sizes,
      basePrice,
      department,
      collection,
      category,
      stock,
      condition = 'new',
      authenticity,
    }: ProductCreationInput & { images: string[] } = body || {}

    // Validate input
    if (!images || !Array.isArray(images) || images.length === 0) {
      return Response.json({
        errors: [{ message: 'Images are required' }],
      }, { status: 400 })
    }

    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return Response.json({
        errors: [{ message: 'Sizes are required' }],
      }, { status: 400 })
    }

    if (!basePrice || typeof basePrice !== 'number' || basePrice <= 0) {
      return Response.json({
        errors: [{ message: 'Valid base price is required' }],
      }, { status: 400 })
    }

    if (!department || typeof department !== 'string') {
      return Response.json({
        errors: [{ message: 'Department is required' }],
      }, { status: 400 })
    }

    if (!collection || typeof collection !== 'string') {
      return Response.json({
        errors: [{ message: 'Collection is required' }],
      }, { status: 400 })
    }

    if (!category || typeof category !== 'string') {
      return Response.json({
        errors: [{ message: 'Category is required' }],
      }, { status: 400 })
    }

    payload.logger.info(
      `[CreateProductAI] Starting AI product creation for user ${typeof user === 'string' ? user : user.id}`
    )

    // Step 1: Validate images FIRST before doing anything else
    payload.logger.info('[CreateProductAI] Validating images before product creation...')
    const validationResult = await validateImagesBeforeCreation(payload, images)

    if (!validationResult.approved) {
      const issuesText = validationResult.issues.length > 0
        ? validationResult.issues.join(', ')
        : `Quality score too low (${validationResult.score}/100)`

      payload.logger.warn(`[CreateProductAI] Image validation failed - Score: ${validationResult.score}/100`)
      payload.logger.warn(`[CreateProductAI] Specific issues from AI: ${JSON.stringify(validationResult.issues)}`)
      payload.logger.warn(`[CreateProductAI] Error message to user: ${issuesText}`)

      // Clean up uploaded images since validation failed
      await cleanupUploadedImages(payload, images)

      return Response.json({
        errors: [
          {
            message: `Image validation failed: ${issuesText}`,
          },
        ],
      }, { status: 400 })
    }

    payload.logger.info(`[CreateProductAI] Images validated successfully (score: ${validationResult.score}/100)`)

    // Step 2: Resolve category (ID or name) - need this before AI validation
    const categoryId = await resolveCategoryId(payload, req, category, collection)
    if (!categoryId) {
      return Response.json({
        errors: [{ message: `Invalid category: ${category}` }],
      }, { status: 400 })
    }

    // Get category name for AI validation
    const categoryDoc = await payload.findByID({
      collection: 'categories',
      id: categoryId,
    })
    const categoryName = categoryDoc?.category || 'Unknown'
    payload.logger.info(`[CreateProductAI] Using category: ${categoryName} (ID: ${categoryId})`)

    // Step 3: Generate description from images if not provided
    let finalDescription = description
    if (!finalDescription) {
      payload.logger.info('[CreateProductAI] No description provided, generating from images...')
      try {
        finalDescription = await generateDescriptionFromImages(payload, images)
        payload.logger.info(`[CreateProductAI] Generated description: ${finalDescription.substring(0, 100)}...`)
      } catch (error) {
        payload.logger.warn('[CreateProductAI] Failed to generate description (localhost not accessible from OpenAI), using placeholder')
        finalDescription = 'Fashion item'
      }
    }

    // Step 4: Analyze images with AI - validate against user's selected category
    let productStructure: AIProductStructure
    try {
      productStructure = await analyzeProductWithAI(
        payload,
        images,
        finalDescription,
        categoryName
      )
      payload.logger.info(
        `[CreateProductAI] AI analysis complete: ${productStructure.variations.length} variations detected`
      )
    } catch (error) {
      const errorMessage = String(error)

      payload.logger.error(`[CreateProductAI] AI analysis failed: ${errorMessage}`)

      // Clean up uploaded images since AI analysis failed
      await cleanupUploadedImages(payload, images)

      // Return a proper error to the user - no fallback to "Default"
      return Response.json({
        errors: [
          {
            message: errorMessage.includes('Error: ')
              ? errorMessage.replace('Error: ', '')
              : `Failed to analyze product images: ${errorMessage}. Please try again.`,
          },
        ],
      }, { status: 400 })
    }

    // Step 5: Get user ID
    const userId = typeof user === 'string' ? user : user.id

    // Step 6: Resolve department ID from slug or ID
    const departmentId = await resolveDepartmentId(payload, department)
    if (!departmentId) {
      return Response.json({
        errors: [{ message: `Invalid department: ${department}` }],
      }, { status: 400 })
    }

    // Step 7: Create the product structure
    const result = await createProductInDatabase(
      payload,
      req,
      productStructure,
      images,
      sizes,
      basePrice,
      stock,
      condition,
      userId,
      departmentId,
      collection,
      categoryId,
      authenticity
    )

    payload.logger.info(
      `[CreateProductAI] Product created successfully: Style ${result.styleId}, ${result.variationIds.length} variations, ${result.skuIds.length} SKUs`
    )

    // Create notification for the seller
    try {
      await payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          type: 'system',
          message: `Your product "${productStructure.style.title}" has been created successfully! Tap to view details and manage variations.`,
          path: `/sell/style/${result.styleId}`,
          metadata: {
            styleId: result.styleId,
            variationCount: result.variationIds.length,
            skuCount: result.skuIds.length,
          },
        },
        req,
      })
      payload.logger.info(`[CreateProductAI] Notification created for user ${userId}`)
    } catch (notifError) {
      payload.logger.error(`[CreateProductAI] Failed to create notification: ${notifError}`)
      // Don't fail the entire request if notification fails
    }

    return Response.json({
      success: true,
      data: result,
    })
  } catch (error) {
    payload.logger.error(`[CreateProductAI] Error: ${error}`)
    return Response.json({
      errors: [
        {
          message: String(error).replace('Error: ', ''),
        },
      ],
    }, { status: 500 })
  }
}

/**
 * Analyze images and description using OpenAI to extract product structure
 * Validates that images match the user's selected category
 */
async function analyzeProductWithAI(
  payload: any,
  imageIds: string[],
  description: string,
  expectedCategory: string
): Promise<AIProductStructure> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Fetch image documents
  const mediaDocs = await payload.find({
    collection: 'media',
    where: { id: { in: imageIds } },
    limit: imageIds.length,
  })

  // Sort to match original order
  const sortedMediaDocs = imageIds
    .map((id) => mediaDocs.docs.find((doc: any) => doc.id === id))
    .filter((doc): doc is any => doc !== undefined)

  // Build content array with all images
  const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []

  for (let i = 0; i < sortedMediaDocs.length; i++) {
    const mediaDoc = sortedMediaDocs[i]
    if (!mediaDoc.filename) continue

    // Use public URL for OpenAI to access images
    const baseUrl = process.env.OPENAI_PUBLIC_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const fullUrl = `${baseUrl}/api/media/file/${mediaDoc.filename}`

    imageContents.push({
      type: 'image_url',
      image_url: {
        url: fullUrl,
        detail: 'high',
      },
    })
  }

  // Add the comprehensive prompt
  imageContents.push({
    type: 'text',
    text: `You are a fashion e-commerce product analyzer for DRES, a Ghana-based fashion marketplace.

Analyze these ${sortedMediaDocs.length} product images and the description below to create a structured product listing.

User Description: "${description}"
User Selected Category: "${expectedCategory}"

**CRITICAL: CATEGORY VALIDATION**
The user has selected the category "${expectedCategory}". You MUST verify that the images match this category.
- If images show products that belong to "${expectedCategory}", proceed with analysis
- If images show products from a DIFFERENT category, return an error
- Example: User selected "T-Shirts" but images show "Hoodies" = ERROR
- Example: User selected "Dresses" but images show "Skirts" = ERROR

IMPORTANT: This marketplace serves both Western/contemporary fashion AND African/traditional fashion. Be able to recognize:
- Traditional African clothing (Kente, Ankara, Dashiki, Kaftan, Agbada, Kaba and Slit, etc.)
- African print patterns and fabrics (Ankara prints, Wax prints, Kente patterns)
- Contemporary/Western fashion (T-Shirts, Jeans, Dresses, etc.)

Your tasks:
1. Determine the material/fabric if visible - recognize African fabrics (Kente, Ankara, African Print, Wax Print, etc.)
2. Detect the brand if visible (or use "Other" if not visible)
3. Group images by color variation (same product, different colors)
4. Generate a descriptive product title that CLEARLY identifies what the item is (including whether it's traditional/African style)

TITLE GENERATION RULES:
- The title MUST clearly identify the specific product type (e.g., "Hoodie", "Denim Jeans", "Ankara Dress", "Kente Cloth")
- Include key identifying details: color, material, pattern, and/or style
- Format: "[Color/Pattern] [Material] [Product Type]" or "[Material] [Product Type]" or "[Style] [Product Type]"
- Examples (Western):
  ✓ Good: "Navy Blue Cotton Hoodie", "Black Denim Jeans", "Brown Leather Boots", "White Canvas Sneakers"
  ✓ Good: "Red Floral Dress", "Grey Wool Coat", "Striped T-Shirt", "Suede Ankle Boots"
- Examples (African/Traditional):
  ✓ Good: "Multicolor Kente Cloth", "Blue Ankara Dress", "Yellow Dashiki", "White Kaftan"
  ✓ Good: "Red Kaba and Slit", "Green African Print Top", "Traditional Agbada", "Patterned Boubou"
  ✗ Bad: "Fashion Item", "Clothing", "Apparel", "Product", "African Wear" (too generic)
- For traditional items, always specify the style (Kente, Ankara, Dashiki, etc.)
- Keep it concise (3-6 words) but descriptive enough to identify the item
- Use proper capitalization for each word

CRITICAL VALIDATION RULES - READ CAREFULLY:

**WHAT TO ACCEPT (proceed with normal JSON response):**
- ✅ ACCEPT: Same product in different colors (e.g., "Blue T-Shirt" + "Red T-Shirt") - GROUP BY COLOR
- ✅ ACCEPT: Same product from different angles (front, side, back, top) - GROUP TOGETHER
- ✅ ACCEPT: Same product in different lighting or backgrounds - GROUP TOGETHER
- ✅ ACCEPT: Same product worn vs laid flat - GROUP TOGETHER
- ✅ ACCEPT: Color variations (Purple version + Navy Blue version) - CREATE COLOR VARIATIONS

**WHAT TO REJECT (return error):**
- ❌ REJECT: Different product types (e.g., "T-Shirt" + "Hoodie", "Dress" + "Skirt")
- ❌ REJECT: Different product categories (e.g., "T-shirt" + "Jeans", "Shoes" + "Bag")
- ❌ REJECT: Different brands when brands ARE visible (e.g., visible Nike logo + visible Adidas logo)
  - NOTE: If NO brand visible, don't reject based on brand
- ❌ REJECT: Completely different items (e.g., "Running shoes" + "Dress shoes")

**CRITICAL: COLOR VARIATIONS = ALWAYS ACCEPT**
- "Purple Levi's T-Shirt" + "Navy Blue Levi's T-Shirt" = ✅ ACCEPT (create 2 color variations)
- "Red Dress" + "Black Dress" (same style) = ✅ ACCEPT (create 2 color variations)
- "White Sneakers" + "Black Sneakers" (same model) = ✅ ACCEPT (create 2 color variations)
- Different colors of the same item = ✅ ALWAYS ACCEPT

**ONLY return an error if:**
1. Images don't match the user's selected category "${expectedCategory}"
2. Different product types/categories (not just colors!)
3. Different brands when brands are VISIBLY shown
4. Mixed unrelated items (shirt + shoes, bag + dress)

CRITICAL RULES for color grouping:
- Only group images of the SAME product in DIFFERENT colors
- If images show different angles/lighting of the SAME colored item, group them together
- Each distinct color should be a separate variation
- **IMPORTANT**: Use descriptive, specific color names (e.g., "Navy Blue", "Black", "Olive Green", "Red", "White", "Purple", "Teal")
- **NEVER use generic names**: NEVER use "Default", "N/A", "Unknown", or similar generic terms
- **ALWAYS identify the actual color**: Even if uncertain, provide your best estimate (e.g., "Blue", "Dark Blue", "Light Blue" instead of "Default")
- For multicolor items, describe the dominant color or pattern (e.g., "Multicolor", "Red and Blue", "Striped")

Image indexes are 0-based (first image is index 0, second is index 1, etc.).

**WHEN TO RETURN AN ERROR:**
ONLY return an error if images show ACTUALLY DIFFERENT product types (NOT just different colors!):
- Category mismatch: User selected "T-Shirts" but images show "Hoodies" = ERROR
- Category mismatch: User selected "Dresses" but images show "Skirts" = ERROR
- Different product types: T-Shirt + Hoodie = ERROR
- Different shoe models: Nike Air Max + Adidas Ultraboost = ERROR
- Mixed categories: T-shirt + Jeans = ERROR
- Different brands (when visible): Visible Nike logo + Visible Adidas logo = ERROR

**DO NOT return an error for:**
- Same product in different colors: Purple Levi's shirt + Blue Levi's shirt = NO ERROR (just group by color)
- Same product from different angles = NO ERROR
- Same product in different lighting = NO ERROR

Error format (use ONLY for different product types, NOT colors):
{
  "error": "Images show different product types. Please upload images of the same product only.",
  "detectedItems": ["T-Shirt", "Hoodie"]
}

OTHERWISE (including color variations), return valid JSON in this format:
{
  "style": {
    "title": "Navy Blue Cotton Hoodie",
    "material": "Cotton",
    "brand": "Other",
    "description": "Comfortable navy blue hoodie with front pocket and drawstring hood"
  },
  "variations": [
    {
      "color": "Navy Blue",
      "imageIndexes": [0, 1, 2]
    },
    {
      "color": "Black",
      "imageIndexes": [3, 4]
    }
  ]
}

Example for single color with multiple angles (all same blue shirt from different angles):
{
  "style": {
    "title": "Blue Cotton T-Shirt",
    "material": "Cotton",
    "brand": "Other",
    "description": "Classic blue cotton t-shirt with crew neck"
  },
  "variations": [
    {
      "color": "Blue",
      "imageIndexes": [0, 1, 2, 3, 4, 5]
    }
  ]
}

Example for color variations (purple and navy blue versions of same Levi's t-shirt):
{
  "style": {
    "title": "Levi's Cotton T-Shirt",
    "material": "Cotton",
    "brand": "Levi's",
    "description": "Classic Levi's cotton t-shirt available in multiple colors"
  },
  "variations": [
    {
      "color": "Purple",
      "imageIndexes": [0, 1, 2]
    },
    {
      "color": "Navy Blue",
      "imageIndexes": [3, 4, 5]
    }
  ]
}

More title examples:
Western/Contemporary:
- "Black Leather Ankle Boots"
- "White Cotton T-Shirt"
- "Blue Denim Jeans"
- "Red Floral Summer Dress"
- "Grey Wool Blazer"

African/Traditional:
- "Multicolor Kente Cloth"
- "Blue Ankara Maxi Dress"
- "Yellow Dashiki Shirt"
- "Red Kaba and Slit"
- "Green African Print Top"
- "Traditional White Kaftan"
- "Patterned Boubou Robe"

Materials:
Western Fabrics:
- Cotton, Polyester, Denim, Leather, Suede, Canvas, Wool, Silk, Linen, Nylon, Spandex

African/Traditional Fabrics:
- Kente, Ankara, African Print, Wax Print, Batik, Adire, Aso Oke, Mudcloth

Use specific fabric names when identifiable (e.g., "Kente" not just "Traditional Fabric")

IMPORTANT: Make sure imageIndexes are 0-based and correspond to the images provided.`,
  })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: imageContents,
        },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    payload.logger.info(`[CreateProductAI] Raw AI response: ${content}`)

    const result = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())

    // Check if AI detected different products and returned an error
    if (result.error) {
      payload.logger.error(`[CreateProductAI] AI validation failed: ${result.error}`)
      throw new Error(result.error)
    }

    // Validate that we have the expected structure
    if (!result.style || !result.variations || result.variations.length === 0) {
      payload.logger.error(`[CreateProductAI] Invalid AI response structure: ${JSON.stringify(result)}`)
      throw new Error('Could not analyze product images. Please ensure all images show the same product.')
    }

    // Validate that all variations have proper color names (not "Default")
    const invalidVariations = result.variations.filter((v: any) =>
      !v.color || v.color.toLowerCase() === 'default' || v.color.trim() === ''
    )

    if (invalidVariations.length > 0) {
      payload.logger.error(`[CreateProductAI] AI returned invalid color names: ${JSON.stringify(invalidVariations)}`)
      throw new Error('Could not properly detect product colors. Please try again with clearer images.')
    }

    payload.logger.info(
      `[CreateProductAI] AI detected: ${result.style?.title}, ${result.variations?.length} variations`
    )

    return result as AIProductStructure
  } catch (error) {
    // Log the full error for debugging
    if (error instanceof Error) {
      payload.logger.error(`[CreateProductAI] AI analysis error: ${error.message}`)
      if (error.stack) {
        payload.logger.error(`[CreateProductAI] Stack trace: ${error.stack}`)
      }
    }
    throw error
  }
}

/**
 * Create Style, Variations, and SKUs in the database
 */
async function createProductInDatabase(
  payload: any,
  req: any,
  structure: AIProductStructure,
  imageIds: string[],
  sizes: string[],
  basePrice: number,
  stock: number | undefined,
  condition: string,
  userId: string,
  departmentId: string,
  collectionId: string,
  categoryId: string,
  authenticity?: string
) {
  // Step 1: Use user-provided category (no need to find/create)
  payload.logger.info(`[CreateProductAI] Using user-provided category: ${categoryId}`)

  // Step 2: Find or create Brand
  payload.logger.info(`[CreateProductAI] Looking for brand: "${structure.style.brand || 'Other'}"`)
  const brandDoc = await findOrCreateBrand(payload, req, structure.style.brand || 'Other')
  if (!brandDoc) {
    throw new Error(`Failed to find or create brand: ${structure.style.brand}`)
  }
  payload.logger.info(`[CreateProductAI] Found/created brand: ${brandDoc.name} (ID: ${brandDoc.id})`)

  // Step 3: Find or create Material (if provided)
  let materialDoc = null
  if (structure.style.material) {
    materialDoc = await findOrCreateMaterial(payload, req, structure.style.material)
  }

  // Step 4: Find Color attribute
  const colorAttribute = await payload.find({
    collection: 'attributes',
    where: { name: { equals: 'Color' } },
    limit: 1,
  })

  if (colorAttribute.docs.length === 0) {
    throw new Error('Color attribute not found')
  }

  const colorAttributeId = colorAttribute.docs[0].id

  // Step 5: Create Style (draft)
  const styleData: any = {
    title: structure.style.title,
    category: categoryId,
    brand: brandDoc.id,
    department: departmentId,
    collection: collectionId,
    seller: userId,
    description: structure.style.description || structure.style.title,
    status: 'draft',
  }

  if (materialDoc) {
    styleData.material = materialDoc.id
  }

  if (authenticity) {
    styleData.authenticity = authenticity
  }

  payload.logger.info(`[CreateProductAI] Creating style with data: ${JSON.stringify(styleData, null, 2)}`)

  const style = await payload.create({
    collection: 'styles',
    data: styleData,
    req,
  })

  payload.logger.info(`[CreateProductAI] Created style: ${style.id}`)

  const variationIds: string[] = []
  const skuIds: string[] = []

  // Step 6: Create Variations and SKUs
  for (const variation of structure.variations) {
    // Find or create color option
    const colorOptionId = await findOrCreateColorOption(payload, req, variation.color)
    if (!colorOptionId) {
      payload.logger.warn(`[CreateProductAI] Skipping variation ${variation.color}: failed to create color option`)
      continue
    }

    // Get image IDs for this variation
    const variationImageIds = variation.imageIndexes
      .filter(idx => idx >= 0 && idx < imageIds.length)
      .map(idx => imageIds[idx])

    if (variationImageIds.length === 0) {
      payload.logger.warn(`[CreateProductAI] Skipping variation ${variation.color}: no valid images`)
      continue
    }

    // Create variation
    const variationDoc = await payload.create({
      collection: 'variations',
      data: {
        title: `${structure.style.title} - ${variation.color}`,
        style: style.id,
        images: variationImageIds,
        condition: condition,
        variants: [
          {
            variant: colorAttributeId,
            value: colorOptionId,
          },
        ],
        status: 'draft',
        imageValidationStatus: 'pending',
      },
      req,
    })

    variationIds.push(variationDoc.id)
    payload.logger.info(`[CreateProductAI] Created variation: ${variationDoc.id} (${variation.color})`)

    // Create SKUs for each size
    for (const size of sizes) {
      // Find or create size option
      const sizeOptionId = await findOrCreateSizeOption(payload, req, size)
      if (!sizeOptionId) {
        payload.logger.warn(`[CreateProductAI] Skipping SKU for size ${size}: failed to create size option`)
        continue
      }

      const skuData: any = {
        variation: variationDoc.id,
        price: basePrice,
        stock: stock,
        isActive: true,
        status: 'active',
        skuOptions: [
          {
            option: await getSizeAttributeId(payload),
            value: sizeOptionId,
          },
        ],
      }

      const sku = await payload.create({
        collection: 'skus',
        data: skuData,
        req,
      })

      skuIds.push(sku.id)
    }

    payload.logger.info(`[CreateProductAI] Created ${sizes.length} SKUs for variation ${variationDoc.id}`)
  }

  return {
    styleId: style.id,
    variationIds,
    skuIds,
    summary: {
      title: structure.style.title,
      variations: structure.variations.length,
      skusPerVariation: sizes.length,
      totalSkus: skuIds.length,
    },
  }
}

/**
 * Helper: Resolve category ID from either ID or name
 * If ID is provided, verify it exists
 * If name is provided, find or create the category and link to collection
 */
async function resolveCategoryId(
  payload: any,
  req: any,
  categoryInput: string,
  collectionId: string
): Promise<string | null> {
  // Check if input is a valid ObjectId (24-character hex string)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryInput)

  if (isObjectId) {
    // Input is an ID - verify it exists
    payload.logger.info(`[CreateProductAI] Category input is ID: ${categoryInput}`)
    try {
      const category = await payload.findByID({
        collection: 'categories',
        id: categoryInput,
      })
      if (category) {
        payload.logger.info(`[CreateProductAI] Category found: ${category.category} (ID: ${category.id})`)
        return category.id
      }
    } catch (error) {
      payload.logger.error(`[CreateProductAI] Category ID not found: ${categoryInput}`)
      return null
    }
  }

  // Input is a name - find or create the category
  payload.logger.info(`[CreateProductAI] Category input is name: "${categoryInput}"`)
  const categoryDoc = await findOrCreateCategory(payload, req, categoryInput)

  if (!categoryDoc) {
    return null
  }

  // Ensure category is linked to the collection
  const categoryCollections = Array.isArray(categoryDoc.collections)
    ? categoryDoc.collections.map((c: any) => (typeof c === 'object' ? c.id : c))
    : []

  if (!categoryCollections.includes(collectionId)) {
    payload.logger.info(`[CreateProductAI] Linking category "${categoryDoc.category}" to collection ${collectionId}`)
    await payload.update({
      collection: 'categories',
      id: categoryDoc.id,
      data: {
        collections: [...categoryCollections, collectionId],
      },
    })
    payload.logger.info(`[CreateProductAI] Category linked to collection successfully`)
  } else {
    payload.logger.info(`[CreateProductAI] Category already linked to collection`)
  }

  return categoryDoc.id
}

/**
 * Helper: Find or create Category with fuzzy matching
 */
async function findOrCreateCategory(payload: any, req: any, categoryName: string) {
  // 1. Try exact match first (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'categories',
    where: {
      category: { equals: categoryName },
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    payload.logger.info(`[CreateProductAI] Exact match found for category "${categoryName}": ${exactMatch.docs[0].category} (ID: ${exactMatch.docs[0].id})`)
    return exactMatch.docs[0]
  }

  // 2. Try fuzzy match - fetch all categories and find closest match
  const allCategories = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
  })

  const normalizedInput = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '')

  for (const cat of allCategories.docs) {
    const catName = cat.category || ''
    const normalizedCat = catName.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Check if very similar (handles "tshirt" vs "t-shirt" vs "t shirt")
    if (normalizedCat === normalizedInput) {
      payload.logger.info(
        `[CreateProductAI] Fuzzy matched category "${categoryName}" to existing "${catName}"`
      )
      return cat
    }
  }

  // 3. Check for partial match (e.g., "shirt" matches "T-Shirts")
  for (const cat of allCategories.docs) {
    const catName = (cat.category || '').toLowerCase()
    const inputLower = categoryName.toLowerCase()

    if (catName.includes(inputLower) || inputLower.includes(catName)) {
      payload.logger.info(
        `[CreateProductAI] Partial matched category "${categoryName}" to existing "${cat.category}"`
      )
      return cat
    }
  }

  // 4. No match found - create new (but log it for review)
  payload.logger.warn(
    `[CreateProductAI] Creating NEW category: "${categoryName}" - No existing match found. Please review.`
  )

  const slug = categoryName.toLowerCase().replace(/\s+/g, '-')
  const newCategory = await payload.create({
    collection: 'categories',
    data: {
      category: categoryName,
      slug: slug,
    },
    req,
  })

  payload.logger.info(`[CreateProductAI] Created new category: ${newCategory.category} (ID: ${newCategory.id})`)
  return newCategory
}

/**
 * Helper: Find or create Collection with fuzzy matching
 */
async function findOrCreateCollection(payload: any, req: any, collectionName: string) {
  // 1. Try exact match first (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'collections',
    where: {
      name: { equals: collectionName },
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    return exactMatch.docs[0]
  }

  // 2. Try fuzzy match - fetch all collections and find closest match
  const allCollections = await payload.find({
    collection: 'collections',
    limit: 100,
    depth: 0,
  })

  const normalizedInput = collectionName.toLowerCase().replace(/[^a-z0-9]/g, '')

  for (const col of allCollections.docs) {
    const colName = col.name || ''
    const normalizedCol = colName.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Check if very similar
    if (normalizedCol === normalizedInput) {
      payload.logger.info(
        `[CreateProductAI] Fuzzy matched collection "${collectionName}" to existing "${colName}"`
      )
      return col
    }
  }

  // 3. Check for partial match
  for (const col of allCollections.docs) {
    const colName = (col.name || '').toLowerCase()
    const inputLower = collectionName.toLowerCase()

    if (colName.includes(inputLower) || inputLower.includes(colName)) {
      payload.logger.info(
        `[CreateProductAI] Partial matched collection "${collectionName}" to existing "${col.name}"`
      )
      return col
    }
  }

  // 4. No match found - create new
  payload.logger.info(
    `[CreateProductAI] Creating NEW collection: "${collectionName}"`
  )

  const slug = collectionName.toLowerCase().replace(/\s+/g, '-')
  return await payload.create({
    collection: 'collections',
    data: {
      name: collectionName,
      slug: slug,
    },
    req,
  })
}

/**
 * Helper: Find or create Brand with fuzzy matching
 */
async function findOrCreateBrand(payload: any, req: any, brandName: string) {
  // 1. Try exact match first (case-insensitive)
  const exactMatch = await payload.find({
    collection: 'brands',
    where: {
      name: { equals: brandName },
    },
    limit: 1,
  })

  if (exactMatch.docs.length > 0) {
    return exactMatch.docs[0]
  }

  // 2. Try fuzzy match - fetch all brands and find closest match
  const allBrands = await payload.find({
    collection: 'brands',
    limit: 500,
    depth: 0,
  })

  const normalizedInput = brandName.toLowerCase().replace(/[^a-z0-9]/g, '')

  for (const brand of allBrands.docs) {
    const brandNameStr = brand.name || ''
    const normalizedBrand = brandNameStr.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Check if very similar (handles "nike" vs "Nike" vs "NIKE")
    if (normalizedBrand === normalizedInput) {
      payload.logger.info(
        `[CreateProductAI] Fuzzy matched brand "${brandName}" to existing "${brandNameStr}"`
      )
      return brand
    }
  }

  // 3. No match found - create new (log for review)
  payload.logger.warn(
    `[CreateProductAI] Creating NEW brand: "${brandName}" - No existing match found. Please review.`
  )

  const slug = brandName.toLowerCase().replace(/\s+/g, '-')
  return await payload.create({
    collection: 'brands',
    data: {
      name: brandName,
      slug: slug,
    },
    req,
  })
}

/**
 * Helper: Find or create Material
 */
async function findOrCreateMaterial(payload: any, req: any, materialName: string) {
  const existing = await payload.find({
    collection: 'materials',
    where: { name: { equals: materialName } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return existing.docs[0]
  }

  const slug = materialName.toLowerCase().replace(/\s+/g, '-')
  return await payload.create({
    collection: 'materials',
    data: {
      name: materialName,
      slug: slug,
    },
    req,
  })
}

/**
 * Helper: Find or create Color AttributeOption
 */
async function findOrCreateColorOption(
  payload: any,
  req: any,
  colorName: string
): Promise<string | null> {
  try {
    const colorAttribute = await payload.find({
      collection: 'attributes',
      where: { name: { equals: 'Color' } },
      limit: 1,
    })

    if (colorAttribute.docs.length === 0) {
      return null
    }

    const colorAttributeId = colorAttribute.docs[0].id

    const existing = await payload.find({
      collection: 'attributeOptions',
      where: {
        and: [
          { attribute: { equals: colorAttributeId } },
          { name: { contains: colorName } },
        ],
      },
      limit: 10,
    })

    const existingOption = existing.docs.find(
      (opt: any) => opt.name?.toLowerCase() === colorName.toLowerCase()
    )

    if (existingOption) {
      return existingOption.id
    }

    const properName = colorName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    const slug = colorName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const newOption = await payload.create({
      collection: 'attributeOptions',
      data: {
        name: properName,
        slug: slug,
        attribute: colorAttributeId,
      },
      req,
    })

    return newOption.id
  } catch (error) {
    payload.logger.error(`[CreateProductAI] Error creating color option: ${error}`)
    return null
  }
}

/**
 * Helper: Find or create Size AttributeOption
 */
async function findOrCreateSizeOption(
  payload: any,
  req: any,
  sizeName: string
): Promise<string | null> {
  try {
    const sizeAttribute = await payload.find({
      collection: 'attributes',
      where: { name: { equals: 'Size' } },
      limit: 1,
    })

    if (sizeAttribute.docs.length === 0) {
      return null
    }

    const sizeAttributeId = sizeAttribute.docs[0].id

    const existing = await payload.find({
      collection: 'attributeOptions',
      where: {
        and: [
          { attribute: { equals: sizeAttributeId } },
          { name: { equals: sizeName } },
        ],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return existing.docs[0].id
    }

    const slug = sizeName.toLowerCase().replace(/\s+/g, '-')

    const newOption = await payload.create({
      collection: 'attributeOptions',
      data: {
        name: sizeName.toUpperCase(),
        slug: slug,
        attribute: sizeAttributeId,
      },
      req,
    })

    return newOption.id
  } catch (error) {
    payload.logger.error(`[CreateProductAI] Error creating size option: ${error}`)
    return null
  }
}

/**
 * Helper: Get Size attribute ID
 */
async function getSizeAttributeId(payload: any): Promise<string> {
  const sizeAttribute = await payload.find({
    collection: 'attributes',
    where: { name: { equals: 'Size' } },
    limit: 1,
  })

  if (sizeAttribute.docs.length === 0) {
    throw new Error('Size attribute not found')
  }

  return sizeAttribute.docs[0].id
}

/**
 * Validate images before creating product
 * Returns validation result with approval status and score
 */
async function validateImagesBeforeCreation(
  payload: any,
  imageIds: string[]
): Promise<{ approved: boolean; score: number; issues: string[] }> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Fetch all categories from CMS
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 200,
    depth: 0,
  })
  const categoryNames = categoriesResult.docs
    .map((doc: any) => doc.category)
    .filter(Boolean)
    .join(', ')

  // Fetch image documents
  const mediaDocs = await payload.find({
    collection: 'media',
    where: { id: { in: imageIds } },
    limit: imageIds.length,
  })

  // Sort to match original order
  const sortedMediaDocs = imageIds
    .map((id) => mediaDocs.docs.find((doc: any) => doc.id === id))
    .filter((doc): doc is any => doc !== undefined)

  // Build image contents using URLs
  const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []
  const serverUrl = process.env.OPENAI_PUBLIC_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  payload.logger.info(`[ImageValidation] Using server URL for images: ${serverUrl}`)
  payload.logger.info(`[ImageValidation] OPENAI_PUBLIC_URL is ${process.env.OPENAI_PUBLIC_URL ? 'SET' : 'NOT SET'}`)

  for (const mediaDoc of sortedMediaDocs) {
    if (mediaDoc.url) {
      const fullUrl = mediaDoc.url.startsWith('http')
        ? mediaDoc.url
        : `${serverUrl}${mediaDoc.url}`
      payload.logger.info(`[ImageValidation] Adding image URL: ${fullUrl}`)
      imageContents.push({
        type: 'image_url',
        image_url: {
          url: fullUrl,
          detail: 'low', // Use low detail for faster validation
        },
      })
    }
  }

  if (imageContents.length === 0) {
    return {
      approved: false,
      score: 0,
      issues: ['No valid images found'],
    }
  }

  // Add validation prompt
  imageContents.push({
    type: 'text',
    text: `You are validating product images for DRES, a Ghana-based fashion marketplace.

This marketplace serves both Western/contemporary fashion AND African/traditional fashion items.

Expected Product Categories:
${categoryNames}

Analyze these ${imageContents.length - 1} product image(s) and score them based on quality.

Scoring Guidelines (give higher scores for better quality):
1. Images must be real product photos (not screenshots, memes, AI-generated, or unrelated images)
2. Images should show actual clothing/fashion items from the categories above
3. **CRITICAL: All images MUST show the SAME type of product**
   - ✓ GOOD: Same product from front, side, back, top views (DIFFERENT ANGLES = OK)
   - ✓ GOOD: Same product in different lighting conditions (LIGHTING VARIATIONS = OK)
   - ✓ GOOD: Same product worn vs laid flat (DIFFERENT PRESENTATION = OK)
   - ✓ GOOD: Same dress design in multiple colors (COLOR VARIATIONS = OK)
   - ✓ GOOD: Same fabric/pattern in different colorways (e.g., striped fabric in yellow/blue AND striped fabric in navy/pink = SAME DESIGN, different colors = OK)
   - ✓ GOOD: Same style garment in different prints or colorways (e.g., floral dress in red tones + floral dress in blue tones = OK)
   - ✓ GOOD: Same product design where ONLY the color differs (shape, cut, pattern structure are the same = OK)
   - ✗ BAD: Two completely different product types (e.g., a T-Shirt + a Hoodie = REJECT)
   - ✗ BAD: Mixed product categories (e.g., shirt + shoes, bag + dress = REJECT)
   - **COLOR VARIATIONS ARE EXPECTED**: Sellers on DRES list products with multiple color variations. If images show the same product design/style/cut but in different colors, patterns, or colorways, this is NORMAL and SHOULD BE ACCEPTED. The key question is: "Is this the same product just in a different color?" If yes, ACCEPT.
   - **BRAND CHECK**: Only check brands IF they are visible in the images
     - If brand logos/tags are visible: All images must show the SAME brand
     - If NO brand is visible: Skip brand check, just verify it's the same product type
     - Example: Nike Air Max + Adidas Ultraboost = REJECT (different brands visible)
     - Example: Generic white t-shirt from different angles = OK (no brand visible)
   - **IMPORTANT**: Do NOT reject images just because they show different angles, lighting, or backgrounds
   - **IMPORTANT**: Do NOT reject images because they show different colors or colorways of the same design
   - **IMPORTANT**: Only reject if you see clearly different product TYPES (e.g., shirt vs pants) or (if brands are visible) different brands
4. Image quality should be acceptable (clear, well-lit)
5. No explicit, offensive, or inappropriate content
6. **Color variations are WELCOME**: Images showing the same product in different colors is the expected use case
   - Multiple angles of same colored item = OK
   - Same product in red + blue colors = OK
   - Same fabric pattern in different colorways (yellow/blue stripes + navy/pink stripes) = OK
   - One red shirt + one blue COMPLETELY DIFFERENT shirt (different cut, style, design) = REJECT
7. Images must not show completely different product categories (e.g., shirt + shoes, bag + dress)
8. Recognize both Western and African/traditional fashion items as valid products

Score Guide:
- 80-100: Excellent quality, same product/model shown (different angles/lighting/colors are fine)
- 60-79: Good quality, same product visible despite minor quality issues
- 50-59: Acceptable quality, same product is identifiable
- 0-49: REJECTED - Only for clearly different products/brands/models or major quality issues

**IMPORTANT**: Do NOT lower the score just because of:
- Different camera angles of the same product
- Different lighting conditions
- Different backgrounds or settings
- Product shown worn vs unworn
- Product shown from multiple sides
- Same product/design in different colors or colorways (this is the EXPECTED use case for variations)

ONLY reject (score < 50) if you see:
- Different brands WHEN brands are visible (Nike + Adidas logos/tags visible)
- Completely different product TYPES (e.g., shirt + pants, shoes + bag)
- Mixed product categories (shirt + shoes together)
- Non-product images (screenshots, memes, etc.)
- Do NOT reject for different colors/colorways of the same product design

**NOTE**: If no brand is visible in any image, do NOT reject based on brand - focus only on whether it's the same product design.

**IMPORTANT - Issues Array**:
- If approved (score >= 40): Leave "issues" empty [] OR list minor concerns
- If rejected (score < 40): Provide SPECIFIC, DETAILED issues that explain WHY
- Be specific: Instead of "different products", say "Image 1 shows Nike Air Max, Image 2 shows Adidas Ultraboost"
- Be clear: Instead of "quality issues", say "Images are blurry and product details not visible"
- Be actionable: Tell users what's wrong so they can fix it

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "approved": true/false,
  "score": 0-100,
  "issues": ["specific, detailed issue 1", "specific, detailed issue 2"]
}

Examples of good issues:
- "Image 1 shows a red t-shirt while Image 2 shows a blue jacket - different products"
- "Images show both Nike and Adidas brand logos - mixed brands detected"
- "Images show a shirt mixed with shoes - different product categories"
- "Images are too blurry to identify the product clearly"`,
  })

  try {
    payload.logger.info(`[ImageValidation] Calling OpenAI with ${imageContents.length - 1} images`)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: imageContents,
        },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    payload.logger.info(`[ImageValidation] Raw response: ${content}`)

    // Parse response
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(jsonStr)

    const result = {
      approved: parsed.approved ?? true,
      score: typeof parsed.score === 'number' ? parsed.score : 50,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    }

    // Use score-based approval: score >= 40 = approved (lowered threshold to be more lenient)
    result.approved = result.score >= 40

    payload.logger.info(`[ImageValidation] Parsed result - Score: ${result.score}, Approved: ${result.approved}, Issues: ${JSON.stringify(result.issues)}`)

    return result
  } catch (error) {
    payload.logger.error(`[ImageValidation] FAILED - Error type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    payload.logger.error(`[ImageValidation] Error message: ${error}`)
    if (error instanceof Error && error.stack) {
      payload.logger.error(`[ImageValidation] Stack trace: ${error.stack}`)
    }

    // On error, allow creation but log the issue
    payload.logger.warn(`[ImageValidation] Falling back to default score of 50 due to validation error`)
    return {
      approved: true,
      score: 50,
      issues: ['Validation error - proceeding with caution'],
    }
  }
}

/**
 * Clean up uploaded images when validation fails
 * Deletes both media documents and actual files from storage
 */
async function cleanupUploadedImages(
  payload: any,
  imageIds: string[]
): Promise<void> {
  try {
    payload.logger.info(`[CleanupImages] Deleting ${imageIds.length} images after validation failure`)

    // Delete each media document (which will also delete the file from S3/storage)
    for (const imageId of imageIds) {
      try {
        await payload.delete({
          collection: 'media',
          id: imageId,
        })
        payload.logger.info(`[CleanupImages] Deleted image: ${imageId}`)
      } catch (error) {
        payload.logger.warn(`[CleanupImages] Failed to delete image ${imageId}: ${error}`)
        // Continue deleting other images even if one fails
      }
    }

    payload.logger.info(`[CleanupImages] Cleanup complete`)
  } catch (error) {
    payload.logger.error(`[CleanupImages] Error during cleanup: ${error}`)
    // Don't throw - cleanup failure shouldn't block the error response
  }
}

/**
 * Helper: Generate description from images using AI
 */
async function generateDescriptionFromImages(
  payload: any,
  imageIds: string[]
): Promise<string> {
  try {
    // Fetch image URLs
    const imageUrls: string[] = []
    for (const imageId of imageIds) {
      try {
        const media = await payload.findByID({
          collection: 'media',
          id: imageId,
        })

        if (media?.filename) {
          // Use public URL for OpenAI to access images
          const baseUrl = process.env.OPENAI_PUBLIC_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
          const fullUrl = `${baseUrl}/api/media/file/${media.filename}`
          imageUrls.push(fullUrl)
          payload.logger.info(`[GenerateDescription] Using public URL: ${fullUrl}`)
        }
      } catch (error) {
        payload.logger.warn(`[GenerateDescription] Failed to fetch image ${imageId}`)
      }
    }

    if (imageUrls.length === 0) {
      return 'Fashion item'
    }

    // Generate description using OpenAI Vision
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a fashion product description writer. Generate a concise, natural product description (2-3 sentences) based on the images provided. Include:
- What the item is
- Key visual details (color, style, notable features)
- Condition observations if visible

Keep it conversational and factual. Do not include pricing, sizing, or availability information.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze these product images and generate a description:',
            },
            ...imageUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
      max_completion_tokens: 200,
    })

    const description = response.choices[0]?.message?.content?.trim() || 'Fashion item'

    return description
  } catch (error) {
    payload.logger.error(`[GenerateDescription] Error: ${error}`)
    return 'Fashion item'
  }
}
