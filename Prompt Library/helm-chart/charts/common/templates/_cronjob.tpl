{{- define "common.cronjob" }}
{{- if (.Values.cronJob).enabled }}
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ .Chart.Name }}-cronjob
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if (.Values.cronJob).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.cronJob.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  schedule: {{ .Values.cronJob.schedule }}
  jobTemplate:
    spec:
      template:
        spec:
{{ if .Values.cronJob.spec.initContainers }}
          initContainers:
{{ toYaml .Values.cronJob.spec.initContainers | indent 10 }}
{{- end }}
          containers:
{{ toYaml .Values.cronJob.spec.containers | indent 10 }}
  restartPolicy: {{ .Values.cronJob.restartPolicy }}
{{- end }}
{{- end }}
