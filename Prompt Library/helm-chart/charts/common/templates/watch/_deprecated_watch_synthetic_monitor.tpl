{{/*
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/}}

{{/*
Watch Synthetic Monitor Template.
This template will generate all the simple alerts mentioned in the Values file, also it will generate all the custom-alerts mentioned in the watch-alerts folder
It basically generates three CRD's KuberhealthyChecks , PrometheusRule, AlertManagerConfig
*/}}
{{- define "common.watch_synthetic_monitor" -}}
{{- if .Values.watch_synthetic_monitor -}}
{{- $data := dict "Release" $.Release -}}
{{- $khcheckNames := dict -}}

{{/*
Creating kuberhealthychecks (if any)
*/}}

{{- range $index, $alert := $.Values.watch_synthetic_monitor.watch_simple_alerts -}}

{{- $_ := set $data  "Values" $alert.monitor -}}
{{- if $alert.monitor -}}
{{- if $alert.monitor.khcheck_http -}}
{{- template "common.httpKhcheck" $data -}}
{{- else if $alert.monitor.khcheck_oms -}}
{{- template "common.omsKhcheck" $data -}}
{{- else if $alert.monitor.khcheck_sftp -}}
{{- template "common.sftpKhcheck" $data -}}
{{- end -}}
{{- end -}}
{{ printf "\n" }}

{{- end -}}

{{/*
Adding prometheusRules CRD (if any)
*/}}

{{- template "common.watch_prometheus_alerts" . -}}

{{/*
Adding alertManagerConfig CRD (if any)
*/}}

{{- template "common.watch_alertmanager_config" . -}}

{{- end -}}
{{- end -}}
{{/*
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/}}

{{/*
Prometheus Rules Template.
This template creates Prometheus Rules for simple alerts and custom alerts.It's used by the "common.watch_synthetic_monitoring" template. Can be used independently as well
It creates PrometheusRule CRD
*/}}

{{- define "common.watch_prometheus_alerts" -}}

{{- $alertsDict := dict -}}
{{- $file := .Files -}}
{{- range $path, $bytes := $file.Glob "watch-alerts/**.yaml" -}}

{{- $_ := set $alertsDict $path ($file.Get $path | fromYaml) -}}

{{- end -}}

{{- if .Values.watch_synthetic_monitor -}}
{{- if .Values.watch_synthetic_monitor.watch_simple_alerts -}}
{{- $simpleAlertsGroup := include "common.watch_prometheus_alerts_helper" . -}}
{{- $_ := set $alertsDict (printf "synthetic-monitor-%s" $.Release.Namespace) ($simpleAlertsGroup | fromYaml) -}}
{{- end -}}
{{- end -}}



{{- range $path, $data := $alertsDict }}
{{if $data.rules -}}
apiVersion: "monitoring.coreos.com/v1"
kind: PrometheusRule
metadata:
  name: prometheus-{{ $path | base }}.rules
  namespace: {{ $.Release.Namespace }}
  labels:
     app: prometheus-operator
     prometheus: "zone-monitoring"
     ruleFileName: {{ $path | base }}
spec:
{{- $data.rules | toYaml | nindent 2 }}
---
{{- end -}}
{{- end }}
{{- end -}}


{{- define "common.watch_prometheus_alerts_helper" -}}
{{- $defaultPriority := "P3" -}}
{{- $defaultSeverity := "critical" -}}
{{- $defaultDuration := "1m" -}}

rules:
 groups:
 - name: "synthetic-monitor-{{$.Release.Namespace}}-alerts"
   rules:
{{- range $index, $alert := $.Values.watch_synthetic_monitor.watch_simple_alerts }}
{{$defaultExpression := printf "kuberhealthy_check{check=%s} != 1" ((printf "%s/%s" $.Release.Namespace (include "common.watch_get_khcheck_name" $alert.monitor))| quote)}}
   - alert: {{ $alert.alertName }}
     for: {{ if $alert.alertSpec -}} {{ default $defaultDuration $alert.alertSpec.duration }} {{- else -}} {{$defaultDuration}} {{- end }}
     expr: {{ if $alert.alertSpec -}} {{ default $defaultExpression $alert.alertSpec.expr }} {{- else -}} {{$defaultExpression}} {{- end }}
     labels:
       priority: {{ if $alert.alertSpec -}} {{ default $defaultPriority $alert.alertSpec.priority }} {{- else -}} {{$defaultPriority}} {{- end }}
       severity: {{ if $alert.alertSpec -}} {{ default $defaultSeverity $alert.alertSpec.severity }} {{- else -}} {{$defaultSeverity}} {{- end }}
       namespace: {{ $.Release.Namespace }}
     annotations:
       {{$message := printf "%s alert triggered in namespace %s" $alert.alertName $.Release.Namespace -}}
       description: {{ if $alert.alertSpec -}} {{default $message $alert.alertSpec.description}} {{- else -}} {{$message}} {{- end }}
       summary: {{ if $alert.alertSpec -}} {{default $message $alert.alertSpec.summary}} {{- else -}} {{$message}} {{- end }}
       message: {{ if $alert.alertSpec -}} {{ default $message $alert.alertSpec.message}} {{- else -}} {{$message}} {{- end }}
{{- end }}
{{- end -}}

{{- define "common.watch_get_khcheck_name" -}}
{{- if .khcheck_http -}}
{{- printf "%s.http-kcheck" (first ( keys .khcheck_http)) -}}
{{- else if .khcheck_oms -}}
{{- printf "%s.oms-kcheck" (first ( keys .khcheck_oms)) -}}
{{- else if .khcheck_sftp -}}
{{- printf "%s.sftp-kcheck" (first ( keys .khcheck_http)) -}}
{{- end -}}
{{- end -}}


{{/*
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/}}


{{- define "common.watch_alertmanager_config" -}}
{{- $alertRoutes := list -}}

{{- $file := .Files -}}

{{- range $path, $bytes := $file.Glob "watch-alerts/**.yaml" -}}
{{- $alerts := ($file.Get $path | fromYaml) -}}
{{- if $alerts.routes -}}
{{- $alertRoutes = concat $alertRoutes $alerts.routes -}}
{{- end -}}
{{- end -}}

{{- if .Values.watch_synthetic_monitor -}}
{{- range $index, $alert := $.Values.watch_synthetic_monitor.watch_simple_alerts }}
{{- $route := dict "labelName" "alertname" -}}
{{- $_ := set $route "labelValue" $alert.alertName -}}
{{- $_ := set $route "receiver" (dict "name" (printf "%s-receiver" $alert.alertName) "spec" (dict "webhookConfigs" (list (dict "url" $alert.webhook))))  -}}
{{- $alertRoutes = mustAppend $alertRoutes $route -}}
{{- end -}}
{{- end -}}

{{- if gt (len $alertRoutes) 0 -}}
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: {{$.Release.Namespace}}-alertmanagerconfig
  labels:
    alertmanagerConfig: {{$.Release.Namespace}}
spec:
  route:
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 30m
    receiver: "default"
    routes:
{{- range $index, $route := $alertRoutes }}
    - matchers:
      - name:  {{$route.labelName}}
        value: {{$route.labelValue}}
        regex: {{default false $route.regex}}
      receiver: {{ if $route.receiver.name -}} {{$route.receiver.name}} {{- else -}} (printf "%s-%s-receiver" $route.labelName $route.labelValue) {{- end -}}
{{- end }}
  receivers:
  - name: "default"
{{- range $index, $route := $alertRoutes }}
  - name: {{ if $route.receiver.name -}} {{$route.receiver.name}} {{- else -}} (printf "%s-%s-receiver" $route.labelName $route.labelValue) {{- end -}}
{{$route.receiver.spec | toYaml | nindent 4 -}}
{{- end}}
{{- end -}}

{{- end -}}

{{/*
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/}}