/* Compatibility loader for the Cloudflare Pages root. Keep the application source in public/app.js. */
const style=document.createElement('style');
style.textContent='.close{cursor:pointer}';
document.head.appendChild(style);
const script=document.createElement('script');
script.src='/public/app.js?v=20260923';
script.defer=false;
document.body.appendChild(script);
