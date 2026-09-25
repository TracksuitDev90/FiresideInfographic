# Fireside Infograph

Rate yourself out of 10 across ten categories, then save a themed card to share with the fireside.

Live site: https://tracksuitdev90.github.io/FiresideInfographic/

## Using it

- Fill in the **About you** panel (name, gender, orientation, age, personality type).
- Tap or drag across a row to rate it. Tap the current box again to clear the row. The ★ box is the 10/10 bonus.
- Tap a category name to see what it means.
- Use the dock at the bottom to pick a fill color, clear ratings (with undo), shuffle the theme, switch dark mode and save.
- On phones, **Save** opens a preview with Share and Download. On desktop it downloads a PNG.

Everything you enter is kept in your browser (`localStorage`) so a refresh doesn't lose it. Nothing is sent anywhere.

## Running locally

It's a static site with no build step:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works, but a local server matches how GitHub Pages serves it.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page markup, meta tags and the tools dock |
| `theme.js` | Theme engine. Runs in `<head>` before first paint: color pairs, WCAG contrast fitting, dark mode, saved state |
| `script.js` | Ratings, form, dock, persistence and image export |
| `style.css` | All styles, including the saved-image layout (`.exporting`) |
| `fonts/` | Self-hosted Poppins and Playfair Display (SIL OFL, see `fonts/OFL.txt`) |
| `vendor/html2canvas.min.js` | html2canvas 1.4.1 (MIT), loaded only when you're about to save |
| `assets/og-image.jpg` | Link-preview image for Discord and other sites |

## Customizing

- **Categories:** edit the `CATEGORIES` list at the top of `script.js`. Rows are generated from it.
- **Color pairs:** edit `PAIRS` in `theme.js`. Each pair makes two themes. Label, heading and title colors are adjusted automatically to meet WCAG contrast, so any pair stays readable.
- **Fill swatches:** edit `SWATCHES` in `theme.js`. The popover shows the eight that stand out best on the current theme's card.

## Credits

- Fonts: [Poppins](https://github.com/itfoundry/Poppins) and [Playfair Display](https://github.com/clauseggers/Playfair-Display), SIL Open Font License 1.1.
- Image export: [html2canvas](https://html2canvas.hertzen.com) by Niklas von Hertzen, MIT License.
