{{- define "common.ingress" }}
{{- if .Values.ingress }}
{{- $fullName := include "common.fullname" . -}}
{{- $svcPort := (default 80 .Values.service.port) -}}
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
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
{{- if .Values.ingress.tls }}
  tls:
  {{- range .Values.ingress.tls }}
    - hosts:
      {{- range .hosts }}
        - {{ . | quote }}
      {{- end }}
      secretName: {{ .secretName }}
  {{- end }}
{{- end }}
  rules:
  {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      {{- $port := (default $svcPort .portOverride) }}
      {{- $pathType := (default "Prefix" .pathType) }}
      http:
        paths:
        {{- range .paths }}
          - path: {{ . }}
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