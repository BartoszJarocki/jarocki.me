export function getHtml(title: string) {
  return `
    <!DOCTYPE html>
    <html>
        <meta charset="utf-8">
        <title>Generated Image</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            @import url("https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap");
            
            html,
            body {
              padding: 0;
              margin: 0;
              width: 100%;
              height: 100%;
            }
            
            * {
              box-sizing: border-box;
            }
            
            .top-background {
                background: linear-gradient(0deg, rgba(255, 255, 255, 1) 10%, rgba(255, 255, 255, 0) 85%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.414-6l5.95-5.95L45.95.636 40 6.586 34.05.636 32.636 2.05 38.586 8l-5.95 5.95 1.414 1.414L40 9.414l5.95 5.95 1.414-1.414L41.414 8zM40 48c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM9.414 40l5.95-5.95-1.414-1.414L8 38.586l-5.95-5.95L.636 34.05 6.586 40l-5.95 5.95 1.414 1.414L8 41.414l5.95 5.95 1.414-1.414L9.414 40z' fill='%23bdbdbd' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E");
            }
            
            .main {
              text-align: center;

            
              width: 100%;
              height: 100%;
            
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 48px;
            }
            
            .title {
              font-size: 5rem;
              word-wrap: break-word;
              letter-spacing: -0.05em;
              font-weight: 800;
              font-family: "Inter", sans-serif;
            }
        </style>
        <body>
            <div class="main top-background">
              <h1 class="title">${title}</h1>
            </div>
        </body>
    </html>
`;
}
