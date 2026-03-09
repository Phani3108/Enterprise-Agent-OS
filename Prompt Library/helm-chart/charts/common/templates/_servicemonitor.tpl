{{- define "common.servicemonitor" }}
{{- if .Values.serviceMonitor }}
{{- if .Values.serviceMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ template "common.fullname" . }}-servicemonitor
  {{- if .Values.serviceMonitor.namespace }}
  namespace: {{ default .Release.Namespace .Values.serviceMonitor.namespace }}
  {{- end }}
  labels:
    {{- include "common.olympus-labels" .Values | nindent 4 }}
    {{- range $key, $value := .Values.serviceMonitor.labels }}
    {{ $key }}: {{ $value | quote }}
    {{- end }}
  {{- if (.Values.serviceMonitor).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.serviceMonitor.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  selector:
    matchLabels:
      {{- if .Values.serviceMonitor.matchLabels }}
        {{- range $key, $value := .Values.serviceMonitor.matchLabels }}
          {{- $key | nindent 6 }}: {{ $value | quote }}
        {{- end }}
      {{- else }}
        {{- include "common.labels" . | nindent 6 }}
      {{- end }}
  endpoints:
    - path: {{ default "/" .Values.serviceMonitor.path }}
      port: {{ .Values.serviceMonitor.port }}
      scrapeTimeout: {{ default "10s" .Values.serviceMonitor.scrapeTimeout }}
      interval: {{ default "60s" .Values.serviceMonitor.interval }}
  namespaceSelector:
    matchNames:
      {{- if .Values.serviceMonitor.matchNamespace }}
      - {{ .Values.serviceMonitor.matchNamespace }}
      {{- else }}
      - {{ .Release.Namespace }}
      {{- end }}
{{- end }}
{{- end }}
{{- end }}
