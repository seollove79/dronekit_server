// src/routes/.well-known/appspecific/com.chrome.devtools.json/+server.js
export function GET() {
    return new Response('{}', {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}