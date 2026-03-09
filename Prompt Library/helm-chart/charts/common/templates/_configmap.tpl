{{- define "common.configmap" }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Chart.Name }}-configmap
  namespace: {{ .Release.Namespace }}
  labels:
  {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if (.Values.configmap).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.configmap.additionalAnnotations | nindent 4 }}
  {{- end }}
data:
  "CLUSTER_NAME": "{{.Values.clusterName}}"
{{- $clusterName := .Values.clusterName}}
{{- $environmentName := (index .Values.envs 0).value }} #hack - assumes that the first env variable is always the environmentName
{{- $files := .Files }}
{{- range list (printf "properties.yaml") (printf "env/default/%s/properties.yaml" $environmentName) (printf "env/%s/properties.yaml" $clusterName ) (printf "env/%s/%s/properties.yaml" $clusterName $environmentName) }}
{{- $fileName := . }}
{{- range splitList "\n" ($files.Get (printf "%s" $fileName)) }}
{{- if not (. | trim | empty) }}
{{- $kv := . | splitn ": " 2 }}
{{ printf "%s: %s" ($kv._0 | quote) ($kv._1 | quote) | indent 2 }}
{{- end }}
{{- end }}
{{- end }}
{{- end }}