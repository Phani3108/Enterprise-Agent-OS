{{- define "common.heracles-route" }}
{{- if (.Values.heraclesRouteSpec) }}
{{- if (.Values.heraclesRouteSpec.enabled) }}
{{- $svcPort := (default 80 .Values.service.port) -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesRouteSpecification
metadata:
  name: {{ template "common.fullname" . }}-route-spec
  namespace: {{ .Release.Namespace }}
  labels:
  {{- include "common.labels" . | nindent 4 }}
  {{- include "common.olympus-labels" .Values | nindent 4 }}
  {{- if (.Values.heraclesRouteSpec).additionalAnnotations }}
  annotations:
    {{- toYaml .Values.heraclesRouteSpec.additionalAnnotations | nindent 4 }}
  {{- end }}
spec:
  paths:
  {{- range .Values.heraclesRouteSpec.paths }}
    - {{ . | quote }}
  {{- end }}
  backend:
    {{- $port := (default $svcPort .Values.heraclesRouteSpec.portOverride) }}
    port: {{ default $port }}
    service: {{ template "common.fullname" . }}
  config:
    upstream-setting:
      {{- if (.Values.heraclesRouteSpec.config.upstreamSetting) }}
      {{- toYaml .Values.heraclesRouteSpec.config.upstreamSetting | trim | nindent 6 }}
      {{- else }}
      proxy-setting:
        protocol: http
        path: /
        connect_timeout: 60000
        retries: 3
        read_timeout: 60000
        write_timeout: 60000
      route-setting:
        methods: "POST,PUT,DELETE,PATCH,GET,OPTIONS"
        preserve_host: false
        strip_path: false
      {{- end -}}

    {{- if (.Values.heraclesRouteSpec.config.rateLimiting) }}
    rate-limiting:
    {{- toYaml .Values.heraclesRouteSpec.config.rateLimiting | trim | nindent 6}}
    {{- end -}}

    {{- if (.Values.heraclesRouteSpec.config.redirection)  }}
    redirection:
    {{- toYaml .Values.heraclesRouteSpec.config.redirection | trim | nindent 6}}
    {{- end -}}

    {{- if (.Values.heraclesRouteSpec.config.ingressv2)  }}
    ingressv2:
    {{- toYaml .Values.heraclesRouteSpec.config.ingressv2 | trim | nindent 6}}
    {{- end -}}

    {{- if (.Values.heraclesRouteSpec.config.requestTransformer)  }}
    request-transformer:
    {{- toYaml .Values.heraclesRouteSpec.config.requestTransformer | trim | nindent 6}}
    {{- end -}}

    {{- if (.Values.heraclesRouteSpec.config.auditlog)  }}
    auditlog:
    {{- toYaml .Values.heraclesRouteSpec.config.auditlog | trim | nindent 6}}
    {{- end -}}

    {{- if (.Values.heraclesRouteSpec.config.otherConfig)  }}
    {{- toYaml .Values.heraclesRouteSpec.config.otherConfig | trim | nindent 4}}
    {{- end }}
{{- end}}
{{- end}}
{{- end}}