{{- define "common.postgresql-service" }}
apiVersion: v1
kind: Service
metadata:
  name: {{ template "common.fullname" . }}-postgresql
  namespace: {{ .Release.Namespace }}
  labels:
    app: {{ template "common.fullname" . }}-postgres
    chart: "{{ .Chart.Name }}-{{ .Chart.Version }}"
    release: "{{ .Release.Name }}"
    heritage: "{{ .Release.Service }}"
    {{- include "common.olympus-labels" .Values | nindent 4 }}
    {{- if .Values.postgres }}
      {{- if .Values.postgres.additionalLabels }}
        {{- toYaml .Values.postgres.additionalLabels | nindent 4 }}
      {{- end }}
    {{- end }}
  {{- if (.Values.postgres).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.postgres.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  type: ExternalName
{{- if .Values.postgres.internal }}
  externalName: {{list "postgresql" .Release.Namespace "svc.cluster.local"| join "." }}
{{- else }}
  externalName: {{.Values.postgres.hostname}}
{{- end}}
{{- end}}