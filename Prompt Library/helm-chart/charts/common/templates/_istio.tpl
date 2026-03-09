{{- define "common.istio" }}
{{- /* This Virtual Service and Destination Rule defiantion is inspired by https://argoproj.github.io/argo-rollouts/features/traffic-management/istio/#subset-level-traffic-splitting */}}
{{- /* This Virtual Service and Destination specification is primarly to support Canary Deployments. */}}
{{- if ((.Values.istio).enabled) }}
{{- if ((.Values.istio.destinationRule).enabled) }}
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: {{ template "common.fullname" . }}
  namespace: {{ .Release.Namespace }}
  {{- if (.Values.istio).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.istio.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  host: {{ template "common.fullname" . }}
  exportTo:
  {{- /*Export DestinationRule for this service the namespace and serviceExportTo. Zone-Traffic is required in serviceExportTo to load balancing/traffic spiliting from enovy sidecar in zone-traffic work*/}}
  - .
  {{- range .Values.istio.serviceExportTo }}
  - {{. | quote}}
  {{- end }}
  {{- if not (.Values.istio.destinationRule).override }}
  subsets:
  {{- if (.Values.rollout).enabled }}
  {{- if .Values.rollout.strategy.canary.enabled }}
  {{- if (.Values.rollout.strategy.canary.trafficRouting).enabled }}
  - name: canary
    {{- /* referenced in Rollout: canary.trafficRouting.istio.destinationRule.stableSubsetName */}}
    labels:
      {{- /*extra labels will be injected in runtime by ArgoRollout with canary rollouts-pod-template-hash value*/}}
      app.kubernetes.io/name: {{ include "common.name" . }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  {{- end }}
  {{- end }}
  {{- end }}
  - name: stable
   {{- /* referenced in Rollout: canary.trafficRouting.istio.destinationRule.stableSubsetName */}}
    labels:
      {{- /*extra labels will be injected in runtime by ArgoRollout with stable rollouts-pod-template-hash*/}}
      app.kubernetes.io/name: {{ include "common.name" . }}
      app.kubernetes.io/instance: {{ .Release.Name }}
  {{- end}}
  {{- if (.Values.istio.destinationRule).additionalSpec }}
  {{- toYaml .Values.istio.destinationRule.additionalSpec | trim | nindent 2 }}
  {{- end }}
{{- end }}
---
{{- if ((.Values.istio.virtualService).enabled) }}
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: {{ template "common.fullname" . }}
  namespace: {{ .Release.Namespace }}
  {{- if (.Values.istio).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.istio.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  hosts:
  - {{ template "common.fullname" . }}
  {{- range .Values.istio.hosts }}
  - {{.}}
  {{- end }}
  exportTo:
  {{- /*Export VirtualService for this service to the current namespace and serviceExportTo. Zone-Traffic is required in serviceExportTo to make load balancing/traffic spiliting from enovy sidecar in zone-traffic work*/}}
  - .
  {{- range .Values.istio.serviceExportTo }}
  - {{. | quote}}
  {{- end }}
  {{- if not (.Values.istio.virtualService).override }}
  http:
  {{- if (.Values.rollout).enabled }}
  {{- if (.Values.rollout.strategy.canary).enabled }}
  {{- if (.Values.rollout.strategy.canary.trafficRouting).enabled }}
  - match:
  {{- /*# To Support Sending Traffic Canary Pods using Header Matching */}}
    - headers:
        x-canary:
          exact: "true"
    route:
      - destination:
          host: {{ template "common.fullname" . }}
          subset: canary
	{{- end }}
	{{- end }}
	{{- end }}
  - name: primary
    {{- /* referenced in Rollout: canary.trafficRouting.istio.virtualService.routes */}}
    route:
    - destination:
        host: {{ template "common.fullname" . }}
        {{- /* referenced in Rollout: canary.trafficRouting.istio.destinationRule.stableSubsetName */}}
        subset: stable
      weight: 100
    {{- if (.Values.rollout).enabled }}
    {{- if .Values.rollout.strategy.canary.enabled }}
    {{- if (.Values.rollout.strategy.canary.trafficRouting).enabled }}
    - destination:
        host: {{ template "common.fullname" . }}
        {{- /* referenced in Rollout: canary.trafficRouting.istio.destinationRule.canarySubsetName */}}
        subset: canary
      weight: 0
    {{- end }}
    {{- end }}
    {{- end }}
  {{- end }}
  {{- if (.Values.istio.virtualService).additionalSpec }}
  {{- toYaml .Values.istio.virtualService.additionalSpec | trim | nindent 2 }}
  {{- end }}
{{- end }}
{{- end }}
{{- end }}