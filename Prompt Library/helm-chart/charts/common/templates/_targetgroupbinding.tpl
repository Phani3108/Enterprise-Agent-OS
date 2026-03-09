{{- define "common.targetgroupbinding" }}
{{- $name := .Chart.Name -}}
{{- if $.Values.targetgroupbindings}}
{{- range $targetgroupbindingConfig := $.Values.targetgroupbindings -}}
---
apiVersion: elbv2.k8s.aws/v1beta1
kind: TargetGroupBinding
metadata:
  name: {{ $name }}-{{ $targetgroupbindingConfig.port }}
  namespace: {{ $.Release.Namespace }}
  {{- if $targetgroupbindingConfig.additionalAnnotations }}
  annotations:
    {{- toYaml $targetgroupbindingConfig.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  nodeSelector:
    matchLabels:
      schedule-on: {{ default "ingress-subnet" $targetgroupbindingConfig.nodegroup }}
  serviceRef:
    name: {{ $name }}
    port: {{ $targetgroupbindingConfig.port }}
  targetGroupARN: {{ $targetgroupbindingConfig.arn }}
  targetType: {{ default "instance" $targetgroupbindingConfig.targetType }}
{{ end }}
{{ end }}
{{ end }}