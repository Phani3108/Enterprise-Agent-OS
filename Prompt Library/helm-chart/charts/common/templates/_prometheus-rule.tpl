{{- define "common.prometheus-rule" }}
{{- $file := .Files }}

{{- if (.Values.rule).enable  }}
{{- range $path, $bytes := $file.Glob "rules/**.yaml" }}
apiVersion: "monitoring.coreos.com/v1"
kind: PrometheusRule
metadata:
  name: prometheus-{{ $path | base }}.rules
  namespace: {{ $.Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" $.Values | nindent 4 }}
    app: prometheus-operator
    ruleFileName: {{ $path | base }}
{{- if $.Values.rule.metadata.labels }}
{{- range $key, $val := $.Values.rule.metadata.labels }}
{{$key | quote | indent 4}}: {{ $val | quote }}
{{- end }}
{{- else }}
    release: promop
{{- end }}
  {{- if $.Values.rule.additionalAnnotations }}
  annotations:
    {{- toYaml $.Values.rule.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
{{- if $.Values.rule.loadAsConfig }}
  {{- (tpl ($file.Glob $path).AsConfig $) | nindent 2 }}
{{- else }}
  {{- $file.Get $path | nindent 2 }}
{{- end }}
---
{{- end }}
{{- end }}
{{- end }}