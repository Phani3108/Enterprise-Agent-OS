{{/* This is the Heracles manifest template library  */}}
---
{{/* HeraclesDomainSpecification  */}}

{{- define "heracles.domainSpecification" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesDomainSpecification
metadata:
  name: {{ .item.name}}
  namespace: {{ .item.namespace | default "zonetraffic" }}
spec:
  {{- if .item.config }}
  config:
        {{- toYaml .item.config | nindent 4 }}
  {{- end }}
{{- end }}

---

{{/* HeraclesDomain  */}}

{{- define "heracles.domain" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesDomain
metadata:
  name: {{ .item.name }}
  namespace: {{ .item.namespace | default "zonetraffic" }}
spec:
  domainSpec: {{ .item.domainSpec | default "zetaolympus-ds"}}
  domainClass: {{ .item.domainClass | default "internal" }}
  hostname:
    {{- range .item.hostNames }}
    - {{ . }}
    {{- end }}
  {{- if .item.config }}
  config:
        {{- toYaml .item.config | nindent 4 }}
  {{- end }}
{{- end }}

---

{{/* HeraclesPathRouter */}}

{{- define "heracles.pathRouter" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesPathRouter
metadata:
  name: {{ .item.name }}
  namespace: {{ .item.namespace | default "zonetraffic"}}
spec:
  domain: {{ .item.domain }}
  paths:
    {{- range .item.paths }}
      - {{ . }}
    {{- end }}
  upstream: {{ .item.upstream }}
  {{- if .item.upstreamParams }}
  upstreamParams:
    {{- range .item.upstreamParams }}
      - {{ . }}
    {{- end }}
  {{- end }}
  loopback: {{ .item.loopback }}
  tokenDecodeApi: {{ .item.tokenDecodeApi }}
  fallback:
    enabled: {{ .item.fallback.enabled }}
    upstream: {{ .item.fallback.upstream }}
  {{- if .item.config }}
  config:
    {{- toYaml .item.config|nindent 4 }}
    {{- end }}
  {{- end }}


---
{{/* HeraclesOlympusDomain */}}

{{- define "heracles.olympusDomain" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesOlympusDomain
metadata:
  name: {{ .item.name }}
  namespace: {{ .item.namespace| default "zonetraffic"}}
spec:
  domainSpec: {{ .item.domainSpec | default "zetaolympus-ds"}}
  domainClass : {{ .item.domainClass | default "zone-ingress"}}
  hostname:
    {{- range .item.hostnames }}
      - {{ . }}
    {{- end }}
  {{- if .item.tls}}
  tls:
    {{- range .item.tls }}
      - {{ . }}
    {{- end }}
  {{- end }}
  {{- if .item.config }}
  config:
    {{- toYaml .item.config|nindent 4 }}
    {{- end }}
  {{- end }}

---
{{/* HeraclesDomainClusterMapper */}}

{{- define "heracles.domainClusterMapper" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesDomainClusterMapper
metadata:
  name: {{ .item.name }}
  namespace: {{ .item.namespace | default "zonetraffic" }}
spec:
  domainClass: {{ .item.domainClass | default "internal" }}
  sandbox: {{ .item.sandbox | toJson  }}
  tenant: {{ .item.tenant | toJson }}
  thirdpart: {{ .item.thirdPart }}
  upstream: {{ .item.upstream }}
{{- end}}

---
{{/* HeraclesClusterProxy */}}

{{- define "heracles.clusterProxy" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesClusterProxy
metadata:
  name: {{ .item.name }}
  namespace: {{ .item.namespace | default "zonetraffic"}}
spec:
  domainSpec: {{ .item.domainSpec }}
  domainClass: {{ .item.domainClass }}
  hostname: {{ .item.hostname }}
  upstream: {{ .item.upstream }}
{{- end }}
---

{{/* HeraclesClusterRoute */}}

{{- define "heracles.clusterRoute" -}}
apiVersion: zeta.tech/v1alpha1
kind: HeraclesClusterRoute
metadata:
  name: {{ .item.name }}
  namespace: {{ default .root.Release.Namespace .item.namespace }}
spec:
  cluster: {{ default .root.Release.Namespace .item.cluster | replace "-" "" }}
  domainClass: {{ .item.domainClass }}
  ingressType:
    {{- range .item.ingressType }}
      - {{ . }}
    {{- end }}
  paths:
    {{- range .item.paths }}
      - {{ . }}
    {{- end }}
  backend:
    port: {{ .item.backend.port }}
    service: {{ .item.backend.service }}

  {{- if .item.config }}
  config:
    {{- toYaml .item.config | nindent 4 }}
  {{- end }}
{{- end }}
