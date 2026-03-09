{{- define "common.hpa" }}
{{- if ((.Values.hpa).enabled) }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ template "common.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
  {{- include "common.labels" . | nindent 4 }}
  {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if (.Values.hpa).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.hpa.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  scaleTargetRef:
    {{- if ((.Values.rollout).enabled) }}
    {{- /* Why are we doing this: https://argoproj.github.io/argo-rollouts/features/hpa-support/ ? */}}
    apiVersion: argoproj.io/v1alpha1
    kind: Rollout
    {{- else }}
    apiVersion: apps/v1
    kind: Deployment
    {{- end }}
    name: {{ template "common.fullname" . }}
  minReplicas: {{ .Values.replicaCount }}
  maxReplicas: {{ .Values.hpa.maxReplicas }}
  metrics:
  {{- if .Values.hpa.cpu }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.hpa.cpu }}
  {{- end }}
  {{- if .Values.hpa.mem }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.hpa.mem }}
  {{- end }}
{{- if (.Values.hpa.additionalMetrics)  }}
{{- toYaml .Values.hpa.additionalMetrics | nindent 4 }}
{{- end }}
{{- if (.Values.hpa).behavior }}
  behavior:
{{- toYaml .Values.hpa.behavior | nindent 4 }}
{{- end }}
{{- end}}
{{- end}}