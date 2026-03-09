{{- define "common.atropos-topic" }}
{{- if $.Values.atroposTopics }}
  {{- range $topic := $.Values.atroposTopics }}
  {{- $finalResourceId := printf "%s.atropostopic.%s" $.Release.Namespace (required "CR name is required" $topic.crName) | kebabcase }}
  {{- $finalResourceName := printf "%s.%s" (required "Tenant Code is required" $topic.tenantCode) $finalResourceId | kebabcase }}
---
apiVersion: rrsd.zetaapps.in/v1alpha1
kind: AtroposTopic
metadata:
  name: {{ $finalResourceName }}
  namespace: {{ $.Release.Namespace }}
  {{- if $topic.additionalAnnotations }}
  annotations:
    {{- toYaml $topic.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  metadata:
    id: {{ $finalResourceId }}
    name: {{ $topic.crName }}
    description: {{ $topic.description | default "Atropos Topic CR" | quote }}
    tenantId: {{ required "Tenant ID is required" $topic.tenantID | quote }}
    tenantCode: {{ $topic.tenantCode }}
    requester:
      module: {{ ($topic.metadata).module | default $.Release.Namespace }}
      moduleVersion: {{ ($topic.metadata).moduleVersion | default "0.0.1" }}
  tenantID: {{ $topic.tenantID }}
  name: {{ required "Topic name is required" $topic.name | quote }}
  state: {{ $topic.state | default "ACTIVE" | quote }}
  priority: {{ $topic.priority | default "UNKNOWN" | quote }}
  brokerType: {{ $topic.brokerType | default "KAFKA" | quote }}
  {{- if  $topic.contactInfo }}
  contactInfo: {{ $topic.contactInfo | toYaml | nindent 6 }}
  {{- end }}

  {{- end }}
{{- else if $.Values.atroposTopic }}
  {{- range $topic := $.Values.atroposTopic }}
---
apiVersion: pubsub.zeta.in/v1alpha1
kind: PubSubTopic
metadata:
  name: {{ $topic.crName }}
  namespace: {{ $.Release.Namespace }}
  {{- if $topic.additionalAnnotations }}
  annotations:
    {{- toYaml $topic.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  name: {{ $topic.name }}
  {{- if hasKey $topic "allowedSourceApplications" }}
  allowedSourceApplications:
  {{- range $topic.allowedSourceApplications }}
  - {{ . }}
  {{- end }}
  {{- else }}
  allowedSourceApplications: []
  {{- end }}
  {{- if hasKey $topic "whitelistedEvents" }}
  whitelistedEvents:
  {{- range $topic.whitelistedEvents }}
    - {{ . }}
  {{- end }}
  {{- else }}
  whitelistedEvents: []
  {{- end }}
  {{- if hasKey $topic "blacklistedEvents" }}
  blacklistedEvents:
  {{- range $topic.blacklistedEvents }}
    - {{ . }}
  {{- end }}
  {{- else }}
  blacklistedEvents: []
  {{- end }}
  {{- if hasKey $topic "allowedSubscriberApplications" }}
  allowedSubscriberApplications:
  {{- range $topic.allowedSubscriberApplications }}
    - {{ . }}
  {{- end }}
  {{- else }}
  allowedSubscriberApplications:
    - type: jid
      value: "*"
    - type: appName
      value: "*"
  {{- end }}
  retentionPeriod: {{ default 1 $topic.retentionPeriod }}
  {{- if  $topic.attrs }}
  attrs: {{ $topic.attrs | toYaml | nindent 8 }}
  {{- else }}
  attrs: {{ dict | toYaml }}
  {{- end }}
  state: {{ default "ACTIVE" $topic.state }}
  tenantID: {{ $topic.tenantID }}
  {{- end }}
  {{- end }}
{{- end }}