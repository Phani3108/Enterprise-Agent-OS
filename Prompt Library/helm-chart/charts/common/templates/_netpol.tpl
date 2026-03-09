{{- define "common.netpol" }}
{{- $name := .Chart.Name -}}
{{- if $.Values.netpol}}
{{- range $netpol := $.Values.netpol }}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ $name }}-{{ $netpol.name }}
  namespace: {{ $.Release.Namespace }}
  {{- if .additionalAnnotations }}
  annotations:
    {{- toYaml .additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: {{ $name }}
      app.kubernetes.io/instance: {{ $.Release.Name }}
{{- if $netpol.ingress }}
  ingress:
{{ toYaml $netpol.ingress | indent 4 }}
{{- end }}
{{- if $netpol.egress }}
  egress:
{{ toYaml $netpol.egress | indent 4 }}
{{- end }}
{{- end }}
{{- end }}
{{- end }}