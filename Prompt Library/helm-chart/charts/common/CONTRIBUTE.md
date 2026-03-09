## How to Contribute?

- Pleas make a PR with your changes.
- Test your changes.
- Bump the chart version
- Modify `CHANGELOG.md` for your changes.
- Run `helm-docs -s file .` to update the README.md
- Please get it approved from one of `TODO: add list of people`

## How to test your changes?

Since everything is defined as template it might be hard to debug your changes. We would suggest

1. temporarily add `test.yaml` in [templates](./templates) folder for including templates that you have changed or you
   want to test out. Example:

```gotemplate
{{ include "common.service-account" . }}
---
{{ include "common.deployment-oms" . }}
---
...
```

2. add default values in [values.yaml](/values.yaml)
3. run `helm template . --debug` see if the chart is rendered properly

You can also go ahead and publish a snapshot version of your changes and include it in one of your application for
testing the changes.