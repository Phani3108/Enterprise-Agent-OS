{{- define "common.env-configmap" }}
{{- if .Values.envProperties }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Chart.Name }}-env-configmap
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if (.Values.envProperties).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.envProperties.additionalAnnotations | nindent 4 }}
  {{- end }}
data:
{{- range $key, $val := .Values.envProperties }}
{{- if $.Values.useGoTemplate }}
{{- /* tpl: https://helm.sh/docs/howto/charts_tips_and_tricks/#using-the-tpl-function */}}
{{ tpl (printf "%s: %s" ($key | quote) ($val | quote) | indent 2) $ }}
{{- else }}
{{ printf "%s: %s" ($key | quote) ($val | quote) | indent 2 }}
{{- end }}
{{- end }}
{{- end }}
{{- end }}