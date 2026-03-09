{{- define "common.log4olympus-configmap" }}
{{- if not (.Values.log4Olympus).dynamicConfigDisabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "common.name" . }}-log4olympus-configmap
  namespace: {{ .Release.Namespace }}
  {{- if (.Values.log4Olympus).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.log4Olympus.additionalAnnotations | nindent 4 }}
  {{- end }}
data:
{{- if .Values.log4Olympus }}
  {{- if .Values.log4Olympus.config }}
{{- range $key, $val := .Values.log4Olympus.config }}
{{ printf "%s: %s" ($key | quote) ($val | quote) | indent 2 }}
  {{- end }}
{{- end }}

{{- end }}
{{- end }}
{{- end }}
