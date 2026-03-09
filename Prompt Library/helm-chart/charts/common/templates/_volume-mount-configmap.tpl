{{- define "common.volume-mount-configmap" }}
{{- if .Values.volumeMounts }}
{{- range $i, $volumeMount := .Values.volumeMounts }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ $.Chart.Name }}-{{ $volumeMount.configMapName }}-volume-mount-configmap
  namespace: {{ $.Release.Namespace }}
  labels:
    {{- include "common.olympus-labels" $.Values | nindent 4 }}
    {{- if $volumeMount.additionalLabels }}
      {{- toYaml $volumeMount.additionalLabels | nindent 4 }}
    {{- end }}
  {{- if $volumeMount.additionalAnnotations }}
  annotations:
    {{- toYaml $volumeMount.additionalAnnotations | nindent 4 }}
  {{- end }}
data:
{{ $volumeMount.fileName | indent 2 }}: |-
{{- if $.Values.useGoTemplate }}
{{- /* tpl: https://helm.sh/docs/howto/charts_tips_and_tricks/#using-the-tpl-function */}}
{{ tpl ($volumeMount.fileContent | indent 4) $ }}
{{- else }}
{{ $volumeMount.fileContent | indent 4 }}
{{- end }}
---
{{- end }}
{{- end }}
{{- end }}