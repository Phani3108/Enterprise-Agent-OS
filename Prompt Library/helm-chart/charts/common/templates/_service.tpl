{{- define "common.service" }}
apiVersion: v1
kind: Service
metadata:
  name: {{ template "common.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
{{ include "common.labels" . | indent 4 }}
  {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if .Values.service }}
    {{- if .Values.service.additionalLabels }}
      {{- toYaml .Values.service.additionalLabels | nindent 4 }}
    {{- end }}
  {{- end }}
  {{- if or (($.Values.istio).enabled) (.Values.service.annotations) }}
  annotations:
  {{- if (.Values.topologyAwareHints).disabled }}
    "service.kubernetes.io/topology-aware-hints": "Disabled"
  {{- end }}
  {{- if ($.Values.istio).enabled }}
    "ingress.kubernetes.io/service-upstream": "true" {{/*Kong/Nginx should not do the load balancing and should send the request ot ClusterIP rather than Pod IP*/}}
    "konghq.com/preserve-host": "false" {{/*Kong should use the k8s service FQDN as the host header*/}}
    "networking.istio.io/exportTo": '.,{{join "," $.Values.istio.serviceExportTo}}' {{/*Export ServiceEntry for this service to current namespace and serviceExportTo. Zone-Traffic is required in serviceExportTo to make load balancing from enovy sidecar in zone-traffic work*/}}
  {{- end }}
  {{- if .Values.service.annotations }}
  {{- with .Values.service.annotations }}
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- end }}
  {{- end }}
spec:
  {{- if .Values.service.isNodePort }}
  type: NodePort
  {{- else if .Values.service.isLoadBalancer }}
  type: LoadBalancer
  {{- else }}
  type: ClusterIP
  {{- if .Values.service.isHeadless }}
  clusterIP: None
  {{- end }}
  {{- end }}
  ports:
    - targetPort: {{ .Values.service.targetPort }}
      port: {{ default 80 .Values.service.port }}
      protocol: TCP
      name: http
  {{- if .Values.omsAppName }}
  {{- if ne .Values.omsAppName "" }}
    - targetPort: {{ default 9099 .Values.service.omsHttpPort }}
      port: {{ default 9099 .Values.service.omsHttpPort }}
      protocol: TCP
      name: omshttp
  {{- end }}
  {{- end }}
    - targetPort: {{ default 8778 .Values.service.jolokiaPort }}
      port: {{ default 8778 .Values.service.jolokiaPort }}
      protocol: TCP
      name: jolokia
    - targetPort: {{ default 44444 .Values.service.jmxmetricsPort }}
      port: {{ default 44444 .Values.service.jmxmetricsPort }}
      protocol: TCP
      name: jmxmetrics
{{- if .Values.extraPorts }}
{{ toYaml .Values.extraPorts | trim | indent 4 }}
{{- end }}
  selector:
    app.kubernetes.io/name: {{ include "common.name" . }}
    app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
