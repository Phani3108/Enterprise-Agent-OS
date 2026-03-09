{{/*
----------------------------------------------------------Http-check----------------------------------------------------------------------------------------------------
*/}}
{{- define "common.httpKhcheck" -}}
{{- if $.Values.khcheck_http -}}
{{- $checkList := dict -}}
{{- if hasKey .Values.khcheck_http "specs" -}}
{{- $key := include "common.fullname" . -}}
{{- $_ := set $checkList  $key $.Values.khcheck_http -}}
{{- else -}}
{{- $checkList := merge $checkList $.Values.khcheck_http -}}
{{- end -}}
{{- range $key, $val := $checkList -}}
{{- if $val.enabled }}
---
apiVersion: comcast.github.io/v1
kind: KuberhealthyCheck
metadata:
  name: "{{ $key }}.http-khcheck"
  namespace: {{ $.Release.Namespace }}
spec:
  runInterval: 5m
  timeout: 2m
  extraAnnotations:
    sidecar.istio.io/inject: "false"
  podSpec:
    containers:
      - name: https
        image: 813361731051.dkr.ecr.ap-south-1.amazonaws.com/kuberhealthy-repo:http-check-v0.0.3
        imagePullPolicy: IfNotPresent
        env:
          - name: CHECK_URL
            value: {{ $val.specs.checkurl }}
          - name: COUNT #### default: "0"
            value: "3"
          - name: SECONDS #### default: "0"
            value: "1"
          - name: PASSING_PERCENT #### default: "100"
            value: "80"
          - name: REQUEST_TYPE #### default: "GET"
            value: {{ default ("GET" | quote) ($val.specs.requestType | quote) }}
          - name: REQUEST_BODY #### default: "{}"
            value: {{ default ("{}" | quote) ($val.specs.requestBody | quote) }}
          - name: EXPECTED_STATUS_CODE #### default: "200"
            value: {{ default ("200" | quote) ($val.specs.statusCode | quote) }}
        securityContext:
          runAsUser: 1001
        resources:
          requests:
            cpu: 15m
            memory: 15Mi
          limits:
            cpu: 25m
    restartPolicy: Always
    terminationGracePeriodSeconds: 5
{{- end -}}
{{- end }}
{{- end -}}
{{- end -}}

{{/*
----------------------------------------------------------Oms-check----------------------------------------------------------------------------------------------------
*/}}

{{- define "common.omsKhcheck" -}}
{{- if $.Values.khcheck_oms -}}
{{- $checkList := dict -}}
{{- if hasKey .Values.khcheck_oms "specs" -}}
{{- $key := include "common.fullname" . -}}
{{- $_ := set $checkList  $key $.Values.khcheck_oms -}}
{{- else -}}
{{- $checkList := merge $checkList $.Values.khcheck_oms -}}
{{- end -}}
{{- range $key, $val := $checkList -}}
{{- if $val.enabled }}
---
apiVersion: comcast.github.io/v1
kind: KuberhealthyCheck
metadata:
  name: "{{ $key }}.oms-khcheck"
  namespace: {{ $.Release.Namespace }}
spec:
  runInterval: 5m
  timeout: 2m
  extraAnnotations:
    sidecar.istio.io/inject: "false"
  podSpec:
    containers:
      - name: main
        image: 813361731051.dkr.ecr.ap-south-1.amazonaws.com/kuberhealthy-repo:http-content-check-v0.0.1
        imagePullPolicy: IfNotPresent
        env:
          - name: TARGET_URL
            value: {{ $val.specs.checkurl }}
          - name: TARGET_STRING #### default: "0"
            value: {{ $val.specs.targetstring | squote }}
          - name: TIMEOUT_DURATION #### default: "0"
            value: "30s"
        securityContext:
          runAsUser: 1001
        resources:
          requests:
            cpu: 15m
            memory: 15Mi
          limits:
            cpu: 25m
    restartPolicy: Always
    terminationGracePeriodSeconds: 5
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
----------------------------------------------------------Sftp-check----------------------------------------------------------------------------------------------------
*/}}
{{- define "common.sftpKhcheck" -}}
{{- if $.Values.khcheck_sftp -}}
{{- $checkList := dict -}}
{{- if hasKey .Values.khcheck_sftp "specs" -}}
{{- $key := include "common.fullname" . -}}
{{- $_ := set $checkList  $key $.Values.khcheck_sftp -}}
{{- else -}}
{{- $checkList := merge $checkList $.Values.khcheck_sftp -}}
{{- end -}}
{{- range $key, $val := $checkList -}}
{{- if $val.enabled }}
---
apiVersion: comcast.github.io/v1
kind: KuberhealthyCheck
metadata:
  name: "{{ $key }}.sftp-khcheck"
  namespace: {{ $.Release.Namespace }}
spec:
  runInterval: 5m
  timeout: 2m
  extraAnnotations:
    sidecar.istio.io/inject: "false"
  podSpec:
    containers:
      - name: sftp
        image: 813361731051.dkr.ecr.ap-south-1.amazonaws.com/dockerhub:kuberhealthy-network-connection-check-v0.2.0
        imagePullPolicy: IfNotPresent
        env:
          - name: CONNECTION_TARGET
            value: {{ $val.specs.checkurl | quote }}
          - name: CONNECTION_TIMEOUT #### default: "0"
            value: "10s"
        securityContext:
          runAsUser: 1001
        resources:
          requests:
            cpu: 15m
            memory: 15Mi
          limits:
            cpu: 25m
    restartPolicy: Always
    terminationGracePeriodSeconds: 5
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
----------------------------------------------------------Http-check-with-headers----------------------------------------------------------------------------------------------------
*/}}
{{- define "common.httpHeadersKhcheck" -}}
{{- if $.Values.khcheck_http_headers -}}
{{- $checkList := dict -}}
{{- if hasKey .Values.khcheck_http_headers "specs" -}}
{{- $key := include "common.fullname" . -}}
{{- $_ := set $checkList  $key $.Values.khcheck_http_headers -}}
{{- else -}}
{{- $checkList := merge $checkList $.Values.khcheck_http_headers -}}
{{- end -}}
{{- range $key, $val := $checkList -}}
{{- if $val.enabled }}
---
apiVersion: comcast.github.io/v1
kind: KuberhealthyCheck
metadata:
  name: "{{ $key }}.http-headers-khcheck"
  namespace: {{ $.Release.Namespace }}
spec:
  runInterval: 5m
  timeout: 2m
  extraAnnotations:
    sidecar.istio.io/inject: "false"
  podSpec:
    containers:
      - name: https
        image: 813361731051.dkr.ecr.ap-south-1.amazonaws.com/kuberhealthy-repo:http-check-with-headers-v0.0.2
        imagePullPolicy: IfNotPresent
        env:
          - name: CHECK_URL
            value: {{ $val.specs.checkurl }}
          - name: COUNT #### default: "0"
            value: "3"
          - name: SECONDS #### default: "0"
            value: "1"
          - name: PASSING_PERCENT #### default: "100"
            value: "80"
          - name: REQUEST_TYPE #### default: "GET"
            value: {{ default ("GET" | quote) ($val.specs.requestType | quote) }}
          - name: REQUEST_BODY #### default: "{}"
            value: {{ default ("{}" | quote) ($val.specs.requestBody | quote) }}
          - name: EXPECTED_STATUS_CODE #### default: "200"
            value: {{ default ("200" | quote) ($val.specs.statusCode | quote) }}
          - name: DYNAMIC_VARIABLES #### default: "[]"
            value: {{ default ("[]" | quote) ($val.specs.dynamicVariables | quote) }}
          - name: REQUEST_HEADERS #### default: "{}"
            value: {{ default ("{}" | quote) ($val.specs.requestHeaders | quote) }}
        securityContext:
          runAsUser: 1001
        resources:
          requests:
            cpu: 15m
            memory: 15Mi
          limits:
            cpu: 25m
    restartPolicy: Always
    terminationGracePeriodSeconds: 5
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}