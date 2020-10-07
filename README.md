![website screenshot](screenshots/jarocki-me.gif)

# Bartosz Jarocki - Personal site / Blog / Portfolio

This is my personal website built using

- [TypeScript](https://www.typescriptlang.org/)
- [Next JS](https://nextjs.org/)
- [Gray Matter](https://github.com/jonschlinkert/gray-matter)
- [Next MDX Remote](https://github.com/hashicorp/next-mdx-remote)
- [MDX Prism](https://github.com/j0lv3r4/mdx-prism)
- [Puppeteer](https://github.com/puppeteer/puppeteer)
- [Tailwind CSS](https://tailwindcss.com)
- [NextSEO](https://github.com/garmeeh/next-seo)
- [Fathom Analytics](https://usefathom.com/ref/Z9A64P)

## Running locally

Add an .env file with the following values

```env
# Used by API to determine how to run headless chrome
IS_PRODUCTION=

# Where the app is currently running? Used to create links
NEXT_PUBLIC_SITE_URL=

# Fathom analytics
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_ANALYTICS_DOMAINS=
```

Clone the repository, run the application

```bash
$ git clone https://github.com/BartoszJarocki/web-jarocki-me
$ cd web-jarocki-me
$ yarn
$ yarn dev
```

## OG images generation

Application generates Open Graph images automatically using lambda functions and Puppetter

Main page example
![main page OG image](https://jarocki.me/api/og?title=Bartosz%20Jarocki%20-%20Personal%20website)

Blog post example
![blog post OG image](https://jarocki.me/api/og?title=React%20Hooks%20-%20a%20few%20rules,%20common%20problems%20and%20how%20to%20solve%20them)

## Credits
Design inspired by [https://leerob.io/](https://leerob.io/)

## License

[MIT](https://choosealicense.com/licenses/mit/)
