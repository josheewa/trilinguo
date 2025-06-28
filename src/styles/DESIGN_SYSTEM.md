# Trilinguo Liquid Glass Design System

## Overview
A comprehensive design system that provides consistent liquid glass styling across all components in the Trilinguo app.

## Core Classes

### Background Patterns
- `.liquid-bg-primary` - Main app background gradient
- `.liquid-bg-overlay` - Overlay gradient for depth
- `.liquid-orb-blue` - Blue floating orb effect
- `.liquid-orb-purple` - Purple floating orb effect

### Glass Surfaces
- `.glass-surface` - Standard glass panel (medium opacity)
- `.glass-surface-subtle` - Subtle glass panel (low opacity)
- `.glass-surface-strong` - Strong glass panel (high opacity)

### Interactive Elements
- `.glass-button` - Basic interactive glass button
- `.glass-button-primary` - Primary action button (blue/purple gradient)
- `.glass-button-secondary` - Secondary action button (emerald gradient)
- `.glass-button-danger` - Destructive action button (red gradient)

### Form Elements
- `.glass-input` - Glass-styled input fields with focus states

### Specialized Components
- `.glass-card` - Card-style containers
- `.glass-panel` - Panel-style containers (stronger than cards)
- `.glass-bubble-user` - User message bubbles
- `.glass-bubble-assistant` - Assistant message bubbles
- `.glass-nav` - Navigation elements
- `.glass-dropdown` - Dropdown menus
- `.glass-modal` - Modal dialogs
- `.glass-overlay` - Modal/panel overlays

### Toggle Switches
- `.glass-toggle-active` - Active toggle state
- `.glass-toggle-inactive` - Inactive toggle state

### Status Variants
- `.glass-success` - Success state styling
- `.glass-warning` - Warning state styling
- `.glass-error` - Error state styling

### Animations
- `.liquid-pulse-1` - Primary pulse animation
- `.liquid-pulse-2` - Secondary pulse animation (with delay)
- `.liquid-float` - Floating animation effect

## Usage Guidelines

### Consistency
- Always use the design system classes instead of custom backdrop-blur/bg-white combinations
- Maintain the established hierarchy: subtle < surface < strong < panel

### Interactive States
- Use appropriate button variants based on action importance
- Primary: Main actions (submit, confirm)
- Secondary: Toggle states, secondary actions
- Danger: Destructive actions (delete, clear)

### Glass Effects
- All glass surfaces include backdrop-blur for depth
- Border opacity and shadows are calibrated for consistency
- Focus states are built-in with blue accent colors

### Animations
- Use `liquid-pulse-1` and `liquid-pulse-2` for background orbs
- Use `liquid-float` for hero elements or important UI components
- Animations are subtle and respect user preferences

## Implementation Examples

```jsx
// Access Code Form
<form className="glass-card rounded-2xl p-8">
  <input className="glass-input" />
  <button className="glass-button-primary">Submit</button>
</form>

// Settings Panel
<div className="glass-panel">
  <button className="glass-button">Option</button>
  <div className="glass-toggle-active">Toggle</div>
</div>

// Message Bubbles
<div className="glass-bubble-user">User message</div>
<div className="glass-bubble-assistant">Assistant message</div>
```

## Benefits
- **Consistency**: Unified visual language across all components
- **Maintainability**: Centralized styling makes updates easier
- **Performance**: Reusable classes reduce CSS duplication
- **Scalability**: Easy to extend for new components
- **Accessibility**: Built-in focus states and contrast ratios 