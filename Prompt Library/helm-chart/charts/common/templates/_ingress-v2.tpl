{{- define "common.ingress-v2" }}
{{- if .Values.ingress }}
{{- $fullName := include "common.fullname" . -}}
{{- $svcPort := (default 80 .Values.service.port) -}}
{{- $namespace := .Release.Namespace -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ $fullName }}
  namespace: {{ .Release.Namespace }}
  labels:
{{ include "common.labels" . | indent 4 }}
  {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if .Values.ingress }}
    {{- if .Values.ingress.additionalLabels }}
      {{- toYaml .Values.ingress.additionalLabels | nindent 4 }}
    {{- end }}
  {{- end }}
  annotations:
  {{- with .Values.ingress.annotations }}
    {{- toYaml . | nindent 4 }}
  {{- end }}
    nginx.ingress.kubernetes.io/rewrite-target: $1
  {{- with .Values.ingress.additionalAnnotations }}
    {{- toYaml .Values.ingress.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  rules:
  {{- $global := ($.Values.global | default dict) }}
  {{- range .Values.ingress.hosts }}
  {{- $pathType := (default "Prefix" .pathType) }}
  {{- $port := (default $svcPort .portOverride) }}
    - http:
        paths:
        {{- range .paths }}
          - path: /{{ default $namespace  $global.clusterAlias }}{{ . }}
            pathType: {{ $pathType }}
            backend:
              service:
                name: {{ $fullName }}
                port:
                  number: {{ default $port }}
        {{- end }}
  {{- end }}
{{- end }}
{{- end}}