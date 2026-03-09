{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "common.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "common.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "common.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "common.labels" -}}
{{- $name := default .Chart.AppVersion .Values.image.tag -}}
app: {{ include "common.name" . }}
version: {{ $name | quote }}
app.kubernetes.io/name: {{ include "common.name" . }}
helm.sh/chart: {{ include "common.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ $name | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/* olympus labels */}}
{{- define "common.olympus-labels" -}}
{{- if  (.global).olympusLabels -}}
{{- with .global.olympusLabels -}}
olympus.cluster: {{ .olympusCluster }}
olympus.cluster.bu: {{ .olympusClusterBU }}
olympus.cluster.team: {{ .olympusClusterTeam }}
olympus.zone: {{ .olympusZone }}
olympus.zone.env: {{ .olympusZoneEnv }}
olympus.common-chart.version: 1.0.92
{{- end -}}
{{- else if .olympusLabels }}
{{- with .olympusLabels -}}
olympus.cluster: {{ .olympusCluster }}
olympus.cluster.bu: {{ .olympusClusterBU }}
olympus.cluster.team: {{ .olympusClusterTeam }}
olympus.zone: {{ .olympusZone }}
olympus.zone.env: {{ .olympusZoneEnv }}
olympus.common-chart.version: 1.0.92
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Vault annotations for pod
*/}}
{{- define "common.vault-annotations" -}}
{{- with default (dict "dummy" "dummy") .vault -}}
{{- if .address }}
vault.security.banzaicloud.io/vault-addr: {{ .address | quote }}
{{- end }}
{{- if .skipVerify }}
vault.security.banzaicloud.io/vault-skip-verify: {{ .skipVerify | quote }}
{{- end }}
{{- if .agent }}
vault.security.banzaicloud.io/vault-agent: {{ .agent | quote }}
{{- end }}
{{- if .path }}
vault.security.banzaicloud.io/vault-path: {{ .path | quote }}
{{- end }}
vault.security.banzaicloud.io/vault-role: {{ default "cluster-service" .role }}
{{- end }}
{{- end -}}


{{/*
Security context for deployment
*/}}
{{- define "common.security-context" -}}
{{- with default (dict "dummy" "dummy") .Values.securityContext -}}
securityContext:
  runAsNonRoot: {{ hasKey . "runAsNonRoot" | ternary .runAsNonRoot "true" }}
  runAsUser: {{ hasKey . "runAsUser" | ternary .runAsUser "1001" }}
  runAsGroup: {{ hasKey . "runAsGroup" | ternary .runAsGroup "2001" }}
  seccompProfile:
    type:  {{ hasKey . "seccompProfile" | ternary .seccompProfile "RuntimeDefault" }}
{{- end -}}
{{- end -}}

{{- define "common.security-context-container" -}}
{{- with default (dict "dummy" "dummy") .Values.securityContext -}}
securityContext:
  allowPrivilegeEscalation: {{ hasKey . "allowPrivilegeEscalation" | ternary .allowPrivilegeEscalation "false" }}
  privileged: {{ hasKey . "privileged" | ternary .privileged "false" }}
  capabilities:
    drop:
    - ALL
    {{- if hasKey . "capabilities" -}}
    {{- with .capabilities -}}
    add:
    {{- range . -}}
    - {{ . }}
    {{- end -}}
    {{- end -}}
    {{- end -}}
{{- end -}}
{{- end -}}

{{/*
calculates the replicat count for deployment.
the replicas needs to be 0
- if hpa is enabled (TODO: confim )
- if rollout is enabled https://argoproj.github.io/argo-rollouts/migrating/#reference-deployment-from-rollout
*/}}
{{- define "common.deployment-replicaCount" -}}
{{- $replicaCount := .Values.replicaCount -}}
{{- if (.Values.rollout).enabled }}
{{- printf "%v" 0 -}}
{{- else }}
{{- printf "%v" $replicaCount -}}
{{- end }}
{{- end -}}


{{/*
Pod disruption budget
example: {{- template "common.pod-disruption-budget" (dict "global" $ "podDisruptionBudget" $.Values.podDisruptionBudget) -}}
*/}}
{{- define "common.pod-disruption-budget" -}}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ template "common.fullname" .global }}-pdb
  namespace: {{ .global.Release.Namespace }}
  labels:
spec:
  minAvailable: {{ default "50%" .minAvailable }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ template "common.fullname" .global }}
{{- end -}}

{{/*
Topology Spread Constraints
*/}}
{{- define "common.topology-spread.zone" -}}
- maxSkew: 1
  topologyKey: "topology.kubernetes.io/zone"
  whenUnsatisfiable: {{ default "DoNotSchedule" ((.Values.topologySpreadConstraints.azspread).whenUnsatisfiable) }}
  labelSelector:
    matchLabels:
      app.kubernetes.io/name: {{ include "common.name" . }}
{{- end -}}
{{- define "common.topology-spread.node" -}}
- maxSkew: 1
  topologyKey: "kubernetes.io/hostname"
  whenUnsatisfiable: {{ default "DoNotSchedule" ((.Values.topologySpreadConstraints.nodespread).whenUnsatisfiable) }}
  labelSelector:
    matchLabels:
      app.kubernetes.io/name: {{ include "common.name" . }}
{{- end -}}

{{- define "common.topology-label" -}}
labelSelector:
  matchLabels:
    app.kubernetes.io/name: {{ include "common.name" $ }}
{{- end -}}


{{/*
Atropos Ebs node affinity
*/}}
{{- define "common.atropos-ebs-affinity" }}
  {{- $affinity := .Values.affinity | default dict -}}
  {{- $nodeAffinity := $affinity.nodeAffinity | default dict -}}
  {{- $nodeSelectorTerms := get ($nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution | default dict) "nodeSelectorTerms" | default list -}}

  {{- $ebsAffinity := (.Values.enableAtroposEbs).affinity | default dict -}}
  {{- $ebsNodeAffinity := $ebsAffinity.nodeAffinity | default dict -}}
  {{- $ebsNodeSelectorTerms := get ($ebsNodeAffinity.requiredDuringSchedulingIgnoredDuringExecution | default dict) "nodeSelectorTerms" | default (list (dict "matchExpressions" (list (dict "key" "atropos-ebs" "operator" "In" "values" (list "enabled"))))) -}}

  {{- $combinedNodeSelectorTerms := list -}}
  {{- if $nodeSelectorTerms }}
    {{- range $term := $nodeSelectorTerms }}
      {{- $updatedMatchExpressions := concat (get $term "matchExpressions" | default list) (get (first $ebsNodeSelectorTerms) "matchExpressions") | uniq -}}
      {{- $updatedTerm := dict "matchExpressions" $updatedMatchExpressions -}}
      {{- $combinedNodeSelectorTerms = append $combinedNodeSelectorTerms $updatedTerm -}}
    {{- end }}
  {{- else }}
    {{- $updatedMatchExpressions := (get (first $ebsNodeSelectorTerms) "matchExpressions") | uniq -}}
    {{- $updatedTerm := dict "matchExpressions" $updatedMatchExpressions -}}
    {{- $combinedNodeSelectorTerms = append $combinedNodeSelectorTerms $updatedTerm -}}
  {{- end }}

  {{- $_ := set $nodeAffinity "requiredDuringSchedulingIgnoredDuringExecution" (dict "nodeSelectorTerms" $combinedNodeSelectorTerms) -}}
  {{- $_ := set $affinity "nodeAffinity" $nodeAffinity -}}
  {{- toYaml $affinity | nindent 8 -}}
{{- end -}}


{{/*
Atropos Ebs tolerations
*/}}
{{- define "common.atropos-ebs-tolerations" }}
  {{- $tolerations := list }}
  {{- if (.Values.enableAtroposEbs).tolerations }}
    {{- $tolerations = concat $tolerations .Values.enableAtroposEbs.tolerations  }}
  {{- else }}
    {{- $defaultToleration := dict "effect" "NoSchedule" "key"  "atropos" "operator" "Equal" "value" "enabled" -}}
    {{- $tolerations = append $tolerations $defaultToleration }}
  {{- end }}
  {{- if .Values.tolerations }}
    {{- $tolerations = concat $tolerations .Values.tolerations | uniq }}
  {{- end }}
  {{- toYaml $tolerations | nindent 8 -}}
{{- end -}}
