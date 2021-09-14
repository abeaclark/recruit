# Recruit

Use the Github API to gather contact information / stats for developers

# Instructions
```
yarn install
export GITHUB_TOKEN=<YOUR GITHUB TOKEN HERE>
yarn recruit Quill.js
```

The yarn command will take in a single argument and use it for a search term.
If there are multiple words, enclose in qoutes.

The output is a CSV file with some metadata about contributors to the key projects returned for that search term.