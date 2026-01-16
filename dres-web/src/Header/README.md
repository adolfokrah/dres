# Header Configuration Guide

This guide explains how to configure the DRES header navigation with dynamic menus powered by Payload CMS.

## Overview

The header navigation supports four types of menu items:

1. **Simple Link** - Basic navigation links
2. **Department Mega Menu** - Automatically populated from a department's categories
3. **Collection Mega Menu** - Shows selected collections
4. **Custom Mega Menu** - Manually configured mega menu sections

## Configuring Navigation in Payload CMS

### Access the Header Global

1. Log into the Payload admin panel at `/admin`
2. Navigate to **Globals** → **Header**
3. Click on **Navigation Items**

### Adding a Simple Link

Perfect for standard navigation items like "New In", "Sale", etc.

1. Click **Add Navigation Item**
2. Set **Type** to "Simple Link"
3. Enter the **Label** (e.g., "New In")
4. Configure the **Link**:
   - **Type**: Choose "Internal" or "Custom"
   - **Document**: Select a page (for internal links)
   - **URL**: Enter a path (e.g., `/discover/products?sort=newest`)
5. Check **Highlight (Red)** if you want it styled in red (e.g., for "Sale")
6. Click **Save**

### Adding a Department Mega Menu

Automatically shows all categories and collections from a department (e.g., "Women", "Men").

1. Click **Add Navigation Item**
2. Set **Type** to "Department Mega Menu"
3. Enter the **Label** (e.g., "Women")
4. Select a **Department** from the dropdown
5. The mega menu will automatically populate with:
   - All categories in that department
   - All collections associated with those categories
6. Click **Save**

**Example**: Setting "Women" will show categories like "Dresses", "Tops", "Shoes" with their subcollections.

### Adding a Collection Mega Menu

Shows specific collections you select.

1. Click **Add Navigation Item**
2. Set **Type** to "Collection Mega Menu"
3. Enter the **Label** (e.g., "Bags")
4. Select one or more **Collections** from the dropdown
5. Click **Save**

### Adding a Custom Mega Menu

Create fully customized mega menu layouts with multiple sections.

1. Click **Add Navigation Item**
2. Set **Type** to "Custom Mega Menu"
3. Enter the **Label** (e.g., "Shop")
4. Add **Mega Menu Sections**:
   - Click **Add Mega Menu Section**
   - Enter **Title** (e.g., "CLOTHES")
   - Add **Links**:
     - **Label**: Link text (e.g., "New In")
     - **Link Details**: Configure the link
   - Repeat for more sections
5. Click **Save**

**Example Custom Menu Structure**:
```
Shop
├── CLOTHES
│   ├── New In
│   ├── Coats
│   ├── Jackets
│   └── Dresses
├── SHOES
│   ├── Trainers
│   ├── Boots
│   └── Sandals
└── BAGS & ACCESSORIES
    ├── Bags
    ├── Belts
    └── Sunglasses
```

## Setting Up Departments, Categories, and Collections

### 1. Create Departments

Navigate to **Collections** → **Departments**:

```
Name: Women
Slug: women
```

```
Name: Men
Slug: men
```

### 2. Create Collections

Navigate to **Collections** → **Collections**:

```
Name: Dresses
Departments: [Women]
```

```
Name: Bags
Departments: [Women, Men]
```

### 3. Create Categories

Navigate to **Collections** → **Categories**:

```
Category: Evening Dresses
Collections: [Dresses]
Departments: [Women]
```

```
Category: Tote Bags
Collections: [Bags]
Departments: [Women, Men]
```

## Example Navigation Setup

Here's a complete example matching the Vestiaire Collective style:

### 1. New In (Simple Link)
- Type: Simple Link
- Label: New In
- URL: `/discover/products?sort=newest`

### 2. Designers (Simple Link)
- Type: Simple Link
- Label: Designers
- URL: `/designers`

### 3. Women (Department Mega Menu)
- Type: Department Mega Menu
- Label: Women
- Department: Women
- *(Automatically shows all women's categories and collections)*

### 4. Men (Department Mega Menu)
- Type: Department Mega Menu
- Label: Men
- Department: Men
- *(Automatically shows all men's categories and collections)*

### 5. We Love (Simple Link)
- Type: Simple Link
- Label: We Love
- URL: `/discover/products?featured=true`

### 6. Vintage (Simple Link)
- Type: Simple Link
- Label: Vintage
- URL: `/discover/products?vintage=true`

### 7. Bags (Collection Mega Menu)
- Type: Collection Mega Menu
- Label: Bags
- Collections: [Bags, Small Bags, Belt Bags]

### 8. Watches & Jewellery (Collection Mega Menu)
- Type: Collection Mega Menu
- Label: Watches & Jewellery
- Collections: [Watches, Jewellery]

### 9. Children (Simple Link)
- Type: Simple Link
- Label: Children
- URL: `/kids`

### 10. Express Delivery (Simple Link)
- Type: Simple Link
- Label: Express Delivery
- URL: `/discover/products?express=true`

### 11. Direct Shipping (Simple Link)
- Type: Simple Link
- Label: Direct Shipping
- URL: `/discover/products?direct=true`

### 12. Sale (Simple Link - Highlighted)
- Type: Simple Link
- Label: Sale
- URL: `/discover/products?sale=true`
- Highlight (Red): ✓ Checked

### 13. Inside Vestiaire (Simple Link)
- Type: Simple Link
- Label: Inside Vestiaire
- URL: `/about`

## Technical Details

### Header Global Configuration

Location: `/src/Header/config.ts`

The header global supports:
- Array of navigation items
- Conditional fields based on menu type
- Relationships to departments and collections
- Custom mega menu sections with nested links

### Frontend Component

Location: `/src/Header/Nav/index.tsx`

The component:
- Renders navigation from CMS data
- Falls back to default items if CMS is empty
- Supports highlighted items (red styling)
- Handles different menu types

### Type Generation

After making changes to the header configuration, always regenerate types:

```bash
cd dres-web
pnpm generate:types
```

This updates `payload-types.ts` with the latest schema.

## Styling

The navigation uses Tailwind CSS classes:

- **Font Size**: `text-[13px]` (13px)
- **Padding**: `px-4 py-3.5`
- **Text Color**: `text-gray-800`
- **Hover**: `hover:text-black`
- **Highlighted**: `text-red-600 hover:text-red-700 font-medium`

To customize styling, edit the className in `/src/Header/Nav/index.tsx`.

## Future Enhancements

The configuration is prepared for mega menu dropdowns. To implement:

1. Create a `MegaMenu` component
2. Add hover/click handlers to navigation items with `type !== 'link'`
3. Fetch and render categories/collections dynamically
4. Style the dropdown panel matching the Vestiaire Collective design

## Troubleshooting

### Navigation items not showing

1. Check that the Header global has navigation items configured
2. Verify `pnpm generate:types` ran successfully
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server: `pnpm dev`

### Department mega menu empty

1. Ensure the department has categories assigned
2. Check that categories have collections assigned
3. Verify relationships are properly configured in Payload

### Changes not reflecting

The header is cached and revalidated on change via the `revalidateHeader` hook. If changes don't appear:

1. Wait a few seconds for revalidation
2. Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Check server logs for errors
