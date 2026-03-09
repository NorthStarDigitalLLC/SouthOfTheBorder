# Hot Headz Southern Foods static build

This package is a full multi-page GitHub Pages-ready website inspired by the theme of the uploaded menu code.

## What is included

- `index.html` — homepage with hero, feature sections, hours, gallery preview, testimonials, and CTA bands
- `menu.html` — JSON-driven breakfast/lunch/crawfish/salad/drinks/dessert page
- `story.html` — longer-form brand/story page
- `catering.html` — delivery and larger-order page
- `gallery.html` — visual grid with client-side filtering
- `contact.html` — contact page with map embed and static form
- `faq.html` — FAQ page
- `404.html` — fallback page for GitHub Pages
- `assets/css/` — split styling system
- `assets/js/` — site interactions, home text rotator, gallery filtering, dynamic menu rendering
- `assets/data/menu.json` — local menu data source
- `assets/images/` — custom SVG placeholders that can be replaced with real photos or logos

## How to publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the root of the repository.
3. In GitHub, go to **Settings > Pages**.
4. Set the source to the main branch and the root folder.
5. Save.

## What to replace first

- Swap the SVG art in `assets/images/` with the restaurant's real images.
- Update `assets/data/menu.json` with the live menu data.
- Replace placeholder story/testimonial copy with the real business story.
- Add real social links in `contact.html`.

## Notes

- This is a static site and does not need a backend.
- The forms are demos. Hook them to a service to receive submissions.
- The design is an original rebuild around the theme of the upload, not a verbatim copy of any live site.
