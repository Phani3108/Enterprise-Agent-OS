{{- define "common.service-account" }}
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: {{ .Release.Namespace }}
  name: {{ required "serviceAccountName is mandatory" .Values.serviceAccountName }}
  {{- if (.Values.serviceAccount).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.serviceAccount.additionalAnnotations | nindent 4 }}
  {{- end }}
  labels:
    {{- include "common.olympus-labels" .Values | nindent 4 }}
    {{- if .Values.serviceAccount }}
      {{- if .Values.serviceAccount.additionalLabels }}
        {{- toYaml .Values.serviceAccount.additionalLabels | nindent 4 }}
      {{- end }}
    {{- end }}
{{- end -}}
