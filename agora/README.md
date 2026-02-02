# AGORA Chamber

The public assembly of political discourse, critique, and manifestos.

## Chamber Overview

**Name:** AGORA
**Subtitle:** Political commentary, manifestos, social critique
**Primary Color:** #DC143C (Crimson Red)
**Secondary Color:** #000000 (Black)
**Wing:** West (Discourse)

## Directory Structure

```
agora/
├── index.html          # Main chamber page
├── config.js           # Chamber configuration and content metadata
├── css/
│   └── agora.css       # Chamber-specific styling
├── js/
│   └── agora.js        # UI functionality (section navigation, filtering)
├── commentary/         # Commentary content directory
├── manifestos/         # Manifestos content directory
└── README.md           # This file
```

## Features

### Content Sections

1. **Chronological Feed** - Timeline view with newest content first
2. **Commentary** - Sharp analysis and critical perspectives on contemporary issues
3. **Manifestos** - Declarations of position, principle, and possibility

### Interactive Features

- **Section Navigation** - Switch between feed, commentary, and manifestos
- **Tag Filtering** - Filter content by topic (Politics, Society, Ideology, Power, Justice, Discourse)
- **Live Filtering** - Items fade/highlight based on selected tag
- **Smooth Transitions** - Animated section changes and filter updates
- **Keyboard Navigation** - Accessible controls for keyboard users

### Accessibility

- Skip links for quick navigation to main content
- ARIA labels on all interactive elements
- Keyboard shortcuts:
  - `Ctrl/Cmd + F` - Focus filter controls
  - `Alt + S` - Focus section navigation
- Screen reader announcements for filter changes
- Focus indicators on all interactive elements

## Styling

### Typography

- **Font Family:** Futura (inherited from site)
- **Heading Weight:** 900 (bold, assertive)
- **Letter Spacing:** Generous tracking for uppercase text
- **Text Transform:** Uppercase for all headings and labels

### Color Scheme

- **Primary:** #DC143C (Crimson) - used for accents, borders, active states
- **Secondary:** #000000 (Black) - background, contrast
- **Text:** White with opacity variants for hierarchy
- **Gradients:** Crimson-to-dark-red for visual emphasis

### Visual Effects

- Glow effects on hover (text-shadow, box-shadow)
- Border animations for buttons
- Fade transitions between sections
- Gradient backgrounds with crimson accents
- High contrast for readability

## Configuration

Edit `config.js` to manage:

- Chamber metadata (name, description, theme)
- Available sections and their content
- Tag definitions and filtering options
- Content items with metadata
- UI/UX feature toggles
- Animation timing
- Accessibility settings

## Content Metadata

Each content item in `AGORA_CONFIG.content.items` includes:

```javascript
{
  id: 'unique-id',
  title: 'Title',
  date: '2026-02-02',
  section: 'feed|commentary|manifestos',
  topic: 'POLITICS|IDEOLOGY|JUSTICE|etc',
  tags: ['tag1', 'tag2'],
  excerpt: 'Short summary',
  content: 'Full content (optional)'
}
```

## Integration

The chamber integrates with:

- **Living Pantheon** - Global content tracking system
- **Chamber Color System** - CSS variables from chamber-colors.css
- **Tachyons CSS** - Utility-first styling framework
- **jQuery & Velocity.js** - DOM manipulation and animations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design
- Keyboard accessible
- Screen reader compatible

## Future Enhancements

- Load additional commentary from external sources
- Chronological archive with date filtering
- Search functionality
- User-generated content/submissions
- Related content recommendations
- Social sharing options
- Print-friendly layouts

---

Created as part of ETCETER4's 10-chamber knowledge system.
