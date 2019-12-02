# Web integration

We allow bluzelle-js to also target browsers via webpack.

## Generating an Application Bundle

1. Get the quick start example running.
2. Run `webpack main.js -o bundle.js`.
3. Save the following html as `index.html`:

```markup
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>

    <script src='bundle.js'></script>
</body>
</html>
```

    4. Open `index.html` in your web browser and view console output in the developer tools.

## Generating a Standalone Bluzelle File

1. Paste the following code into `bluzelle-export.js`.

```javascript
window.bluzelle = require('bluzelle').bluzelle;
```

   2. Run `webpack bluzelle-export.js -o bluzelle-bundle.js`.  
   3. Include `bluzelle-bundle.js` into your application and use `bluzelle` as a global variable.

