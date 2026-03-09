{{- define "common.slo" -}}
{{- if .Values.slo.enabled -}}
{{- $defaultName := include "common.fullname" . }}
---
apiVersion: watch.zeta.tech/v1alpha1
kind: SLO
metadata:
  name: {{default (printf "%s-slo" $defaultName) .Values.slo.name }}
  namespace: {{ $.Release.Namespace }}
  {{- if .Values.slo.labels }}
  labels:
  {{- range $key, $val := .Values.slo.labels }}
    {{$key}}: {{$val}}
  {{- end -}}
  {{- end }}
spec:
  {{- if .Values.slo.description }}
  description: {{ .Values.slo.description }}
  {{- end }}
  group: {{ .Values.slo.group }}
  objective:
    target: {{ .Values.slo.target }}
  indicator:
    ratioMetrics:
        total:
            queryType: {{ .Values.slo.queryType }}
            {{- if .Values.slo.source }}
            source: {{ .Values.slo.source }}
            {{- end }}
            query: {{ .Values.slo.total }}
        {{- if .Values.slo.bad }}
        bad:
            queryType: {{ .Values.slo.queryType }}
            {{- if .Values.slo.source }}
            source: {{ .Values.slo.source }}
            {{- end }}
            query: {{ .Values.slo.bad }}
        {{- end -}}
        {{- if .Values.slo.good }}
        good:
            queryType: {{ .Values.slo.queryType }}
            {{- if .Values.slo.source }}
            source: {{ .Values.slo.source }}
            {{- end }}
            query: {{ .Values.slo.good }}
        {{- end -}}
  {{- if .Values.slo.budgetingMethod }}
  budgetingMethod: {{ .Values.slo.budgetingMethod }}
  {{- end }}
  {{- if .Values.slo.timeWindow }}
  timeWindow:
    default: false
    windows:
        {{- range $i,$window := .Values.slo.timeWindow}}
        - unit: {{$window.unit}}
          count: {{$window.count}}
          isRolling: {{default false $window.isRolling }} 
        {{- end -}}
  {{- end -}}
{{- end -}}
{{- end -}}

