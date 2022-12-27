![screenshot](screenshots/screenshot.png)

# Bartosz Jarocki - Personal site / Blog / Portfolio

This is my personal website built using

- [TypeScript](https://www.typescriptlang.org/)
- [Next JS](https://nextjs.org/)
- [Next Themes](https://github.com/pacocoursey/next-themes)
- [Content Layer](https://www.contentlayer.dev/)
- [Tailwind CSS](https://tailwindcss.com)
- [NextSEO](https://github.com/garmeeh/next-seo)
- [Vercel OG](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)

## Running locally

Clone the repository, run the application

```bash
git clone https://github.com/BartoszJarocki/web-jarocki-me
cd web-jarocki-me
yarn
yarn dev
```

## OG images generation

Application generates Open Graph images automatically using lambda functions and Puppetter

Main page example
![main page OG image](https://jarocki.me/api/og?title=Bartosz%20Jarocki%20-%20Personal%20website)

Blog post example
![blog post OG image](https://jarocki.me/api/og?title=React%20Hooks%20-%20a%20few%20rules,%20common%20problems%20and%20how%20to%20solve%20them)

## Credits

Design heavily inspired by [Tailwind UI Spotlight template](https://tailwindui.com/templates/spotlight)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBartoszJarocki%2Fweb-jarocki-me)

## License

[MIT](https://choosealicense.com/licenses/mit/)
