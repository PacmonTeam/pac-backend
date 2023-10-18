module.exports = {
  "semi": false,
  "singleQuote": true,
  "importOrder": ["^@/(.*)$", "^[./]"],
  "importOrderSeparation": true,
  "plugins": [require.resolve("@trivago/prettier-plugin-sort-imports")],
}
