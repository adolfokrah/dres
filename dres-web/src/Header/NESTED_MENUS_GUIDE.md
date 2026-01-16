# Nested Menus Guide

## Overview

The DRES header now supports **unlimited nested submenus** up to 3 levels deep. Every menu item can have its own submenu, and those submenu items can have their own submenus, creating a hierarchical navigation structure.

## Menu Structure

```
Level 1 (Top Navigation)
├── Level 2 (Dropdown)
│   ├── Level 3 (Nested Dropdown)
│   │   └── Level 4 (Deep Nested - optional)
```

## Configuration in Payload CMS

### Adding a Top-Level Menu Item

1. Go to **Globals** → **Header**
2. Click **Add Navigation Item**
3. Fill in:
   - **Label**: Display text (e.g., "Women")
   - **Highlighted**: Check if you want red styling (e.g., for "Sale")
   - **Link**: The URL when clicking the main item
   - **Sub Menu Items**: Click to add dropdown items

### Adding Submenu Items (Level 2)

Under any navigation item:

1. Click **Add Sub Menu Item**
2. Fill in:
   - **Label**: Submenu item text (e.g., "Clothing")
   - **Link**: URL for this item
   - **Featured Item**: Check to make it bold/prominent
   - **Nested Sub Items**: Add even deeper items

### Adding Nested Submenus (Level 3)

Under any Level 2 submenu item:

1. Click **Add Nested Sub Item**
2. Fill in:
   - **Label**: Item text (e.g., "Coats")
   - **Link**: URL for this item
   - **Deeply Nested Items**: Add Level 4 if needed

### Adding Deep Nested Items (Level 4)

Under any Level 3 item:

1. Click **Add Deeply Nested Item**
2. Fill in:
   - **Label**: Item text
   - **Link**: URL

## Example: Women's Menu Structure

```
Women (Level 1)
├── Clothing (Level 2 - Featured)
│   ├── Coats (Level 3)
│   ├── Jackets (Level 3)
│   ├── Dresses (Level 3)
│   ├── Tops (Level 3)
│   ├── Trousers (Level 3)
│   └── Skirts (Level 3)
├── Shoes (Level 2)
│   ├── Trainers (Level 3)
│   ├── Boots (Level 3)
│   ├── Sandals (Level 3)
│   └── Heels (Level 3)
└── Bags & Accessories (Level 2)
    ├── Handbags (Level 3)
    ├── Shoulder Bags (Level 3)
    ├── Clutches (Level 3)
    ├── Jewellery (Level 3)
    └── Sunglasses (Level 3)
```

## Seeding Header Data

### Automatic Seeding (Recommended)

Seed the header with pre-configured data including nested menus:

```bash
# In Payload admin or via API
POST /api/seed
Body: { "target": "header" }
```

Or seed everything including header:

```bash
POST /api/seed
Body: { "target": "all" }
```

### Manual Configuration

You can manually create the entire menu structure in the Payload admin panel following the steps above.

## Current Menu Structure (After Seeding)

The seed data creates this navigation:

1. **New In** - Simple link
2. **Designers** - Simple link
3. **Women** - With nested clothing, shoes, and accessories submenus
4. **Men** - With nested clothing, shoes, and accessories submenus
5. **We Love** - Simple link
6. **Vintage** - Simple link
7. **Bags** - With submenu of bag types
8. **Watches & Jewellery** - With submenu of jewellery types
9. **Children** - With girls, boys, and baby submenus
10. **Sale** - Simple link (highlighted in red)

### Removed Items

The following items were removed as requested:
- ~~Inside Vestiaire~~
- ~~Express Delivery~~
- ~~Direct Shipping~~

## Technical Implementation

### Header Config Structure

Location: `/src/Header/config.ts`

```typescript
{
  navItems: [
    {
      label: string
      highlighted: boolean
      link: { type, url }
      subItems: [
        {
          label: string
          link: { type, url }
          featured: boolean
          subItems: [
            {
              label: string
              link: { type, url }
              subItems: [...]  // Level 4
            }
          ]
        }
      ]
    }
  ]
}
```

### Features

- **Unlimited Nesting**: Up to 3-4 levels deep
- **Featured Items**: Highlight specific submenu items
- **Highlighted Nav Items**: Red styling for special items (Sale)
- **Flexible Links**: Internal or custom URLs
- **Easy Management**: All managed through Payload CMS

## Best Practices

1. **Keep It Simple**: Don't go deeper than 3 levels unless absolutely necessary
2. **Featured Items**: Use sparingly to highlight important categories
3. **Clear Labels**: Use descriptive, short labels (1-3 words)
4. **Logical Grouping**: Group related items together
5. **Test Navigation**: Check that all links work after configuration

## Frontend Implementation (Future)

The mega menu dropdown component will:
- Show Level 2 items in columns
- Display Level 3 items under their parents
- Highlight featured items
- Support hover and click interactions
- Be responsive for mobile devices

## Troubleshooting

### Menu items not showing

1. Run `pnpm generate:types` to regenerate TypeScript types
2. Restart the dev server
3. Check Payload admin for any validation errors
4. Clear browser cache

### Nested items not appearing

1. Ensure `subItems` array is properly configured
2. Check that links are valid
3. Verify the menu structure in Payload admin

### Seed data not applying

1. Ensure you're logged in as admin
2. Check server logs for errors
3. Verify the seed endpoint is accessible
4. Try restarting the server after seeding

## Example API Response

After configuration, the header API returns:

```json
{
  "navItems": [
    {
      "label": "Women",
      "highlighted": false,
      "link": { "type": "custom", "url": "/women" },
      "subItems": [
        {
          "label": "Clothing",
          "featured": true,
          "link": { "type": "custom", "url": "/women/clothing" },
          "subItems": [
            {
              "label": "Coats",
              "link": { "type": "custom", "url": "/women/clothing/coats" }
            }
          ]
        }
      ]
    }
  ]
}
```

## Running the Seed Script

### Via pnpm Command (Recommended)

```bash
# Seed only the header
pnpm seed:header

# Or seed everything (includes header)
pnpm seed
```

### Via Direct Script

```bash
# Seed only header
tsx src/endpoints/seed/run.ts header

# Seed multiple targets
tsx src/endpoints/seed/run.ts header men-home women-home
```

### Via API Endpoint

```bash
# As an authenticated admin user
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"target": "header"}'
```

## Verification

After seeding, verify the header configuration:

1. Go to `/admin` → **Globals** → **Header**
2. You should see 10 navigation items with nested submenus
3. Women and Men should have 3-level deep menu structures
4. Sale should be marked as highlighted (red)

