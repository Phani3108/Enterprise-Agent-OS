{{- define "common.servicemonitor-v2" }}
{{- if and (.Values.serviceMonitor.enabled) (.Values.serviceMonitor.monitors)  }}
{{- range .Values.serviceMonitor.monitors }}
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ template "common.fullname" $ }}-{{ .name }}-servicemonitor
  namespace: {{ default $.Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" $.Values | nindent 4 }}
    {{- if .labels }}
      {{- toYaml .labels | nindent 4 }}
    {{- end }}
  {{- if .additionalAnnotations }}
  annotations:
    {{- toYaml .additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  selector:
    matchLabels:
      {{- if .matchLabels }}
          {{- toYaml .matchLabels | nindent 6 }}
      {{- else }}
        {{- include "common.labels" $ | nindent 6 }}
      {{- end }}
  endpoints:
    - path: {{ default "/" .path }}
      port: {{ required "port is mandatory" .port }}
      scrapeTimeout: {{ default "10s" .scrapeTimeout }}
      interval: {{ default "60s" .interval }}
  namespaceSelector:
    matchNames:
      {{- if .matchNamespace }}
      - {{ .matchNamespace }}
      {{- else }}
      - {{ $.Release.Namespace }}
      {{- end }}
---
{{- end }}
{{- end }}
{{/* -- start jmxmetrics servicemonitor -- */}}
{{- if not (.Values.jmxScrapeConfig).disabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ template "common.fullname" $ }}-jmxmetrics-servicemonitor
  namespace: {{ default $.Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" $.Values | nindent 4 }}
    prometheus: zone-monitoring
    {{- if .labels }}
      {{- toYaml .labels | nindent 4 }}
    {{- end }}
spec:
  selector:
    matchLabels:
      {{- include "common.labels" $ | nindent 6 }}
  endpoints:
    - path: {{ default "/" (.Values.jmxScrapeConfig).path }}
      port: {{ default "jmxmetrics" (.Values.jmxScrapeConfig).port }}
      scrapeTimeout: {{ default "10s" (.Values.jmxScrapeConfig).scrapeTimeout }}
      interval: {{ default "60s" (.Values.jmxScrapeConfig).interval }}
  namespaceSelector:
    matchNames:
      - {{ $.Release.Namespace }}
{{- end }}
{{/* -- end jmxmetrics servicemonitor -- */}}
---
{{/* -- start springboot http servicemonitor -- */}}
{{- if not .Values.omsAppName }}
{{- if not (.Values.springbootHttpScrapeConfig).disabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ template "common.fullname" $ }}-springboothttp-servicemonitor
  namespace: {{ default $.Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" $.Values | nindent 4 }}
    prometheus: zone-monitoring
    {{- if .labels }}
      {{- toYaml .labels | nindent 4 }}
    {{- end }}
spec:
  selector:
    matchLabels:
      {{- include "common.labels" $ | nindent 6 }}
  endpoints:
    - path: {{ default "/prometheus" (.Values.springbootHttpScrapeConfig).path }}
      port: {{ default "http" (.Values.springbootHttpScrapeConfig).port }}
      scrapeTimeout: {{ default "10s" (.Values.springbootHttpScrapeConfig).scrapeTimeout }}
      interval: {{ default "60s" (.Values.springbootHttpScrapeConfig).interval }}
  namespaceSelector:
    matchNames:
      - {{ $.Release.Namespace }}
{{- end }}
{{- end }}
{{/* -- end springboot http servicemonitor -- */}}
---
{{/* -- start oms http servicemonitor -- */}}
{{- if .Values.omsAppName }}
{{- if ne .Values.omsAppName "" }}
{{- if not (.Values.omsHttpScrapeConfig).disabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ template "common.fullname" $ }}-omshttp-servicemonitor
  namespace: {{ default $.Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" $.Values | nindent 4 }}
    prometheus: zone-monitoring
    {{- if .labels }}
      {{- toYaml .labels | nindent 4 }}
    {{- end }}
spec:
  selector:
    matchLabels:
      {{- include "common.labels" $ | nindent 6 }}
  endpoints:
    - path: {{ default "/_metrics/" (.Values.omsHttpScrapeConfig).path }}
      port: {{ default "omshttp" (.Values.omsHttpScrapeConfig).port }}
      scrapeTimeout: {{ default "10s" (.Values.omsHttpScrapeConfig).scrapeTimeout }}
      interval: {{ default "60s" (.Values.omsHttpScrapeConfig).interval }}
  namespaceSelector:
    matchNames:
      - {{ $.Release.Namespace }}
{{- end }}
{{- end }}
{{- end }}
{{/* -- end oms http servicemonitor -- */}}
{{- end }}
