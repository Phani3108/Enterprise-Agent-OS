{{- define "common.synthetic_monitor" -}}
{{- $rootValues := dict "Release" $.Release "Chart" $.Chart -}}
{{- range $i, $data := $.Values.synthetic_monitor -}}
{{- $monitorName := (include "common.synthetic_monitor_khcheck_name_helper" $data) -}}
{{- range $i, $type := list "slo" "alert" "monitor" -}}

{{- /*
    -----------------------------------------------------SLO-----------------------------------------------------------------------  
*/ -}}
{{- if eq $type "slo" -}}
{{- if eq (include "common.synthetic_monitor_type_enabled_helper" $data.sloSpec) "true" -}}
{{- $sloValues := dict "enabled" true -}}

{{- /* Setting Default Values */ -}}
{{- $_ := set $sloValues "name" (printf "%s" $data.name) -}}
{{- $_ := set $sloValues "target" ("0.95" | quote) -}}
{{- $_ := set $sloValues "group" (printf "%s-synthetic-monitor-slo-group" $.Release.Namespace) -}}
{{- $_ := set $sloValues "bad" (printf "sum(count_over_time(kuberhealthy_check{check=~%s, status=%s}[$period]))" ((printf "%s/%s" $.Release.Namespace $monitorName)| quote) (0| quote)) -}}
{{- $_ := set $sloValues "total" (printf "sum(count_over_time(kuberhealthy_check{check=~%s}[$period]))" ((printf "%s/%s" $.Release.Namespace $monitorName)| quote)) -}}
{{- $_ := set $sloValues "queryType" $data.name -}}
{{- $_ := set $sloValues "labels" (dict "type" "availability") -}}
{{- if $data.sloSpec -}}
{{- $sloValues = merge dict $data.sloSpec $sloValues -}}
{{- end -}}
{{- include "common.slo" (set $rootValues "Values" (dict "slo" $sloValues)) -}}
{{- end -}}
{{- end -}}

{{- /*
    -----------------------------------------------------Monitor-----------------------------------------------------------------------  
*/ -}}

{{- if eq $type "monitor" -}}
{{- if eq (include "common.synthetic_monitor_type_enabled_helper" $data.monitorSpec) "true" -}}
{{- $monitorValues := dict -}}

{{- if $data.url -}}
{{- $finalurl := $data.url -}}
{{- $pathKeys := $.Values.path_keys -}}
{{- $myList := regexFindAll "\\{(.*?)\\}"  $finalurl -1 -}}
{{- range $item := $myList -}}
{{- $val := trimPrefix  "{" $item  -}}
{{- $val  = trimSuffix  "}" $val -}}
{{- if hasKey $pathKeys $val -}}
{{- $replval := get $pathKeys $val -}}
{{- $finalurl = $finalurl | replace $item $replval -}}
{{- end -}}
{{- end -}}
{{- $_ := set $monitorValues "khcheck_http" (dict $data.name (dict "enabled" true "specs" (dict "checkurl" $finalurl))) -}}
{{- template "common.httpKhcheck" (set $rootValues "Values" $monitorValues) -}}
{{- else if $data.monitorSpec -}}
{{- if eq $data.monitorSpec.type "http" -}}
{{- $_ := set $monitorValues "khcheck_http" (dict $data.name (dict "enabled" true "specs"  $data.monitorSpec.specs)) -}}
{{- template "common.httpKhcheck" (set $rootValues "Values" $monitorValues) -}}
{{- else if eq $data.monitorSpec.type "oms" -}}
{{- $_ := set $monitorValues "khcheck_oms" (dict $data.name (dict "enabled" true "specs"  $data.monitorSpec.specs)) -}}
{{- template "common.omsKhcheck" (set $rootValues "Values" $monitorValues) -}}
{{- else if eq $data.monitorSpec.type "sftp" -}}
{{- $_ := set $monitorValues "khcheck_sftp" (dict $data.name (dict "enabled" true "specs"  $data.monitorSpec.specs)) -}}
{{- template "common.sftpKhcheck" (set $rootValues "Values" $monitorValues) -}}
{{- else if eq $data.monitorSpec.type "http-headers" -}}
{{- $_ := set $monitorValues "khcheck_http_headers" (dict $data.name (dict "enabled" true "specs"  $data.monitorSpec.specs)) -}}
{{- template "common.httpHeadersKhcheck" (set $rootValues "Values" $monitorValues) -}}
{{- end -}}
{{- end -}}

{{- end -}}
{{- end -}}

{{- /*
    -----------------------------------------------------Alert-----------------------------------------------------------------------  
*/ -}}

{{- if eq $type "alert" -}}
{{- if eq (include "common.synthetic_monitor_type_enabled_helper" $data.alertSpec) "true" -}}
{{- $message := printf "%s-alert  triggered in namespace %s" ($data.name) $.Release.Namespace -}}
{{- $alertValues := dict "for" "5m" "name" (printf "%s-alert" $data.name) "group" "synthetic_monitor_alerts" "annotations" (dict "message" $message "summary" $message "description" $message) "labels" (dict "namespace" $.Release.Namespace "severity" "warning" "priority" "P4") -}}
{{- $_ := set $alertValues "expr" (printf "kuberhealthy_check{check=%s} != 1" ((printf "%s/%s" $.Release.Namespace $monitorName | quote))) -}}
{{- if $data.alertSpec -}}
{{- $alertValues = merge dict $data.alertSpec $alertValues -}}
{{- end }}
---
apiVersion: "monitoring.coreos.com/v1"
kind: PrometheusRule
metadata:
  name: prometheus-{{$data.name}}.rules
  namespace: {{$.Release.Namespace}}
  labels:
     app: prometheus-operator
     prometheus: "zone-monitoring"
     ruleFileName: synthetic_monitor-{{$.Release.Namespace}}
spec:
  groups:
  - name: {{$alertValues.group}}
    rules:
    - alert: {{$alertValues.name}}
      for: {{$alertValues.for}}
      expr: {{$alertValues.expr}}
      labels:
        {{- range $key, $value := $alertValues.labels }}
        {{$key}}: {{$value}}
        {{- end }}
      annotations:
        {{- range $key, $value := $alertValues.annotations }}
        {{$key}}: {{$value}}
        {{- end -}}
{{- if  $data.alertSpec  -}}
{{- if or $data.alertSpec.webhook $data.alertSpec.recieverSpec  -}}
{{- $routeValues := dict "labelName" "alertname" "labelValue" $alertValues.name "recieverSpec" $data.alertSpec.recieverSpec -}}
{{- range $key, $value := $data.alertSpec.routingLabel -}}
{{- $_ := set $routeValues "labelName" $key -}}
{{- $_ := set $routeValues "labelValue" $value -}}
{{- end -}}
{{- if $data.alertSpec.webhook -}}
{{- $_ := set $routeValues "recieverSpec" (dict "webhookConfigs" (list (dict "url" $data.alertSpec.webhook))) -}}
{{- end -}}
{{- $_ := set $routeValues "receiverName" (printf "%s-%s-reciever" $routeValues.labelName $routeValues.labelValue) }}
---
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: {{$data.name}}-alertmanagerconfig
  labels:
    alertmanagerConfig: {{$.Release.Namespace}}
  namespace: {{$.Release.Namespace}}
spec:
  route:
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 30m
    receiver: "default"
    routes:
    - matchers:
      - name:  {{$routeValues.labelName}}
        value: {{$routeValues.labelValue}}
      receiver: {{$routeValues.receiverName}}
  receivers:
  - name: "default"
  - name: {{$routeValues.receiverName}}
    {{- $routeValues.recieverSpec | toYaml | nindent 4 }}


{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- end -}}
{{- end -}}
{{- end -}}

{{- /* 
    Helper function to retrieve khcheck name 
*/ -}}
{{- define "common.synthetic_monitor_khcheck_name_helper" -}}
{{- $khcheckName := .name -}}
{{- if .monitorSpec -}}
{{- if .monitorSpec.type -}}
{{- $khcheckName = (printf "%s.%s-khcheck" $khcheckName .monitorSpec.type) -}}
{{- end -}}
{{- else if .url -}}
{{- $khcheckName = (printf "%s.%s-khcheck" $khcheckName "http") -}}
{{- end -}}
{{- printf "%s" $khcheckName -}}
{{- end -}}

{{- /* 
    Helper function to check whether to enable a crd or not
*/ -}}
{{- define "common.synthetic_monitor_type_enabled_helper" -}}
{{- if . -}} {{- if eq .enabled false -}} false {{- else -}} true {{- end -}} {{- else -}} true {{- end -}}
{{- end -}}