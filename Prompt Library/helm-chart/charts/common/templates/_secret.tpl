{{- define "common.secret" }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Chart.Name }}-secret
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" .Values | nindent 4 }}
    {{- if .Values.secret }}
      {{- if .Values.secret.additionalLabels }}
        {{- toYaml .Values.secret.additionalLabels | nindent 4 }}
      {{- end }}
    {{- end }}
  {{- if (.Values.secret).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.secret.additionalAnnotations | nindent 4 }}
  {{- end }}
data:
{{- $chartName := .Chart.Name}}
{{- range splitList "\n" (.Files.Get "secrets.yaml.dec") }}
{{- if not (. | trim | empty) }}
{{- $kv := . | splitn ": " 2 }}
{{ printf "%s: %s" ($kv._0 | quote) ((b64enc ($kv._1)) | quote) | indent 2 }}
{{- end }}
{{- end }}
{{- end }}