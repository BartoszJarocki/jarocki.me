export function getHtml(title: string) {
  return `
    <!DOCTYPE html>
    <html>
        <meta charset="utf-8">
        <title>Generated Image</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap" rel="stylesheet">
        <style>
            html,
            body {
              padding: 0;
              margin: 0;
              width: 100%;
              height: 100%;
              background-color: #1e2020;
            }
            
            * {
              box-sizing: border-box;
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
              font-size: 4rem;
              word-wrap: break-word;
              font-weight: 700;
              font-family: 'Inter', sans-serif;
            }
        </style>
        <body>
            <div class="main">
              <h1 class="title">${title}</h1>
            </div>
        </body>
    </html>
`;
}
