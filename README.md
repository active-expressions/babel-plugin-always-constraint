# babel-plugin-always-constraint
A babel plugin to rewrite statements labelled with always to linear constraints

Live editable at http://astexplorer.net/#/JrmlrJciNw/7

## Example

Transforms
```js
something
```

to
```js
something else
```

## Installation

```sh
$ npm install babel-plugin-always-constraint
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["always-constraint"]
}
```

### Via CLI

```sh
$ babel --plugins always-constraint script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["always-constraint"]
});
```
