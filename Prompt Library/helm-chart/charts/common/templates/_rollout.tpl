{{/* Using Workload Reference in Rollout: https://argoproj.github.io/argo-rollouts/migrating/#reference-deployment-from-rollout */}}
{{/* Rollout specification: https://argoproj.github.io/argo-rollouts/features/specification/ */}}
{{- define "common.rollout" }}
{{- if ((.Values.rollout).enabled) }}
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: {{ template "common.fullname" . }}
  namespace: {{ .Release.Namespace }}
  {{- if (.Values.rollout).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.rollout.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  {{- if not .Values.rollout.override }}
  replicas: {{ .Values.replicaCount }}
  revisionHistoryLimit: {{ default 3 .Values.rollout.revisionHistoryLimit }}
  workloadRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ template "common.fullname" . }}
  {{- with .Values.rollout.strategy }}
  strategy:
    {{- if (.canary).enabled }}
    {{- with .canary }}
    canary:
    {{- /*Canary Deployment: https://argoproj.github.io/argo-rollouts/features/canary/ */}}
      {{- if (.trafficRouting).enabled }}
      {{- if not (.trafficRouting).override }}
      trafficRouting:
        istio:
         {{- /* Canary Deployment with Istio: https://argoproj.github.io/argo-rollouts/features/traffic-management/istio/#subset-level-traffic-splitting/ */}}
         {{- /* names specified here are refered in Virtual Service and Destination Rule */}}
          virtualService:
            name: {{ template "common.fullname" $ }}
            routes:
              - primary
          destinationRule:
            name: {{ template "common.fullname" $ }}
            canarySubsetName: canary
            stableSubsetName: stable
      {{- end }}
      {{- if (.trafficRouting).additionalSpec }}
      {{- toYaml (.trafficRouting).additionalSpec | trim | nindent 12 }}
      {{- end }}
      {{- end}}
      {{- if not ($.Values.rollout).rollingUpdate }}
      {{- if (.steps).enabled }}
      steps:
      {{- /*Steps define sequence of steps to take during an update of the canary*/}}
      {{- if not (.steps).override }}
        - setWeight: {{default "10" (.steps).initialWeight }}
        - pause: { duration: {{ default "30m" (.steps).initialPause  }} }
      {{- end }}
      {{- if (.steps).additionalSpec }}
      {{- toYaml (.steps).additionalSpec | trim | nindent 8 }}
      {{- end }}
      {{- end }}
      {{- end}}
      {{- if (.analysis).enabled }}
      analysis:
      {{- /*Refer to for what kind of Analysis are offered: ttps://argoproj.github.io/argo-rollouts/features/analysis/*/}}
      {{- if not (.analysis).override }}
        templates:
        {{- /*Refer to https://bitbucket.org/zetaengg/zeta-argo-rollouts/src/master/README.md for the Cluster Analysis Templates @ Zeta*/}}
          - templateName: background-istio-success-rate
            clusterScope: true
          - templateName: background-istio-number-of-request
            clusterScope: true
        args:
          - name: service-name
            value: {{ template "common.fullname" $ }}
          - name: version
            value: {{ $.Values.image.tag }}
          - name: threshold
            value: {{ (.analysis).successThreshold | quote }}
          - name: minimum-requests
            value: {{ (.analysis).minimumRequests | quote }}
          - name: maximum-tries
            value: {{ (.analysis).maximumTries | quote }}
      {{- end }}
      {{- if (.analysis).additionalSpec }}
      {{- toYaml (.analysis).additionalSpec | trim | nindent 12 }}
      {{- end }}
      {{- end}}
    {{- end }}
    {{- if not .override }}
    {{- end }}
    {{- if .additionalSpec }}
    {{- toYaml .additionalSpec | trim | nindent 6 }}
    {{- end }}
    {{- end}}
    {{- end}}
    {{- end}}
  {{- end}}
  {{- if (.Values.rollout).additionalSpec }}
  {{- toYaml (.Values.rollout).additionalSpec | trim | nindent 2 }}
  {{- end }}
---
{{- end }}