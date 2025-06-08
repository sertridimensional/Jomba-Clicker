
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jomba Clicker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif; /* A common sans-serif font, often used with Tailwind */
      background-color: #111827; /* Tailwind gray-900, slightly adjusted for deeper dark */
      color: #d1d5db; /* Tailwind gray-300 */
      overscroll-behavior: none; /* Prevents pull-to-refresh on mobile */
    }
    /* For smoother transitions on transform */
    .smooth-transform {
        will-change: transform;
    }
    /* Custom selection color */
    ::selection {
        background-color: #7c3aed; /* Tailwind purple-600 */
        color: white;
    }
  </style>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.1.0",
    "react-dom/": "https://esm.sh/react-dom@^19.1.0/",
    "react/": "https://esm.sh/react@^19.1.0/"
  }
}
</script>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
  <script type="module" src="./index.tsx"></script>
</body>
</html>
