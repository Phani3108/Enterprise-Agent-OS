{{- define "common.atropos-schedule" }}
{{- if $.Values.atroposSchedules }}
  {{- range $name, $schedule := $.Values.atroposSchedules }}
  {{- $finalResourceId := printf "%s.atroposschedule.%s" $.Release.Namespace (required "CR name is required" $name) | kebabcase }}
  {{- $finalResourceName := printf "%s.%s" (required "Tenant Code is required" $schedule.tenantCode) $finalResourceId | kebabcase }}
---
apiVersion: rrsd.zetaapps.in/v1alpha1
kind: AtroposSchedule
metadata:
  name: {{ $finalResourceName }}
  namespace: {{ $.Release.Namespace }}
spec:
  metadata:
    id: {{ $finalResourceId }}
    name: {{ required "Schedule name is required" $schedule.name | quote }}
    description: {{ $schedule.description | default "Atropos Schedule CR" | quote }}
    tenantId: {{ required "Tenant ID is required" $schedule.tenantID | quote }}
    tenantCode: {{ $schedule.tenantCode }}
    requester:
      module: {{ ($schedule.metadata).module | default $.Release.Namespace }}
      moduleVersion: {{ ($schedule.metadata).moduleVersion | default "0.0.1" }}
  state: {{ $schedule.state | default "ACTIVE" | quote }}
  id: {{ printf "%s.%s.%s" $schedule.tenantCode $.Release.Namespace (required "Schedule ID is required" $schedule.id) }}
  name: {{ $schedule.name | quote }}
  description: {{ $schedule.description | default "Atropos schedule CR" | quote }}
  schedule:
    type: {{ required "Schedule type is required" ($schedule.schedule).type | upper }}
    timezone: {{ required "Schedule timezone is required" ($schedule.schedule).timezone }}
    {{- if eq ($schedule.schedule.type | upper) "RECURRING" }}
    recurringCronExpression: {{ required "Recurring cron expression is required" $schedule.schedule.recurringCronExpression | quote }}
    {{- else if eq ($schedule.schedule.type | upper) "ONE_TIME" }}
    oneTimeScheduleAt: {{ required "One time scheduleAt is required" $schedule.schedule.oneTimeScheduleAt | quote }}
    {{- end }}
  mode: {{ required "Schedule mode is required" $schedule.mode | upper }}
  {{- if and (eq ($schedule.mode | upper) "ASYNC") (hasKey $schedule "asyncTimeoutInMillis") }}
  asyncTimeoutInMillis: {{ $schedule.asyncTimeoutInMillis }}
  {{- end }}
  webhook:
    request: |-
    {{- required "Schedule webhook request is required" ($schedule.webhook).request | nindent 6 }}

    {{- if  $schedule.webhook.auth }}
    auth: {{ $schedule.webhook.auth | toYaml | nindent 6 }}
    {{- end }}

    {{- if  $schedule.webhook.retryPolicy }}
    retryPolicy: {{ $schedule.webhook.retryPolicy | toYaml | nindent 6 }}
    {{- end }}
  owner: {{ required "Schedule owner is required" $schedule.owner | toYaml | nindent 4 }}

  {{- end }}
{{- end }}
{{- end }}