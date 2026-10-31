Style Guide — Netflix Clone
Visual identity

- Vibe: Cinematic, immersive, modern, and premium. The interface should feel like a streaming platform, emphasizing movie artwork and making it easy to discover what to watch.
- Design inspiration: Netflix's dark interface, oversized featured artwork, horizontal content rows, and bold visual hierarchy. The project should have its own identity rather than copying Netflix branding exactly.
- Primary goal: Let the content stand out. The interface should support discovery without overwhelming the user with unnecessary elements.
  Layout
- Responsive design: Build for mobile, tablet, and desktop. Use a flexible poster grid on browse pages and horizontal scrolling rows for featured collections.
- Home page: A prominent featured-content banner at the top, followed by rows such as Popular Movies, Trending Shows, and Recommended Categories.
- Browse pages: A page heading, genre filter, and responsive grid of poster cards.
- Title Details: Large cinematic backdrop, title information, and clearly visible watchlist actions.
- My Watchlist: A responsive grid of saved titles with easy access to details and removal actions.
- Search Results: A search field and a grid of matching titles.
- Spacing: Consistent spacing between navigation, headings, poster cards, and content rows. Avoid cramped layouts.
  Colors
  Use a dark cinematic palette with one primary accent.
  Purpose	Color	Hex
  Main background	Near-black	#141414
  Secondary surface	Dark charcoal	#232323
  Primary text	White	#FFFFFF
  Secondary text	Light gray	#B3B3B3
  Primary accent	Streaming red	#E50914
  Error messages	Bright red	#FF6B6B
  Card hover surface	Dark gray	#303030
  Use red primarily for important actions, active states, and selected interface elements. Do not make every button, heading, or icon red.
  Typography
- Headings: Bold, modern sans-serif typography with strong visual hierarchy.
- Body text: A readable sans-serif such as Inter or system UI fonts.
- Featured titles: Large, bold headings that remain readable over background imagery.
- Metadata: Smaller, muted text for release years, genres, maturity ratings, and runtime.
- Consistency: Use a predictable scale for page headings, section headings, card titles, and descriptions.
  Movie and TV show cards
- Display the poster prominently with consistent image proportions.
- Include the title and useful metadata where appropriate.
- Use rounded corners subtly, without making the interface look like a generic mobile dashboard.
- On hover or keyboard focus, reveal additional details or quick actions when practical.
- Make the entire card a clear, accessible link to its Title Details page.
- Use a consistent fallback image or placeholder when a poster is missing.
  Buttons and interactions
- Primary action: Red button with white text for actions such as Add to My List.
- Secondary action: Dark or transparent button with a visible border.
- Hover and focus: Provide clear visual feedback.
- Watchlist state: Change the button label or icon when a title is already saved.
- Feedback: Show a brief confirmation when a title is added or removed.
- Loading: Use a subtle loading indicator or skeleton cards while content loads.
- Errors: Display clear messages that explain what happened and what the user can do next.
  Navigation
- Desktop: A top navigation bar with the app logo, Home, Movies, TV Shows, Search, and My List.
- Mobile: A compact, responsive navigation layout that keeps important destinations accessible.
- Highlight the current page.
- Keep navigation consistent across all pages.
- Ensure search remains easy to access without taking up excessive space.
  Motion
- Use subtle hover effects on poster cards and buttons.
- Keep transitions short and smooth.
- Use gentle fades for overlays and content changes.
- Avoid excessive animation that distracts from browsing.
- Respect reduced-motion preferences.
  Accessibility
- Maintain readable text and sufficient contrast.
- Provide visible keyboard focus indicators.
- Give search inputs and buttons accessible labels.
- Do not rely on color alone to communicate whether a title is saved or an action succeeded.
- Provide alternative text for meaningful images.
- Ensure interactive elements work with a keyboard.
- Use appropriately sized touch targets on mobile.
  Implementation priorities
  Build the interface in this order:

1. Global layout, navigation, and color system.
2. Reusable movie/show poster card component.
3. Home page and shared content rows.
4. Browse Movies and Browse TV Shows pages.
5. Search Results page.
6. Title Details page and watchlist interactions.
7. My Watchlist page.
8. Responsive polish, loading states, empty states, error handling, and accessibility.
   Senior engineer's advice: Build reusable components rather than six separate page designs from scratch. A single TitleCard component should work on Home, Browse Movies, Browse TV Shows, Search Results, and My Watchlist. That keeps the design consistent and makes future changes much easier.

Take all of this into account and then add a vibe of street graffiti + girl power queen energy
