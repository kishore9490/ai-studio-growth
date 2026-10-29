# CJ Consulting & Financial Services — Static Website

A plain HTML/CSS/JS version of the CJ Consulting & Financial Services website. No build step or server needed.

## Pages
- `index.html` — Home
- `about.html` — About Us
- `solutions.html` — Financial Solutions
- `how-it-works.html` — How It Works
- `government-schemes.html` — Government Schemes
- `faq.html` — FAQ
- `contact.html` — Contact

## Structure
- `assets/css/style.css` — all styles (colors and fonts are CSS variables at the top)
- `assets/js/main.js` — mobile menu, scroll animations, contact form
- `assets/images/` — logo and photos

## Usage
Open `index.html` in a browser, or upload the whole folder to any static host
(Hostinger File Manager `public_html`, Netlify, GitHub Pages, etc.).

The contact form has no backend: on submit it opens the visitor's email app with
the details pre-filled, addressed to the email in the form's `data-email` attribute
in `contact.html`.
