{{- define "common.kong-ingress" }}
{{- $fullName := include "common.fullname" . -}}
{{- $svcPort := (default 80 .Values.service.port) -}}
{{- $namespace := .Release.Namespace -}}
{{- $ingressClass := "" }}
{{- if hasKey .Values.ingress "annotations" }}
  {{- if hasKey .Values.ingress.annotations "kubernetes.io/ingress.class"}}
      {{- $ingressClass =  index .Values "ingress" "annotations" "kubernetes.io/ingress.class" }}
  {{- end }}
{{- end }}
---
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
    konghq.com/strip-path: "false"
spec:
  rules:
  {{- $global := ($.Values.global | default dict) }}
  {{- range .Values.ingress.hosts }}
  {{- $port := (default $svcPort .portOverride) }}
  {{- $pathType := (default "Prefix" .pathType) }}
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
---

apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: zeta-ingress-v2-plugin
  labels:
    global: "true"
  annotations:
  {{- with .Values.ingress.annotations }}
    {{- toYaml . | nindent 4 }}
  {{- end }}
config:
  scope: "global"
  {{- if eq $ingressClass "kong-internal" }}
  type: "internal"
  {{- else }}
  type: "external"
  {{- end }}
plugin: zeta-ingress-v2
---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: request-transformer-plugin
  annotations:
  {{- with .Values.ingress.annotations }}
    {{- toYaml . | nindent 4 }}
  {{- end }}
config:
  replace:
    uri: "/$(uri_captures[1])"
plugin: request-transformer
{{- end }}