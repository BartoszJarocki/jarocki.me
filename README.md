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
![main page OG image](https://jarocki.me/api/og?title=Bartosz%20Jarocki&description=A%20passionate%20software%20engineer%20with%20an%20eye%20for%20details%20based%20in%20Wroc%C5%82aw,%20Poland.)

Blog post example
![blog post OG image](https://jarocki.me/api/og?title=Monito,%20two%20weeks%20after%20launch&description=No%20audience,%20just%20Product%20Hunt%20and%20Hacker%20News%20launch.%20How%20did%20it%20go?)

## Credits

Design heavily inspired by [Tailwind UI Spotlight template](https://tailwindui.com/templates/spotlight)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBartoszJarocki%2Fweb-jarocki-me)

## License

[MIT](https://choosealicense.com/licenses/mit/)
