export function getHtml({ currentYear, percentPassed }) {
  return `
    <!DOCTYPE html>
    <html>
        <meta charset="utf-8">
        <title>Generated Image</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            @import url("https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap");
            
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
            
            .app {
              text-align: center;
              font-family: "Inter", sans-serif;
            
              width: 100%;
              height: 100%;
            
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            
            .appTitle {
              font-size: 3rem;
            }
            
            .appProgressContainer {
              height: 21px;
              width: 100%;
              max-width: 620px;
              border-color: #000000;
              border-radius: 4px;
              border-width: 1px;
              border-style: solid;
            }
            
            .appYearProgress {
              background: #000000;
              height: 100%;
              width: ${percentPassed}%;
            }
            
            .appDescription {
              font-size: 2.5rem;
            }
        </style>
        <body>
            <div class="app">
              <h1 class="appTitle">${currentYear}</h1>
              <div class="appProgressContainer">
                  <div class="appYearProgress" />
              </div>
              <h2 class="appDescription">${percentPassed}%</h2>
            </div>
        </body>
    </html>
`;
}
