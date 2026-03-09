{{- define "common.atropos-subscription" }}
{{- if $.Values.atroposSubscriptions }}
{{- if $.Values.atroposSubscriptions.enableV2 }}
  {{- range $subscription := omit $.Values.atroposSubscriptions "enableV2" }}
  {{- $finalResourceId := printf "%s.atropossubscription.%s" $.Release.Namespace (required "CR name is required" $subscription.crName) | kebabcase }}
  {{- $finalResourceName := printf "%s.%s" (required "Tenant Code is required" $subscription.tenantCode) $finalResourceId | kebabcase }}
---
apiVersion: rrsd.zetaapps.in/v1alpha1
kind: AtroposSubscription
metadata:
  name: {{ $finalResourceName }}
  namespace: {{ $.Release.Namespace }}
  {{- if $subscription.additionalAnnotations }}
  annotations:
    {{- toYaml $subscription.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  metadata:
    id: {{ $finalResourceId }}
    name: {{ $subscription.crName }}
    description: {{ $subscription.description | default "Atropos Subscription CR" | quote }}
    tenantId: {{ required "Tenant ID is required" $subscription.tenantID | quote }}
    tenantCode: {{ $subscription.tenantCode }}
    requester:
      module: {{ ($subscription.metadata).module | default $.Release.Namespace }}
      moduleVersion: {{ ($subscription.metadata).moduleVersion | default "0.0.1" }}
  subscriptionType: {{ required "Subscription type is required" $subscription.subscriptionType | lower }}
  state: {{ $subscription.state | default "ACTIVE" | quote }}
  subscription:
    tenantID: {{ $subscription.tenantID }}
    {{- if $subscription.sandboxID }}
    sandboxID: {{ $subscription.sandboxID }}
    {{- end }}
    subscriptionID: {{ required "Subscription ID is required" $subscription.subscriptionID }}
    subscriber: {{ required "Subscriber is required" $subscription.subscriber }}
    topic: {{ required "Topic is required" $subscription.topic }}
    eventName: {{ $subscription.eventName | default "*" | quote }}
    transformerJS: |-
    {{- required "Transformer JS is required" $subscription.transformerJS | nindent 6 }}
    config: {{ hasKey $subscription "config" | ternary ($subscription.config | toYaml | nindent 6) (dict | toYaml) }}
    filters: {{ hasKey $subscription "filters" | ternary ($subscription.filters | toYaml | nindent 6) (list | toYaml) }}

    {{- if eq ($subscription.subscriptionType | lower) "webhook" }}
    {{- if $subscription.webhookRequest }}
    webhookRequest: |-
    {{- $subscription.webhookRequest | nindent 6 }}
    {{- else }}
    webhookURL: {{ required "Webhook URL or request is required" $subscription.webhookURL }}
    {{- end }}

    {{- if $subscription.blacklistErrorCodes }}
    blacklistErrorCodes:
    {{- range $subscription.blacklistErrorCodes }}
      - {{ . }}
    {{- end }}
    {{- end }}

    {{- end }}

    {{- if  $subscription.contactInfo }}
    contactInfo: {{ $subscription.contactInfo | toYaml | nindent 6 }}
    {{- end }}

  {{- end }}
{{- else }}
  {{- range $subscription := omit $.Values.atroposSubscriptions "enableV2" }}
---
apiVersion: pubsub.zeta.in/v1alpha1
kind: PubSubSubscription
metadata:
  name: {{ $subscription.crName }}
  namespace: {{ $.Release.Namespace }}
  {{- if $subscription.additionalAnnotations }}
  annotations:
    {{- toYaml $subscription.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  state: {{ default "ACTIVE" $subscription.state }}
  subscription:
    eventName: {{ default "*" $subscription.eventName | quote}}
    {{- if hasKey $subscription "filters" }}
    filters: {{ $subscription.filters | toYaml | nindent 6 }}
    {{- else }}
    filters: []
    {{- end }}
    subscriber: {{ $subscription.subscriber}}
    subscriptionID: {{ $subscription.subscriptionID}}
    tenantID: {{ $subscription.tenantID}}
    topic: {{ $subscription.topic}}
    transformerJS: {{- $subscription.transformerJS | toYaml | indent 4 }}
    {{- if  $subscription.config }}
    config: {{ $subscription.config | toYaml | nindent 6 }}
    {{- else }}
    config: {{ dict | toYaml }}
    {{- end }}
    {{- if  $subscription.webhookURL }}
    webhookURL: {{ $subscription.webhookURL }}
    {{- end }}
    {{- if  $subscription.webhookRequest }}
    webhookRequest: {{- $subscription.webhookRequest | toYaml | indent 4 }}
    {{- end }}
    {{- if  $subscription.contactInfo }}
    contactInfo: {{ $subscription.contactInfo | toYaml | nindent 6 }}
    {{- else }}
    contactInfo: {{ dict | toYaml }}
    {{- end }}
  subscriptionType: {{ $subscription.subscriptionType }}

  {{- end }}
{{- end }}
{{- end }}
{{- end }}