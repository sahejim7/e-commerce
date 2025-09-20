# Landing Page Components

This directory contains the custom landing page components built from the Figma design specification.

## Components

### HeroSection
- Large hero image with "SECRET" text overlay
- "THE BEST FASHION IS ONLY HERE" subtitle
- "SHOP" CTA button with "Find Your Style" text
- Uses the hero background image from assets

### NewArrivals
- Displays 3 product cards in a grid layout
- Each card includes product image, name, category, colors, and price
- Features overlay badges (Best Seller, Extra 20% off, Extra 10% off)
- Currently uses mock data but can be easily connected to real product data

### CategoryGrid
- Four category cards: Women's Essentials, Hoodies, Shorts, Men
- Each card has a background image and text overlay
- Links to category pages with query parameters
- Responsive grid layout

### NewsletterSignUp
- Large background image with "SUBSCRIBE TO OUR NEWSLETTER" text
- Email input form with submit button
- "1994" year text overlay
- Client-side form handling

## Assets
All images are stored in `/public/assets/` and referenced by their original Figma export names.

## Fonts
- Uses system fonts as fallbacks (Turret Road font not available on Google Fonts)
- In production, you would need to add the Turret Road font files

## Styling
- Uses Tailwind CSS for styling
- Pixel-perfect recreation of the Figma design
- Responsive design considerations
- Uses Shadcn UI components where appropriate

## Integration
The components are assembled in `/app/(root)/page.tsx` to create the complete landing page.

